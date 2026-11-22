import { MetadataRoute } from "next";
import { createLocalizedAlternates, SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes = [
    { path: "", priority: 1.0, changeFrequency: "daily" as const },
    { path: "/midi-to-sheet", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/virtual-piano", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/ai-midi", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/sheet-to-midi", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/mp3-to-midi", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/midi-editor", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/scanner", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/pricing", priority: 0.7, changeFrequency: "monthly" as const },
  ];

  return routes.map((r) => {
    const fullUrl = r.path ? `${SITE_URL}${r.path}` : SITE_URL;
    const { languages } = createLocalizedAlternates(r.path);

    return {
      url: fullUrl,
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
      alternates: {
        languages,
      },
    };
  });
}
