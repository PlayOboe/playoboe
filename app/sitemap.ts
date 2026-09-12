import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE.url,
      lastModified: new Date("2026-09-12"),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
