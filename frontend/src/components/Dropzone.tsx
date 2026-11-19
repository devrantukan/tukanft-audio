"use client";

import React, { useState, useRef } from "react";
import { SampleInfo } from "@/types";

interface DropzoneProps {
  onFileUpload: (file: File) => void;
  onSelectSample: (sampleId: string) => void;
  samples: SampleInfo[];
  isLoading: boolean;
}

export default function Dropzone({
  onFileUpload,
  onSelectSample,
  samples,
  isLoading,
}: DropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith(".mid") || file.name.toLowerCase().endsWith(".midi")) {
        onFileUpload(file);
      } else {
        alert("Please upload a valid MIDI file (.mid or .midi)");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-6 px-4">
      {/* Drag & Drop Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
          isDragOver
            ? "border-rose-500 bg-rose-950/20 shadow-lg shadow-rose-950/30 scale-[1.01]"
            : "border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-700"
        } ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".mid,.midi"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-rose-600/20 to-indigo-600/20 border border-slate-700/60 flex items-center justify-center text-rose-500 shadow-inner">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-white mb-1">
          Drop your MIDI file here, or <span className="text-rose-500 underline underline-offset-4">browse</span>
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Supports multi-track polyphonic MIDI files. Fast automatic grand staff splitting, key signature detection, and tuplet quantization.
        </p>
      </div>

      {/* Preloaded Sample Scores */}
      {samples.length > 0 && (
        <div className="mt-5">
          <div className="text-xs font-medium text-slate-400 mb-2.5 flex items-center gap-1.5">
            <span className="text-rose-500">⚡</span>
            <span>Or test with a preloaded sample:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {samples.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelectSample(s.id)}
                disabled={isLoading}
                className="text-left p-3 rounded-xl bg-slate-900/60 hover:bg-slate-850 border border-slate-800/80 hover:border-slate-700 transition group disabled:opacity-50"
              >
                <div className="text-xs font-semibold text-slate-200 group-hover:text-rose-400 transition truncate">
                  {s.title}
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">{s.composer}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
