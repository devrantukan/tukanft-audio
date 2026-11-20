"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import StudioLayout from "@/components/StudioLayout";
import VirtualPiano from "@/components/VirtualPiano";
import { useLanguage } from "@/context/LanguageContext";
import { SampleInfo, ScoreData } from "@/types";

export default function VirtualPianoPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [samples, setSamples] = useState<SampleInfo[]>([]);

  useEffect(() => {
    fetch("/api/samples")
      .then((res) => res.json())
      .then((data) => {
        if (data.samples) setSamples(data.samples);
      })
      .catch((err) => console.error("Failed to load sample registry:", err));
  }, []);

  const handleOpenScoreInSheetMusic = (data: ScoreData) => {
    // Navigate to sheet music view
    router.push("/midi-to-sheet");
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
      activeTool="virtual-piano"
      title={t("virtualPiano")}
      badge={t("proStudio")}
      actions={headerActions}
    >
      <VirtualPiano
        samples={samples}
        onOpenScoreInSheetMusic={handleOpenScoreInSheetMusic}
      />
    </StudioLayout>
  );
}
