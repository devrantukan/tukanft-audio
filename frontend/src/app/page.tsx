"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Sidebar } from "@/components/Sidebar";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

export default function LandingPage() {
  const { user, openLoginModal } = useAuth();
  const { t } = useLanguage();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("tukanft_sidebar_collapsed");
      if (saved === "true") {
        setIsSidebarCollapsed(true);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const onChange = () => {
      setIsMobileViewport(mq.matches);
      if (!mq.matches) setIsMobileSidebarOpen(false);
    };
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("tukanft_sidebar_collapsed", String(next));
      } catch (e) {}
      return next;
    });
  };

  const handleHeaderMenuClick = () => {
    if (isMobileViewport) {
      setIsMobileSidebarOpen((open) => !open);
    } else {
      toggleSidebarCollapse();
    }
  };

  const TOOLS = [
    {
      id: "midi-to-sheet",
      href: "/midi-to-sheet",
      icon: "🎼",
      title: t("midiToSheet"),
      tag: "FLAGSHIP ENGRAVER",
      color: "from-rose-500/20 to-red-500/20 border-rose-500/30 text-rose-400",
      btnClass: "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20",
      description: "Convert MIDI files into engraved, professional sheet music. Automatic grand staff split, smart tuplet recognition, real-time playback cursor, and MusicXML export.",
    },
    {
      id: "virtual-piano",
      href: "/virtual-piano",
      icon: "🎹",
      title: t("virtualPiano"),
      tag: "88-KEY SIMULATOR",
      color: "from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-400",
      btnClass: "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/20",
      description: "Interactive 88-key grand piano keyboard. Play with your computer keyboard (QWERTY), mouse, or any real USB/Bluetooth MIDI controller with animated note waterfalls.",
    },
    {
      id: "sheet-to-midi",
      href: "/sheet-to-midi",
      icon: "📄",
      title: t("sheetToMidi"),
      tag: "NEURAL OMR v2.4",
      color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400",
      btnClass: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20",
      description: "Upload scanned sheet music PDFs or photos to convert printed staves into playable MIDI sequences using deep neural Optical Music Recognition.",
    },
    {
      id: "scanner",
      href: "/scanner",
      icon: "📷",
      title: t("scanner"),
      tag: "CAMERA & MOBILE",
      color: "from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400",
      btnClass: "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20",
      description: "Snap a photo of printed sheet music with your smartphone or webcam. Alignment guides and laser scanning recognize notes and play them back on the spot.",
    },
    {
      id: "mp3-to-midi",
      href: "/mp3-to-midi",
      icon: "🎙️",
      title: t("mp3ToMidi"),
      tag: "AUDIO TRANSCRIPTION",
      color: "from-purple-500/20 to-indigo-500/20 border-purple-500/30 text-purple-400",
      btnClass: "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/20",
      description: "Upload audio recordings (.mp3, .wav, .m4a) to transcribe polyphonic piano, vocal melodies, and basslines into clean, edit-ready MIDI.",
    },
    {
      id: "ai-midi",
      href: "/ai-midi",
      icon: "✨",
      title: t("aiMidi"),
      tag: "AI TRANSFORMER",
      color: "from-yellow-500/20 to-amber-500/20 border-yellow-500/30 text-yellow-400",
      btnClass: "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20",
      description: "Generate musical ideas, chord progressions, and melodic hooks directly from natural language prompts using deep generative music models.",
    },
    {
      id: "midi-editor",
      href: "/midi-editor",
      icon: "🎛️",
      title: t("midiEditor"),
      tag: "PIANO ROLL EDITOR",
      color: "from-indigo-500/20 to-blue-500/20 border-indigo-500/30 text-indigo-400",
      btnClass: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20",
      description: "In-browser multi-track piano roll editor. Draw notes, adjust velocity curves, snap to quantization grids, and export cleanly into sheet music.",
    },
  ];

  return (
    <div className="flex h-[100dvh] w-full max-w-full overflow-hidden bg-slate-950 text-slate-100">
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
        activeTool="all-tools"
      />

      {/* Main Landing Canvas */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        {/* Top Navbar Header */}
        <header className="relative z-30 pt-safe min-h-14 bg-slate-900/95 border-b border-slate-800 px-safe flex items-center justify-between gap-2 shrink-0 backdrop-blur-sm px-4 sm:px-6">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              onClick={handleHeaderMenuClick}
              className="w-10 h-10 shrink-0 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition focus:outline-none flex items-center justify-center"
              title={
                isMobileViewport
                  ? "Open navigation menu"
                  : isSidebarCollapsed
                    ? "Expand sidebar"
                    : "Collapse sidebar"
              }
              aria-label="Toggle navigation"
              aria-expanded={isMobileViewport ? isMobileSidebarOpen : undefined}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Tukanft Audio Suite</span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-rose-600/15 text-rose-400 border border-rose-500/25">
                CREATIVE STUDIO
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/pricing"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition hidden sm:inline-block"
            >
              {t("pricing")}
            </Link>

            <LanguageSwitcher />

            {!user ? (
              <button
                onClick={openLoginModal}
                className="h-9 px-3 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 transition shadow-sm shadow-rose-600/30"
              >
                <span>{t("signIn")}</span>
              </button>
            ) : (
              <span className="text-xs font-mono text-slate-400">
                {user.email}
              </span>
            )}
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative shrink-0 pt-12 pb-16 px-4 sm:px-6 lg:px-12 text-center bg-gradient-to-b from-slate-900/60 via-slate-950 to-slate-950 border-b border-slate-800/80">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-6">
              <span>✨</span>
              <span>Next-Generation AI Audio & Music Notation Suite</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white mb-6 leading-[1.15]">
              Create, Transcribe & Engrave Music with <span className="bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent">Superhuman Precision</span>
            </h1>

            <p className="text-sm sm:text-lg text-slate-400 max-w-2xl mb-8 leading-relaxed">
              Transform MIDI files into engraved sheet music, scan physical scores with your camera, play the 88-key virtual piano, and transcribe polyphonic audio in one unified studio.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/midi-to-sheet"
                className="px-6 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold shadow-xl shadow-rose-600/30 transition flex items-center gap-2"
              >
                <span>🎼 Launch Sheet Music Engraver</span>
                <span>→</span>
              </Link>
              <Link
                href="/virtual-piano"
                className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition flex items-center gap-2"
              >
                <span>🎹 Play Virtual Piano</span>
              </Link>
              <Link
                href="/scanner"
                className="px-6 py-3.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs sm:text-sm font-semibold transition flex items-center gap-2"
              >
                <span>📷 Scan Sheet Music</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Tools Showcase Grid */}
        <section className="shrink-0 py-12 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold text-rose-400 uppercase tracking-widest block mb-1">
                COMPLETE STUDIO ECOSYSTEM
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Explore the Creative Audio Tools
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md">
              Each tool is built with professional grade accuracy, browser-based Web Audio synthesis, and multi-format exports.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TOOLS.map((tool) => (
              <div
                key={tool.id}
                className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between gap-6 group hover:shadow-2xl hover:bg-slate-900 relative"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      {tool.icon}
                    </div>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                      {tool.tag}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white mb-2 group-hover:text-rose-400 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {tool.description}
                  </p>
                </div>

                <Link
                  href={tool.href}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm ${tool.btnClass}`}
                >
                  <span>Launch Tool</span>
                  <span>→</span>
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Feature Highlights Banner */}
        <section className="shrink-0 py-12 px-4 sm:px-6 lg:px-12 border-t border-slate-800/80 bg-slate-900/30">
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80">
              <span className="text-2xl mb-2 block">⚡</span>
              <h4 className="text-sm font-bold text-white mb-1">Live Audio Engine</h4>
              <p className="text-xs text-slate-400">
                100% real-time browser Web Audio synthesis with polyphonic piano, rhodes, strings, and organ.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80">
              <span className="text-2xl mb-2 block">🎼</span>
              <h4 className="text-sm font-bold text-white mb-1">OpenSheetMusicDisplay</h4>
              <p className="text-xs text-slate-400">
                High-fidelity vector engraving with instant transposition, continuous/paged layouts, and printing.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80">
              <span className="text-2xl mb-2 block">🌐</span>
              <h4 className="text-sm font-bold text-white mb-1">6 Languages Supported</h4>
              <p className="text-xs text-slate-400">
                Seamless studio localization in English, Turkish, French, Spanish, German, and Italian.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80">
              <span className="text-2xl mb-2 block">📱</span>
              <h4 className="text-sm font-bold text-white mb-1">Mobile & Camera Ready</h4>
              <p className="text-xs text-slate-400">
                WebRTC live camera scanning and responsive mobile layout engineered for creators on the go.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="shrink-0 border-t border-slate-800 py-8 px-4 sm:px-6 text-center text-xs text-slate-500">
          <p className="mb-2">
            © {new Date().getFullYear()} Tukanft Audio. Built for musicians, producers, and arrangers worldwide.
          </p>
          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
            <Link href="/midi-to-sheet" className="hover:text-white transition">MIDI to Sheet</Link>
            <span>•</span>
            <Link href="/virtual-piano" className="hover:text-white transition">Virtual Piano</Link>
            <span>•</span>
            <Link href="/sheet-to-midi" className="hover:text-white transition">Sheet to MIDI</Link>
            <span>•</span>
            <Link href="/scanner" className="hover:text-white transition">Camera Scanner</Link>
            <span>•</span>
            <Link href="/pricing" className="hover:text-white transition">Pricing</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
