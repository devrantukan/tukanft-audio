"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import Toolbar from "@/components/Toolbar";
import SidebarControls from "@/components/SidebarControls";
import ScoreViewer from "@/components/ScoreViewer";
import Dropzone from "@/components/Dropzone";
import { MidiAudioPlayer } from "@/lib/audioPlayer";
import { ScoreData, SampleInfo, InstrumentType } from "@/types";

export default function Home() {
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
  const handleOsmdReady = useCallback((osmd: any) => {
    osmdInstanceRef.current = osmd;
    player.osmd = osmd;
  }, [player]);

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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Lacuna-style Studio Sidebar */}
      <Sidebar />

      {/* Main Studio Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar Header */}
        <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>MIDI to Sheet Music</span>
              <span className="hidden sm:inline px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-rose-600/20 text-rose-400 border border-rose-500/30">
                PRO STUDIO
              </span>
            </h1>
            {scoreData && (
              <span className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-xs">
                — {scoreData.metadata.title}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {scoreData && (
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
            )}

            <button
              onClick={() => setShowUploadModal(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-600/30 flex items-center gap-1.5 transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>{scoreData ? "New Score" : "Upload MIDI"}</span>
            </button>
          </div>
        </header>

        {/* Playback & View Toolbar */}
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

        {/* Global Error Banner if any */}
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

        {/* Main Content Workspace: Left Controls + Canvas Sheet View */}
        <div className="flex-1 flex min-h-0 relative overflow-hidden">
          {/* Collapsible Left Settings & Analysis Panel */}
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

          {/* Interactive Sheet Music Vector Display */}
          <main className="flex-1 h-full min-w-0 relative">
            {!scoreData && (
              <div className="h-full overflow-y-auto flex flex-col items-center justify-center py-10">
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    Transform MIDI into Engraved Sheet Music
                  </h2>
                  <p className="text-sm text-slate-400 mt-1 max-w-lg">
                    Real-time synthesis, smart tuplet cleanup, automatic grand staff separation, and multi-format export.
                  </p>
                </div>
                <Dropzone
                  onFileUpload={handleFileUpload}
                  onSelectSample={handleSelectSample}
                  samples={samples}
                  isLoading={isLoading}
                />
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
