import type { Metadata } from "next";
import { createLocalizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Sheet Music Scanner — Camera & Mobile Optical Music Recognition",
  description:
    "Scan printed sheet music using your phone camera or webcam. Real-time alignment guides, instant OMR transcription, and immediate playback.",
  alternates: createLocalizedAlternates("/scanner"),
  openGraph: {
    title: "Sheet Music Camera Scanner — Tukanft Audio",
    description:
      "Scan physical sheet music with your phone camera or webcam and hear it played back instantly.",
    url: "/scanner",
    locale: "en_US",
    alternateLocale: ["tr_TR", "fr_FR", "es_ES", "de_DE", "it_IT"],
  },
};

export default function ScannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
