"use client";

import React, { useState, useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import Sidebar, { ActiveToolType } from "@/components/Sidebar";
import Toolbar from "@/components/Toolbar";
import SidebarControls from "@/components/SidebarControls";
import ScoreViewer from "@/components/ScoreViewer";
import Dropzone from "@/components/Dropzone";
import VirtualPiano from "@/components/VirtualPiano";
import LoginModal from "@/components/LoginModal";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { MidiAudioPlayer } from "@/lib/audioPlayer";
import { ScoreData, SampleInfo, InstrumentType } from "@/types";

function StudioApp() {
  const { user, openLoginModal } = useAuth();

  // Active Tool View
  const [activeTool, setActiveTool] = useState<ActiveToolType>("midi-to-sheet");

  // Sidebar collapsed state (initialized to false to prevent Next.js SSR hydration mismatch)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const isDesktopLayout = useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia("(min-width: 1024px)");
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia("(min-width: 1024px)").matches,
    () => false
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem("tukanft_sidebar_collapsed");
      if (saved === "true") {
        setIsSidebarCollapsed(true);
      }
    } catch (e) {}
  }, []);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("tukanft_sidebar_collapsed", String(next));
      } catch (e) {}
      return next;
    });
  };

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
        if (data && data.samples) {
          setSamples(data.samples);
        }
      })
      .catch((err) => console.warn("Failed to load samples:", err));
  }, []);

  // Setup player callbacks
  useEffect(() => {
    player.onProgressCallback = (curr, dur) => {
      setCurrentTime(curr);
      setDuration(dur);
    };

    player.onStateChangeCallback = (state) => {
      setIsPlaying(state === "playing");
      setIsPaused(state === "paused");
    };

    return () => {
      player.stop();
    };
  }, [player]);

  // Handle Score Loading
  const handleScoreLoaded = (data: ScoreData) => {
    if (!data.musicXml && (data as any).musicxml) {
      data.musicXml = (data as any).musicxml;
    }
    setScoreData(data);
    setShowUploadModal(false);
    setErrorMessage(null);
    setTranspose(0);
    setQuantize("smart");
    setSplitGrandStaff(false);
    setSelectedPart("all");

    // Load into audio engine
    if (data.playbackEvents && data.playbackEvents.length > 0) {
      player.loadEvents(
        data.playbackEvents,
        data.metadata.durationSeconds,
        osmdInstanceRef.current,
        data.metadata.tempoBpm
      );
      setDuration(data.metadata.durationSeconds);
      setCurrentTime(0);
    }
  };

  // Convert uploaded MIDI file
  const handleFileUpload = async (file: File) => {
    try {
      setIsLoading(true);
      setStatusMessage(`Analyzing and engraving ${file.name}...`);
      setErrorMessage(null);

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
    } catch (err: any) {
      console.error("Upload error:", err);
      setErrorMessage(err.message || "Failed to parse MIDI file.");
    } finally {
      setIsLoading(false);
      setStatusMessage(null);
    }
  };

  // Load a preloaded sample
  const handleSelectSample = async (sampleId: string) => {
    try {
      setIsLoading(true);
      setStatusMessage("Loading sample score...");
      setErrorMessage(null);

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
    } catch (err: any) {
      console.error("Sample load error:", err);
      setErrorMessage(err.message || "Failed to load sample score.");
    } finally {
      setIsLoading(false);
      setStatusMessage(null);
    }
  };

  // Apply transformations (transpose, quantize, split, part isolation)
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

      // Update player with new events
      player.loadEvents(
        updatedData.playbackEvents,
        updatedData.metadata.durationSeconds,
        osmdInstanceRef.current,
        updatedData.metadata.tempoBpm
      );
      setDuration(updatedData.metadata.durationSeconds);
    } catch (err: any) {
      console.error("Reprocess error:", err);
      setErrorMessage(err.message || "Failed to transform score.");
    } finally {
      setIsReprocessing(false);
    }
  };

  // OSMD ready hook
  const handleOsmdReady = useCallback(
    (osmd: any) => {
      osmdInstanceRef.current = osmd;
      player.osmd = osmd;
    },
    [player]
  );

  // Sound and instrument change
  const handleInstrumentChange = (newInst: InstrumentType) => {
    setInstrument(newInst);
    player.setInstrument(newInst, true);
  };

  const handleTogglePedal = () => {
    const next = !sustainPedal;
    setSustainPedal(next);
    player.setSustainPedal(next);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    player.setSpeed(newSpeed);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    player.setVolume(newVol);
  };

  // Exports
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadMusicXml = () => {
    if (!scoreData?.musicXml) return;
    const blob = new Blob([scoreData.musicXml], { type: "application/vnd.recordare.musicxml+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${scoreData.metadata.title.replace(/\s+/g, "_")}.musicxml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMidi = async () => {
    if (!scoreData?.sessionId) return;
    try {
      const formData = new FormData();
      formData.append("session_id", scoreData.sessionId);
      formData.append("transpose", transpose.toString());
      formData.append("quantize", quantize);
      formData.append("selected_part", selectedPart);

      const res = await fetch("/api/export/midi", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("MIDI export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${scoreData.metadata.title.replace(/\s+/g, "_")}.mid`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert("Failed to export MIDI: " + e.message);
    }
  };

  const handleHeaderMenuClick = () => {
    if (isDesktopLayout) {
      toggleSidebarCollapse();
    } else {
      setIsMobileNavOpen((open) => !open);
    }
  };

  return (
    <div className="flex h-[100dvh] w-full max-w-full overflow-hidden bg-slate-950 text-slate-100">
      <Sidebar
        isOpen={isDesktopLayout || isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
        activeTool={activeTool}
        onSelectTool={(tool) => setActiveTool(tool)}
        onSelectActiveTool={() => setActiveTool("midi-to-sheet")}
      />

      {/* Main Studio Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar Header */}
        <header className="pt-safe min-h-14 bg-slate-900/95 border-b border-slate-800 px-safe flex items-center justify-between gap-2 shrink-0 backdrop-blur-sm">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              onClick={handleHeaderMenuClick}
              className="w-10 h-10 shrink-0 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition focus:outline-none flex items-center justify-center"
              title={isDesktopLayout ? (isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar") : "Open menu"}
              aria-label="Toggle navigation"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-white truncate">
                {activeTool === "virtual-piano" ? "Virtual Piano" : "MIDI to Sheet Music"}
              </h1>
              {activeTool === "midi-to-sheet" && scoreData && (
                <p className="text-[11px] text-slate-500 truncate">{scoreData.metadata.title}</p>
              )}
            </div>
            <span className="hidden md:inline shrink-0 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-rose-600/15 text-rose-400 border border-rose-500/25">
              Studio
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!user && (
              <button
                onClick={openLoginModal}
                className="h-10 px-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
              >
                <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

            {activeTool === "midi-to-sheet" && scoreData && (
              <button
                onClick={() => setShowControls(!showControls)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 ${showControls
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
            )}

            {activeTool === "midi-to-sheet" && scoreData && (
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
            )}

            {activeTool === "virtual-piano" && (
              <button
                onClick={() => setActiveTool("midi-to-sheet")}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
              >
                <span>🎼 View Sheet Music</span>
              </button>
            )}
          </div>
        </header>

        {/* If Active Tool is Virtual Piano */}
        {activeTool === "virtual-piano" ? (
          <VirtualPiano
            samples={samples}
            onOpenScoreInSheetMusic={(data) => {
              handleScoreLoaded(data);
              setActiveTool("midi-to-sheet");
            }}
          />
        ) : (
          /* MIDI to Sheet Music View */
          <>
            {scoreData && (
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
            )}

            {errorMessage && (
              <div className="bg-rose-950/80 border-b border-rose-800 text-rose-200 px-4 py-2 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold">Error:</span>
                  <span>{errorMessage}</span>
                </div>
                <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white">
                  ✕
                </button>
              </div>
            )}

            <div className="flex-1 flex min-h-0 relative overflow-hidden">
              {scoreData && showControls && (
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
              )}

              <main className="flex-1 h-full min-w-0 relative">
                {!scoreData && (
                  <div className="studio-ambient h-full overflow-y-auto pb-safe flex flex-col items-center justify-center py-8 sm:py-12 px-safe">
                    <div className="text-center mb-8 max-w-lg">
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-400/90 mb-3">
                        Professional engraving
                      </p>
                      <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
                        Transform MIDI into engraved sheet music
                      </h2>
                      <p className="text-sm sm:text-base text-slate-400 mt-3 leading-relaxed">
                        Real-time playback, intelligent tuplet cleanup, automatic grand staff splitting, and export to MusicXML or MIDI.
                      </p>
                    </div>
                    <Dropzone
                      onFileUpload={handleFileUpload}
                      onSelectSample={handleSelectSample}
                      samples={samples}
                      isLoading={isLoading}
                    />
                    {statusMessage && (
                      <p className="mt-6 text-sm text-slate-400 animate-pulse">{statusMessage}</p>
                    )}
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
          </>
        )}
      </div>

      {/* Upload New Score Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
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
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <StudioApp />
      <LoginModal />
    </AuthProvider>
  );
}
