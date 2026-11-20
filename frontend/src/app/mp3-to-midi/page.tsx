"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import StudioLayout from "@/components/StudioLayout";
import { useLanguage } from "@/context/LanguageContext";

export default function Mp3ToMidiPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [transcriptionDone, setTranscriptionDone] = useState(false);
  const [modelType, setModelType] = useState<"polyphonic" | "melody" | "drums">("polyphonic");

  const SAMPLES = [
    { title: "Acoustic Piano Chord Progression", genre: "Classical / Jazz", duration: "0:24", key: "C Major" },
    { title: "Solo Cello & Violin Melody", genre: "Orchestral", duration: "0:18", key: "D Minor" },
    { title: "Funky Bassline & E-Piano", genre: "Soul / R&B", duration: "0:30", key: "A Minor" },
  ];

  const handleFile = (file: File) => {
    setSelectedFile(file);
    setIsProcessing(true);
    setTranscriptionDone(false);

    setTimeout(() => {
      setIsProcessing(false);
      setTranscriptionDone(true);
    }, 2400);
  };

  const handleSample = (sample: typeof SAMPLES[0]) => {
    setIsProcessing(true);
    setTranscriptionDone(false);

    setTimeout(() => {
      setIsProcessing(false);
      setTranscriptionDone(true);
    }, 2200);
  };

  return (
    <StudioLayout
      activeTool="mp3-to-midi"
      title={t("mp3ToMidi")}
      badge={t("aiAudioEngine")}
    >
      <div className="flex-1 flex flex-col h-full w-full overflow-y-auto bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
          {/* Header */}
          <div className="border-b border-slate-800/80 pb-6">
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="text-xl">🎙️</span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {t("mp3ToMidi")}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-purple-600/15 text-purple-400 border border-purple-500/25">
                NEURAL AUDIO TRANSCRIPTION
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Convert recorded audio (.mp3, .wav, .flac, .m4a) into clean, polyphonic MIDI tracks using deep neural pitch tracking and onset detection.
            </p>
          </div>

          {/* Model Options */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-900/60 p-2 rounded-2xl border border-slate-800 w-fit">
            <button
              onClick={() => setModelType("polyphonic")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                modelType === "polyphonic"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🎹 Polyphonic (Chords & Piano)
            </button>
            <button
              onClick={() => setModelType("melody")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                modelType === "melody"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🎤 Monophonic (Vocals & Solo)
            </button>
            <button
              onClick={() => setModelType("drums")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                modelType === "drums"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🥁 Percussion / Stems
            </button>
          </div>

          {!transcriptionDone && !isProcessing && (
            <div className="flex flex-col gap-6">
              {/* Dropzone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`p-10 sm:p-14 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-purple-500 bg-purple-500/10 scale-[0.99]"
                    : "border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/80"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,.mp3,.wav,.m4a,.flac"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) handleFile(e.target.files[0]);
                  }}
                />
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-3xl flex items-center justify-center mx-auto mb-4">
                  🎙️
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">
                  Drop your audio recording here
                </h3>
                <p className="text-xs text-purple-400 font-medium mb-3 underline underline-offset-4">
                  or browse audio files from device
                </p>
                <p className="text-[11px] text-slate-500">
                  Supports MP3, WAV, FLAC, M4A, OGG up to 50MB
                </p>
              </div>

              {/* Classical / Audio Samples */}
              <div className="flex flex-col gap-3">
                <h4 className="text-sm font-bold text-slate-300">
                  Or test with sample audio recordings
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {SAMPLES.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSample(s)}
                      className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-left transition flex flex-col justify-between gap-2 group"
                    >
                      <div>
                        <h5 className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors">
                          {s.title}
                        </h5>
                        <p className="text-[11px] text-slate-400">{s.genre}</p>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>{s.duration}</span>
                        <span className="text-purple-400 font-semibold">{s.key}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Processing Animation */}
          {isProcessing && (
            <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center flex flex-col items-center justify-center shadow-2xl">
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
                <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-xl animate-pulse">
                  🎙️
                </div>
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                Transcribing Audio to MIDI...
              </h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Detecting pitch frequencies, separating harmonic overtones, and assembling quantized MIDI note tracks.
              </p>
            </div>
          )}

          {/* Transcription Results */}
          {transcriptionDone && !isProcessing && (
            <div className="flex flex-col gap-6">
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400">
                    Audio Transcription Complete
                  </span>
                  <h3 className="text-lg font-bold text-white">
                    {selectedFile?.name || "Audio Recording (Polyphonic)"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    92 note events • C Major • 120 BPM • 1 Track
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTranscriptionDone(false)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold"
                  >
                    🔄 Transcribe Another
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => router.push("/midi-to-sheet")}
                  className="p-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-600/20"
                >
                  <span>🎼 Engrave into Sheet Music</span>
                </button>
                <button
                  onClick={() => router.push("/virtual-piano")}
                  className="p-3.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 font-semibold text-xs flex items-center justify-center gap-2"
                >
                  <span>🎹 Play in Virtual Piano</span>
                </button>
                <button
                  onClick={() => alert("Downloading transcribed MIDI...")}
                  className="p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2"
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
