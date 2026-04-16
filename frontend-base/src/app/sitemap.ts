import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";

const BASE_URL = "https://base.escrowhubs.io";

/**
 * Public pages that should be indexed, with locale prefixes.
 * Excluded: /admin, /escrow/[id] (noindex), /marketplace/escrow/[escrow_id] (dynamic/private),
 *           /marketplace/dashboard (auth-gated), /claim/[address] (dynamic/private).
 */
const PUBLIC_PATHS: Array<{ path: string; changeFreq: MetadataRoute.Sitemap[0]["changeFrequency"]; priority: number }> = [
  { path: "",                        changeFreq: "weekly",  priority: 1.0 },
  { path: "/how-it-works",           changeFreq: "monthly", priority: 0.9 },
  { path: "/create",                 changeFreq: "monthly", priority: 0.8 },
  { path: "/dashboard",              changeFreq: "daily",   priority: 0.7 },
  { path: "/marketplace",            changeFreq: "weekly",  priority: 0.8 },
  { path: "/learn",                  changeFreq: "monthly", priority: 0.7 },
  { path: "/learn/onboarding",       changeFreq: "monthly", priority: 0.6 },
  { path: "/learn/how-it-works",     changeFreq: "monthly", priority: 0.6 },
  { path: "/learn/escrow-flow",      changeFreq: "monthly", priority: 0.6 },
  { path: "/learn/global-flow",      changeFreq: "monthly", priority: 0.6 },
  { path: "/learn/faq",              changeFreq: "monthly", priority: 0.7 },
  { path: "/learn/mock-escrow",      changeFreq: "monthly", priority: 0.5 },
  { path: "/learn/role-view",        changeFreq: "monthly", priority: 0.5 },
  { path: "/learn/network-sim",      changeFreq: "monthly", priority: 0.5 },
  { path: "/security",               changeFreq: "monthly", priority: 0.6 },
  { path: "/terms",                  changeFreq: "yearly",  priority: 0.4 },
  { path: "/privacy",                changeFreq: "yearly",  priority: 0.4 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const { path, changeFreq, priority } of PUBLIC_PATHS) {
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}${path}`,
        lastModified: now,
        changeFrequency: changeFreq,
        priority,
      });
    }
  }

  return entries;
}
