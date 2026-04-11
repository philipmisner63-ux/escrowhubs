import { MetadataRoute } from "next";

const BASE_URL = "https://base.escrowhubs.io";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL,                lastModified: new Date(), changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE_URL}/dashboard`, lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE_URL}/create`,    lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/security`,  lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ];
}
