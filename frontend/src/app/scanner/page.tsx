"use client";

import React from "react";
import { useRouter } from "next/navigation";
import StudioLayout from "@/components/StudioLayout";
import SheetScanner from "@/components/SheetScanner";
import { useLanguage } from "@/context/LanguageContext";
import { ScoreData } from "@/types";

export default function ScannerPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const handleOpenScoreInSheetMusic = (data: ScoreData) => {
    router.push("/midi-to-sheet");
  };

  const handleOpenScoreInVirtualPiano = (data: ScoreData) => {
    router.push("/virtual-piano");
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
      activeTool="scanner"
      title={t("scanner")}
      badge={t("cameraMobile")}
      actions={headerActions}
    >
      <SheetScanner
        onOpenScoreInSheetMusic={handleOpenScoreInSheetMusic}
        onOpenScoreInVirtualPiano={handleOpenScoreInVirtualPiano}
      />
    </StudioLayout>
  );
}
