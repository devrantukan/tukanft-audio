"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import StudioLayout from "@/components/StudioLayout";
import { useLanguage } from "@/context/LanguageContext";

export default function AiMidiPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const [prompt, setPrompt] = useState("Moody neo-soul piano chords with warm lush 7th and 9th voicings, syncopated rhythm, in E flat major at 84 BPM");
  const [key, setKey] = useState("Eb Major");
  const [bpm, setBpm] = useState(84);
  const [genre, setGenre] = useState("Neo-Soul");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMidi, setGeneratedMidi] = useState<any | null>(null);

  const PRESETS = [
    { title: "Lofi Hip-Hop Chords", desc: "Muted jazzy 9ths, swung timing, nostalgic vinyl mood.", genre: "Lofi", key: "F Minor", bpm: 78 },
    { title: "Cinematic String Ostinato", desc: "Epic rising arpeggios with deep cellos and driving rhythm.", genre: "Cinematic", key: "D Minor", bpm: 124 },
    { title: "Bach Polyphonic Invention", desc: "Two-part counterpoint imitation with baroque cadence.", genre: "Classical", key: "C Major", bpm: 104 },
    { title: "Synthwave Arp Lead", desc: "16th-note analog bassline with retro neon melody.", genre: "Synthwave", key: "A Minor", bpm: 128 },
  ];

  const handleGenerate = () => {
    setIsGenerating(true);
    setGeneratedMidi(null);

    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedMidi({
        title: `${genre} Generation (${key})`,
        notesCount: 64,
        measures: 8,
        key: key,
        bpm: bpm,
      });
    }, 2000);
  };

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

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="mt-2 py-3 px-6 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <span>{isGenerating ? "⚡ Generating Musical Tokens..." : "✨ Generate AI MIDI Sequence"}</span>
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
          {generatedMidi && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                    AI Generation Complete
                  </span>
                  <h3 className="text-base font-bold text-white">{generatedMidi.title}</h3>
                  <p className="text-xs text-slate-400">
                    {generatedMidi.measures} measures • {generatedMidi.notesCount} notes • {generatedMidi.bpm} BPM
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => router.push("/midi-to-sheet")}
                  className="p-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center justify-center gap-2"
                >
                  <span>🎼 Open in Sheet Music</span>
                </button>
                <button
                  onClick={() => router.push("/virtual-piano")}
                  className="p-3 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 font-semibold text-xs flex items-center justify-center gap-2"
                >
                  <span>🎹 Play in Virtual Piano</span>
                </button>
                <button
                  onClick={() => alert("Downloading generated AI MIDI...")}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2"
                >
                  <span>📥 Download MIDI (.mid)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </StudioLayout>
  );
}
