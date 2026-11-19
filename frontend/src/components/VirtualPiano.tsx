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

interface KeyGeometry {
  isBlack: boolean;
  left: number;
  centerX: number;
  width: number;
}

function computeKeyGeometry(midi: number): KeyGeometry {
  let whiteCountBefore = 0;
  for (let m = 21; m < midi; m++) {
    const name = NOTE_NAMES[m % 12];
    if (!name.includes("#")) {
      whiteCountBefore++;
    }
  }
  const isBlack = NOTE_NAMES[midi % 12].includes("#");
  const whiteKeyWidth = 44;
  const blackKeyWidth = 28;

  if (isBlack) {
    const centerX = whiteCountBefore * whiteKeyWidth;
    const left = centerX - blackKeyWidth / 2;
    return { isBlack: true, left, centerX, width: blackKeyWidth };
  } else {
    const left = whiteCountBefore * whiteKeyWidth;
    const centerX = left + whiteKeyWidth / 2;
    return { isBlack: false, left, centerX, width: whiteKeyWidth };
  }
}

const TOTAL_PIANO_WIDTH = 52 * 44; // 2288px (52 white keys)

const KEY_GEOMETRY_MAP = new Map<number, KeyGeometry>();
for (let m = 21; m <= 108; m++) {
  KEY_GEOMETRY_MAP.set(m, computeKeyGeometry(m));
}

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

interface NoteBlock {
  id: number;
  midi: number;
  bottom: number;
  height: number;
  active: boolean;
}

interface SplashParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
}

