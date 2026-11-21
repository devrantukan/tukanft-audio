import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Online MIDI Editor & Piano Roll — Draw, Quantize & Compose",
  description:
    "Interactive in-browser MIDI Piano Roll editor. Draw notes, quantize to grid, preview sounds with polyphonic synthesis, export standard MIDI (.mid), and engrave into sheet music.",
  alternates: {
    canonical: "/midi-editor",
  },
  openGraph: {
    title: "Online MIDI Editor & Piano Roll — Tukanft Audio",
    description:
      "Interactive in-browser MIDI Piano Roll. Draw notes, quantize, preview sounds, export MIDI, and engrave sheet music.",
    url: "/midi-editor",
  },
};

export default function MidiEditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
