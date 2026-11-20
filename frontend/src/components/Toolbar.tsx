"use client";

import React, { useState } from "react";
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

const INSTRUMENT_LABELS: Record<InstrumentType, string> = {
  piano: "Piano",
  epiano: "E-Piano",
  strings: "Strings",
  organ: "Organ",
  celesta: "Celesta",
  synth: "Synth",
};

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
  const [moreOpen, setMoreOpen] = useState(false);
  const transportDisabled = disabled || duration === 0;

  return (
    <div className="w-full bg-slate-900/95 border-b border-slate-800/80 backdrop-blur z-20 no-print">
      {/* Primary transport row — always visible when score is loaded */}
      <div className="px-safe py-2 flex items-center gap-2 sm:gap-3 min-h-12">
        <button
          onClick={isPlaying ? onPause : onPlay}
          disabled={transportDisabled}
          aria-label={isPlaying ? "Pause" : "Play"}
          className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed ${
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

        <button
          onClick={onStop}
          disabled={disabled || (!isPlaying && !isPaused && currentTime === 0)}
          aria-label="Stop"
          className="w-10 h-10 shrink-0 rounded-xl bg-slate-800/90 hover:bg-slate-700/80 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition border border-slate-700/50"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M6 6h12v12H6z" />
          </svg>
        </button>

        <div className="font-mono text-slate-300 text-xs shrink-0 bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800 min-w-[4.5rem] text-center">
          <span>{formatTime(currentTime)}</span>
          <span className="text-slate-600 mx-0.5">/</span>
          <span className="text-slate-400">{formatTime(duration)}</span>
        </div>

        <select
          value={instrument}
          onChange={(e) => onInstrumentChange(e.target.value as InstrumentType)}
          disabled={disabled}
          aria-label="Instrument"
          className="flex-1 min-w-0 max-w-[9.5rem] sm:max-w-none bg-slate-800/90 border border-slate-700 rounded-lg px-2 py-2 text-slate-200 outline-none focus:border-indigo-500 cursor-pointer text-xs truncate"
        >
          <option value="piano">🎹 {INSTRUMENT_LABELS.piano}</option>
          <option value="epiano">⚡ {INSTRUMENT_LABELS.epiano}</option>
          <option value="strings">🎻 {INSTRUMENT_LABELS.strings}</option>
          <option value="organ">⛪ {INSTRUMENT_LABELS.organ}</option>
          <option value="celesta">✨ {INSTRUMENT_LABELS.celesta}</option>
          <option value="synth">🎛️ {INSTRUMENT_LABELS.synth}</option>
        </select>

        {/* Desktop-only inline controls */}
        <div className="hidden lg:flex items-center gap-2 ml-1">
          <button
            onClick={onTogglePedal}
            disabled={disabled}
            title="Sustain pedal"
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${
              sustainPedal
                ? "bg-indigo-950/80 border-indigo-600/70 text-indigo-200"
                : "bg-slate-850 border-slate-700 text-slate-400 hover:text-slate-200"
            }`}
          >
            Pedal {sustainPedal ? "ON" : "OFF"}
          </button>
          <select
            value={speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            disabled={disabled}
            className="bg-slate-800/90 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 outline-none cursor-pointer text-xs"
          >
            <option value={0.5}>0.5×</option>
            <option value={0.75}>0.75×</option>
            <option value={1.0}>1.0×</option>
            <option value={1.25}>1.25×</option>
            <option value={1.5}>1.5×</option>
            <option value={2.0}>2.0×</option>
          </select>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            aria-label="Volume"
            className="w-20 accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          <div className="flex items-center bg-slate-950/60 rounded-lg border border-slate-800 p-0.5">
            <button
              onClick={() => onZoomChange(Math.max(0.5, zoom - 0.1))}
              disabled={disabled || zoom <= 0.5}
              className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-100 disabled:opacity-30 rounded-md hover:bg-slate-800"
              title="Zoom out"
            >
              −
            </button>
            <span className="text-[11px] font-mono px-1.5 text-slate-300 min-w-[2.75rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => onZoomChange(Math.min(2.0, zoom + 0.1))}
              disabled={disabled || zoom >= 2.0}
              className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-100 disabled:opacity-30 rounded-md hover:bg-slate-800"
              title="Zoom in"
            >
              +
            </button>
          </div>

          {/* Mobile "more" menu for export & extra options */}
          <div className="relative lg:hidden">
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center"
              aria-expanded={moreOpen}
              aria-label="More actions"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>
            {moreOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-30"
                  aria-label="Close menu"
                  onClick={() => setMoreOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-40 w-52 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl p-1.5 text-xs">
                  <button
                    onClick={() => {
                      onTogglePedal();
                      setMoreOpen(false);
                    }}
                    disabled={disabled}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-200"
                  >
                    Sustain pedal: {sustainPedal ? "ON" : "OFF"}
                  </button>
                  <select
                    value={layoutMode}
                    onChange={(e) => onLayoutChange(e.target.value as "continuous" | "paged")}
                    disabled={disabled}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                  >
                    <option value="continuous">Continuous scroll</option>
                    <option value="paged">Paged view</option>
                  </select>
                  <div className="mt-2 pt-2 border-t border-slate-800">
                    <ExportButtons
                      onPrint={onPrint}
                      onDownloadMusicXml={onDownloadMusicXml}
                      onDownloadMidi={onDownloadMidi}
                      disabled={disabled}
                      transportDisabled={transportDisabled}
                      onDone={() => setMoreOpen(false)}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Desktop secondary export row */}
      <div className="hidden lg:flex px-4 pb-2.5 pt-0 items-center justify-end gap-2 text-xs border-t border-slate-800/50 mx-4">
        <select
          value={layoutMode}
          onChange={(e) => onLayoutChange(e.target.value as "continuous" | "paged")}
          disabled={disabled}
          className="bg-slate-800/90 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 outline-none cursor-pointer text-xs mr-auto"
        >
          <option value="continuous">Continuous scroll</option>
          <option value="paged">Paged view</option>
        </select>
        <ExportButtons
          onPrint={onPrint}
          onDownloadMusicXml={onDownloadMusicXml}
          onDownloadMidi={onDownloadMidi}
          disabled={disabled}
          transportDisabled={transportDisabled}
        />
      </div>
    </div>
  );
}

function ExportButtons({
  onPrint,
  onDownloadMusicXml,
  onDownloadMidi,
  disabled,
  transportDisabled,
  onDone,
}: {
  onPrint: () => void;
  onDownloadMusicXml: () => void;
  onDownloadMidi: () => void;
  disabled?: boolean;
  transportDisabled: boolean;
  onDone?: () => void;
}) {
  const wrap = (fn: () => void) => () => {
    fn();
    onDone?.();
  };
  return (
    <div className="flex flex-col gap-1 lg:flex-row lg:gap-2">
      <button
        onClick={wrap(onPrint)}
        disabled={disabled || transportDisabled}
        className="w-full lg:w-auto px-3 py-2.5 lg:py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-medium flex items-center gap-2 transition disabled:opacity-40"
      >
        <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        Print / PDF
      </button>
      <button
        onClick={wrap(onDownloadMusicXml)}
        disabled={disabled || transportDisabled}
        className="w-full lg:w-auto px-3 py-2.5 lg:py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-2 transition disabled:opacity-40"
      >
        MusicXML
      </button>
      <button
        onClick={wrap(onDownloadMidi)}
        disabled={disabled || transportDisabled}
        className="w-full lg:w-auto px-3 py-2.5 lg:py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 font-medium flex items-center gap-2 transition disabled:opacity-40"
      >
        Export MIDI
      </button>
    </div>
  );
}
