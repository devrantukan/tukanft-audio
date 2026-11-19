"use client";

import React from "react";
import { ScoreMetadata } from "@/types";

interface SidebarControlsProps {
  metadata: ScoreMetadata | null;
  transpose: number;
  quantize: string;
  splitGrandStaff: boolean;
  selectedPart: string;
  isProcessing: boolean;
  onTransposeChange: (val: number) => void;
  onQuantizeChange: (val: string) => void;
  onSplitGrandStaffChange: (val: boolean) => void;
  onSelectedPartChange: (val: string) => void;
  onApplyTransformations: () => void;
}

const CHROMATIC_SCALE = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export default function SidebarControls({
  metadata,
  transpose,
  quantize,
  splitGrandStaff,
  selectedPart,
  isProcessing,
  onTransposeChange,
  onQuantizeChange,
  onSplitGrandStaffChange,
  onSelectedPartChange,
  onApplyTransformations,
}: SidebarControlsProps) {
  if (!metadata) {
    return (
      <div className="w-80 h-full bg-slate-900 border-r border-slate-800 p-5 flex flex-col items-center justify-center text-center text-slate-500">
        <svg className="w-12 h-12 stroke-slate-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        <p className="text-sm font-medium text-slate-400">Score Settings & Analysis</p>
        <p className="text-xs text-slate-500 mt-1">
          Upload or choose a MIDI file to inspect musical parameters and transformations.
        </p>
      </div>
    );
  }

  // Calculate max pitch class count for histogram normalization
  const distribution = metadata.pitchClassDistribution || {};
  const maxCount = Math.max(...Object.values(distribution), 1);

  return (
    <div className="w-full md:w-80 max-h-[45vh] md:max-h-none shrink-0 md:shrink md:h-full bg-slate-900 border-b md:border-b-0 border-r border-slate-800 flex flex-col justify-between overflow-y-auto p-4 text-slate-200">
      <div className="space-y-5">
        {/* Header & Key Signature */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Score Analysis
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-700/50">
              {metadata.keySignature || "C major"}
            </span>
          </div>
          <h2 className="text-base font-bold text-white truncate" title={metadata.title}>
            {metadata.title || "Untitled Score"}
          </h2>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Time Sig</div>
            <div className="text-sm font-bold text-slate-100 mt-0.5">{metadata.timeSignature || "4/4"}</div>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Tempo</div>
            <div className="text-sm font-bold text-slate-100 mt-0.5">{metadata.tempoBpm || 120} BPM</div>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Measures</div>
            <div className="text-sm font-bold text-slate-100 mt-0.5">{metadata.measureCount} bars</div>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Notes / Chords</div>
            <div className="text-sm font-bold text-slate-100 mt-0.5">{metadata.noteCount} notes</div>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Pitch Range</div>
            <div className="text-sm font-bold text-slate-100 mt-0.5">{metadata.pitchRange || "C3 - C5"}</div>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Duration</div>
            <div className="text-sm font-bold text-slate-100 mt-0.5">
              {Math.floor(metadata.durationSeconds / 60)}:
              {(metadata.durationSeconds % 60).toString().padStart(2, "0")}
            </div>
          </div>
        </div>

        <div className="h-px bg-slate-800" />

        {/* Musicology Transformations Controls */}
        <div className="space-y-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Music Transformations
          </div>

          {/* Transpose Slider */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-slate-300 font-medium">Pitch Transposition</span>
              <span className={`font-mono font-bold ${transpose === 0 ? "text-slate-400" : "text-indigo-400"}`}>
                {transpose > 0 ? `+${transpose}` : transpose} st
              </span>
            </div>
            <input
              type="range"
              min={-12}
              max={12}
              step={1}
              value={transpose}
              onChange={(e) => onTransposeChange(parseInt(e.target.value))}
              className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>-1 Octave</span>
              <button
                type="button"
                onClick={() => onTransposeChange(0)}
                className="hover:text-indigo-400 transition"
              >
                Reset (0)
              </button>
              <span>+1 Octave</span>
            </div>
          </div>

          {/* Rhythm Quantization Dropdown */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Rhythm Quantization
            </label>
            <select
              value={quantize}
              onChange={(e) => onQuantizeChange(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="smart">Smart Notation (Clean Tuplets & Rests)</option>
              <option value="eighth">Strict 1/8th Note Grid</option>
              <option value="sixteenth">Strict 1/16th Note Grid</option>
              <option value="quarter">Strict 1/4th Note Grid</option>
              <option value="none">Raw Unquantized (Real-time)</option>
            </select>
            <p className="text-[10px] text-slate-500 mt-1">
              Cleans up human performance variations and suppresses micro-tuplets.
            </p>
          </div>

          {/* Isolate Part / Track */}
          {metadata.parts && metadata.parts.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Isolate Part / Track
              </label>
              <select
                value={selectedPart}
                onChange={(e) => onSelectedPartChange(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">All Tracks / Parts (Full Score)</option>
                {metadata.parts.map((p) => (
                  <option key={p.index} value={p.index.toString()}>
                    Part {p.index + 1}: {p.name || `Track ${p.index + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Auto Split Grand Staff Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={splitGrandStaff}
                onChange={(e) => onSplitGrandStaffChange(e.target.checked)}
                className="mt-0.5 rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-indigo-600"
              />
              <div>
                <span className="text-xs font-medium text-slate-200 block">
                  Auto Split into Grand Staff (Treble + Bass)
                </span>
                <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                  Splits wide-range single piano tracks at Middle C.
                </span>
              </div>
            </label>
          </div>

          {/* Apply Button */}
          <button
            onClick={onApplyTransformations}
            disabled={isProcessing}
            className="w-full mt-2 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition shadow-md shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Applying Changes...</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0020 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 004 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
                </svg>
                <span>Update Score</span>
              </>
            )}
          </button>
        </div>

        <div className="h-px bg-slate-800" />

        {/* Pitch Class Distribution Histogram */}
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Pitch Class Histogram
          </div>
          <div className="h-16 flex items-end gap-1 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
            {CHROMATIC_SCALE.map((note) => {
              const count = distribution[note] || 0;
              const heightPct = Math.round((count / maxCount) * 100);
              return (
                <div key={note} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  <div
                    className="w-full bg-indigo-500/70 group-hover:bg-indigo-400 rounded-t transition-all"
                    style={{ height: `${Math.max(4, heightPct)}%` }}
                  />
                  <span className="text-[8px] text-slate-500 mt-1 font-mono">{note}</span>
                  {/* Tooltip on hover */}
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded pointer-events-none transition shadow">
                    {note}: {count}
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
