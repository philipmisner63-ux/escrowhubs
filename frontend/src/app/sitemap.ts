import { MetadataRoute } from "next";
import { locales } from "@/i18n/config";

const BASE_URL = "https://app.escrowhubs.io";

const pages = [
  { path: "",              changeFrequency: "weekly"  as const, priority: 1.0 },
  { path: "/how-it-works", changeFrequency: "monthly" as const, priority: 0.9 },
  { path: "/security",     changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/create",       changeFrequency: "monthly" as const, priority: 0.6 },
  { path: "/learn",        changeFrequency: "monthly" as const, priority: 0.6 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const page of pages) {
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}${page.path}`,
        lastModified: now,
        changeFrequency: page.changeFrequency,
        priority: locale === "en" ? page.priority : page.priority * 0.9,
      });
    }
  }

  return entries;
}
