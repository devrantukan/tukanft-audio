import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tukanft Audio — Professional MIDI to Sheet Music Converter",
  description:
    "AI-powered MIDI to Sheet Music studio with real-time playback, intelligent quantization, and multi-format export (MusicXML, MIDI, PDF).",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-rose-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
