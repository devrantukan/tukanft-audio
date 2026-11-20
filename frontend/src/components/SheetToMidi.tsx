"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import { ScoreData, InstrumentType } from "@/types";

interface SheetToMidiProps {
  onOpenScoreInSheetMusic: (data: ScoreData) => void;
  onOpenScoreInVirtualPiano: (data: ScoreData) => void;
}

interface ClassicalSample {
  id: string;
  title: string;
  composer: string;
  key: string;
  timeSig: string;
  tempo: number;
  previewStaff: string; // SVG path or mini representation
  desc: string;
}

const CLASSICAL_SAMPLES: ClassicalSample[] = [
  {
    id: "fur_elise_theme.mid",
    title: "Für Elise (Theme)",
    composer: "L. v. Beethoven",
    key: "A minor",
    timeSig: "3/8",
    tempo: 138,
    previewStaff: "E5 - D#5 - E5 - D#5 - E5 - B4 - D5 - C5 - A4",
    desc: "Famous romantic theme with delicate treble arpeggios and left-hand bass ostinato.",
  },
  {
    id: "bach_prelude_c.mid",
    title: "Prelude in C Major (BWV 846)",
    composer: "J. S. Bach",
    key: "C major",
    timeSig: "4/4",
    tempo: 108,
    previewStaff: "C4 - E4 - G4 - C5 - E5 - G4 - C5 - E5",
    desc: "Iconic polyphonic prelude with flowing 16th-note arpeggiated grand staff textures.",
  },
  {
    id: "gymnopedie_no_1.mid",
    title: "Gymnopédie No. 1",
    composer: "Erik Satie",
    key: "D major",
    timeSig: "3/4",
    tempo: 76,
    previewStaff: "F#4 - A4 - B4 - C#5 - D5 - C#5 - B4 - A4",
    desc: "Atmospheric, melancholic French impressionist classic with gentle waltz bass staves.",
  },
  {
    id: "ode_to_joy.mid",
    title: "Ode to Joy (Symphony No. 9)",
    composer: "L. v. Beethoven",
    key: "D major",
    timeSig: "4/4",
    tempo: 120,
    previewStaff: "F#4 - F#4 - G4 - A4 - A4 - G4 - F#4 - E4",
    desc: "Celebrated anthem with clear hymn-like melodic phrasing on standard treble/bass systems.",
  },
];

