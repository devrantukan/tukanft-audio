import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sheet Music Scanner — Camera & Mobile Optical Music Recognition",
  description:
    "Scan printed sheet music using your phone camera or webcam. Real-time alignment guides, instant OMR transcription, and immediate playback.",
  alternates: {
    canonical: "/scanner",
  },
  openGraph: {
    title: "Sheet Music Camera Scanner — Tukanft Audio",
    description:
      "Scan physical sheet music with your phone camera or webcam and hear it played back instantly.",
    url: "/scanner",
  },
};

export default function ScannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
