import type { Metadata } from "next";
import { createLocalizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "MIDI to Sheet Music Converter — Free Online Score Engraver",
  description:
    "Convert MIDI files to engraved sheet music instantly in your browser. Real-time audio playback, interactive score viewer, transposition, and MusicXML export.",
  alternates: createLocalizedAlternates("/midi-to-sheet"),
  openGraph: {
    title: "MIDI to Sheet Music Converter — Tukanft Audio",
    description:
      "Convert MIDI files to engraved sheet music instantly in your browser. Real-time audio playback, interactive score viewer, and vector PDF/MusicXML export.",
    url: "/midi-to-sheet",
    locale: "en_US",
    alternateLocale: ["tr_TR", "fr_FR", "es_ES", "de_DE", "it_IT"],
  },
};

export default function MidiToSheetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
