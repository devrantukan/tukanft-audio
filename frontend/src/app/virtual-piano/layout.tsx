import type { Metadata } from "next";
import { createLocalizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "88-Key Online Virtual Piano — Realistic Sound & MIDI Support",
  description:
    "Play the full 88-key grand piano in your browser. Supports computer keyboard shortcuts, USB/Bluetooth MIDI keyboard input, polyphonic synthesis, and sheet music visualization.",
  alternates: createLocalizedAlternates("/virtual-piano"),
  openGraph: {
    title: "88-Key Online Virtual Piano — Tukanft Audio",
    description:
      "Play the full 88-key grand piano in your browser with real-time acoustic synthesis, MIDI keyboard input, and interactive sheet music.",
    url: "/virtual-piano",
    locale: "en_US",
    alternateLocale: ["tr_TR", "fr_FR", "es_ES", "de_DE", "it_IT"],
  },
};

export default function VirtualPianoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
