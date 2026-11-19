"use client";

import React from "react";
import { InstrumentType } from "@/types";

interface ToolbarProps {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  instrument: InstrumentType;
  sustainPedal: boolean;
  speed: number;
  volume: number;
  zoom: number;
  layoutMode: "continuous" | "paged";
  disabled?: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onInstrumentChange: (inst: InstrumentType) => void;
  onTogglePedal: () => void;
  onSpeedChange: (speed: number) => void;
  onVolumeChange: (vol: number) => void;
  onZoomChange: (zoom: number) => void;
  onLayoutChange: (mode: "continuous" | "paged") => void;
  onPrint: () => void;
  onDownloadMusicXml: () => void;
  onDownloadMidi: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export default function Toolbar({
  isPlaying,
  isPaused,
  currentTime,
  duration,
  instrument,
  sustainPedal,
  speed,
  volume,
  zoom,
  layoutMode,
  disabled = false,
  onPlay,
  onPause,
  onStop,
  onInstrumentChange,
  onTogglePedal,
  onSpeedChange,
  onVolumeChange,
  onZoomChange,
  onLayoutChange,
  onPrint,
  onDownloadMusicXml,
  onDownloadMidi,
}: ToolbarProps) {
  return (
    <div className="w-full bg-slate-900/95 border-b border-slate-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-200 backdrop-blur z-20">
      {/* Left section: Transport Controls */}
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={isPlaying ? onPause : onPlay}
          disabled={disabled || duration === 0}
          aria-label={isPlaying ? "Pause" : "Play"}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed ${
            isPlaying
              ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20"
              : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30"
          }`}
        >
          {isPlaying ? (
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Stop Button */}
        <button
          onClick={onStop}
          disabled={disabled || (!isPlaying && !isPaused && currentTime === 0)}
          aria-label="Stop"
          className="w-8 h-8 rounded-lg bg-slate-800/90 hover:bg-slate-700/80 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition border border-slate-700/50"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M6 6h12v12H6z" />
          </svg>
        </button>

        {/* Time Display */}
        <div className="font-mono text-slate-300 min-w-[76px] text-center bg-slate-950/60 px-2 py-1 rounded border border-slate-800">
          <span>{formatTime(currentTime)}</span>
          <span className="text-slate-600 mx-1">/</span>
          <span className="text-slate-400">{formatTime(duration)}</span>
        </div>

        <div className="h-5 w-px bg-slate-800 hidden sm:block" />

        {/* Sound Instrument Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 hidden md:inline">Sound:</span>
          <select
            value={instrument}
            onChange={(e) => onInstrumentChange(e.target.value as InstrumentType)}
            disabled={disabled}
            className="bg-slate-800/90 hover:bg-slate-750 border border-slate-700 rounded px-2 py-1 text-slate-200 outline-none focus:border-indigo-500 cursor-pointer text-xs"
          >
            <option value="piano">🎹 Grand Piano</option>
            <option value="epiano">⚡ Rhodes E-Piano</option>
            <option value="strings">🎻 Warm Strings</option>
            <option value="organ">⛪ Church Organ</option>
            <option value="celesta">✨ Celesta / Chime</option>
            <option value="synth">🎛️ Retro Synth</option>
          </select>
        </div>

        {/* Sustain Pedal Toggle */}
        <button
          onClick={onTogglePedal}
          disabled={disabled}
          title="Toggle acoustic sustain pedal resonance"
          className={`px-2.5 py-1 rounded border text-xs font-medium transition flex items-center gap-1 ${
            sustainPedal
              ? "bg-indigo-950/80 border-indigo-600/70 text-indigo-200 shadow-sm shadow-indigo-900/30"
              : "bg-slate-850 border-slate-700 text-slate-400 hover:text-slate-200"
          }`}
        >
          <span className="text-[10px]">🎹</span>
          <span>Pedal: {sustainPedal ? "ON" : "OFF"}</span>
        </button>

        {/* Playback Speed */}
        <div className="hidden lg:flex items-center gap-1.5">
          <span className="text-slate-400">Speed:</span>
          <select
            value={speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            disabled={disabled}
            className="bg-slate-800/90 border border-slate-700 rounded px-2 py-1 text-slate-200 outline-none cursor-pointer text-xs"
          >
            <option value={0.5}>0.5x (Slow)</option>
            <option value={0.75}>0.75x</option>
            <option value={1.0}>1.0x (Normal)</option>
            <option value={1.25}>1.25x</option>
            <option value={1.5}>1.5x</option>
            <option value={2.0}>2.0x (Fast)</option>
          </select>
        </div>

        {/* Volume Slider */}
        <div className="hidden xl:flex items-center gap-2">
          <span className="text-slate-400">Vol:</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-16 accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Right section: Zoom, View, Exports */}
      <div className="flex items-center gap-2">
        {/* Zoom Controls */}
        <div className="flex items-center bg-slate-950/60 rounded border border-slate-800 p-0.5">
          <button
            onClick={() => onZoomChange(Math.max(0.5, zoom - 0.1))}
            disabled={disabled || zoom <= 0.5}
            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-100 disabled:opacity-30 rounded hover:bg-slate-800"
            title="Zoom out"
          >
            -
          </button>
          <span className="text-[11px] font-mono px-2 text-slate-300 min-w-[42px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => onZoomChange(Math.min(2.0, zoom + 0.1))}
            disabled={disabled || zoom >= 2.0}
            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-100 disabled:opacity-30 rounded hover:bg-slate-800"
            title="Zoom in"
          >
            +
          </button>
        </div>

        {/* Layout Mode */}
        <select
          value={layoutMode}
          onChange={(e) => onLayoutChange(e.target.value as "continuous" | "paged")}
          disabled={disabled}
          className="bg-slate-800/90 border border-slate-700 rounded px-2 py-1 text-slate-200 outline-none cursor-pointer text-xs hidden sm:block"
        >
          <option value="continuous">Continuous Scroll</option>
          <option value="paged">Paged View</option>
        </select>

        <div className="h-5 w-px bg-slate-800 hidden sm:block" />

        {/* Print / PDF Button */}
        <button
          onClick={onPrint}
          disabled={disabled || duration === 0}
          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-40"
          title="Print or Save as PDF"
        >
          <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span className="hidden md:inline">Print / PDF</span>
        </button>

        {/* MusicXML Download Button */}
        <button
          onClick={onDownloadMusicXml}
          disabled={disabled || duration === 0}
          className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition shadow-sm shadow-indigo-600/30 disabled:opacity-40"
          title="Download MusicXML format"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
          </svg>
          <span>MusicXML</span>
        </button>

        {/* MIDI Export Button */}
        <button
          onClick={onDownloadMidi}
          disabled={disabled || duration === 0}
          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-40"
          title="Export transformed MIDI"
        >
          <span className="text-xs">🎹</span>
          <span>MIDI</span>
        </button>
      </div>
    </div>
  );
}
