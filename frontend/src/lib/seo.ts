export const SITE_URL = "https://audio.tukanft.com";

export const SUPPORTED_LOCALES = ["en", "tr", "fr", "es", "de", "it"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const OG_LOCALES: Record<SupportedLocale, string> = {
  en: "en_US",
  tr: "tr_TR",
  fr: "fr_FR",
  es: "es_ES",
  de: "de_DE",
  it: "it_IT",
};

/**
 * Creates standardized multi-locale hreflang alternates for any route path.
 * Compatible with Next.js Metadata `alternates` and Sitemap `alternates`.
 */
export function createLocalizedAlternates(path: string = "") {
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  const languages: Record<string, string> = {
    "x-default": `${SITE_URL}${cleanPath}`,
  };

  for (const lang of SUPPORTED_LOCALES) {
    languages[lang] = `${SITE_URL}${cleanPath}?lang=${lang}`;
  }

  return {
    canonical: `${SITE_URL}${cleanPath}`,
    languages,
  };
}
