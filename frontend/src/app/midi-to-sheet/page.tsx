"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import StudioLayout from "@/components/StudioLayout";
import Toolbar from "@/components/Toolbar";
import SidebarControls from "@/components/SidebarControls";
import ScoreViewer from "@/components/ScoreViewer";
import Dropzone from "@/components/Dropzone";
import { useLanguage } from "@/context/LanguageContext";
import { MidiAudioPlayer } from "@/lib/audioPlayer";
import { ScoreData, SampleInfo, InstrumentType } from "@/types";

export default function MidiToSheetPage() {
  const { t } = useLanguage();

  // Score state
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [samples, setSamples] = useState<SampleInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Transformations
  const [transpose, setTranspose] = useState<number>(0);
  const [quantize, setQuantize] = useState<string>("smart");
  const [splitGrandStaff, setSplitGrandStaff] = useState<boolean>(false);
  const [selectedPart, setSelectedPart] = useState<string>("all");
  const [isReprocessing, setIsReprocessing] = useState<boolean>(false);

  // Playback & Audio
  const [player] = useState<MidiAudioPlayer>(() => new MidiAudioPlayer());
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [instrument, setInstrument] = useState<InstrumentType>("piano");
  const [sustainPedal, setSustainPedal] = useState(true);
  const [speed, setSpeed] = useState(1.0);
  const [volume, setVolume] = useState(0.85);

  // View settings
  const [zoom, setZoom] = useState(1.0);
  const [layoutMode, setLayoutMode] = useState<"continuous" | "paged">("continuous");
  const [showControls, setShowControls] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // OSMD reference
  const osmdInstanceRef = useRef<any>(null);

  // Fetch preloaded samples on mount
  useEffect(() => {
    fetch("/api/samples")
      .then((res) => res.json())
      .then((data) => {
        if (data.samples) setSamples(data.samples);
      })
      .catch((err) => console.error("Failed to load sample registry:", err));
  }, []);

  // Check for active score passed from other studios (Sheet to MIDI, Scanner, etc.)
  useEffect(() => {
    let loaded = false;
    try {
      if (typeof window !== "undefined") {
        const raw =
          sessionStorage.getItem("tukanft_active_score") ||
          localStorage.getItem("tukanft_active_score");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && (parsed.musicXml || parsed.musicxml)) {
            if (!parsed.musicXml && parsed.musicxml) {
              parsed.musicXml = parsed.musicxml;
            }
            handleScoreLoaded(parsed);
            loaded = true;
            sessionStorage.removeItem("tukanft_active_score");
            localStorage.removeItem("tukanft_active_score");
          }
        }
      }
    } catch (e) {
      console.warn("Storage score load warning:", e);
    }

    if (!loaded && typeof window !== "undefined") {
      const urlSession = new URLSearchParams(window.location.search).get("session");
      if (urlSession) {
        setIsLoading(true);
        setStatusMessage("Loading shared score session...");
        fetch(`/api/session/${urlSession}`)
          .then((res) => {
            if (!res.ok) throw new Error("Session not found");
            return res.json();
          })
          .then((data: ScoreData) => {
            handleScoreLoaded(data);
          })
          .catch((err) => {
            console.warn("URL session load error:", err);
          })
          .finally(() => {
            setIsLoading(false);
            setStatusMessage(null);
          });
      }
    }
  }, []);

  // Synchronize playback cursor with score
  useEffect(() => {
    player.onProgressCallback = (time: number) => {
      setCurrentTime(time);
      if (osmdInstanceRef.current && osmdInstanceRef.current.cursor) {
        try {
          const cursor = osmdInstanceRef.current.cursor;
          if (!cursor.iterator || cursor.iterator.EndReached) return;
        } catch (e) {}
      }
    };

    player.onStateChangeCallback = (state: "playing" | "paused" | "stopped") => {
      setIsPlaying(state === "playing");
      setIsPaused(state === "paused");
      if (state === "stopped") {
        setCurrentTime(0);
        if (osmdInstanceRef.current && osmdInstanceRef.current.cursor) {
          try {
            osmdInstanceRef.current.cursor.reset();
            osmdInstanceRef.current.cursor.show();
          } catch (e) {}
        }
      }
    };

    return () => {
      player.stop();
    };
  }, [player]);

  const handleScoreLoaded = (data: ScoreData) => {
    const normalizedData: ScoreData = {
      ...data,
      musicXml: data.musicXml || (data as any).musicxml || "",
    };
    setScoreData(normalizedData);
    setErrorMessage(null);
    setTranspose((data.metadata as any)?.transposition || 0);
    setQuantize((data.metadata as any)?.quantization || "smart");
    setDuration(data.metadata?.durationSeconds || 0);
    setCurrentTime(0);
    setIsPlaying(false);
    setIsPaused(false);

    if (data.playbackEvents) {
      player.loadEvents(data.playbackEvents, data.metadata?.durationSeconds || 0);
      player.setInstrument(instrument);
      player.setSustainPedal(sustainPedal);
      player.setSpeed(speed);
      player.setVolume(volume);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      setStatusMessage("Uploading and engraving score with music21...");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("transpose", "0");
      formData.append("quantize", "smart");
      formData.append("split_grand_staff", "false");
      formData.append("selected_part", "all");

      const response = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server responded with ${response.status}`);
      }

      const data: ScoreData = await response.json();
      handleScoreLoaded(data);
      setShowUploadModal(false);
    } catch (err: any) {
      console.error("Conversion error:", err);
      setErrorMessage(err.message || "Failed to convert MIDI file.");
    } finally {
      setIsLoading(false);
      setStatusMessage(null);
    }
  };

  const handleSelectSample = async (sampleId: string) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      setStatusMessage("Loading sample engraving from server...");

      const formData = new FormData();
      formData.append("transpose", "0");
      formData.append("quantize", "smart");
      formData.append("split_grand_staff", "false");
      formData.append("selected_part", "all");

      const response = await fetch(`/api/sample/${sampleId}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server responded with ${response.status}`);
      }

      const data: ScoreData = await response.json();
      handleScoreLoaded(data);
      setShowUploadModal(false);
    } catch (err: any) {
      console.error("Sample load error:", err);
      setErrorMessage(err.message || "Failed to load sample score.");
    } finally {
      setIsLoading(false);
      setStatusMessage(null);
    }
  };

  const handleApplyTransformations = async () => {
    if (!scoreData || !scoreData.sessionId) return;

    try {
      setIsReprocessing(true);
      setErrorMessage(null);
      player.pause();

      const formData = new FormData();
      formData.append("session_id", scoreData.sessionId);
      formData.append("transpose", transpose.toString());
      formData.append("quantize", quantize);
      formData.append("split_grand_staff", splitGrandStaff ? "true" : "false");
      formData.append("selected_part", selectedPart);

      const response = await fetch("/api/reprocess", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Reprocessing failed.");
      }

      const updatedData: ScoreData = await response.json();
      setScoreData(updatedData);

      player.loadEvents(
        updatedData.playbackEvents,
        updatedData.metadata.durationSeconds
      );
    } catch (err: any) {
      console.error("Reprocess error:", err);
      setErrorMessage(err.message || "Failed to reprocess score.");
    } finally {
      setIsReprocessing(false);
    }
  };

  const handleInstrumentChange = (newInst: InstrumentType) => {
    setInstrument(newInst);
    player.setInstrument(newInst);
  };

  const handleTogglePedal = () => {
    const nextPedal = !sustainPedal;
    setSustainPedal(nextPedal);
    player.setSustainPedal(nextPedal);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    player.setSpeed(newSpeed);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    player.setVolume(newVol);
  };

  const handleOsmdReady = useCallback((osmd: any) => {
    osmdInstanceRef.current = osmd;
    if (osmd && osmd.cursor) {
      try {
        osmd.cursor.show();
      } catch (e) {}
    }
  }, []);

  // Listen to beforeprint / afterprint (e.g. keyboard shortcuts Cmd+P / Ctrl+P)
  useEffect(() => {
    const handleBeforePrint = () => {
      if (osmdInstanceRef.current && osmdInstanceRef.current.cursor) {
        try {
          osmdInstanceRef.current.cursor.hide();
        } catch (e) {}
      }
    };
    const handleAfterPrint = () => {
      if (osmdInstanceRef.current && osmdInstanceRef.current.cursor) {
        try {
          osmdInstanceRef.current.cursor.show();
        } catch (e) {}
      }
    };
    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);

  const handlePrint = () => {
    if (osmdInstanceRef.current && osmdInstanceRef.current.cursor) {
      try {
        osmdInstanceRef.current.cursor.hide();
      } catch (e) {}
    }
    window.print();
    setTimeout(() => {
      if (osmdInstanceRef.current && osmdInstanceRef.current.cursor) {
        try {
          osmdInstanceRef.current.cursor.show();
        } catch (e) {}
      }
    }, 500);
  };

  const handleDownloadMusicXml = () => {
    if (!scoreData) return;
    const blob = new Blob([scoreData.musicXml], {
      type: "application/vnd.recordare.musicxml+xml",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${scoreData.metadata.title.toLowerCase().replace(/\s+/g, "_")}.musicxml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMidi = async () => {
    if (!scoreData) return;
    try {
      const formData = new FormData();
      formData.append("session_id", scoreData.sessionId);
      formData.append("transpose", transpose.toString());
      formData.append("quantize", quantize);
      formData.append("selected_part", selectedPart);

      const response = await fetch("/api/export/midi", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to export MIDI");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${scoreData.metadata.title.toLowerCase().replace(/\s+/g, "_")}.mid`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert("Failed to export MIDI: " + e.message);
    }
  };

  const headerActions = scoreData ? (
    <>
      <button
        onClick={() => setShowControls(!showControls)}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 ${
          showControls
            ? "bg-slate-800 text-slate-200 border-slate-700"
            : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
        }`}
        title="Toggle analysis & transformation controls"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        <span className="hidden sm:inline">Settings</span>
      </button>

      <button
        onClick={() => setShowUploadModal(true)}
        className="h-10 px-3 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-600/30 flex items-center gap-1.5 transition"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span className="hidden sm:inline">New Score</span>
        <span className="sm:hidden">New</span>
      </button>
    </>
  ) : null;

  return (
    <StudioLayout
      activeTool="midi-to-sheet"
      title={t("midiToSheet")}
      subtitle={scoreData?.metadata.title}
      badge={t("proStudio")}
      actions={headerActions}
    >
      {scoreData && (
        <div className="no-print">
          <Toolbar
            isPlaying={isPlaying}
            isPaused={isPaused}
            currentTime={currentTime}
            duration={duration}
            instrument={instrument}
            sustainPedal={sustainPedal}
            speed={speed}
            volume={volume}
            zoom={zoom}
            layoutMode={layoutMode}
            disabled={!scoreData}
            onPlay={() => player.play()}
            onPause={() => player.pause()}
            onStop={() => player.stop()}
            onInstrumentChange={handleInstrumentChange}
            onTogglePedal={handleTogglePedal}
            onSpeedChange={handleSpeedChange}
            onVolumeChange={handleVolumeChange}
            onZoomChange={setZoom}
            onLayoutChange={setLayoutMode}
            onPrint={handlePrint}
            onDownloadMusicXml={handleDownloadMusicXml}
            onDownloadMidi={handleDownloadMidi}
          />
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-950/80 border-b border-rose-800 text-rose-200 px-4 py-2 text-xs flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <span className="font-bold">Error:</span>
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row min-h-0 relative overflow-hidden print-score-flow">
        {scoreData && showControls && (
          <div className="no-print shrink-0 md:h-full">
            <SidebarControls
              metadata={scoreData.metadata}
              transpose={transpose}
              quantize={quantize}
              splitGrandStaff={splitGrandStaff}
              selectedPart={selectedPart}
              isProcessing={isReprocessing}
              onTransposeChange={setTranspose}
              onQuantizeChange={setQuantize}
              onSplitGrandStaffChange={setSplitGrandStaff}
              onSelectedPartChange={setSelectedPart}
              onApplyTransformations={handleApplyTransformations}
            />
          </div>
        )}

        <main className="flex-1 h-full min-w-0 relative print-score-flow">
          {!scoreData && (
            <div className="studio-ambient h-full w-full overflow-y-auto flex flex-col items-center px-4 sm:px-6 py-6 sm:py-10 no-print">
              <div className="my-auto flex flex-col items-center w-full max-w-2xl py-2">
                <div className="text-center mb-6 max-w-lg">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-400/90 mb-2">
                    {t("proEngraving")}
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2 leading-tight">
                    {t("heroTitle")}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {t("heroDesc")}
                  </p>
                </div>

                <div className="w-full">
                  <Dropzone
                    onFileUpload={handleFileUpload}
                    onSelectSample={handleSelectSample}
                    samples={samples}
                    isLoading={isLoading}
                  />
                </div>

                {statusMessage && (
                  <p className="mt-4 text-xs font-medium text-slate-400 animate-pulse text-center">
                    {statusMessage}
                  </p>
                )}
              </div>
            </div>
          )}

          {scoreData && (
            <ScoreViewer
              musicXml={scoreData.musicXml}
              zoom={zoom}
              layoutMode={layoutMode}
              onOsmdReady={handleOsmdReady}
              isLoading={isLoading || isReprocessing}
            />
          )}
        </main>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg p-1"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-white mb-2">Upload or Select MIDI</h3>
            <p className="text-xs text-slate-400 mb-4">
              Select a new MIDI file to engrave. Your current session will be preserved.
            </p>
            <Dropzone
              variant="compact"
              onFileUpload={handleFileUpload}
              onSelectSample={handleSelectSample}
              samples={samples}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}
    </StudioLayout>
  );
}
