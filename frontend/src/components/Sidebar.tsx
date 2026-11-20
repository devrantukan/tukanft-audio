"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

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

export type ActiveToolType =
  | "all-tools"
  | "midi-to-sheet"
  | "virtual-piano"
  | "sheet-to-midi"
  | "scanner"
  | "mp3-to-midi"
  | "ai-midi"
  | "midi-editor"
  | "pricing";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  activeTool?: ActiveToolType;
  onSelectTool?: (tool: ActiveToolType) => void;
  onSelectActiveTool?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = false,
  onClose = () => { },
  isCollapsed = false,
  onToggleCollapse = () => { },
  activeTool,
  onSelectTool,
  onSelectActiveTool = () => { },
}) => {
  const pathname = usePathname();
  const { user, openLoginModal, logout } = useAuth();
  const { t } = useLanguage();
  const [activeModal, setActiveModal] = useState<ToolInfo | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const effectiveActiveTool: ActiveToolType =
    activeTool ||
    (pathname === "/virtual-piano"
      ? "virtual-piano"
      : pathname === "/midi-to-sheet"
      ? "midi-to-sheet"
      : pathname === "/sheet-to-midi"
      ? "sheet-to-midi"
      : pathname === "/scanner"
      ? "scanner"
      : pathname === "/mp3-to-midi"
      ? "mp3-to-midi"
      : pathname === "/ai-midi"
      ? "ai-midi"
      : pathname === "/midi-editor"
      ? "midi-editor"
      : pathname === "/pricing"
      ? "pricing"
      : pathname === "/"
      ? "all-tools"
      : "midi-to-sheet");

  const handleToolClick = (toolKey: string) => {
    if (toolKey === "midi-to-sheet") {
      if (onSelectTool) onSelectTool("midi-to-sheet");
      onSelectActiveTool();
      onClose();
    } else if (toolKey === "virtual-piano") {
      if (onSelectTool) onSelectTool("virtual-piano");
      onClose();
    } else if (toolKey === "sheet-to-midi") {
      if (onSelectTool) onSelectTool("sheet-to-midi");
      onClose();
    } else if (toolKey === "scanner") {
      if (onSelectTool) onSelectTool("scanner");
      onClose();
    } else {
      setActiveModal(TOOL_INFO_MAP[toolKey] || null);
    }
  };

  return (
    <>
      {/* Mobile Backdrop — only when the full navigation drawer is open */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden no-print"
          aria-hidden="true"
        />
      )}

      {/* Main Studio Sidebar — mobile: off-canvas drawer; desktop: static rail with optional collapse */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col border-r border-slate-800 bg-[#0f172a] text-slate-300 transition-all duration-200 no-print",
          "w-[265px] p-4",
          "lg:static lg:translate-x-0",
          isCollapsed ? "lg:w-[68px] lg:p-2.5" : "lg:w-[265px] lg:p-4",
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        {/* Brand Header */}
        <div
          className={`flex items-center pb-4 pt-1 ${
            isCollapsed ? "lg:justify-center" : "justify-between px-2"
          }`}
        >
          <div className="flex items-center gap-3">
            <Link href="/" onClick={onClose} className="flex items-center gap-3 group">
              <Image
                src="/tukan-logo.svg"
                alt="Tukanft Logo"
                width={32}
                height={32}
                className="drop-shadow shrink-0 cursor-pointer group-hover:scale-105 transition-transform"
              />
              <div
                className={`items-baseline gap-1.5 leading-none overflow-hidden ${
                  isCollapsed ? "hidden max-lg:flex" : "flex"
                }`}
              >
                <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-slate-100 transition-colors">Tukanft</span>
                <span className="text-xs font-bold uppercase tracking-wider text-red-500">audio</span>
              </div>
            </Link>
          </div>

          {/* Collapse/Expand Toggle Button */}
          <button
            onClick={onToggleCollapse}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition hidden lg:block ${
              isCollapsed ? "lg:hidden" : ""
            }`}
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Expand button when collapsed at the top */}
        {isCollapsed && (
          <button
            onClick={onToggleCollapse}
            className="w-full hidden lg:flex items-center justify-center p-1.5 mb-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Section Label (when expanded) */}
        <div
          className={`px-2 pb-1.5 pt-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 ${
            isCollapsed ? "hidden max-lg:block" : "block"
          }`}
        >
          {t("midiAndNotation")}
        </div>

        {/* Navigation Section */}
        <nav className="flex flex-col gap-1 mt-1">
          {/* Virtual Piano Tool */}
          <Link
            href="/virtual-piano"
            onClick={onClose}
            title="Virtual Piano Keyboard Simulator"
            className={`relative flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition ${
              isCollapsed ? "lg:justify-center lg:gap-0 lg:p-2.5 lg:px-2.5" : ""
            } ${effectiveActiveTool === "virtual-piano"
                ? "bg-slate-800/90 text-white shadow-sm ring-1 ring-slate-700/60"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
              }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-lg text-sm shrink-0 ${effectiveActiveTool === "virtual-piano"
                ? "bg-red-500/10 text-red-500"
                : "bg-slate-800/80 text-slate-400"
                }`}
            >
              🎹
            </span>
            <span className={isCollapsed ? "max-lg:inline hidden" : "inline"}>{t("virtualPiano")}</span>
            {effectiveActiveTool === "virtual-piano" && (
              <span
                className={`h-2 w-2 rounded-full bg-red-500 ${
                  isCollapsed ? "absolute top-1.5 right-1.5 lg:top-1.5 lg:right-1.5 ml-auto max-lg:ml-auto max-lg:static lg:absolute" : "ml-auto"
                }`}
              />
            )}
          </Link>

          {/* MIDI to Sheet Music Tool */}
          <Link
            href="/midi-to-sheet"
            onClick={onClose}
            title="MIDI to Sheet Music Converter"
            className={`relative flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition ${
              isCollapsed ? "lg:justify-center lg:gap-0 lg:p-2.5 lg:px-2.5" : ""
            } ${effectiveActiveTool === "midi-to-sheet"
                ? "bg-slate-800/90 text-white shadow-sm ring-1 ring-slate-700/60"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
              }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-lg text-sm shrink-0 ${effectiveActiveTool === "midi-to-sheet"
                ? "bg-red-500/10 text-red-500"
                : "bg-slate-800/80 text-slate-400"
                }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </span>
            <span className={isCollapsed ? "max-lg:inline hidden" : "inline"}>{t("midiToSheet")}</span>
            {effectiveActiveTool === "midi-to-sheet" && (
              <span
                className={`h-2 w-2 rounded-full bg-red-500 ${
                  isCollapsed ? "absolute top-1.5 right-1.5 ml-auto max-lg:ml-auto max-lg:static lg:absolute" : "ml-auto"
                }`}
              />
            )}
          </Link>

          {/* AI MIDI Generator */}
          <Link
            href="/ai-midi"
            onClick={onClose}
            title="AI MIDI Generator"
            className={`relative flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition ${
              isCollapsed ? "lg:justify-center lg:gap-0 lg:p-2.5 lg:px-2.5" : ""
            } ${effectiveActiveTool === "ai-midi"
                ? "bg-slate-800/90 text-white shadow-sm ring-1 ring-slate-700/60"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
              }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-lg text-sm shrink-0 ${effectiveActiveTool === "ai-midi"
                ? "bg-amber-500/15 text-amber-400"
                : "text-slate-400"
                }`}
            >
              ✨
            </span>
            <span className={isCollapsed ? "max-lg:inline hidden" : "inline"}>{t("aiMidi")}</span>
            {effectiveActiveTool === "ai-midi" && (
              <span
                className={`h-2 w-2 rounded-full bg-amber-500 ${
                  isCollapsed ? "absolute top-1.5 right-1.5 ml-auto max-lg:ml-auto max-lg:static lg:absolute" : "ml-auto"
                }`}
              />
            )}
          </Link>

          {/* MP3 to MIDI */}
          <Link
            href="/mp3-to-midi"
            onClick={onClose}
            title="MP3 to MIDI"
            className={`relative flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition ${
              isCollapsed ? "lg:justify-center lg:gap-0 lg:p-2.5 lg:px-2.5" : ""
            } ${effectiveActiveTool === "mp3-to-midi"
                ? "bg-slate-800/90 text-white shadow-sm ring-1 ring-slate-700/60"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
              }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-lg text-sm shrink-0 ${effectiveActiveTool === "mp3-to-midi"
                ? "bg-purple-500/15 text-purple-400"
                : "text-slate-400"
                }`}
            >
              🎙️
            </span>
            <span className={isCollapsed ? "max-lg:inline hidden" : "inline"}>{t("mp3ToMidi")}</span>
            {effectiveActiveTool === "mp3-to-midi" && (
              <span
                className={`h-2 w-2 rounded-full bg-purple-500 ${
                  isCollapsed ? "absolute top-1.5 right-1.5 ml-auto max-lg:ml-auto max-lg:static lg:absolute" : "ml-auto"
                }`}
              />
            )}
          </Link>

          {/* Sheet to MIDI */}
          <Link
            href="/sheet-to-midi"
            onClick={onClose}
            title="Sheet Music to MIDI"
            className={`relative flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition ${
              isCollapsed ? "lg:justify-center lg:gap-0 lg:p-2.5 lg:px-2.5" : ""
            } ${
              effectiveActiveTool === "sheet-to-midi"
                ? "bg-slate-800/90 text-white shadow-sm ring-1 ring-slate-700/60"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-lg text-sm shrink-0 ${
                effectiveActiveTool === "sheet-to-midi"
                  ? "bg-rose-500/15 text-rose-400"
                  : "text-slate-400"
              }`}
            >
              🎼
            </span>
            <span className={isCollapsed ? "max-lg:inline hidden" : "inline"}>{t("sheetToMidi")}</span>
            {effectiveActiveTool === "sheet-to-midi" && (
              <span
                className={`h-2 w-2 rounded-full bg-red-500 ${
                  isCollapsed ? "absolute top-1.5 right-1.5 ml-auto max-lg:ml-auto max-lg:static lg:absolute" : "ml-auto"
                }`}
              />
            )}
          </Link>

          {/* MIDI Editor */}
          <Link
            href="/midi-editor"
            onClick={onClose}
            title="MIDI Editor"
            className={`relative flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition ${
              isCollapsed ? "lg:justify-center lg:gap-0 lg:p-2.5 lg:px-2.5" : ""
            } ${
              effectiveActiveTool === "midi-editor"
                ? "bg-slate-800/90 text-white shadow-sm ring-1 ring-slate-700/60"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-lg text-sm shrink-0 ${
                effectiveActiveTool === "midi-editor"
                  ? "bg-indigo-500/15 text-indigo-400"
                  : "text-slate-400"
              }`}
            >
              🎛️
            </span>
            <span className={isCollapsed ? "max-lg:inline hidden" : "inline"}>{t("midiEditor")}</span>
            {effectiveActiveTool === "midi-editor" && (
              <span
                className={`h-2 w-2 rounded-full bg-indigo-500 ${
                  isCollapsed ? "absolute top-1.5 right-1.5 ml-auto max-lg:ml-auto max-lg:static lg:absolute" : "ml-auto"
                }`}
              />
            )}
          </Link>

          {/* Sheet Music Scanner */}
          <Link
            href="/scanner"
            onClick={onClose}
            title="Sheet Music Scanner"
            className={`relative flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition ${
              isCollapsed ? "lg:justify-center lg:gap-0 lg:p-2.5 lg:px-2.5" : ""
            } ${
              effectiveActiveTool === "scanner"
                ? "bg-slate-800/90 text-white shadow-sm ring-1 ring-slate-700/60"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-lg text-sm shrink-0 ${
                effectiveActiveTool === "scanner"
                  ? "bg-cyan-500/15 text-cyan-400"
                  : "text-slate-400"
              }`}
            >
              📷
            </span>
            <span className={isCollapsed ? "max-lg:inline hidden" : "inline"}>{t("scanner")}</span>
            {effectiveActiveTool === "scanner" && (
              <span
                className={`h-2 w-2 rounded-full bg-cyan-500 ${
                  isCollapsed ? "absolute top-1.5 right-1.5 ml-auto max-lg:ml-auto max-lg:static lg:absolute" : "ml-auto"
                }`}
              />
            )}
          </Link>

          {/* All Tools / Landing */}
          <Link
            href="/"
            onClick={onClose}
            title="All Tools"
            className={`flex items-center rounded-xl text-sm font-semibold text-slate-400 hover:bg-slate-800/60 hover:text-white transition justify-between px-3 py-2.5 ${isCollapsed ? "lg:justify-center lg:gap-0 lg:p-2.5" : ""
              } ${effectiveActiveTool === "all-tools" ? "bg-slate-850 text-white" : ""}`}
          >
            <div className="flex items-center gap-3">
              <span className="shrink-0 text-slate-400">🧰</span>
              <span className={isCollapsed ? "max-lg:inline hidden" : "inline"}>{t("allTools")}</span>
            </div>
            <span className={`text-xs text-slate-600 ${isCollapsed ? "max-lg:inline hidden" : "inline"}`}>›</span>
          </Link>
        </nav>

        {/* Utilities Section */}
        <div
          className={`mt-4 flex flex-col gap-1 border-t border-slate-800/80 pt-3 ${
            isCollapsed ? "lg:items-center" : ""
          }`}
        >
          <button
            onClick={() => handleToolClick("pricing")}
            title="Pricing & Credits"
            className={`flex items-center rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800/60 hover:text-white transition gap-3 px-3 py-2 w-full ${isCollapsed ? "lg:justify-center lg:gap-0 lg:p-2.5" : ""
              }`}
          >
            <span className="shrink-0">💎</span>
            <span className={isCollapsed ? "max-lg:inline hidden" : "inline"}>{t("pricing")}</span>
          </button>

          <button
            onClick={() => handleToolClick("feedback")}
            title="Feedback & Support"
            className={`flex items-center rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800/60 hover:text-white transition gap-3 px-3 py-2 w-full ${isCollapsed ? "lg:justify-center lg:gap-0 lg:p-2.5" : ""
              }`}
          >
            <span className="shrink-0">💬</span>
            <span className={isCollapsed ? "max-lg:inline hidden" : "inline"}>{t("feedback")}</span>
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User Profile Card OR Sign In Button */}
        <div className="border-t border-slate-800 pt-3 relative">
          {!user ? (
            <button
              onClick={openLoginModal}
              title="Sign In / Log In"
              className={`w-full flex items-center justify-center gap-2 p-2.5 text-xs rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 font-semibold text-white transition hover:border-slate-600 shadow-sm ${
                isCollapsed ? "lg:gap-0" : ""
              }`}
            >
              <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span className={isCollapsed ? "max-lg:inline hidden" : "inline"}>{t("signIn")}</span>
            </button>
          ) : (
            <>
              {/* User Menu Dropdown Popup */}
              {isUserMenuOpen && (
                <div
                  className={`absolute bottom-full mb-2 rounded-xl bg-slate-900 border border-slate-800 p-2 shadow-2xl text-xs text-slate-200 z-50 animate-in fade-in duration-100 ${isCollapsed ? "left-0 w-56" : "left-0 w-full"
                    }`}
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
                    <span>{t("upgradePro")}</span>
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
                    <span>{t("logOut")}</span>
                  </button>
                </div>
              )}

              {/* Collapsed Avatar Icon */}
              {isCollapsed ? (
                <div
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="cursor-pointer hidden lg:flex items-center justify-center p-1 rounded-xl hover:bg-slate-800/80 transition"
                  title={`${user.name} (${user.plan}) • ${user.creditsUsed}/${user.creditsTotal} credits`}
                >
                  <div className="relative h-9 w-9 overflow-hidden rounded-full ring-2 ring-slate-700 bg-slate-950">
                    <Image
                      src={user.avatarUrl || "/tukan-logo.png"}
                      alt={user.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              ) : null}
              {/* Full profile on mobile drawer + desktop expanded; desktop collapsed uses avatar above */}
              <div
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`cursor-pointer group ${isCollapsed ? "max-lg:block hidden" : "block"}`}
              >
                  <div className="flex items-center gap-2.5 rounded-lg p-1.5 hover:bg-slate-800/50 transition">
                    <div className="relative h-9 w-9 overflow-hidden rounded-full ring-1 ring-slate-700 bg-slate-950 shrink-0">
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
                      <span>{t("monthly")}</span>
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
                      <span>✦ {user.creditPacks} {t("creditPack")}</span>
                      <span>{t("resets")} {user.resetDate}</span>
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
                {t("gotIt")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
