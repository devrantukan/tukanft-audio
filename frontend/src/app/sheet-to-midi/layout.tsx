import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sheet Music to MIDI Converter — Online OMR Optical Scanner",
  description:
    "Convert printed sheet music, score images, and PDFs into MIDI and MusicXML. Automatic staff detection, key recognition, and interactive playback.",
  alternates: {
    canonical: "/sheet-to-midi",
  },
  openGraph: {
    title: "Sheet Music to MIDI Converter (OMR) — Tukanft Audio",
    description:
      "Convert printed sheet music and score PDFs into playable MIDI files with AI-powered Optical Music Recognition.",
    url: "/sheet-to-midi",
  },
};

export default function SheetToMidiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
