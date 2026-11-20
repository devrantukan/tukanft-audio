"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import StudioLayout from "@/components/StudioLayout";
import { useLanguage } from "@/context/LanguageContext";
import { ScoreData } from "@/types";

export default function AiMidiPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const [prompt, setPrompt] = useState(
    "Moody neo-soul piano chords with warm lush 7th and 9th voicings, syncopated rhythm, in E flat major at 84 BPM"
  );
  const [key, setKey] = useState("Eb Major");
  const [bpm, setBpm] = useState(84);
  const [genre, setGenre] = useState("Neo-Soul");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Score and playback states
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [instrument, setInstrument] = useState<"piano" | "epiano" | "organ">("piano");

  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeOscillatorsRef = useRef<{ stop: () => void }[]>([]);
  const playbackTimerRef = useRef<number | null>(null);

  const PRESETS = [
    {
      title: "Lofi Hip-Hop Chords",
      desc: "Muted jazzy 9ths, swung timing, nostalgic vinyl mood.",
      genre: "Lofi",
      key: "F Minor",
      bpm: 78,
    },
    {
      title: "Cinematic String Ostinato",
      desc: "Epic rising arpeggios with deep cellos and driving rhythm.",
      genre: "Cinematic",
      key: "D Minor",
      bpm: 124,
    },
    {
      title: "Bach Polyphonic Invention",
      desc: "Two-part counterpoint imitation with baroque cadence.",
      genre: "Classical",
      key: "C Major",
      bpm: 104,
    },
    {
      title: "Synthwave Arp Lead",
      desc: "16th-note analog bassline with retro neon melody.",
      genre: "Synthwave",
      key: "A Minor",
      bpm: 128,
    },
  ];

  useEffect(() => {
    return () => {
      stopAudioPlayback();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
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

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    stopAudioPlayback();

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          key,
          bpm,
          genre,
          measures: 8,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || "Failed to generate AI MIDI composition");
      }

      const data: ScoreData = await res.json();
      setScoreData(data);
    } catch (err: any) {
      console.error("AI Generation error:", err);
      setErrorMessage(err.message || "Failed to generate composition. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenScoreInSheetMusic = () => {
    if (!scoreData) return;
    stopAudioPlayback();
    try {
      if (typeof window !== "undefined") {
        const json = JSON.stringify(scoreData);
        sessionStorage.setItem("tukanft_active_score", json);
        localStorage.setItem("tukanft_active_score", json);
      }
    } catch (e) {
      console.warn("Storage save error:", e);
    }
    const targetUrl = scoreData.sessionId
      ? `/midi-to-sheet?session=${scoreData.sessionId}`
      : "/midi-to-sheet";
    window.location.href = targetUrl;
  };

  const handleOpenScoreInVirtualPiano = () => {
    if (!scoreData) return;
    stopAudioPlayback();
    try {
      if (typeof window !== "undefined") {
        const json = JSON.stringify(scoreData);
        sessionStorage.setItem("tukanft_active_score", json);
        localStorage.setItem("tukanft_active_score", json);
      }
    } catch (e) {
      console.warn("Storage save error:", e);
    }
    const targetUrl = scoreData.sessionId
      ? `/virtual-piano?session=${scoreData.sessionId}`
      : "/virtual-piano";
    window.location.href = targetUrl;
  };

  const handleDownloadMidi = () => {
    if (!scoreData) return;
    const title = scoreData.metadata?.title || `${genre}_Generation_${key}`;
    const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `${safeTitle}.mid`;

    if (scoreData.midiBase64) {
      const byteCharacters = atob(scoreData.midiBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "audio/midi" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (scoreData.sessionId) {
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/api/export/midi";
      form.style.display = "none";

      const sessionInput = document.createElement("input");
      sessionInput.type = "hidden";
      sessionInput.name = "session_id";
      sessionInput.value = scoreData.sessionId;
      form.appendChild(sessionInput);

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    }
  };

  const durationSec = Math.round(scoreData?.metadata?.durationSeconds || 15);
  const currentSec = Math.round(currentTime);

  return (
    <StudioLayout
      activeTool="ai-midi"
      title={t("aiMidi")}
      badge="NEURAL MUSIC MODEL v3"
    >
      <div className="flex-1 flex flex-col h-full w-full overflow-y-auto bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
          {/* Header */}
          <div className="border-b border-slate-800/80 pb-6">
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="text-xl">✨</span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {t("aiMidi")}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-amber-600/15 text-amber-400 border border-amber-500/25">
                TRANSFORMER MUSIC MODEL
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Generate full musical compositions, chord sequences, and melodic hooks from natural language descriptions.
            </p>
          </div>

          {/* Generator Input Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-4 shadow-xl">
            <label className="text-xs font-bold text-slate-300">
              Describe the music you want to generate:
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition resize-none leading-relaxed"
              placeholder="e.g. Melancholic romantic waltz in A minor with expressive rubato and arpeggiated bass..."
            />

            {/* Parameter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Musical Key
                </label>
                <select
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold focus:outline-none"
                >
                  <option value="C Major">C Major</option>
                  <option value="A Minor">A Minor</option>
                  <option value="D Minor">D Minor</option>
                  <option value="Eb Major">Eb Major</option>
                  <option value="G Major">G Major</option>
                  <option value="F Minor">F Minor</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Tempo (BPM): {bpm}
                </label>
                <input
                  type="range"
                  min={60}
                  max={180}
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer mt-2"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Genre Style
                </label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold focus:outline-none"
                >
                  <option value="Neo-Soul">Neo-Soul / R&B</option>
                  <option value="Classical">Classical / Baroque</option>
                  <option value="Lofi">Lofi Hip-Hop</option>
                  <option value="Cinematic">Cinematic / Film</option>
                  <option value="Jazz">Jazz Standard</option>
                  <option value="Synthwave">Synthwave 80s</option>
                </select>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                ⚠️ {errorMessage}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="mt-2 py-3 px-6 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <span>{isGenerating ? "⚡ Generating Musical Tokens & Score..." : "✨ Generate AI MIDI Sequence"}</span>
            </button>
          </div>

          {/* Prompt Presets */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Quick Inspiration Presets
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(p.desc);
                    setGenre(p.genre);
                    setKey(p.key);
                    setBpm(p.bpm);
                  }}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-left transition flex flex-col justify-between gap-1 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                      {p.title}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{p.bpm} BPM</span>
                  </div>
                  <p className="text-[11px] text-slate-400">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Result Card */}
          {scoreData && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                    AI Generation Complete
                  </span>
                  <h3 className="text-base font-bold text-white">
                    {scoreData.metadata?.title || `${genre} Generation (${key})`}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {scoreData.metadata?.measureCount || 8} measures •{" "}
                    {scoreData.metadata?.noteCount || 64} notes •{" "}
                    {scoreData.metadata?.tempoBpm || bpm} BPM
                  </p>
                </div>
              </div>

              {/* Synthesizer Audio Preview Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center gap-3">
                  <button
                    onClick={isPlaying ? stopAudioPlayback : startAudioPlayback}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition shadow-lg ${
                      isPlaying
                        ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/30"
                        : "bg-rose-600 hover:bg-rose-500 shadow-rose-600/30"
                    }`}
                    title={isPlaying ? "Stop audio" : "Play recognized audio"}
                  >
                    <span>{isPlaying ? "⏸" : "▶"}</span>
                  </button>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-200">
                      {isPlaying ? "Playing AI Composition..." : "Preview Synthesizer Playback"}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {currentSec}s / {durationSec}s
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={instrument}
                    onChange={(e) => setInstrument(e.target.value as any)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="piano">Kuyruklu Piyano</option>
                    <option value="epiano">Elektrik Piyano</option>
                    <option value="organ">Kilise Orgu</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={handleOpenScoreInSheetMusic}
                  className="p-3 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-rose-600/25"
                >
                  <span>🎼 {t("openInViewer") || "Open in Sheet Music"}</span>
                </button>
                <button
                  onClick={handleOpenScoreInVirtualPiano}
                  className="p-3 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 active:scale-95 text-cyan-300 border border-cyan-500/30 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <span>🎹 {t("openInPiano") || "Play in Virtual Piano"}</span>
                </button>
                <button
                  onClick={handleDownloadMidi}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-750 active:scale-95 text-white border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <span>📥 {t("downloadMidi") || "Download MIDI"} (.mid)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </StudioLayout>
  );
}
