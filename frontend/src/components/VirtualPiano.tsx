"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { MidiAudioPlayer, InstrumentType } from "@/lib/audioPlayer";
import { SampleInfo, ScoreData } from "@/types";

interface VirtualPianoProps {
  samples: SampleInfo[];
  onOpenScoreInSheetMusic?: (data: ScoreData) => void;
}

interface PianoKeyData {
  midi: number;
  noteName: string;
  isBlack: boolean;
  octave: number;
  shortcut?: string;
}

export type KeyLabelMode = "notes" | "shortcuts" | "both" | "off";

const KEY_SHORTCUTS: Record<string, number> = {
  // Octave 3/4
  z: 48, // C3
  s: 49, // C#3
  x: 50, // D3
  d: 51, // D#3
  c: 52, // E3
  v: 53, // F3
  g: 54, // F#3
  b: 55, // G3
  h: 56, // G#3
  n: 57, // A3
  j: 58, // A#3
  m: 59, // B3
  // Octave 4/5 (Home row)
  q: 60, // C4
  "2": 61, // C#4
  w: 62, // D4
  "3": 63, // D#4
  e: 64, // E4
  r: 65, // F4
  "5": 66, // F#4
  t: 67, // G4
  "6": 68, // G#4
  y: 69, // A4
  "7": 70, // A#4
  u: 71, // B4
  i: 72, // C5
  "9": 73, // C#5
  o: 74, // D5
  "0": 75, // D#5
  p: 76, // E5
};

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Build standard 88-key piano (A0 to C8: MIDI 21 to 108)
function generate88Keys(): PianoKeyData[] {
  const keys: PianoKeyData[] = [];
  const shortcutMap = new Map<number, string>();
  for (const [key, midi] of Object.entries(KEY_SHORTCUTS)) {
    shortcutMap.set(midi, key.toUpperCase());
  }

  for (let midi = 21; midi <= 108; midi++) {
    const noteIndex = midi % 12;
    const name = NOTE_NAMES[noteIndex];
    const isBlack = name.includes("#");
    const octave = Math.floor(midi / 12) - 1;
    keys.push({
      midi,
      noteName: `${name}${octave}`,
      isBlack,
      octave,
      shortcut: shortcutMap.get(midi),
    });
  }
  return keys;
}

const ALL_88_KEYS = generate88Keys();

