"use client";

import React from "react";
import { useRouter } from "next/navigation";
import StudioLayout from "@/components/StudioLayout";
import SheetToMidi from "@/components/SheetToMidi";
import { useLanguage } from "@/context/LanguageContext";
import { ScoreData } from "@/types";

export default function SheetToMidiPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const handleOpenScoreInSheetMusic = (data: ScoreData) => {
    try {
      if (typeof window !== "undefined") {
        const json = JSON.stringify(data);
        sessionStorage.setItem("tukanft_active_score", json);
        localStorage.setItem("tukanft_active_score", json);
      }
    } catch (e) {
      console.warn("Storage save error:", e);
    }
    const targetUrl = data.sessionId ? `/midi-to-sheet?session=${data.sessionId}` : "/midi-to-sheet";
    router.push(targetUrl);
  };

  const handleOpenScoreInVirtualPiano = (data: ScoreData) => {
    try {
      if (typeof window !== "undefined") {
        const json = JSON.stringify(data);
        sessionStorage.setItem("tukanft_active_score", json);
        localStorage.setItem("tukanft_active_score", json);
      }
    } catch (e) {
      console.warn("Storage save error:", e);
    }
    const targetUrl = data.sessionId ? `/virtual-piano?session=${data.sessionId}` : "/virtual-piano";
    router.push(targetUrl);
  };

  const headerActions = (
    <button
      onClick={() => router.push("/midi-to-sheet")}
      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
    >
      <span>🎼 {t("midiToSheet")}</span>
    </button>
  );

  return (
    <StudioLayout
      activeTool="sheet-to-midi"
      title={t("sheetToMidi")}
      badge={t("opticalRecognition")}
      actions={headerActions}
    >
      <SheetToMidi
        onOpenScoreInSheetMusic={handleOpenScoreInSheetMusic}
        onOpenScoreInVirtualPiano={handleOpenScoreInVirtualPiano}
      />
    </StudioLayout>
  );
}
