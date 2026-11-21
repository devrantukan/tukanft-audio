import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "88-Key Online Virtual Piano — Realistic Sound & MIDI Support",
  description:
    "Play the full 88-key grand piano in your browser. Supports computer keyboard shortcuts, USB/Bluetooth MIDI keyboard input, polyphonic synthesis, and sheet music visualization.",
  alternates: {
    canonical: "/virtual-piano",
  },
  openGraph: {
    title: "88-Key Online Virtual Piano — Tukanft Audio",
    description:
      "Play the full 88-key grand piano in your browser with real-time acoustic synthesis, MIDI keyboard input, and interactive sheet music.",
    url: "/virtual-piano",
  },
};

export default function VirtualPianoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
