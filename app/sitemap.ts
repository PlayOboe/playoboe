import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE.url,
      lastModified: new Date("2026-09-14"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE.url}/studio`,
      lastModified: new Date("2026-09-14"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
