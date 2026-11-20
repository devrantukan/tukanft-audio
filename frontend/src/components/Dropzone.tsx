"use client";

import React, { useState, useRef } from "react";
import { SampleInfo } from "@/types";
import { useLanguage, TranslationKey } from "@/context/LanguageContext";

interface DropzoneProps {
  onFileUpload: (file: File) => void;
  onSelectSample: (sampleId: string) => void;
  samples: SampleInfo[];
  isLoading: boolean;
  variant?: "default" | "compact";
}

const FEATURE_KEYS: TranslationKey[] = [
  "featureGrandStaff",
  "featureTuplets",
  "featurePlayback",
  "featureMusicXml",
];

export default function Dropzone({
  onFileUpload,
  onSelectSample,
  samples,
  isLoading,
  variant = "default",
}: DropzoneProps) {
  const { t } = useLanguage();
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

  const isCompact = variant === "compact";

  return (
    <div className={`w-full mx-auto ${isCompact ? "max-w-2xl" : "max-w-xl sm:max-w-2xl"} px-safe`}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`group relative border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all duration-300 ${
          isCompact ? "p-6 sm:p-8" : "p-8 sm:p-10"
        } ${
          isDragOver
            ? "border-rose-400 bg-rose-950/25 shadow-xl shadow-rose-950/25 scale-[1.01]"
            : "border-slate-700/80 bg-slate-900/50 hover:bg-slate-900/80 hover:border-slate-600"
        } ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".mid,.midi"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-rose-500/25 via-slate-800 to-indigo-600/25 border border-slate-600/50 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-950/20">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>

        <p className="text-base sm:text-lg font-semibold text-white mb-2">
          {isDragOver ? t("dropRelease") : t("dropTitle")}
        </p>
        <p className="text-sm text-slate-400 mb-4">
          <span className="text-rose-400 font-medium underline underline-offset-4 decoration-rose-500/50">
            {t("browseDevice")}
          </span>
        </p>

        {!isCompact && (
          <div className="flex flex-wrap justify-center gap-2 mb-1">
            {FEATURE_KEYS.map((key) => (
              <span
                key={key}
                className="text-[10px] sm:text-xs font-medium uppercase tracking-wide px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/60"
              >
                {t(key)}
              </span>
            ))}
          </div>
        )}
      </div>

      {samples.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-medium text-slate-500 mb-3 text-center sm:text-left">
            {t("trySample")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {samples.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSample(s.id);
                }}
                disabled={isLoading}
                className="text-left p-3.5 min-h-[3.25rem] rounded-xl bg-slate-900/70 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-600 transition group disabled:opacity-50"
              >
                <div className="text-sm font-semibold text-slate-100 group-hover:text-rose-300 transition truncate">
                  {s.title}
                </div>
                <div className="text-xs text-slate-500 truncate mt-0.5">{s.composer}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}