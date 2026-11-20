"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sidebar, ActiveToolType } from "@/components/Sidebar";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

interface StudioLayoutProps {
  children: React.ReactNode;
  activeTool?: ActiveToolType;
  title?: string;
  subtitle?: string;
  badge?: string;
  actions?: React.ReactNode;
}

export default function StudioLayout({
  children,
  activeTool,
  title,
  subtitle,
  badge,
  actions,
}: StudioLayoutProps) {
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

  return (
    <div className="flex h-[100dvh] w-full max-w-full overflow-hidden bg-slate-950 text-slate-100 print-score-flow">
      <div className="no-print">
        <Sidebar
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
          activeTool={activeTool}
        />
      </div>

      {/* Main Studio Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden print-score-flow">
        {/* Top Navbar Header */}
        <div className="no-print">
          <header className="relative z-30 pt-safe min-h-14 bg-slate-900/95 border-b border-slate-800 px-safe flex items-center justify-between gap-2 shrink-0 backdrop-blur-sm no-print">
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

              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-bold text-white truncate">
                  {title || t("proStudio")}
                </h1>
                {subtitle && (
                  <p className="text-[11px] text-slate-500 truncate">{subtitle}</p>
                )}
              </div>

              <span className="hidden md:inline shrink-0 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-rose-600/15 text-rose-400 border border-rose-500/25">
                {badge || t("proStudio")}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Custom page action buttons */}
              {actions}

              {/* Language Switcher */}
              <LanguageSwitcher />

              {!user && (
                <button
                  onClick={openLoginModal}
                  className="h-10 px-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
                >
                  <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">{t("signIn")}</span>
                </button>
              )}
            </div>
          </header>
        </div>

        {/* Content Canvas */}
        <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden print-score-flow">
          {children}
        </div>
      </div>
    </div>
  );
}