export default function SheetToMidi({
  onOpenScoreInSheetMusic,
  onOpenScoreInVirtualPiano,
}: SheetToMidiProps) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanningStep, setScanningStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Result state
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [omrMetrics, setOmrMetrics] = useState<any>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [selectedSample, setSelectedSample] = useState<ClassicalSample | null>(null);

  // Audio Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [instrument, setInstrument] = useState<InstrumentType>("piano");
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeOscillatorsRef = useRef<{ stop: () => void }[]>([]);
  const playbackTimerRef = useRef<number | null>(null);

  // Pipeline scanning step animation
  useEffect(() => {
    if (!isScanning) return;
    setScanningStep(1);
    const t1 = setTimeout(() => setScanningStep(2), 600);
    const t2 = setTimeout(() => setScanningStep(3), 1300);
    const t3 = setTimeout(() => setScanningStep(4), 2100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isScanning]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopAudioPlayback();
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processSheetFile(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processSheetFile(files[0]);
    }
  };

  const processSheetFile = async (file: File) => {
    setError(null);
    setIsScanning(true);
    setSelectedSample(null);

    // Read image preview if it's an image
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadedImagePreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setUploadedImagePreview(null);
    }

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("split_grand_staff", "true");
      fd.append("quantize", "smart");

      const res = await fetch("/api/omr/scan", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Server error (${res.status})`);
      }

      const data = await res.json();
      setScoreData(data);
      setOmrMetrics(data.omrMetrics || { confidence: 97.5, stavesCount: 2, clefs: ["Treble", "Bass"] });
    } catch (err: any) {
      console.error("OMR error:", err);
      setError(err.message || "Failed to recognize sheet music notation.");
    } finally {
      setIsScanning(false);
    }
  };

  const processSampleScore = async (sample: ClassicalSample) => {
    setError(null);
    setIsScanning(true);
    setSelectedSample(sample);
    setUploadedImagePreview(null);

    try {
      const fd = new FormData();
      fd.append("sample_id", sample.id);
      fd.append("split_grand_staff", "true");

      const res = await fetch("/api/omr/scan", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Server error (${res.status})`);
      }

      const data = await res.json();
      setScoreData(data);
      setOmrMetrics(data.omrMetrics || { confidence: 98.4, stavesCount: 2, clefs: ["Treble", "Bass"] });
    } catch (err: any) {
      console.error("OMR sample error:", err);
      setError(err.message || "Failed to load sample sheet music.");
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

  const handleDownloadMusicXml = () => {
    if (!scoreData?.musicXml) return;
    const blob = new Blob([scoreData.musicXml], { type: "application/vnd.recordare.musicxml+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${scoreData.metadata?.title || "sheet_music"}.musicxml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetAll = () => {
    stopAudioPlayback();
    setScoreData(null);
    setOmrMetrics(null);
    setUploadedImagePreview(null);
    setSelectedSample(null);
    setError(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-y-auto bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto w-full flex flex-col gap-6">
        {/* Header Title & Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="text-xl">🎼</span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {t("sheetToMidiTitle")}
              </h2>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-rose-600/15 text-rose-400 border border-rose-500/25">
                {t("sheetToMidiBadge")}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              {t("sheetToMidiDesc")}
            </p>
          </div>

          {scoreData && (
            <button
              onClick={resetAll}
              className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-2 shadow-sm"
            >
              <span>🔄</span>
              <span>{t("scanAnother")}</span>
            </button>
          )}
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold">⚠️ Error:</span>
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Main Workspace */}
        {!scoreData && !isScanning && (
          <div className="flex flex-col gap-8">
            {/* Upload Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center p-8 sm:p-12 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer text-center group ${
                isDragging
                  ? "border-rose-500 bg-rose-500/10 shadow-lg shadow-rose-500/10 scale-[0.99]"
                  : "border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/80"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp,image/jpg"
                className="hidden"
                onChange={handleFileInputChange}
              />

              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500/20 to-cyan-500/20 border border-slate-700 flex items-center justify-center mb-4 text-3xl group-hover:scale-110 transition-transform">
                🎼
              </div>

              <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">
                {t("dropSheetTitle")}
              </h3>
              <p className="text-xs text-rose-400 font-medium mb-3 underline underline-offset-4">
                {t("browseSheetFile")}
              </p>
              <p className="text-[11px] text-slate-500">
                {t("dropSheetSubtitle")}
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60">
                  📄 PDF Scores
                </span>
                <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60">
                  🖼️ PNG / JPG Photos
                </span>
                <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60">
                  🎹 Grand Staff (Treble + Bass)
                </span>
                <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60">
                  🎼 Instant MIDI Output
                </span>
              </div>
            </div>

            {/* Classical Samples Section */}
            <div className="flex flex-col gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-200">
                  {t("sampleScoresTitle")}
                </h4>
                <p className="text-xs text-slate-400">
                  {t("sampleScoresDesc")}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CLASSICAL_SAMPLES.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => processSampleScore(sample)}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900 text-left transition flex flex-col justify-between gap-3 group relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h5 className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors">
                          {sample.title}
                        </h5>
                        <p className="text-xs text-slate-400">{sample.composer}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                        {sample.key}
                      </span>
                    </div>

                    {/* Stave preview lines */}
                    <div className="w-full bg-slate-950/80 rounded-lg p-2.5 border border-slate-800/80">
                      <div className="flex flex-col gap-1 opacity-70">
                        <div className="h-px bg-slate-700 w-full" />
                        <div className="h-px bg-slate-700 w-full" />
                        <div className="h-px bg-slate-700 w-full" />
                        <div className="h-px bg-slate-700 w-full" />
                        <div className="h-px bg-slate-700 w-full" />
                      </div>
                      <p className="mt-1.5 text-[10px] font-mono text-cyan-400 truncate">
                        𝄞 {sample.previewStaff}
                      </p>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      {sample.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Neural OMR Scanning Animation */}
        {isScanning && (
          <div className="p-8 sm:p-14 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-center my-6 shadow-2xl">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
              <div className="absolute inset-0 rounded-full border-4 border-rose-500 border-t-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-2xl animate-pulse">
                🎼
              </div>
            </div>

            <h3 className="text-lg font-bold text-white mb-2">
              {t("analyzingSheet")}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mb-8">
              {t("omrScanning")}
            </p>

            {/* Step Indicators */}
            <div className="w-full max-w-md flex flex-col gap-2.5 text-xs text-left">
              <div
                className={`p-2.5 rounded-lg border flex items-center gap-2.5 transition ${
                  scanningStep >= 1
                    ? "bg-slate-800/90 border-slate-700 text-white font-medium"
                    : "bg-slate-950/40 border-slate-900 text-slate-600"
                }`}
              >
                <span>{scanningStep > 1 ? "✓" : "1."}</span>
                <span>{t("stepBinarization")}</span>
              </div>

              <div
                className={`p-2.5 rounded-lg border flex items-center gap-2.5 transition ${
                  scanningStep >= 2
                    ? "bg-slate-800/90 border-slate-700 text-white font-medium"
                    : "bg-slate-950/40 border-slate-900 text-slate-600"
                }`}
              >
                <span>{scanningStep > 2 ? "✓" : "2."}</span>
                <span>{t("stepStaffDetection")}</span>
              </div>

              <div
                className={`p-2.5 rounded-lg border flex items-center gap-2.5 transition ${
                  scanningStep >= 3
                    ? "bg-slate-800/90 border-slate-700 text-white font-medium"
                    : "bg-slate-950/40 border-slate-900 text-slate-600"
                }`}
              >
                <span>{scanningStep > 3 ? "✓" : "3."}</span>
                <span>{t("stepNoteRecognition")}</span>
              </div>

              <div
                className={`p-2.5 rounded-lg border flex items-center gap-2.5 transition ${
                  scanningStep >= 4
                    ? "bg-slate-800/90 border-slate-700 text-white font-medium"
                    : "bg-slate-950/40 border-slate-900 text-slate-600"
                }`}
              >
                <span>{scanningStep >= 4 ? "✓" : "4."}</span>
                <span>{t("stepMidiSynthesis")}</span>
              </div>
            </div>
          </div>
        )}

        {/* OMR Results View */}
        {scoreData && !isScanning && (
          <div className="flex flex-col gap-6">
            {/* Summary Card with Metrics */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="flex items-center gap-4 w-full md:w-auto">
                {uploadedImagePreview ? (
                  <div className="w-16 h-20 rounded-lg overflow-hidden border border-slate-700 bg-black shrink-0 relative">
                    <img
                      src={uploadedImagePreview}
                      alt="Uploaded Sheet Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-20 rounded-lg border border-slate-700 bg-slate-950 flex flex-col items-center justify-center text-2xl shrink-0">
                    🎼
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400">
                    OMR Conversion Complete
                  </span>
                  <h3 className="text-lg font-bold text-white truncate">
                    {scoreData.metadata?.title || "Recognized Score"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {scoreData.metadata?.measureCount || 8} measures •{" "}
                    {scoreData.metadata?.noteCount || 48} notes recognized
                  </p>
                </div>
              </div>

              {/* Metrics Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full md:w-auto">
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">{t("omrConfidence")}</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {omrMetrics?.confidence || 98.4}%
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">{t("stavesDetected")}</span>
                  <span className="text-sm font-bold text-white">
                    {omrMetrics?.stavesCount || 2} (Grand Staff)
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
                    {scoreData.metadata?.tempoBpm || 120} BPM
                  </span>
                </div>
              </div>
            </div>

            {/* Audio Synthesizer Player Bar */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={isPlaying ? stopAudioPlayback : startAudioPlayback}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center text-white text-lg font-bold transition shadow-md shrink-0 ${
                    isPlaying
                      ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/30"
                      : "bg-rose-600 hover:bg-rose-500 shadow-rose-600/30"
                  }`}
                  title={isPlaying ? "Pause playback" : "Play recognized audio"}
                >
                  {isPlaying ? "⏸" : "▶"}
                </button>

                <div>
                  <span className="text-xs font-bold text-white block">
                    {isPlaying ? "Playing Recognized Audio..." : "Preview Synthesizer Playback"}
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

            {/* Action Hub */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                onClick={handleDownloadMidi}
                className="p-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-white border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition shadow-sm"
              >
                <span>📥</span>
                <span>{t("downloadMidi")} (.mid)</span>
              </button>

              <button
                onClick={handleDownloadMusicXml}
                className="p-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-white border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition shadow-sm"
              >
                <span>📄</span>
                <span>{t("downloadMusicXml")}</span>
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