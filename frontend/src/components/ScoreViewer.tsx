"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import type { OpenSheetMusicDisplay } from "opensheetmusicdisplay";

interface ScoreViewerProps {
  musicXml: string | null;
  zoom: number;
  layoutMode: "continuous" | "paged";
  onOsmdReady?: (osmd: OpenSheetMusicDisplay) => void;
  isLoading?: boolean;
}

export default function ScoreViewer({
  musicXml,
  zoom,
  layoutMode,
  onOsmdReady,
  isLoading = false,
}: ScoreViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  // Keep a stable ref to onOsmdReady to prevent render loops
  const onOsmdReadyRef = useRef(onOsmdReady);
  useEffect(() => {
    onOsmdReadyRef.current = onOsmdReady;
  }, [onOsmdReady]);

  // Keep track of current zoom without re-running full init
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  // Initialize and render OSMD
  const initScore = useCallback(async () => {
    if (!containerRef.current || !musicXml) return;

    try {
      setIsRendering(true);
      setRenderError(null);

      // Clean up previous instance contents
      containerRef.current.innerHTML = "";

      // Dynamic import to guarantee client-side window availability
      const { OpenSheetMusicDisplay } = await import("opensheetmusicdisplay");

      const osmd = new OpenSheetMusicDisplay(containerRef.current, {
        autoResize: true,
        backend: "svg",
        drawTitle: true,
        drawSubtitle: true,
        drawComposer: true,
        drawCredits: true,
        drawPartNames: true,
        followCursor: true,
        drawingParameters: "default",
        pageFormat: layoutMode === "continuous" ? "Endless" : "A4_P",
      });

      // Ensure notes and staves fill the page width completely with proper justification
      osmd.EngravingRules.CompactMode = false;
      osmd.EngravingRules.StretchLastSystemLine = true;
      osmd.EngravingRules.FillEmptyMeasuresWithWholeRest = 1;
      osmd.EngravingRules.PageLeftMargin = 2;
      osmd.EngravingRules.PageRightMargin = 2;

      osmdRef.current = osmd;

      await osmd.load(musicXml);
      osmd.zoom = zoomRef.current;
      osmd.render();

      if (osmd.cursor) {
        osmd.cursor.show();
        osmd.cursor.reset();
      }

      if (onOsmdReadyRef.current) {
        onOsmdReadyRef.current(osmd);
      }
    } catch (err: any) {
      console.error("OSMD render error:", err);
      setRenderError(err?.message || "Failed to render sheet music.");
    } finally {
      setIsRendering(false);
    }
  }, [musicXml, layoutMode]);

  // Re-run ONLY when musicXml or layoutMode changes
  useEffect(() => {
    initScore();
  }, [initScore]);

  // Handle dynamic container resize (sidebar toggle, settings toggle, window resize)
  useEffect(() => {
    if (!containerRef.current) return;
    let resizeTimer: NodeJS.Timeout | null = null;
    let lastWidth = containerRef.current.clientWidth;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = Math.round(entry.contentRect.width);
        if (newWidth > 0 && Math.abs(newWidth - lastWidth) > 5 && osmdRef.current) {
          lastWidth = newWidth;
          if (resizeTimer) clearTimeout(resizeTimer);
          resizeTimer = setTimeout(() => {
            try {
              if (osmdRef.current) {
                osmdRef.current.render();
              }
            } catch (e) {
              console.warn("OSMD resize render warning:", e);
            }
          }, 150);
        }
      }
    });

    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      if (resizeTimer) clearTimeout(resizeTimer);
    };
  }, []);

  // Update zoom when zoom prop changes without full re-parse
  useEffect(() => {
    if (osmdRef.current && musicXml) {
      try {
        osmdRef.current.zoom = zoom;
        osmdRef.current.render();
      } catch (e) {
        console.warn("Zoom update warning:", e);
      }
    }
  }, [zoom, musicXml]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-start overflow-y-auto bg-slate-900/60 p-4 sm:p-8 score-print-wrapper print-score-flow">
      {/* Loading overlay */}
      {(isLoading || isRendering) && (
        <div className="absolute inset-0 z-30 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3 no-print">
          <div className="w-10 h-10 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-300">
            {isLoading ? "Generating Sheet Music..." : "Engraving Vector Notation..."}
          </p>
        </div>
      )}

      {/* Render error fallback */}
      {renderError && (
        <div className="w-full max-w-xl mx-auto my-12 p-5 bg-rose-950/50 border border-rose-800/80 rounded-xl text-rose-200 no-print">
          <div className="flex items-center gap-2 mb-2 font-semibold">
            <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Notation Rendering Notice
          </div>
          <p className="text-xs text-rose-300/90 leading-relaxed">{renderError}</p>
        </div>
      )}

      {/* Sheet Music Canvas Sheet Container */}
      <div
        id="score-sheet-paper"
        className={`w-full max-w-5xl bg-white rounded-lg shadow-2xl p-6 sm:p-12 text-slate-900 transition-all duration-200 print:shadow-none print:border-none print:rounded-none print:p-0 print:max-w-none print:w-full ${
          musicXml ? "block" : "hidden"
        }`}
        style={{
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)",
        }}
      >
        <div ref={containerRef} className="w-full overflow-x-auto min-h-[300px] print:overflow-visible print:w-full print:p-0" />
      </div>

      {!musicXml && !isLoading && (
        <div className="flex flex-col items-center justify-center h-96 text-slate-500 text-center no-print">
          <svg className="w-16 h-16 stroke-slate-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <p className="text-base font-medium text-slate-400">No score loaded yet</p>
          <p className="text-xs text-slate-500 mt-1">Upload a MIDI file or select a sample above to begin</p>
        </div>
      )}
    </div>
  );
}
