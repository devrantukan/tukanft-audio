"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

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
    icon: "🎛️",
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
    desc: "Upgrade to Tukanft Pro ($12/mo) for unlimited MIDI exports, batch processing, and 24-bit audio renders.",
  },
  "feedback": {
    title: "Feedback & Community",
    badge: "SUPPORT",
    icon: "💬",
    desc: "Have ideas, feature requests, or bugs to report? We build Tukanft Audio for musicians and producers. Send us your feedback!",
  },
};

export type ActiveToolType = "midi-to-sheet" | "virtual-piano";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  activeTool?: ActiveToolType;
  onSelectTool?: (tool: ActiveToolType) => void;
  onSelectActiveTool?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = true,
  onClose = () => {},
  activeTool = "midi-to-sheet",
  onSelectTool,
  onSelectActiveTool = () => {},
}) => {
  const { user, openLoginModal, logout } = useAuth();
  const [activeModal, setActiveModal] = useState<ToolInfo | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleToolClick = (toolKey: string) => {
    if (toolKey === "midi-to-sheet") {
      if (onSelectTool) onSelectTool("midi-to-sheet");
      onSelectActiveTool();
      onClose();
    } else if (toolKey === "virtual-piano") {
      if (onSelectTool) onSelectTool("virtual-piano");
      onClose();
    } else {
      setActiveModal(TOOL_INFO_MAP[toolKey] || null);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Main Studio Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[265px] shrink-0 flex-col border-r border-slate-800 bg-[#0f172a] p-4 text-slate-300 transition-transform duration-200 lg:static lg:translate-x-0 ${
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
          {/* Virtual Piano Tool */}
          <button
            onClick={() => handleToolClick("virtual-piano")}
            className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              activeTool === "virtual-piano"
                ? "bg-slate-800/90 text-white shadow-sm ring-1 ring-slate-700/60"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-lg text-sm ${
                activeTool === "virtual-piano"
                  ? "bg-red-500/10 text-red-500"
                  : "bg-slate-800/80 text-slate-400"
              }`}
            >
              🎹
            </span>
            <span>Virtual Piano</span>
            {activeTool === "virtual-piano" && (
              <span className="ml-auto h-2 w-2 rounded-full bg-red-500" />
            )}
          </button>

          {/* MIDI to Sheet Music Tool */}
          <button
            onClick={() => handleToolClick("midi-to-sheet")}
            className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              activeTool === "midi-to-sheet"
                ? "bg-slate-800/90 text-white shadow-sm ring-1 ring-slate-700/60"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-lg text-sm ${
                activeTool === "midi-to-sheet"
                  ? "bg-red-500/10 text-red-500"
                  : "bg-slate-800/80 text-slate-400"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </span>
            <span>MIDI to Sheet Music</span>
            {activeTool === "midi-to-sheet" && (
              <span className="ml-auto h-2 w-2 rounded-full bg-red-500" />
            )}
          </button>

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
            <span className="text-slate-400">🎛️</span>
            <span>MIDI Editor</span>
          </button>

          <button
            onClick={() => handleToolClick("scanner")}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-800/60 hover:text-slate-300"
          >
            <span>📷</span>
            <span>Sheet Music Scanner</span>
          </button>

          <button
            onClick={() => handleToolClick("all-tools")}
            className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800/60 hover:text-white"
          >
            <div className="flex items-center gap-3">
              <span>🧰</span>
              <span>All tools</span>
            </div>
            <span className="text-xs text-slate-600">›</span>
          </button>
        </nav>

        {/* Utilities Section */}
        <div className="mt-4 flex flex-col gap-1 border-t border-slate-800/80 pt-3">
          <button
            onClick={() => handleToolClick("pricing")}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800/60 hover:text-white"
          >
            <span>💎</span>
            <span>Pricing</span>
          </button>

          <button
            onClick={() => handleToolClick("feedback")}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800/60 hover:text-white"
          >
            <span>💬</span>
            <span>Feedback</span>
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User Profile Card OR Sign In Button */}
        <div className="border-t border-slate-800 pt-3 relative">
          {!user ? (
            <button
              onClick={openLoginModal}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 p-2.5 text-xs font-semibold text-white transition hover:border-slate-600 shadow-sm"
            >
              <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span>Sign In / Log In</span>
            </button>
          ) : (
            <>
              {/* User Menu Dropdown Popup */}
              {isUserMenuOpen && (
                <div
                  className="absolute bottom-full left-0 mb-2 w-full rounded-xl bg-slate-900 border border-slate-800 p-2 shadow-2xl text-xs text-slate-200 z-50 animate-in fade-in duration-100"
                >
                  <div className="px-2 py-1.5 border-b border-slate-800 mb-1">
                    <div className="font-semibold text-white truncate">{user.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                  </div>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      handleToolClick("pricing");
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-800 flex items-center justify-between text-slate-300 hover:text-white"
                  >
                    <span>Upgrade to PRO</span>
                    <span className="text-[10px] bg-red-600/20 text-red-400 px-1.5 py-0.5 rounded font-bold">PRO</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 flex items-center gap-2 mt-1"
                  >
                    <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Log Out</span>
                  </button>
                </div>
              )}

              {/* User Profile Card matching screenshot */}
              <div
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 rounded-lg p-1.5 hover:bg-slate-800/50 transition">
                  <div className="relative h-9 w-9 overflow-hidden rounded-full ring-1 ring-slate-700 bg-slate-950">
                    <Image
                      src={user.avatarUrl || "/tukan-logo.png"}
                      alt={user.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-white">{user.name}</span>
                      <span className="rounded bg-slate-800 px-1 py-0.5 text-[10px] font-bold text-slate-400">
                        {user.plan}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col text-[10px] text-slate-500 group-hover:text-slate-300">
                    <span>▲</span>
                    <span className="-mt-1.5">▼</span>
                  </div>
                </div>

                <div className="mt-2 px-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Monthly</span>
                    <span className="font-semibold text-slate-300">
                      {user.creditsUsed}/{user.creditsTotal}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-500 to-red-500 transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.round((user.creditsUsed / user.creditsTotal) * 100))}%`,
                      }}
                    />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[11px] text-slate-500">
                    <span>✦ {user.creditPacks} Credit Pack</span>
                    <span>Resets {user.resetDate}</span>
                  </div>
                </div>
              </div>
            </>
          )}
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