export default function VirtualPiano({ samples, onOpenScoreInSheetMusic }: VirtualPianoProps) {
  const [player] = useState<MidiAudioPlayer>(() => new MidiAudioPlayer());
  const [activeMidiKeys, setActiveMidiKeys] = useState<Set<number>>(new Set());
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [instrument, setInstrument] = useState<InstrumentType>("piano");
  const [sustainPedal, setSustainPedal] = useState(true);
  const [labelMode, setLabelMode] = useState<KeyLabelMode>("notes");
  const [midiInputStatus, setMidiInputStatus] = useState<string>("Scanning for MIDI devices...");
  const [hasMidiDevice, setHasMidiDevice] = useState(false);

  // Playback state
  const [isPlayingSong, setIsPlayingSong] = useState(false);
  const [activeSongTitle, setActiveSongTitle] = useState<string | null>(null);
  const [songProgress, setSongProgress] = useState(0);
  const [songDuration, setSongDuration] = useState(0);

  const keyboardScrollRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Auto center scroll on Middle C (C4 = MIDI 60) strictly inside keyboard container
  useEffect(() => {
    if (keyboardScrollRef.current) {
      const container = keyboardScrollRef.current;
      const c4Element = document.getElementById("key-60");
      if (c4Element) {
        const offset = c4Element.offsetLeft - container.clientWidth / 2 + c4Element.clientWidth / 2;
        container.scrollTo({ left: Math.max(0, offset), behavior: "smooth" });
      } else {
        container.scrollLeft = container.scrollWidth * 0.38;
      }
    }
  }, []);

  // Web MIDI API detection & handler
  useEffect(() => {
    if (typeof window !== "undefined" && "requestMIDIAccess" in navigator) {
      (navigator as any)
        .requestMIDIAccess()
        .then((midiAccess: any) => {
          let count = 0;
          const inputs = midiAccess.inputs.values();
          for (const input of inputs) {
            count++;
            input.onmidimessage = handleMidiMessage;
          }
          if (count > 0) {
            setHasMidiDevice(true);
            setMidiInputStatus(`Connected: ${count} MIDI Controller${count > 1 ? "s" : ""}`);
          } else {
            setMidiInputStatus("Ready (No external MIDI keyboard detected)");
          }

          midiAccess.onstatechange = (e: any) => {
            const connected = midiAccess.inputs.size > 0;
            setHasMidiDevice(connected);
            setMidiInputStatus(
              connected
                ? `Connected: ${e.port.name || "MIDI Keyboard"}`
                : "Ready (No external MIDI keyboard detected)"
            );
          };
        })
        .catch(() => {
          setMidiInputStatus("Web MIDI not supported or permission denied");
        });
    } else {
      setMidiInputStatus("Web MIDI API not available in this browser");
    }
  }, []);

  // Play a note
  const triggerNoteOn = useCallback(
    (midi: number, vel: number = 0.8) => {
      player.playNote(midi, vel);
      setActiveMidiKeys((prev) => {
        const next = new Set(prev);
        next.add(midi);
        return next;
      });
    },
    [player]
  );

  // Release a note
  const triggerNoteOff = useCallback(
    (midi: number) => {
      player.releaseNote(midi);
      setActiveMidiKeys((prev) => {
        const next = new Set(prev);
        next.delete(midi);
        return next;
      });
    },
    [player]
  );

  // Handle hardware MIDI input messages
  const handleMidiMessage = useCallback(
    (event: any) => {
      const [status, note, velocity] = event.data;
      const command = status >> 4;
      if (command === 9 && velocity > 0) {
        triggerNoteOn(note, velocity / 127.0);
      } else if (command === 8 || (command === 9 && velocity === 0)) {
        triggerNoteOff(note);
      }
    },
    [triggerNoteOn, triggerNoteOff]
  );

  // Computer QWERTY keyboard listener
  useEffect(() => {
    const activeKeysMap = new Map<string, number>();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      const key = e.key.toLowerCase();
      if (KEY_SHORTCUTS[key] && !activeKeysMap.has(key)) {
        const midi = KEY_SHORTCUTS[key];
        activeKeysMap.set(key, midi);
        triggerNoteOn(midi, 0.85);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (activeKeysMap.has(key)) {
        const midi = activeKeysMap.get(key)!;
        activeKeysMap.delete(key);
        triggerNoteOff(midi);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [triggerNoteOn, triggerNoteOff]);

  // Setup visual canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGrad.addColorStop(0, "#030712");
      bgGrad.addColorStop(0.7, "#0b0f19");
      bgGrad.addColorStop(1, "#020617");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Horizon glow line above keys
      ctx.beginPath();
      ctx.moveTo(0, canvas.height - 1);
      ctx.lineTo(canvas.width, canvas.height - 1);
      ctx.strokeStyle = "rgba(56, 189, 248, 0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Light beams for active keys
      activeMidiKeys.forEach((midi) => {
        const keyEl = document.getElementById(`key-${midi}`);
        if (keyEl && canvas) {
          const rect = keyEl.getBoundingClientRect();
          const canvasRect = canvas.getBoundingClientRect();
          const x = rect.left - canvasRect.left + rect.width / 2;
          const width = rect.width * 0.9;

          const beamGrad = ctx.createLinearGradient(0, canvas.height, 0, 0);
          beamGrad.addColorStop(0, "rgba(56, 189, 248, 0.8)");
          beamGrad.addColorStop(0.4, "rgba(99, 102, 241, 0.3)");
          beamGrad.addColorStop(1, "rgba(244, 63, 94, 0)");

          ctx.fillStyle = beamGrad;
          ctx.fillRect(x - width / 2, 0, width, canvas.height);

          ctx.beginPath();
          ctx.arc(x, canvas.height - 2, width / 2, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(147, 197, 253, 0.9)";
          ctx.fill();
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [activeMidiKeys]);

  // Load and play a preloaded song
  const handlePlaySample = async (sampleId: string) => {
    try {
      player.stop();
      setIsPlayingSong(true);
      const res = await fetch(`/api/sample/${sampleId}`, { method: "POST" });
      const data: ScoreData = await res.json();
      setActiveSongTitle(data.metadata.title);
      setSongDuration(data.metadata.durationSeconds);

      player.loadEvents(data.playbackEvents, data.metadata.durationSeconds, null, data.metadata.tempoBpm);

      player.onProgressCallback = (curr, dur) => {
        setSongProgress(curr);
        setSongDuration(dur);

        const activeNow = new Set<number>();
        for (const ev of data.playbackEvents) {
          if (curr >= ev.time && curr <= ev.time + ev.duration) {
            activeNow.add(ev.midi);
          }
        }
        setActiveMidiKeys(activeNow);
      };

      player.onStateChangeCallback = (state) => {
        if (state === "stopped") {
          setIsPlayingSong(false);
          setActiveMidiKeys(new Set());
        }
      };

      await player.play();
    } catch (e: any) {
      alert("Failed to load song: " + e.message);
      setIsPlayingSong(false);
    }
  };

  const handleStopSong = () => {
    player.stop();
    setIsPlayingSong(false);
    setActiveMidiKeys(new Set());
    setActiveSongTitle(null);
  };

  const handleInstrumentChange = (inst: InstrumentType) => {
    setInstrument(inst);
    player.setInstrument(inst, true);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Top Controls & Status Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Title & MIDI Hardware status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🎹</span>
            <span className="font-bold text-white text-sm">Virtual Piano Keyboard</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              88 KEYS
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          {/* MIDI controller status pill */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400">
            <span className={`w-2 h-2 rounded-full ${hasMidiDevice ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
            <span className="truncate max-w-[200px]">{midiInputStatus}</span>
          </div>
        </div>

        {/* Center / Right: Instrument, Pedal, Key Label Display Mode */}
        <div className="flex items-center gap-2.5">
          {/* Sound selector */}
          <select
            value={instrument}
            onChange={(e) => handleInstrumentChange(e.target.value as InstrumentType)}
            className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-slate-200 text-xs outline-none focus:border-rose-500 cursor-pointer"
          >
            <option value="piano">🎹 Grand Piano</option>
            <option value="epiano">⚡ Rhodes E-Piano</option>
            <option value="strings">🎻 Warm Strings</option>
            <option value="organ">⛪ Church Organ</option>
            <option value="celesta">✨ Celesta / Bells</option>
            <option value="synth">🎛️ Retro Synth</option>
          </select>

          {/* Sustain Pedal */}
          <button
            onClick={() => {
              const next = !sustainPedal;
              setSustainPedal(next);
              player.setSustainPedal(next);
            }}
            className={`px-2.5 py-1 rounded border text-xs font-medium transition flex items-center gap-1 ${
              sustainPedal
                ? "bg-indigo-950/80 border-indigo-600/70 text-indigo-300 shadow-sm"
                : "bg-slate-800 border-slate-700 text-slate-400"
            }`}
          >
            <span>Pedal: {sustainPedal ? "ON" : "OFF"}</span>
          </button>

          {/* Clean Key Label Selector (Notes vs Shortcuts vs Both vs Off) */}
          <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded p-0.5 text-[11px]">
            <button
              onClick={() => setLabelMode("notes")}
              className={`px-2 py-0.5 rounded transition font-medium ${
                labelMode === "notes"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Show clean note names (C4, D4...)"
            >
              Notes
            </button>
            <button
              onClick={() => setLabelMode("shortcuts")}
              className={`px-2 py-0.5 rounded transition font-medium ${
                labelMode === "shortcuts"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Show computer keyboard keys (Q, W, E...)"
            >
              Keys
            </button>
            <button
              onClick={() => setLabelMode("both")}
              className={`px-2 py-0.5 rounded transition font-medium ${
                labelMode === "both"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Separate both (Shortcuts on top, Notes at bottom)"
            >
              Both
            </button>
            <button
              onClick={() => setLabelMode("off")}
              className={`px-2 py-0.5 rounded transition font-medium ${
                labelMode === "off"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Clean piano without labels"
            >
              Off
            </button>
          </div>
        </div>
      </div>

      {/* Hero Visualizer Banner */}
      <div className="relative flex-1 min-h-[160px] max-h-[340px] w-full overflow-hidden flex flex-col justify-between">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" width={1600} height={340} />

        {/* Ambient overlay info */}
        <div className="relative z-10 p-5 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight drop-shadow-md">
              {activeSongTitle ? `Playing: ${activeSongTitle}` : "Play the Virtual Piano"}
            </h3>
            <p className="text-xs text-slate-300 mt-1 drop-shadow">
              Play with mouse, computer keyboard (QWERTY), or plug in any real USB/Bluetooth MIDI keyboard.
            </p>
          </div>

          {/* Song playback transport if active */}
          {isPlayingSong && (
            <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-2 rounded-xl backdrop-blur">
              <button
                onClick={handleStopSong}
                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 transition"
              >
                <span>⏹ Stop Song</span>
              </button>
              <span className="font-mono text-xs text-slate-300">
                {Math.floor(songProgress / 60)}:
                {Math.floor(songProgress % 60)
                  .toString()
                  .padStart(2, "0")}
              </span>
            </div>
          )}
        </div>

        {/* Preloaded demo song chips */}
        <div className="relative z-10 px-5 pb-3 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
            Songs:
          </span>
          {samples.map((s) => (
            <button
              key={s.id}
              onClick={() => handlePlaySample(s.id)}
              className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition shrink-0 backdrop-blur"
            >
              ▶ {s.title}
            </button>
          ))}
        </div>
      </div>

      {/* 88-Key Interactive Piano Keyboard Container */}
      <div
        ref={keyboardScrollRef}
        onMouseDown={() => setIsMouseDown(true)}
        onMouseUp={() => setIsMouseDown(false)}
        className="w-full bg-[#0a0d14] border-t border-slate-800 overflow-x-auto overflow-y-hidden shadow-2xl py-4 px-6"
        style={{ scrollbarWidth: "thin" }}
      >
        <div className="relative inline-flex h-56 min-w-max select-none pb-2 pt-1">
          {ALL_88_KEYS.map((key) => {
            const isActive = activeMidiKeys.has(key.midi);

            // Black Key
            if (key.isBlack) {
              const showShortcut = (labelMode === "shortcuts" || labelMode === "both") && key.shortcut;
              const showNote = labelMode === "notes" || labelMode === "both";

              return (
                <div
                  key={key.midi}
                  id={`key-${key.midi}`}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    triggerNoteOn(key.midi);
                  }}
                  onMouseUp={() => triggerNoteOff(key.midi)}
                  onMouseEnter={() => isMouseDown && triggerNoteOn(key.midi)}
                  onMouseLeave={() => isActive && triggerNoteOff(key.midi)}
                  className={`absolute z-20 w-7 h-36 -ml-3.5 rounded-b-md transition-all duration-75 cursor-pointer shadow-lg flex flex-col justify-between items-center py-2 ${
                    isActive
                      ? "bg-gradient-to-b from-sky-400 to-indigo-600 shadow-cyan-500/50 scale-[0.98] ring-2 ring-cyan-300"
                      : "bg-gradient-to-b from-slate-900 via-slate-950 to-black hover:from-slate-800 hover:to-slate-900 border-x border-b border-slate-700/60"
                  }`}
                  style={{
                    left: `${getBlackKeyLeftOffset(key.midi)}px`,
                  }}
                >
                  {/* Top section: Keyboard Shortcut (if visible) */}
                  <div className="h-4 flex items-center justify-center">
                    {showShortcut && (
                      <span
                        className={`text-[9px] font-bold font-mono px-1 rounded ${
                          isActive ? "text-white bg-black/40" : "text-slate-400 bg-slate-800/80"
                        }`}
                      >
                        {key.shortcut}
                      </span>
                    )}
                  </div>

                  {/* Bottom section: Note Name (if visible) */}
                  <div className="h-4 flex items-center justify-center">
                    {showNote && (
                      <span
                        className={`text-[8px] font-mono ${
                          isActive ? "text-cyan-100 font-bold" : "text-slate-400"
                        }`}
                      >
                        {key.noteName}
                      </span>
                    )}
                  </div>
                </div>
              );
            }

            // White Key
            const showShortcut = (labelMode === "shortcuts" || labelMode === "both") && key.shortcut;
            const showNote = labelMode === "notes" || labelMode === "both";

            return (
              <div
                key={key.midi}
                id={`key-${key.midi}`}
                onMouseDown={() => triggerNoteOn(key.midi)}
                onMouseUp={() => triggerNoteOff(key.midi)}
                onMouseEnter={() => isMouseDown && triggerNoteOn(key.midi)}
                onMouseLeave={() => isActive && triggerNoteOff(key.midi)}
                className={`relative z-10 w-11 h-52 rounded-b-lg border-x border-b transition-all duration-75 cursor-pointer flex flex-col justify-between items-center py-3 ${
                  isActive
                    ? "bg-gradient-to-b from-sky-100 to-sky-300 border-sky-400 shadow-md shadow-sky-400/50 scale-[0.99]"
                    : "bg-gradient-to-b from-slate-100 via-white to-slate-200 hover:from-white hover:to-slate-100 border-slate-300 shadow-sm"
                }`}
              >
                {/* Upper section: QWERTY keyboard shortcut */}
                <div className="h-5 flex items-center justify-center">
                  {showShortcut && (
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isActive ? "bg-sky-600 text-white" : "bg-slate-200/90 text-slate-700"
                      }`}
                    >
                      {key.shortcut}
                    </span>
                  )}
                </div>

                {/* Lower section: Musical Note Name (e.g. C4, D4, E4) */}
                <div className="h-5 flex items-center justify-center">
                  {showNote && (
                    <span
                      className={`text-[11px] font-semibold ${
                        isActive ? "text-sky-950 font-bold" : "text-slate-600"
                      }`}
                    >
                      {key.noteName}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Helper to compute exact horizontal pixel alignment for black keys
function getBlackKeyLeftOffset(blackMidi: number): number {
  let whiteCountBefore = 0;
  for (let m = 21; m < blackMidi; m++) {
    const name = NOTE_NAMES[m % 12];
    if (!name.includes("#")) {
      whiteCountBefore++;
    }
  }
  const whiteKeyWidth = 44; // 11rem / 44px
  return whiteCountBefore * whiteKeyWidth;
}
