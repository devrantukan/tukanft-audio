import type { Metadata } from "next";
import { createLocalizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Pricing & Plans — Free & Pro Music Notation Tools",
  description:
    "Flexible plans for musicians, arrangers, students, and educators. Free plan with essential tools, or upgrade to Pro for unlimited exports, OMR scans, and priority AI processing.",
  alternates: createLocalizedAlternates("/pricing"),
  openGraph: {
    title: "Pricing & Plans — Tukanft Audio",
    description:
      "Explore free and Pro plans for Tukanft Audio. Unlimited MIDI conversion, OMR score scanning, and AI music composition.",
    url: "/pricing",
    locale: "en_US",
    alternateLocale: ["tr_TR", "fr_FR", "es_ES", "de_DE", "it_IT"],
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
