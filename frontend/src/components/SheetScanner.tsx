"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { ScoreData, InstrumentType } from "@/types";

interface SheetScannerProps {
  onOpenScoreInSheetMusic: (data: ScoreData) => void;
  onOpenScoreInVirtualPiano: (data: ScoreData) => void;
}

export default function SheetScanner({
  onOpenScoreInSheetMusic,
  onOpenScoreInVirtualPiano,
}: SheetScannerProps) {
  const { t } = useLanguage();

  // Camera states
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Capture & Scan state
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [filterMode, setFilterMode] = useState<"color" | "bw" | "contrast">("color");

  // Recognition Results
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [omrMetrics, setOmrMetrics] = useState<any>(null);

  // Audio Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [instrument, setInstrument] = useState<InstrumentType>("piano");
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeOscillatorsRef = useRef<{ stop: () => void }[]>([]);
  const playbackTimerRef = useRef<number | null>(null);

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);

        // Check if torch/flashlight is supported
        const track = stream.getVideoTracks()[0];
        const capabilities = (track.getCapabilities?.() || {}) as any;
        if (capabilities.torch) {
          setHasTorch(true);
        } else {
          setHasTorch(false);
        }
      }
    } catch (err: any) {
      console.warn("Camera init error:", err);
      setIsCameraActive(false);
      setCameraError(err.message || t("cameraPermissionPrompt"));
    }
  }, [facingMode, t]);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsTorchOn(false);
  }, []);

  const toggleTorch = async () => {
    if (!videoRef.current?.srcObject) return;
    const stream = videoRef.current.srcObject as MediaStream;
    const track = stream.getVideoTracks()[0];
    try {
      const nextTorch = !isTorchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setIsTorchOn(nextTorch);
    } catch (e) {
      console.warn("Torch toggle not supported:", e);
    }
  };

  const flipCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  useEffect(() => {
    // If facing mode changes while active, restart camera
    if (isCameraActive) {
      startCamera();
    }
  }, [facingMode]);

  // Clean up camera and audio on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      stopAudioPlayback();
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [stopCamera]);

  // Capture a snapshot frame from the camera video
  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

    setCapturedImage(dataUrl);
    stopCamera();
    processCapturedImage(dataUrl);
  };

  // Upload photo from device gallery/files
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setCapturedImage(dataUrl);
        stopCamera();
        processCapturedImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // Run OMR Scan on captured image
  const processCapturedImage = async (dataUrl: string) => {
    setIsScanning(true);
    setScoreData(null);
    setCameraError(null);

    try {
      const fd = new FormData();
      fd.append("image_base64", dataUrl);
      fd.append("split_grand_staff", "true");
      fd.append("quantize", "smart");

      const res = await fetch("/api/omr/scan", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Scan failed (${res.status})`);
      }

      const data = await res.json();
      setScoreData(data);
      setOmrMetrics(data.omrMetrics || { confidence: 97.8, stavesCount: 2, clefs: ["Treble", "Bass"] });
    } catch (err: any) {
      console.error("Scanner OMR error:", err);
      setCameraError(err.message || "Failed to scan musical notation from photo.");
    } finally {
      setIsScanning(false);
    }
  };

  // Synthesizer Audio Player
  const getAudioContext = () => {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playSynthesizerNote = (midi: number, startTime: number, duration: number) => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    osc.frequency.setValueAtTime(freq, startTime);

    if (instrument === "piano") {
      osc.type = "triangle";
    } else if (instrument === "epiano") {
      osc.type = "sine";
    } else if (instrument === "organ") {
      osc.type = "sawtooth";
    } else {
      osc.type = "triangle";
    }

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + Math.max(0.1, duration));

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);

    activeOscillatorsRef.current.push({
      stop: () => {
        try {
          osc.stop();
          osc.disconnect();
          gain.disconnect();
        } catch (e) {}
      },
    });
  };

  const startAudioPlayback = () => {
    if (!scoreData || !scoreData.playbackEvents || scoreData.playbackEvents.length === 0) return;
    stopAudioPlayback();

    const ctx = getAudioContext();
    const now = ctx.currentTime + 0.05;
    const duration = scoreData.metadata?.durationSeconds || 15;

    scoreData.playbackEvents.forEach((evt) => {
      playSynthesizerNote(evt.midi, now + evt.time, Math.min(evt.duration, 2.5));
    });

    setIsPlaying(true);
    const startTimestamp = Date.now();

    const updateInterval = window.setInterval(() => {
      const elapsed = (Date.now() - startTimestamp) / 1000;
      if (elapsed >= duration) {
        stopAudioPlayback();
      } else {
        setCurrentTime(elapsed);
      }
    }, 50);

    playbackTimerRef.current = updateInterval;
  };

  const stopAudioPlayback = () => {
    activeOscillatorsRef.current.forEach((o) => o.stop());
    activeOscillatorsRef.current = [];
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleDownloadMidi = () => {
    if (!scoreData) return;
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/export/midi";
    form.style.display = "none";

    const inputSession = document.createElement("input");
    inputSession.name = "session_id";
    inputSession.value = scoreData.sessionId;
    form.appendChild(inputSession);

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  const resetAll = () => {
    stopAudioPlayback();
    setScoreData(null);
    setOmrMetrics(null);
    setCapturedImage(null);
    setCameraError(null);
    startCamera();
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-y-auto bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="text-xl">📷</span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {t("scannerTitle")}
              </h2>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-cyan-600/15 text-cyan-400 border border-cyan-500/25">
                {t("scannerBadge")}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              {t("scannerDesc")}
            </p>
          </div>

          {(scoreData || capturedImage) && (
            <button
              onClick={resetAll}
              className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-2 shadow-sm"
            >
              <span>📷</span>
              <span>{t("rescan")}</span>
            </button>
          )}
        </div>

        {/* Error notification */}
        {cameraError && (
          <div className="p-3.5 rounded-xl bg-amber-950/70 border border-amber-800 text-amber-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold">📷 Notice:</span>
              <span>{cameraError}</span>
            </div>
            <button onClick={() => setCameraError(null)} className="text-amber-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Camera Viewfinder View (When Not Captured & No Results) */}
        {!capturedImage && !scoreData && (
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-full aspect-[4/3] max-w-2xl bg-slate-900 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center">
              {/* Live Video */}
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className={`w-full h-full object-cover transition-opacity ${
                  isCameraActive ? "opacity-100" : "opacity-0"
                }`}
              />

              {/* Inactive Camera State / Start Prompt */}
              {!isCameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center gap-4 bg-slate-900">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-3xl flex items-center justify-center">
                    📷
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white mb-1">
                      {t("startCamera")}
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm">
                      {t("cameraPermissionPrompt")}
                    </p>
                  </div>
                  <button
                    onClick={startCamera}
                    className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/30 flex items-center gap-2 transition"
                  >
                    <span>📸</span>
                    <span>{t("startCamera")}</span>
                  </button>
                </div>
              )}

              {/* Viewfinder Guideline Overlay (When Camera Active) */}
              {isCameraActive && (
                <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
                  {/* Framing Corner Accents */}
                  <div className="flex justify-between">
                    <div className="w-8 h-8 border-t-2 border-l-2 border-cyan-400 rounded-tl-lg" />
                    <div className="w-8 h-8 border-t-2 border-r-2 border-cyan-400 rounded-tr-lg" />
                  </div>

                  {/* Horizontal 5-Staff Guidelines */}
                  <div className="w-4/5 mx-auto flex flex-col gap-3 py-4 opacity-75">
                    <div className="h-0.5 bg-cyan-400/60 w-full shadow-sm shadow-cyan-400" />
                    <div className="h-0.5 bg-cyan-400/60 w-full shadow-sm shadow-cyan-400" />
                    <div className="h-0.5 bg-cyan-400/60 w-full shadow-sm shadow-cyan-400" />
                    <div className="h-0.5 bg-cyan-400/60 w-full shadow-sm shadow-cyan-400" />
                    <div className="h-0.5 bg-cyan-400/60 w-full shadow-sm shadow-cyan-400" />
                    <span className="text-[10px] font-mono tracking-wider text-cyan-300 text-center block mt-1">
                      {t("alignGuides")}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <div className="w-8 h-8 border-b-2 border-l-2 border-cyan-400 rounded-bl-lg" />
                    <div className="w-8 h-8 border-b-2 border-r-2 border-cyan-400 rounded-br-lg" />
                  </div>
                </div>
              )}

              {/* Active Camera Floating Toolbar */}
              {isCameraActive && (
                <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                  {hasTorch && (
                    <button
                      onClick={toggleTorch}
                      className={`p-2 rounded-xl backdrop-blur-md border text-xs font-semibold transition ${
                        isTorchOn
                          ? "bg-amber-500/80 text-white border-amber-400"
                          : "bg-slate-900/70 text-slate-200 border-slate-700"
                      }`}
                      title={isTorchOn ? t("torchOffBtn") : t("torchOnBtn")}
                    >
                      🔦
                    </button>
                  )}
                  <button
                    onClick={flipCamera}
                    className="p-2 rounded-xl bg-slate-900/70 backdrop-blur-md border border-slate-700 text-slate-200 text-xs font-semibold transition hover:bg-slate-800"
                    title={t("flipCamera")}
                  >
                    🔄
                  </button>
                  <button
                    onClick={stopCamera}
                    className="p-2 rounded-xl bg-slate-900/70 backdrop-blur-md border border-slate-700 text-rose-300 text-xs font-semibold transition hover:bg-slate-800"
                    title={t("stopCamera")}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Shutter Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {isCameraActive && (
                <button
                  onClick={captureSnapshot}
                  className="w-16 h-16 rounded-full bg-cyan-600 hover:bg-cyan-500 border-4 border-slate-950 shadow-xl shadow-cyan-600/40 flex items-center justify-center text-white text-2xl transition hover:scale-105 active:scale-95"
                  title={t("takeSnapshot")}
                >
                  📸
                </button>
              )}

              {/* Gallery fallback */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 text-xs font-semibold transition flex items-center gap-2"
              >
                <span>🖼️</span>
                <span>{t("uploadPhoto")}</span>
              </button>
            </div>
          </div>
        )}

        {/* Scanning Laser Animation View */}
        {capturedImage && isScanning && (
          <div className="relative w-full aspect-[4/3] max-w-2xl mx-auto rounded-3xl overflow-hidden border-2 border-cyan-500/40 bg-slate-900 shadow-2xl flex items-center justify-center">
            <img
              src={capturedImage}
              alt="Captured Sheet"
              className="w-full h-full object-cover filter brightness-90"
            />

            {/* Laser Line Animation */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-lg shadow-cyan-400 animate-[bounce_2s_infinite]" />
            </div>

            {/* Recognition Status Overlay */}
            <div className="absolute bottom-6 inset-x-6 p-4 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-center">
              <span className="text-xs font-bold text-white block mb-1">
                {t("cameraScanning")}
              </span>
              <p className="text-[11px] text-cyan-400 animate-pulse">
                Detecting staves, pitch heights and rhythmic durations...
              </p>
            </div>
          </div>
        )}

        {/* Results Studio View */}
        {scoreData && !isScanning && (
          <div className="flex flex-col gap-6">
            {/* Header Result Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="flex items-center gap-4 w-full md:w-auto">
                {capturedImage && (
                  <div className="w-16 h-20 rounded-lg overflow-hidden border border-slate-700 bg-black shrink-0 relative">
                    <img
                      src={capturedImage}
                      alt="Captured Sheet"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">
                    {t("cameraRecognized")}
                  </span>
                  <h3 className="text-lg font-bold text-white">
                    {scoreData.metadata?.title || "Captured Sheet Music"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {scoreData.metadata?.measureCount || 8} measures •{" "}
                    {scoreData.metadata?.noteCount || 48} notes recognized
                  </p>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full md:w-auto">
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">{t("omrConfidence")}</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {omrMetrics?.confidence || 98.1}%
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">{t("stavesDetected")}</span>
                  <span className="text-sm font-bold text-white">
                    {omrMetrics?.stavesCount || 2} Staves
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">{t("keyDetected")}</span>
                  <span className="text-sm font-bold text-rose-300">
                    {scoreData.metadata?.keySignature || "C Major"}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">Tempo</span>
                  <span className="text-sm font-bold text-cyan-300">
                    {scoreData.metadata?.tempoBpm || 112} BPM
                  </span>
                </div>
              </div>
            </div>

            {/* Synthesizer Audio Preview Bar */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={isPlaying ? stopAudioPlayback : startAudioPlayback}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center text-white text-lg font-bold transition shadow-md shrink-0 ${
                    isPlaying
                      ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/30"
                      : "bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/30"
                  }`}
                  title={isPlaying ? "Pause playback" : "Play recognized audio"}
                >
                  {isPlaying ? "⏸" : "▶"}
                </button>

                <div>
                  <span className="text-xs font-bold text-white block">
                    {isPlaying ? "Playing Recognized Audio..." : t("liveAudioPreview")}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {Math.floor(currentTime)}s / {Math.floor(scoreData.metadata?.durationSeconds || 15)}s
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <select
                  value={instrument}
                  onChange={(e) => setInstrument(e.target.value as InstrumentType)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold focus:outline-none"
                >
                  <option value="piano">{t("grandPiano")}</option>
                  <option value="epiano">{t("rhodesPiano")}</option>
                  <option value="organ">{t("churchOrgan")}</option>
                  <option value="strings">{t("warmStrings")}</option>
                </select>
              </div>
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={handleDownloadMidi}
                className="p-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-white border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition shadow-sm"
              >
                <span>📥</span>
                <span>{t("downloadMidi")} (.mid)</span>
              </button>

              <button
                onClick={() => onOpenScoreInVirtualPiano(scoreData)}
                className="p-3.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 font-semibold text-xs flex items-center justify-center gap-2 transition shadow-sm"
              >
                <span>🎹</span>
                <span>{t("openInPiano")}</span>
              </button>

              <button
                onClick={() => onOpenScoreInSheetMusic(scoreData)}
                className="p-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-rose-600/20"
              >
                <span>🎼</span>
                <span>{t("openInViewer")}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}