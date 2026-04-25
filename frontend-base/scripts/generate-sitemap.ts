import { mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";

const BASE_URL = "https://base.escrowhubs.io";
const APP_DIR = join(process.cwd(), "src", "app");
const OUTPUT_FILE = join(process.cwd(), "public", "sitemap.xml");
const PAGE_FILE_PATTERN = /^page\.(tsx|ts|jsx|js|mdx)$/;
const LOCALES = [
  "en",
  "ar",
  "es",
  "zh",
  "ru",
  "pt-BR",
  "tr",
  "hi",
  "fr",
  "de",
  "ko",
  "ja",
] as const;

type SitemapEntry = {
  path: string;
  alternates: Array<{
    locale: string;
    url: string;
  }>;
};

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      return walk(fullPath);
    }

    return PAGE_FILE_PATTERN.test(entry) ? [fullPath] : [];
  });
}

function pageFileToRoute(filePath: string): string | null {
  const routeSegments = dirname(relative(APP_DIR, filePath))
    .split(sep)
    .filter((segment) => segment && !isRouteGroup(segment));

  if (routeSegments.some((segment) => isDynamicSegment(segment) && segment !== "[locale]")) {
    return null;
  }

  const resolvedSegments = routeSegments.map((segment) => (segment === "[locale]" ? ":locale" : segment));
  return `/${resolvedSegments.join("/")}`.replace(/\/$/, "") || "/";
}

function isRouteGroup(segment: string): boolean {
  return segment.startsWith("(") && segment.endsWith(")");
}

function isDynamicSegment(segment: string): boolean {
  return segment.startsWith("[") && segment.endsWith("]");
}

function buildSitemapEntries(routes: string[]): SitemapEntry[] {
  return routes
    .filter((route) => route.includes(":locale"))
    .flatMap((route) => {
      const alternates = LOCALES.map((locale) => {
        const path = route.replace(":locale", locale);
        return {
          locale,
          url: `${BASE_URL}${path}`,
        };
      });

      return alternates.map(({ locale, url }) => ({
        path: route.replace(":locale", locale),
        alternates,
      }));
    })
    .sort((a, b) => a.path.localeCompare(b.path));
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function renderSitemap(entries: SitemapEntry[]): string {
  const urls = entries
    .map((entry) => {
      const alternates = entry.alternates
        .map(
          (alternate) =>
            `    <xhtml:link rel="alternate" hreflang="${escapeXml(alternate.locale)}" href="${escapeXml(
              alternate.url,
            )}" />`,
        )
        .join("\n");

      return `  <url>
    <loc>${escapeXml(`${BASE_URL}${entry.path}`)}</loc>
${alternates}
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
}

const routes = Array.from(new Set(walk(APP_DIR).map(pageFileToRoute).filter((route): route is string => route !== null)));
const entries = buildSitemapEntries(routes);

mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
writeFileSync(OUTPUT_FILE, renderSitemap(entries), "utf8");

console.log(`Generated ${entries.length} URLs in ${relative(process.cwd(), OUTPUT_FILE)}`);
