"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import StudioLayout from "@/components/StudioLayout";
import { useLanguage } from "@/context/LanguageContext";
import { MidiAudioPlayer, InstrumentType, PlaybackEvent } from "@/lib/audioPlayer";
import { generateMidiBytes, downloadMidiFile, ExportNote } from "@/lib/midiWriter";
import { ScoreData } from "@/types";

export interface PianoRollNote {
  id: string;
  pitch: string;
  midi: number;
  start: number; // in sixteenth-note steps (0 to 127 for 8 bars)
  length: number; // in sixteenth-note steps
  velocity?: number;
}

// 3 Full Octaves: C6 (84) down to C3 (48) = 37 pitches
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const PITCH_ROWS: { pitch: string; midi: number; isBlack: boolean }[] = [];
for (let m = 84; m >= 48; m--) {
  const octave = Math.floor(m / 12) - 1;
  const name = NOTE_NAMES[m % 12];
  PITCH_ROWS.push({
    pitch: `${name}${octave}`,
    midi: m,
    isBlack: name.includes("#"),
  });
}

const STEP_WIDTH = 28; // width in px of 1 sixteenth note
const ROW_HEIGHT = 28; // height in px of 1 semitone row
const TOTAL_BARS = 8;
const STEPS_PER_BAR = 16;
const TOTAL_STEPS = TOTAL_BARS * STEPS_PER_BAR; // 128 sixteenth steps

// Classic Presets
const PRESETS: Record<string, { title: string; bpm: number; notes: Omit<PianoRollNote, "id">[] }> = {
  furElise: {
    title: "Für Elise (Beethoven)",
    bpm: 128,
    notes: [
      { pitch: "E5", midi: 76, start: 0, length: 2 },
      { pitch: "D#5", midi: 75, start: 2, length: 2 },
      { pitch: "E5", midi: 76, start: 4, length: 2 },
      { pitch: "D#5", midi: 75, start: 6, length: 2 },
      { pitch: "E5", midi: 76, start: 8, length: 2 },
      { pitch: "B4", midi: 71, start: 10, length: 2 },
      { pitch: "D5", midi: 74, start: 12, length: 2 },
      { pitch: "C5", midi: 72, start: 14, length: 2 },
      { pitch: "A4", midi: 69, start: 16, length: 6 },
      { pitch: "C4", midi: 60, start: 24, length: 2 },
      { pitch: "E4", midi: 64, start: 26, length: 2 },
      { pitch: "A4", midi: 69, start: 28, length: 2 },
      { pitch: "B4", midi: 71, start: 30, length: 6 },
      { pitch: "E4", midi: 64, start: 38, length: 2 },
      { pitch: "G#4", midi: 68, start: 40, length: 2 },
      { pitch: "B4", midi: 71, start: 42, length: 2 },
      { pitch: "C5", midi: 72, start: 44, length: 6 },
    ],
  },
  odeToJoy: {
    title: "Ode to Joy (Beethoven)",
    bpm: 120,
    notes: [
      { pitch: "E4", midi: 64, start: 0, length: 4 },
      { pitch: "E4", midi: 64, start: 4, length: 4 },
      { pitch: "F4", midi: 65, start: 8, length: 4 },
      { pitch: "G4", midi: 67, start: 12, length: 4 },
      { pitch: "G4", midi: 67, start: 16, length: 4 },
      { pitch: "F4", midi: 65, start: 20, length: 4 },
      { pitch: "E4", midi: 64, start: 24, length: 4 },
      { pitch: "D4", midi: 62, start: 28, length: 4 },
      { pitch: "C4", midi: 60, start: 32, length: 4 },
      { pitch: "C4", midi: 60, start: 36, length: 4 },
      { pitch: "D4", midi: 62, start: 40, length: 4 },
      { pitch: "E4", midi: 64, start: 44, length: 4 },
      { pitch: "E4", midi: 64, start: 48, length: 6 },
      { pitch: "D4", midi: 62, start: 54, length: 2 },
      { pitch: "D4", midi: 62, start: 56, length: 8 },
    ],
  },
  bluesLick: {
    title: "Blues & Jazz Cadence",
    bpm: 105,
    notes: [
      { pitch: "C4", midi: 60, start: 0, length: 2 },
      { pitch: "D#4", midi: 63, start: 2, length: 2 },
      { pitch: "F4", midi: 65, start: 4, length: 2 },
      { pitch: "F#4", midi: 66, start: 6, length: 2 },
      { pitch: "G4", midi: 67, start: 8, length: 4 },
      { pitch: "A#4", midi: 70, start: 12, length: 4 },
      { pitch: "C5", midi: 72, start: 16, length: 8 },
      { pitch: "G4", midi: 67, start: 24, length: 4 },
      { pitch: "F4", midi: 65, start: 28, length: 4 },
      { pitch: "D#4", midi: 63, start: 32, length: 4 },
      { pitch: "C4", midi: 60, start: 36, length: 8 },
    ],
  },
  cMajorScale: {
    title: "C Major Scale",
    bpm: 120,
    notes: [
      { pitch: "C4", midi: 60, start: 0, length: 4 },
      { pitch: "D4", midi: 62, start: 4, length: 4 },
      { pitch: "E4", midi: 64, start: 8, length: 4 },
      { pitch: "F4", midi: 65, start: 12, length: 4 },
      { pitch: "G4", midi: 67, start: 16, length: 4 },
      { pitch: "A4", midi: 69, start: 20, length: 4 },
      { pitch: "B4", midi: 71, start: 24, length: 4 },
      { pitch: "C5", midi: 72, start: 28, length: 4 },
    ],
  },
};

