"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import StudioLayout from "@/components/StudioLayout";
import { useLanguage } from "@/context/LanguageContext";

export default function MidiEditorPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const [quantizeGrid, setQuantizeGrid] = useState("1/16");
  const [isPlaying, setIsPlaying] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [selectedTool, setSelectedTool] = useState<"draw" | "erase" | "select">("draw");

  // Sample notes for the piano roll preview
  const SAMPLE_NOTES = [
    { pitch: "E5", midi: 76, start: 0, length: 2 },
    { pitch: "D#5", midi: 75, start: 2, length: 2 },
    { pitch: "E5", midi: 76, start: 4, length: 2 },
    { pitch: "D#5", midi: 75, start: 6, length: 2 },
    { pitch: "E5", midi: 76, start: 8, length: 2 },
    { pitch: "B4", midi: 71, start: 10, length: 2 },
    { pitch: "D5", midi: 74, start: 12, length: 2 },
    { pitch: "C5", midi: 72, start: 14, length: 2 },
    { pitch: "A4", midi: 69, start: 16, length: 4 },
  ];

  return (
    <StudioLayout
      activeTool="midi-editor"
      title={t("midiEditor")}
      badge="PIANO ROLL v2"
    >
      <div className="flex-1 flex flex-col h-full w-full overflow-hidden bg-slate-950 text-slate-100">
        {/* Editor Toolbar */}
        <div className="h-12 border-b border-slate-800 bg-slate-900/80 px-4 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                isPlaying
                  ? "bg-amber-600 hover:bg-amber-500 text-white"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white"
              }`}
            >
              <span>{isPlaying ? "⏸ Pause" : "▶ Play"}</span>
            </button>

            <div className="h-4 w-px bg-slate-800 mx-1" />

            {/* Edit Tools */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setSelectedTool("draw")}
                className={`px-2.5 py-1 rounded text-xs font-semibold ${
                  selectedTool === "draw" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
                title="Pencil / Draw note"
              >
                ✏️ Draw
              </button>
              <button
                onClick={() => setSelectedTool("select")}
                className={`px-2.5 py-1 rounded text-xs font-semibold ${
                  selectedTool === "select" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
                title="Select notes"
              >
                ↖️ Select
              </button>
              <button
                onClick={() => setSelectedTool("erase")}
                className={`px-2.5 py-1 rounded text-xs font-semibold ${
                  selectedTool === "erase" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
                title="Eraser"
              >
                🧹 Erase
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">Grid:</span>
              <select
                value={quantizeGrid}
                onChange={(e) => setQuantizeGrid(e.target.value)}
                className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold focus:outline-none"
              >
                <option value="1/4">1/4</option>
                <option value="1/8">1/8</option>
                <option value="1/16">1/16</option>
                <option value="1/32">1/32</option>
                <option value="1/16T">1/16 Triplet</option>
              </select>
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={snapToGrid}
                onChange={(e) => setSnapToGrid(e.target.checked)}
                className="rounded accent-indigo-600"
              />
              <span>Snap</span>
            </label>

            <button
              onClick={() => router.push("/midi-to-sheet")}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition shadow-sm"
            >
              <span>🎼 Engrave Score</span>
            </button>
          </div>
        </div>

        {/* Piano Roll Workspace */}
        <div className="flex-1 flex overflow-hidden">
          {/* Vertical Piano Keys Scale */}
          <div className="w-20 border-r border-slate-800 bg-slate-900/60 overflow-y-auto flex flex-col shrink-0 select-none">
            {["C6", "B5", "A#5", "A5", "G#5", "G5", "F#5", "F5", "E5", "D#5", "D5", "C#5", "C5", "B4", "A#4", "A4", "G#4", "G4"].map((noteKey) => {
              const isBlack = noteKey.includes("#");
              return (
                <div
                  key={noteKey}
                  className={`h-7 px-2 border-b text-[10px] font-mono flex items-center justify-between border-slate-800/60 ${
                    isBlack ? "bg-slate-950 text-slate-400 font-bold" : "bg-slate-900 text-slate-200"
                  }`}
                >
                  <span>{noteKey}</span>
                  {isBlack && <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />}
                </div>
              );
            })}
          </div>

          {/* Interactive Note Grid */}
          <div className="flex-1 overflow-auto bg-slate-950 relative p-2">
            <div className="min-w-[800px] h-full relative border border-slate-800/80 rounded-xl bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_28px]">
              {/* Measure Markers */}
              <div className="h-6 border-b border-slate-800 bg-slate-900/40 flex text-[10px] font-mono text-slate-500">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((m) => (
                  <div key={m} className="w-[160px] pl-2 border-r border-slate-800 font-bold">
                    Bar {m}
                  </div>
                ))}
              </div>

              {/* Rendered Note Blocks */}
              <div className="relative p-2">
                {SAMPLE_NOTES.map((n, i) => (
                  <div
                    key={i}
                    style={{
                      left: `${n.start * 28 + 20}px`,
                      top: `${(80 - n.midi) * 28 + 32}px`,
                      width: `${n.length * 28}px`,
                    }}
                    className="absolute h-6 rounded-md bg-gradient-to-r from-indigo-500 to-purple-500 border border-indigo-400 shadow-md flex items-center px-1.5 text-[10px] font-bold text-white cursor-pointer hover:brightness-110 active:scale-[0.98] transition-transform select-none"
                  >
                    <span>{n.pitch}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudioLayout>
  );
}
