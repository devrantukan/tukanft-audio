import type { Metadata } from "next";
import { createLocalizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "AI MIDI Generator — Compose Music with Text Prompts",
  description:
    "Generate full polyphonic MIDI sequences and engraved sheet music with AI prompts. Select musical key, tempo BPM, and genre styles (Neo-Soul, Classical, Jazz, Lofi, Synthwave).",
  alternates: createLocalizedAlternates("/ai-midi"),
  openGraph: {
    title: "AI MIDI Generator — Tukanft Audio",
    description:
      "Generate polyphonic MIDI sequences and engraved sheet music from text prompts. Real-time synthesis and one-click score engraving.",
    url: "/ai-midi",
    locale: "en_US",
    alternateLocale: ["tr_TR", "fr_FR", "es_ES", "de_DE", "it_IT"],
  },
};

export default function AiMidiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