export default function MidiEditorPage() {
  const { t } = useLanguage();
  const router = useRouter();

  // State
  const [notes, setNotes] = useState<PianoRollNote[]>(() =>
    PRESETS.furElise.notes.map((n, i) => ({ ...n, id: `note-${i}-${Date.now()}` }))
  );
  const [quantizeGrid, setQuantizeGrid] = useState<"1/4" | "1/8" | "1/16" | "1/32">("1/16");
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [selectedTool, setSelectedTool] = useState<"draw" | "erase" | "select">("draw");
  const [bpm, setBpm] = useState(128);
  const [instrument, setInstrument] = useState<InstrumentType>("piano");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadStep, setPlayheadStep] = useState(0);
  const [isEngraving, setIsEngraving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activePianoKey, setActivePianoKey] = useState<number | null>(null);

  // Dragging / Resizing State
  const [draggingNote, setDraggingNote] = useState<{
    id: string;
    mode: "move" | "resize";
    startX: number;
    startY: number;
    origStart: number;
    origLength: number;
    origMidi: number;
  } | null>(null);

  // Audio Player Ref
  const audioPlayerRef = useRef<MidiAudioPlayer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const playbackStartTimeRef = useRef<number>(0);
  const workspaceScrollRef = useRef<HTMLDivElement | null>(null);

  // Initialize Audio Player
  const getAudioPlayer = useCallback((): MidiAudioPlayer => {
    if (!audioPlayerRef.current) {
      const player = new MidiAudioPlayer();
      player.instrument = instrument;
      player.bpm = bpm;
      audioPlayerRef.current = player;
    }
    return audioPlayerRef.current;
  }, [instrument, bpm]);

  // Sync Instrument changes to Audio Player
  useEffect(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.setInstrument(instrument);
    }
  }, [instrument]);

  // Center scroll on C4-C5 upon initial render
  useEffect(() => {
    if (workspaceScrollRef.current) {
      // Find row index for C5 (midi 72)
      const c5Row = PITCH_ROWS.findIndex((p) => p.midi === 72);
      if (c5Row !== -1) {
        workspaceScrollRef.current.scrollTop = Math.max(0, c5Row * ROW_HEIGHT - 60);
      }
    }
  }, []);

  // Calculate grid quantize step multiplier
  const getQuantizeStep = useCallback((): number => {
    switch (quantizeGrid) {
      case "1/4":
        return 4; // 1 quarter = 4 sixteenths
      case "1/8":
        return 2; // 1 eighth = 2 sixteenths
      case "1/16":
        return 1; // 1 sixteenth
      case "1/32":
        return 0.5;
      default:
        return 1;
    }
  }, [quantizeGrid]);

  // Preview / Play single note
  const previewNote = useCallback(
    (midi: number, durationSec: number = 0.35) => {
      const player = getAudioPlayer();
      player.playNote(midi, 0.85);
      setActivePianoKey(midi);
      setTimeout(() => {
        player.releaseNote(midi);
        setActivePianoKey((prev) => (prev === midi ? null : prev));
      }, durationSec * 1000);
    },
    [getAudioPlayer]
  );

  // Playback Control
  const stopPlayback = useCallback(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.stop();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsPlaying(false);
    setPlayheadStep(0);
  }, []);

  const startPlayback = useCallback(() => {
    if (notes.length === 0) return;
    const player = getAudioPlayer();
    player.setInstrument(instrument);

    // 1 sixteenth note duration in seconds: (60 / bpm) / 4
    const secPerStep = 60 / bpm / 4;

    // Convert notes into PlaybackEvent[]
    const events: PlaybackEvent[] = notes.map((n, idx) => ({
      _id: idx,
      time: n.start * secPerStep,
      duration: Math.max(0.1, n.length * secPerStep),
      midi: n.midi,
      velocity: (n.velocity || 90) / 127,
      noteName: n.pitch,
    }));

    const totalDuration = Math.max(
      ...notes.map((n) => (n.start + n.length) * secPerStep),
      TOTAL_STEPS * secPerStep
    );

    player.loadEvents(events, totalDuration, null, bpm);
    player.play();
    setIsPlaying(true);

    const startTime = performance.now();
    playbackStartTimeRef.current = startTime;

    const tick = () => {
      if (!player.isPlaying) {
        setIsPlaying(false);
        setPlayheadStep(0);
        return;
      }
      const curSec = player.currentTime;
      const currentStep = curSec / secPerStep;
      setPlayheadStep(currentStep);

      if (currentStep >= TOTAL_STEPS || curSec >= totalDuration) {
        stopPlayback();
        return;
      }
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
  }, [notes, bpm, instrument, getAudioPlayer, stopPlayback]);

  const togglePlay = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  };

  // Preset Loader
  const handleLoadPreset = (key: string) => {
    stopPlayback();
    if (key === "clear") {
      setNotes([]);
      setStatusMessage("Grid cleared");
      setTimeout(() => setStatusMessage(null), 2500);
      return;
    }
    const preset = PRESETS[key];
    if (preset) {
      setBpm(preset.bpm);
      setNotes(preset.notes.map((n, i) => ({ ...n, id: `note-${i}-${Date.now()}` })));
      setStatusMessage(`Loaded preset: ${preset.title}`);
      setTimeout(() => setStatusMessage(null), 2500);
    }
  };

  // Add / Draw Note
  const handleGridCellClick = (rowIndex: number, stepIndex: number) => {
    if (selectedTool !== "draw") return;

    const row = PITCH_ROWS[rowIndex];
    if (!row) return;

    const quantize = getQuantizeStep();
    const snappedStep = snapToGrid ? Math.floor(stepIndex / quantize) * quantize : stepIndex;

    // Check if a note already starts here
    const existing = notes.find((n) => n.midi === row.midi && Math.abs(n.start - snappedStep) < 0.5);
    if (existing) {
      // Preview it
      previewNote(row.midi, 0.25);
      return;
    }

    const defaultLength = Math.max(1, quantize);
    const newNote: PianoRollNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      pitch: row.pitch,
      midi: row.midi,
      start: snappedStep,
      length: defaultLength,
      velocity: 95,
    };

    setNotes((prev) => [...prev, newNote]);
    previewNote(row.midi, 0.3);
  };

  // Delete Note
  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  // Note Mouse Down (Move / Resize / Erase)
  const handleNoteMouseDown = (
    e: React.MouseEvent,
    note: PianoRollNote,
    isRightEdge: boolean
  ) => {
    e.stopPropagation();

    if (selectedTool === "erase" || e.button === 2) {
      handleDeleteNote(note.id);
      return;
    }

    previewNote(note.midi, 0.25);

    const mode = isRightEdge ? "resize" : "move";
    setDraggingNote({
      id: note.id,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      origStart: note.start,
      origLength: note.length,
      origMidi: note.midi,
    });
  };

  // Global Mouse Move for Dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingNote) return;

      const deltaX = e.clientX - draggingNote.startX;
      const deltaY = e.clientY - draggingNote.startY;
      const stepDelta = Math.round(deltaX / STEP_WIDTH);
      const rowDelta = Math.round(deltaY / ROW_HEIGHT);

      const quantize = snapToGrid ? getQuantizeStep() : 1;

      setNotes((prev) =>
        prev.map((n) => {
          if (n.id !== draggingNote.id) return n;

          if (draggingNote.mode === "resize") {
            const rawLength = draggingNote.origLength + stepDelta;
            const snappedLength = snapToGrid
              ? Math.max(quantize, Math.round(rawLength / quantize) * quantize)
              : Math.max(1, rawLength);
            return { ...n, length: snappedLength };
          } else {
            // Moving position and pitch
            const rawStart = draggingNote.origStart + stepDelta;
            const snappedStart = snapToGrid
              ? Math.max(0, Math.round(rawStart / quantize) * quantize)
              : Math.max(0, rawStart);

            // Pitch row shift
            const targetMidi = Math.max(48, Math.min(84, draggingNote.origMidi - rowDelta));
            const targetRow = PITCH_ROWS.find((p) => p.midi === targetMidi);
            const pitchName = targetRow ? targetRow.pitch : n.pitch;

            return {
              ...n,
              start: Math.min(TOTAL_STEPS - n.length, snappedStart),
              midi: targetMidi,
              pitch: pitchName,
            };
          }
        })
      );
    };

    const handleMouseUp = () => {
      setDraggingNote(null);
    };

    if (draggingNote) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingNote, snapToGrid, getQuantizeStep]);

  // Clean up playback on unmount
  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.stop();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Export MIDI file
  const handleExportMidi = () => {
    if (notes.length === 0) {
      alert("No notes to export! Draw some notes on the piano roll first.");
      return;
    }

    const ppq = 480;
    const ticksPerStep = ppq / 4; // 120 ticks per sixteenth note
    const exportNotes: ExportNote[] = notes.map((n) => ({
      midi: n.midi,
      startTick: Math.round(n.start * ticksPerStep),
      durationTick: Math.max(60, Math.round(n.length * ticksPerStep)),
      velocity: n.velocity || 90,
    }));

    const bytes = generateMidiBytes(exportNotes, bpm, ppq);
    downloadMidiFile(bytes, "piano_roll_composition.mid");
    setStatusMessage("MIDI downloaded successfully!");
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Engrave Score in Sheet Music Viewer
  const handleEngraveScore = async () => {
    if (notes.length === 0) {
      alert("No notes to engrave! Draw some notes on the piano roll first.");
      return;
    }

    setIsEngraving(true);
    stopPlayback();

    try {
      const ppq = 480;
      const ticksPerStep = ppq / 4;
      const exportNotes: ExportNote[] = notes.map((n) => ({
        midi: n.midi,
        startTick: Math.round(n.start * ticksPerStep),
        durationTick: Math.max(60, Math.round(n.length * ticksPerStep)),
        velocity: n.velocity || 90,
      }));

      const bytes = generateMidiBytes(exportNotes, bpm, ppq);
      const blob = new Blob([bytes as any], { type: "audio/midi" });
      const file = new File([blob], "piano_roll_score.mid", { type: "audio/midi" });

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || "Failed to engrave sheet music");
      }

      const scoreData: ScoreData = await res.json();

      if (typeof window !== "undefined") {
        const json = JSON.stringify(scoreData);
        sessionStorage.setItem("tukanft_active_score", json);
        localStorage.setItem("tukanft_active_score", json);
      }

      const targetUrl = scoreData.sessionId
        ? `/midi-to-sheet?session=${scoreData.sessionId}`
        : "/midi-to-sheet";

      window.location.href = targetUrl;
    } catch (err: any) {
      console.error("Engrave score error:", err);
      alert(`Engraving error: ${err.message || "Failed to engrave score"}`);
    } finally {
      setIsEngraving(false);
    }
  };

  return (
    <StudioLayout
      activeTool="midi-editor"
      title={t("midiEditor")}
      badge="PIANO ROLL v2"
    >
      <div className="flex-1 flex flex-col h-full w-full overflow-hidden bg-slate-950 text-slate-100 select-none">
        {/* Editor Main Toolbar */}
        <div className="h-14 border-b border-slate-800 bg-slate-900/90 px-4 flex flex-wrap items-center justify-between gap-3 shrink-0 z-20 backdrop-blur-md">
          {/* Left Group: Playback & Editing Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer ${
                isPlaying
                  ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30 animate-pulse"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30"
              }`}
            >
              <span>{isPlaying ? "⏸ Pause" : "▶ Play"}</span>
            </button>

            <button
              onClick={stopPlayback}
              className="p-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title="Stop & Rewind"
            >
              ⏹
            </button>

            <div className="h-4 w-px bg-slate-800 mx-1" />

            {/* Edit Tools */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setSelectedTool("draw")}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                  selectedTool === "draw"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Pencil / Draw note"
              >
                <span>✏️ Draw</span>
              </button>
              <button
                onClick={() => setSelectedTool("select")}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                  selectedTool === "select"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Select & Move / Resize"
              >
                <span>↖️ Select</span>
              </button>
              <button
                onClick={() => setSelectedTool("erase")}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                  selectedTool === "erase"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Eraser (or double-click note)"
              >
                <span>🧹 Erase</span>
              </button>
            </div>

            <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

            {/* Presets */}
            <div className="hidden md:flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-semibold">Preset:</span>
              <select
                onChange={(e) => handleLoadPreset(e.target.value)}
                defaultValue="furElise"
                className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="furElise">Für Elise</option>
                <option value="odeToJoy">Ode to Joy</option>
                <option value="bluesLick">Blues Cadence</option>
                <option value="cMajorScale">C Major Scale</option>
                <option value="clear">🗑️ Clear All</option>
              </select>
            </div>
          </div>

          {/* Right Group: Quantize, BPM, Sound & Actions */}
          <div className="flex items-center gap-3 text-xs">
            {/* Grid Quantize */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold">Grid:</span>
              <select
                value={quantizeGrid}
                onChange={(e) => setQuantizeGrid(e.target.value as any)}
                className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="1/4">1/4</option>
                <option value="1/8">1/8</option>
                <option value="1/16">1/16</option>
                <option value="1/32">1/32</option>
              </select>
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={snapToGrid}
                onChange={(e) => setSnapToGrid(e.target.checked)}
                className="rounded accent-indigo-600"
              />
              <span>Snap</span>
            </label>

            {/* Tempo (BPM) */}
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              <span className="text-slate-400 font-semibold">BPM:</span>
              <input
                type="number"
                min={40}
                max={240}
                value={bpm}
                onChange={(e) => setBpm(Math.max(40, Math.min(240, Number(e.target.value) || 120)))}
                className="w-12 bg-transparent text-amber-400 font-mono font-bold text-xs focus:outline-none text-center"
              />
            </div>

            {/* Instrument Selection */}
            <div className="hidden sm:flex items-center gap-1.5">
              <select
                value={instrument}
                onChange={(e) => setInstrument(e.target.value as InstrumentType)}
                className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="piano">Grand Piano</option>
                <option value="epiano">Rhodes EP</option>
                <option value="strings">Strings</option>
                <option value="organ">Organ</option>
                <option value="synth">Lead Synth</option>
              </select>
            </div>

            {/* Download MIDI */}
            <button
              onClick={handleExportMidi}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Download standard MIDI file (.mid)"
            >
              <span>📥 Export MIDI</span>
            </button>

            {/* Engrave Score */}
            <button
              onClick={handleEngraveScore}
              disabled={isEngraving}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 active:scale-95 text-white transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>{isEngraving ? "⚡ Engraving..." : "🎼 Engrave Score"}</span>
            </button>
          </div>
        </div>

        {/* Status notification toast */}
        {statusMessage && (
          <div className="absolute top-16 right-6 z-50 px-4 py-2 rounded-xl bg-slate-900 border border-indigo-500/40 text-indigo-300 text-xs font-semibold shadow-2xl animate-fade-in flex items-center gap-2">
            <span>✨</span>
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Piano Roll Workspace Container */}
        <div
          ref={workspaceScrollRef}
          className="flex-1 overflow-auto bg-slate-950 relative"
          onContextMenu={(e) => e.preventDefault()}
        >
          <div
            style={{
              width: `${TOTAL_STEPS * STEP_WIDTH + 80}px`,
              height: `${PITCH_ROWS.length * ROW_HEIGHT + 28}px`,
            }}
            className="relative"
          >
            {/* Top-Left Corner Box (Sticky Top & Left) */}
            <div className="sticky top-0 left-0 w-20 h-7 bg-slate-900 border-r border-b border-slate-800 z-40 flex items-center justify-center text-[10px] font-mono text-slate-400">
              Keys
            </div>

            {/* Measure Bar Header (Sticky Top) */}
            <div
              style={{ left: "80px", width: `${TOTAL_STEPS * STEP_WIDTH}px` }}
              className="absolute top-0 h-7 border-b border-slate-800 bg-slate-900/90 backdrop-blur flex text-[10px] font-mono text-slate-400 z-30 cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickedStep = Math.max(0, Math.min(TOTAL_STEPS, clickX / STEP_WIDTH));
                setPlayheadStep(clickedStep);
              }}
            >
              {Array.from({ length: TOTAL_BARS }).map((_, barIdx) => (
                <div
                  key={barIdx}
                  style={{ width: `${STEPS_PER_BAR * STEP_WIDTH}px` }}
                  className="h-full pl-2 border-r border-slate-800 flex items-center font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Bar {barIdx + 1}
                </div>
              ))}
            </div>

            {/* Vertical Piano Keyboard (Sticky Left) */}
            <div
              style={{ top: "28px" }}
              className="sticky left-0 w-20 flex flex-col z-30 select-none bg-slate-900 border-r border-slate-800"
            >
              {PITCH_ROWS.map((row) => {
                const isActive = activePianoKey === row.midi;
                return (
                  <div
                    key={row.midi}
                    onMouseDown={() => previewNote(row.midi, 0.4)}
                    style={{ height: `${ROW_HEIGHT}px` }}
                    className={`px-2 border-b text-[10px] font-mono flex items-center justify-between border-slate-800/60 cursor-pointer transition-colors ${
                      isActive
                        ? "bg-amber-500 text-slate-950 font-black shadow-inner"
                        : row.isBlack
                        ? "bg-slate-950 text-slate-400 font-bold hover:bg-slate-900"
                        : "bg-slate-900 text-slate-200 hover:bg-slate-850"
                    }`}
                  >
                    <span>{row.pitch}</span>
                    {row.isBlack && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActive ? "bg-slate-950" : "bg-slate-600"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Note Grid Canvas */}
            <div
              style={{
                left: "80px",
                top: "28px",
                width: `${TOTAL_STEPS * STEP_WIDTH}px`,
                height: `${PITCH_ROWS.length * ROW_HEIGHT}px`,
              }}
              className="absolute bg-slate-950"
            >
              {/* Background Grid Rows & Columns */}
              {PITCH_ROWS.map((row, rIdx) => (
                <div
                  key={row.midi}
                  style={{
                    top: `${rIdx * ROW_HEIGHT}px`,
                    height: `${ROW_HEIGHT}px`,
                    width: "100%",
                  }}
                  className={`absolute border-b border-slate-800/40 flex ${
                    row.isBlack ? "bg-slate-950/60" : "bg-slate-900/15"
                  }`}
                >
                  {/* Sixteenth Note Grid Cells */}
                  {Array.from({ length: TOTAL_STEPS }).map((_, stepIdx) => {
                    const isBarStart = stepIdx % STEPS_PER_BAR === 0;
                    const isBeatStart = stepIdx % 4 === 0;

                    return (
                      <div
                        key={stepIdx}
                        onClick={() => handleGridCellClick(rIdx, stepIdx)}
                        style={{ width: `${STEP_WIDTH}px` }}
                        className={`h-full border-r ${
                          isBarStart
                            ? "border-slate-700/80"
                            : isBeatStart
                            ? "border-slate-800/60"
                            : "border-slate-850/20"
                        } hover:bg-indigo-500/10 cursor-crosshair transition-colors`}
                      />
                    );
                  })}
                </div>
              ))}

              {/* Visual Playhead Bar */}
              <div
                style={{
                  left: `${playheadStep * STEP_WIDTH}px`,
                  height: "100%",
                }}
                className="absolute top-0 w-0.5 bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.9)] z-20 pointer-events-none transition-transform"
              >
                <div className="w-3 h-3 bg-rose-500 rotate-45 -ml-[5px] -mt-1.5 shadow-sm" />
              </div>

              {/* Rendered Notes Blocks */}
              {notes.map((n) => {
                const rowIndex = PITCH_ROWS.findIndex((p) => p.midi === n.midi);
                if (rowIndex === -1) return null;

                const leftPx = n.start * STEP_WIDTH;
                const topPx = rowIndex * ROW_HEIGHT + 2;
                const widthPx = Math.max(12, n.length * STEP_WIDTH - 2);

                return (
                  <div
                    key={n.id}
                    onMouseDown={(e) => handleNoteMouseDown(e, n, false)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(n.id);
                    }}
                    style={{
                      left: `${leftPx}px`,
                      top: `${topPx}px`,
                      width: `${widthPx}px`,
                      height: `${ROW_HEIGHT - 4}px`,
                    }}
                    className={`absolute rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 border border-indigo-400 shadow-md flex items-center justify-between px-1.5 text-[10px] font-bold text-white group cursor-move hover:brightness-115 active:scale-[0.99] transition-all z-10 ${
                      draggingNote?.id === n.id ? "ring-2 ring-white brightness-125 z-20" : ""
                    }`}
                  >
                    <span className="truncate select-none pointer-events-none">{n.pitch}</span>

                    {/* Right-edge Resize Handle */}
                    <div
                      onMouseDown={(e) => handleNoteMouseDown(e, n, true)}
                      className="w-2.5 h-full absolute right-0 top-0 cursor-ew-resize hover:bg-white/30 rounded-r-md transition-colors"
                      title="Drag to resize note duration"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info strip */}
        <div className="h-7 border-t border-slate-800 bg-slate-900/60 px-4 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center gap-3">
            <span>
              Total Notes: <strong className="text-slate-200">{notes.length}</strong>
            </span>
            <span>•</span>
            <span>
              Length: <strong className="text-slate-200">{TOTAL_BARS} Bars</strong>
            </span>
            <span>•</span>
            <span>
              Snap: <strong className="text-slate-200">{snapToGrid ? quantizeGrid : "Off"}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-500">
            <span>Tip: Click empty grid to draw • Drag body to move • Drag right edge to resize • Double-click to erase</span>
          </div>
        </div>
      </div>
    </StudioLayout>
  );
}
