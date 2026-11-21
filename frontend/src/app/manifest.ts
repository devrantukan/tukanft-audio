import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tukanft Audio — AI Audio & Music Notation Suite",
    short_name: "Tukanft Audio",
    description:
      "Transform MIDI to sheet music, scan scores with camera OMR, play the 88-key virtual piano, and edit MIDI sequences online.",
    start_url: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#020617",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/tukan-logo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/tukan-logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
