import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing & Plans — Free & Pro Music Notation Tools",
  description:
    "Flexible plans for musicians, arrangers, students, and educators. Free plan with essential tools, or upgrade to Pro for unlimited exports, OMR scans, and priority AI processing.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pricing & Plans — Tukanft Audio",
    description:
      "Explore free and Pro plans for Tukanft Audio. Unlimited MIDI conversion, OMR score scanning, and AI music composition.",
    url: "/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