export default function VirtualPiano({ samples, onOpenScoreInSheetMusic }: VirtualPianoProps) {
  const [player] = useState<MidiAudioPlayer>(() => new MidiAudioPlayer());
  const [activeMidiKeys, setActiveMidiKeys] = useState<Set<number>>(new Set());
  const [isMouseDown, setIsMouseDown] = useState(false);
  const touchActiveMidiRef = useRef<number | null>(null);
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
  const activeMidiKeysRef = useRef<Set<number>>(activeMidiKeys);

  // Waterfall note block and sparkle particles state (Pianovera / Synthesia note engine)
  const noteBlocksRef = useRef<NoteBlock[]>([]);
  const particlesRef = useRef<SplashParticle[]>([]);
  const nextBlockIdRef = useRef<number>(1);
  const prevSongKeysRef = useRef<Set<number>>(new Set());

  const startNoteBlock = useCallback((midi: number) => {
    for (const b of noteBlocksRef.current) {
      if (b.midi === midi && b.active) {
        b.active = false;
      }
    }
    noteBlocksRef.current.push({
      id: nextBlockIdRef.current++,
      midi,
      bottom: 0,
      height: 6,
      active: true,
    });
  }, []);

  const endNoteBlock = useCallback((midi: number) => {
    for (const b of noteBlocksRef.current) {
      if (b.midi === midi && b.active) {
        b.active = false;
      }
    }
  }, []);

  useEffect(() => {
    activeMidiKeysRef.current = activeMidiKeys;
  }, [activeMidiKeys]);

  // Auto center scroll on Middle C (C4 = MIDI 60) strictly inside keyboard container
  useEffect(() => {
    if (keyboardScrollRef.current) {
      const container = keyboardScrollRef.current;
      const c4 = KEY_GEOMETRY_MAP.get(60);
      if (c4) {
        const offset = c4.centerX - container.clientWidth / 2;
        container.scrollTo({ left: Math.max(0, offset), behavior: "smooth" });
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
      startNoteBlock(midi);
      setActiveMidiKeys((prev) => {
        const next = new Set(prev);
        next.add(midi);
        return next;
      });
    },
    [player, startNoteBlock]
  );

  // Release a note
  const triggerNoteOff = useCallback(
    (midi: number) => {
      player.releaseNote(midi);
      endNoteBlock(midi);
      setActiveMidiKeys((prev) => {
        const next = new Set(prev);
        next.delete(midi);
        return next;
      });
    },
    [player, endNoteBlock]
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

  // Setup visual canvas animation with 1:1 pixel alignment to piano keys
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();
    const SPEED = 145; // waterfall block speed in pixels per second

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05) || 0.016;
      lastTime = time;

      const dpr = window.devicePixelRatio || 1;
      const displayWidth = TOTAL_PIANO_WIDTH; // exactly 2288px
      const displayHeight = 240;

      const targetWidth = Math.round(displayWidth * dpr);
      const targetHeight = Math.round(displayHeight * dpr);
      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Deep dark studio visualizer background
      ctx.clearRect(0, 0, displayWidth, displayHeight);
      const bgGrad = ctx.createLinearGradient(0, 0, 0, displayHeight);
      bgGrad.addColorStop(0, "#020409");
      bgGrad.addColorStop(0.7, "#080d1a");
      bgGrad.addColorStop(1, "#03060e");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, displayWidth, displayHeight);

      // 1. Draw Pianovera-style vertical lanes for all 52 white keys
      for (let w = 0; w <= 52; w++) {
        const x = w * 44;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, displayHeight);
        ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 2. Draw darker vertical columns for all 36 black keys
      ALL_88_KEYS.forEach((key) => {
        if (key.isBlack) {
          const geom = KEY_GEOMETRY_MAP.get(key.midi);
          if (geom) {
            // Darker column for black key track
            ctx.fillStyle = "rgba(2, 6, 23, 0.6)";
            ctx.fillRect(geom.left, 0, geom.width, displayHeight);

            // Subtle lane edges
            ctx.strokeStyle = "rgba(56, 189, 248, 0.1)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(geom.left, 0);
            ctx.lineTo(geom.left, displayHeight);
            ctx.moveTo(geom.left + geom.width, 0);
            ctx.lineTo(geom.left + geom.width, displayHeight);
            ctx.stroke();
          }
        }
      });

      // 3. Update & Draw Waterfall Note Blocks (Pianovera discrete key press/release pills)
      const blocks = noteBlocksRef.current;
      for (let i = blocks.length - 1; i >= 0; i--) {
        const b = blocks[i];
        if (b.active) {
          b.height += SPEED * dt;
        } else {
          b.bottom += SPEED * dt;
        }

        if (b.bottom > displayHeight) {
          blocks.splice(i, 1);
          continue;
        }

        const geom = KEY_GEOMETRY_MAP.get(b.midi);
        if (!geom) continue;

        const blockWidth = Math.max(8, geom.width - 6);
        const x = geom.centerX - blockWidth / 2;
        const y = displayHeight - (b.bottom + b.height);
        const h = Math.max(6, b.height);
        const radius = Math.min(6, blockWidth / 2, h / 2);

        ctx.save();
        ctx.shadowColor = "rgba(56, 189, 248, 0.8)";
        ctx.shadowBlur = 10;

        // Gradient for note block
        const blockGrad = ctx.createLinearGradient(x, y, x + blockWidth, y + h);
        blockGrad.addColorStop(0, "rgba(56, 189, 248, 0.95)");
        blockGrad.addColorStop(0.5, "rgba(99, 102, 241, 0.9)");
        blockGrad.addColorStop(1, "rgba(56, 189, 248, 0.85)");
        ctx.fillStyle = blockGrad;

        ctx.beginPath();
        if (typeof (ctx as any).roundRect === "function") {
          (ctx as any).roundRect(x, y, blockWidth, h, radius);
        } else {
          ctx.rect(x, y, blockWidth, h);
        }
        ctx.fill();

        // Inner specular highlight
        if (h > 10 && blockWidth > 8) {
          ctx.shadowBlur = 0;
          ctx.fillStyle = "rgba(224, 242, 254, 0.65)";
          const coreW = blockWidth * 0.45;
          const coreH = Math.max(4, h - 8);
          ctx.beginPath();
          if (typeof (ctx as any).roundRect === "function") {
            (ctx as any).roundRect(x + (blockWidth - coreW) / 2, y + 4, coreW, coreH, radius * 0.5);
          } else {
            ctx.rect(x + (blockWidth - coreW) / 2, y + 4, coreW, coreH);
          }
          ctx.fill();
        }

        ctx.restore();
      }

      // 4. Spawn & update particles at the base of active keys
      const currentActive = activeMidiKeysRef.current;
      currentActive.forEach((midi) => {
        const geom = KEY_GEOMETRY_MAP.get(midi);
        if (geom && Math.random() < 0.65) {
          particlesRef.current.push({
            x: geom.centerX + (Math.random() - 0.5) * (geom.width * 0.7),
            y: displayHeight - 4,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -(Math.random() * 2.2 + 1.2),
            radius: Math.random() * 2.2 + 1.2,
            alpha: 1,
          });
        }
      });

      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.035;
        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(186, 230, 253, ${Math.max(0, p.alpha)})`;
        ctx.shadowColor = "rgba(56, 189, 248, 0.9)";
        ctx.shadowBlur = 6;
        ctx.fill();
      }

      // 5. Horizon line glow right above the keys
      ctx.beginPath();
      ctx.moveTo(0, displayHeight - 1);
      ctx.lineTo(displayWidth, displayHeight - 1);
      ctx.strokeStyle = "rgba(56, 189, 248, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

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

        // Stream discrete note blocks for each key press & release in song
        const prev = prevSongKeysRef.current;
        for (const midi of activeNow) {
          if (!prev.has(midi)) {
            startNoteBlock(midi);
          }
        }
        for (const midi of prev) {
          if (!activeNow.has(midi)) {
            endNoteBlock(midi);
          }
        }
        prevSongKeysRef.current = activeNow;
        setActiveMidiKeys(activeNow);
      };

      player.onStateChangeCallback = (state) => {
        if (state === "stopped") {
          setIsPlayingSong(false);
          for (const b of noteBlocksRef.current) {
            b.active = false;
          }
          prevSongKeysRef.current = new Set();
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
    for (const b of noteBlocksRef.current) {
      b.active = false;
    }
    prevSongKeysRef.current = new Set();
    setActiveMidiKeys(new Set());
    setActiveSongTitle(null);
  };

  const handleInstrumentChange = (inst: InstrumentType) => {
    setInstrument(inst);
    player.setInstrument(inst, true);
  };

  const handleKeyTouchStart = (midi: number) => (e: React.TouchEvent) => {
    e.preventDefault();
    touchActiveMidiRef.current = midi;
    triggerNoteOn(midi);
  };

  const handleKeyTouchEnd = (midi: number) => (e: React.TouchEvent) => {
    e.preventDefault();
    if (touchActiveMidiRef.current === midi) {
      touchActiveMidiRef.current = null;
    }
    triggerNoteOff(midi);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Top Controls & Status Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
        {/* Left: Title & MIDI Hardware status */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base shrink-0">🎹</span>
            <span className="font-bold text-white text-sm truncate">Virtual Piano</span>
            <span className="hidden sm:inline px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shrink-0">
              88 KEYS
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          {/* MIDI controller status pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400">
            <span className={`w-2 h-2 rounded-full ${hasMidiDevice ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
            <span className="truncate max-w-[200px]">{midiInputStatus}</span>
          </div>
        </div>

        {/* Center / Right: Instrument, Pedal, Key Label Display Mode */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
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
          <div className="hidden sm:flex items-center bg-slate-950/80 border border-slate-800 rounded p-0.5 text-[11px]">
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

      {/* Upper Transport & Demo Songs Bar */}
      <div className="px-3 sm:px-5 py-2 sm:py-3 bg-slate-900/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <h3 className="text-sm sm:text-lg font-bold text-white tracking-tight truncate">
            {activeSongTitle ? `Playing: ${activeSongTitle}` : "Play the Virtual Piano"}
          </h3>
          {isPlayingSong && (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
              <button
                onClick={handleStopSong}
                className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition"
              >
                ⏹ Stop
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
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
            Songs:
          </span>
          {samples.map((s) => (
            <button
              key={s.id}
              onClick={() => handlePlaySample(s.id)}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-200 hover:text-white text-xs font-medium transition shrink-0 shadow-sm"
            >
              ▶ {s.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Piano Studio Scroll Container (Holds both Visualizer Canvas and Keyboard!) */}
      <div
        ref={keyboardScrollRef}
        onMouseDown={() => setIsMouseDown(true)}
        onMouseUp={() => setIsMouseDown(false)}
        onTouchStart={() => setIsMouseDown(true)}
        onTouchEnd={() => setIsMouseDown(false)}
        className="flex-1 min-h-0 w-full bg-[#070b14] overflow-x-auto overflow-y-auto sm:overflow-y-hidden shadow-inner py-2 sm:py-4 px-3 sm:px-6 flex flex-col justify-end touch-pan-x"
        style={{ scrollbarWidth: "thin", WebkitOverflowScrolling: "touch" }}
      >
        <div className="relative inline-flex flex-col select-none mx-auto touch-manipulation" style={{ width: TOTAL_PIANO_WIDTH }}>
          {/* Visualizer Lanes Canvas (exact same width as keys: 2288px!) */}
          <div className="relative w-[2288px] h-28 sm:h-52 md:h-64 overflow-hidden rounded-t-xl bg-[#020409] border-t border-x border-slate-800/80 shadow-2xl shrink-0">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" width={TOTAL_PIANO_WIDTH} height={240} />

            {/* Ambient center watermark / prompt */}
            {!isPlayingSong && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-xs uppercase tracking-widest font-bold text-slate-600/40">
                  Virtual Piano Studio • Web MIDI & QWERTY Keyboard
                </span>
              </div>
            )}
          </div>

          {/* Horizon glow bar right at the key top */}
          <div className="w-[2288px] h-[3px] bg-gradient-to-r from-sky-500/20 via-sky-400 to-sky-500/20 shadow-md shadow-cyan-400/50 relative z-30" />

          {/* Piano Keyboard (exactly 2288px wide: 52 white keys * 44px) */}
          <div className="relative h-40 sm:h-56 w-[2288px] select-none pt-0.5 shrink-0">
            {ALL_88_KEYS.map((key) => {
              const isActive = activeMidiKeys.has(key.midi);
              const geom = KEY_GEOMETRY_MAP.get(key.midi)!;

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
                    onTouchStart={handleKeyTouchStart(key.midi)}
                    onTouchEnd={handleKeyTouchEnd(key.midi)}
                    onTouchCancel={handleKeyTouchEnd(key.midi)}
                    className={`absolute z-20 w-7 h-28 sm:h-36 rounded-b-md transition-all duration-75 cursor-pointer shadow-lg flex flex-col justify-between items-center py-2 touch-manipulation ${
                      isActive
                        ? "bg-gradient-to-b from-sky-400 to-indigo-600 shadow-cyan-500/50 scale-[0.98] ring-2 ring-cyan-300"
                        : "bg-gradient-to-b from-slate-900 via-slate-950 to-black hover:from-slate-800 hover:to-slate-900 border-x border-b border-slate-700/60"
                    }`}
                    style={{ left: `${geom.left}px` }}
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
                  onTouchStart={handleKeyTouchStart(key.midi)}
                  onTouchEnd={handleKeyTouchEnd(key.midi)}
                  onTouchCancel={handleKeyTouchEnd(key.midi)}
                  className={`absolute z-10 w-11 h-40 sm:h-52 rounded-b-lg border-x border-b transition-all duration-75 cursor-pointer flex flex-col justify-between items-center py-3 touch-manipulation ${
                    isActive
                      ? "bg-gradient-to-b from-sky-100 to-sky-300 border-sky-400 shadow-md shadow-sky-400/50 scale-[0.99]"
                      : "bg-gradient-to-b from-slate-100 via-white to-slate-200 hover:from-white hover:to-slate-100 border-slate-300 shadow-sm"
                  }`}
                  style={{ left: `${geom.left}px` }}
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
    </div>
  );
}
