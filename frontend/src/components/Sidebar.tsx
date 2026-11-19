"use client";

import React, { useState } from "react";
import Image from "next/image";

interface ToolInfo {
  title: string;
  badge: string;
  icon: string;
  desc: string;
}

const TOOL_INFO_MAP: Record<string, ToolInfo> = {
  "ai-midi": {
    title: "AI MIDI Generator",
    badge: "PRO FEATURE",
    icon: "✨",
    desc: "Generate multi-instrument polyphonic MIDI sequences, chord progressions, and melodies directly from natural language prompts using neural music transformers.",
  },
  "mp3-to-midi": {
    title: "MP3 to MIDI Converter",
    badge: "AI AUDIO ENGINE",
    icon: "🎙️",
    desc: "Upload recorded audio files (.mp3, .wav, .m4a) to automatically transcribe vocal melodies, bass lines, and polyphonic chords into clean, edit-ready MIDI.",
  },
  "sheet-to-midi": {
    title: "Sheet Music to MIDI (OMR)",
    badge: "OPTICAL RECOGNITION",
    icon: "🎼",
    desc: "Upload scanned sheet music PDFs or photos to convert printed staves into playable MIDI sequences using deep neural Optical Music Recognition.",
  },
  "midi-editor": {
    title: "Interactive MIDI Editor",
    badge: "STUDIO TOOL",
    icon: "🎹",
    desc: "Comprehensive browser-based piano roll editor with velocity curve drawing, quantization grids, note duration stretching, and multi-track routing.",
  },
  "scanner": {
    title: "Sheet Music Scanner",
    badge: "CAMERA & MOBILE",
    icon: "📷",
    desc: "Snap a photo of any printed sheet music with your camera or phone to immediately hear it played back and export it as clean MIDI or MusicXML.",
  },
  "all-tools": {
    title: "Tukanft Audio Suite",
    badge: "ECOSYSTEM",
    icon: "🧰",
    desc: "Discover all 12+ creative audio, MIDI, and sheet music production tools in the Tukanft Audio ecosystem.",
  },
  "pricing": {
    title: "Tukanft Membership & Credits",
    badge: "FREE PLAN",
    icon: "💎",
    desc: "You are currently on the Free Tier with 80 of 120 monthly credits used. Upgrade to Tukanft Pro ($12/mo) for unlimited MIDI exports, batch processing, and 24-bit audio renders.",
  },
  "feedback": {
    title: "Feedback & Community",
    badge: "SUPPORT",
    icon: "💬",
    desc: "Have ideas, feature requests, or bugs to report? We build Tukanft Audio for musicians and producers. Send us your feedback!",
  },
  "account": {
    title: "Devran Tukan's Account",
    badge: "FREE TIER",
    icon: "👤",
    desc: "Account: Devran Tukan\nPlan: Free Member\nMonthly Usage: 80 / 120 credits used\nNext Reset: Dec 1, 2026\nCredit Pack: 0 Credits",
  },
};

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSelectActiveTool?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = true,
  onClose = () => {},
  onSelectActiveTool = () => {},
}) => {
  const [activeModal, setActiveModal] = useState<ToolInfo | null>(null);

  const handleToolClick = (toolKey: string) => {
    if (toolKey === "midi-to-sheet") {
      onSelectActiveTool();
      onClose();
    } else {
      setActiveModal(TOOL_INFO_MAP[toolKey] || null);
    }
  };

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[265px] flex-col border-r border-slate-800 bg-[#0f172a] p-4 text-slate-300 transition-transform duration-200 lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 pb-5 pt-1">
          <Image
            src="/tukan-logo.svg"
            alt="Tukanft Logo"
            width={32}
            height={32}
            className="drop-shadow"
          />
          <div className="flex items-baseline gap-1.5 leading-none">
            <span className="text-xl font-extrabold tracking-tight text-white">Tukanft</span>
            <span className="text-xs font-bold uppercase tracking-wider text-red-500">audio</span>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="px-2 pb-1.5 pt-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          MIDI & NOTATION
        </div>

        <nav className="flex flex-col gap-1">
          <button
            onClick={() => handleToolClick("ai-midi")}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800/60 hover:text-white"
          >
            <span className="text-slate-400">✨</span>
            <span>AI MIDI Generator</span>
          </button>

          <button
            onClick={() => handleToolClick("mp3-to-midi")}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800/60 hover:text-white"
          >
            <span className="text-slate-400">🎙️</span>
            <span>MP3 to MIDI</span>
          </button>

          <button
            onClick={() => handleToolClick("sheet-to-midi")}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800/60 hover:text-white"
          >
            <span className="text-slate-400">🎼</span>
            <span>Sheet Music to MIDI</span>
          </button>

          <button
            onClick={() => handleToolClick("midi-editor")}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800/60 hover:text-white"
          >
            <span className="text-slate-400">🎹</span>
            <span>MIDI Editor</span>
          </button>

          {/* Active Tool: MIDI to Sheet Music */}
          <button
            onClick={() => handleToolClick("midi-to-sheet")}
            className="flex items-center gap-3 rounded-lg bg-slate-800/90 px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-white/10"
          >
            <span className="text-indigo-400">🎵</span>
            <span className="flex-1 text-left">MIDI to Sheet Music</span>
          </button>

          <button
            onClick={() => handleToolClick("scanner")}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800/60 hover:text-white"
          >
            <span className="text-slate-400">📷</span>
            <span>Sheet Music Scanner</span>
          </button>

          <button
            onClick={() => handleToolClick("all-tools")}
            className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800/60 hover:text-white"
          >
            <div className="flex items-center gap-3">
              <span className="text-slate-400">🧰</span>
              <span>All tools</span>
            </div>
            <span className="text-xs text-slate-600">›</span>
          </button>
        </nav>

        <div className="my-3 border-t border-slate-800" />

        {/* Footer Links */}
        <div className="flex items-center justify-between px-1">
          <button
            onClick={() => handleToolClick("pricing")}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-slate-400 hover:bg-slate-800/40 hover:text-white"
          >
            <span>💎</span>
            <span>Pricing</span>
          </button>
          <button
            onClick={() => handleToolClick("feedback")}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-slate-400 hover:bg-slate-800/40 hover:text-white"
          >
            <span>💬</span>
            <span>Feedback</span>
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User Profile Card matching screenshot */}
        <div
          onClick={() => handleToolClick("account")}
          className="cursor-pointer border-t border-slate-800 pt-3"
        >
          <div className="flex items-center gap-2.5 rounded-lg p-1.5 hover:bg-slate-800/50">
            <div className="relative h-9 w-9 overflow-hidden rounded-full ring-1 ring-slate-700">
              <Image
                src="/user-avatar.png"
                alt="Devran Tukan"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-semibold text-white">Devran Tukan</span>
                <span className="rounded bg-slate-800 px-1 py-0.5 text-[10px] font-bold text-slate-400">
                  FREE
                </span>
              </div>
            </div>
            <div className="flex flex-col text-[10px] text-slate-500">
              <span>▲</span>
              <span className="-mt-1.5">▼</span>
            </div>
          </div>

          <div className="mt-2 px-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Monthly</span>
              <span className="font-semibold text-slate-300">80/120</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div className="h-full w-[66.6%] rounded-full bg-gradient-to-r from-rose-500 to-red-500" />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] text-slate-500">
              <span>✦ 0 Credit Pack</span>
              <span>Resets Dec 1</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Feature Preview Modal */}
      {activeModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveModal(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-2xl text-indigo-400">
              {activeModal.icon}
            </div>
            <span className="inline-block rounded-full bg-red-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-red-400">
              {activeModal.badge}
            </span>
            <h3 className="mt-2 text-lg font-bold text-white">{activeModal.title}</h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-400">
              {activeModal.desc}
            </p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
