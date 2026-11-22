import type { Metadata } from "next";
import { createLocalizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "MP3 to MIDI Converter — Audio to MIDI Polyphonic Transcription",
  description:
    "Transcribe MP3, WAV, and audio recordings into clean MIDI files. AI neural polyphonic pitch tracking, onset detection, and sheet music engraving.",
  alternates: createLocalizedAlternates("/mp3-to-midi"),
  openGraph: {
    title: "MP3 to MIDI Converter — Tukanft Audio",
    description:
      "Transcribe polyphonic audio recordings into clean MIDI and sheet music with AI pitch tracking.",
    url: "/mp3-to-midi",
    locale: "en_US",
    alternateLocale: ["tr_TR", "fr_FR", "es_ES", "de_DE", "it_IT"],
  },
};

export default function Mp3ToMidiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
