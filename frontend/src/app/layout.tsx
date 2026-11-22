import type { Metadata } from "next";
import Script from "next/script";
import Providers from "@/components/Providers";
import { createLocalizedAlternates, SITE_URL } from "@/lib/seo";
import "./globals.css";

const siteUrl = SITE_URL;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Tukanft Audio — AI Audio & Music Notation Suite",
    template: "%s | Tukanft Audio",
  },
  description:
    "Free AI music studio: convert MIDI to sheet music, scan physical scores with camera OMR, compose with AI MIDI prompt generation, play the 88-key virtual piano, and edit MIDI in-browser.",
  applicationName: "Tukanft Audio",
  authors: [{ name: "Tukanft Audio Team", url: siteUrl }],
  generator: "Next.js",
  keywords: [
    "midi to sheet music",
    "convert midi to sheet music",
    "midi to notes",
    "sheet music to midi",
    "omr scanner",
    "optical music recognition",
    "virtual piano",
    "online piano roll",
    "midi editor",
    "ai midi generator",
    "mp3 to midi",
    "musicxml converter",
    "opensheetmusicdisplay",
    "music transcription",
  ],
  referrer: "origin-when-cross-origin",
  creator: "Tukanft Audio",
  publisher: "Tukanft Audio",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: createLocalizedAlternates(""),
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/tukan-logo.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["tr_TR", "fr_FR", "es_ES", "de_DE", "it_IT"],
    url: siteUrl,
    siteName: "Tukanft Audio",
    title: "Tukanft Audio — AI Audio & Music Notation Suite",
    description:
      "Transform MIDI into engraved sheet music, scan physical scores with your camera, play the 88-key virtual piano, and transcribe polyphonic audio in one unified studio.",
    images: [
      {
        url: "/tukan-logo.png",
        width: 1200,
        height: 630,
        alt: "Tukanft Audio — Professional AI Music Notation & MIDI Suite",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tukanft Audio — AI Audio & Music Notation Suite",
    description:
      "Transform MIDI into engraved sheet music, scan physical scores with your camera, play the 88-key virtual piano, and transcribe polyphonic audio.",
    images: ["/tukan-logo.png"],
    creator: "@tukanft",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const gaMeasurementId =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
  process.env.GA_MEASUREMENT_ID ||
  "G-B10HC9ZY5C";

const gtmId =
  process.env.NEXT_PUBLIC_GTM_ID ||
  process.env.GTM_ID ||
  "GTM-TNZ58P9W";

// Schema.org WebApplication JSON-LD
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${siteUrl}/#webapp`,
      name: "Tukanft Audio",
      url: siteUrl,
      description:
        "AI-powered audio and music notation suite: transform MIDI files into engraved sheet music, scan scores with camera OMR, play virtual piano, and transcribe polyphonic audio.",
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Web, macOS, Windows, Linux, iOS, Android",
      inLanguage: ["en", "tr", "fr", "es", "de", "it"],
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        category: "Free / Pro Subscription",
      },
      featureList: [
        "MIDI to Sheet Music Converter with MusicXML & SVG Vector Engraving",
        "88-Key Interactive Virtual Piano with Realistic Polyphonic Synthesis",
        "Optical Music Recognition (OMR) Sheet Music Scanner",
        "AI MIDI Musical Prompt Generation Engine",
        "Multi-Track Piano Roll MIDI Editor",
        "Audio MP3 to MIDI Polyphonic Transcription",
      ],
      screenshot: `${siteUrl}/tukan-logo.png`,
    },
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Tukanft Audio",
      url: siteUrl,
      logo: `${siteUrl}/tukan-logo.png`,
      sameAs: [
        "https://twitter.com/tukanft",
        "https://github.com/devrantukan/tukanft-audio",
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Google Analytics 4 (gtag.js) */}
        {gaMeasurementId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics-gtag" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaMeasurementId}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}

        {/* Google Tag Manager (GTM) */}
        {gtmId && (
          <Script id="google-tag-manager" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${gtmId}');
            `}
          </Script>
        )}
      </head>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-rose-500 selection:text-white">
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
