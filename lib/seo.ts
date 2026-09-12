import type { Metadata } from "next";
import { SITE } from "./site";

export function absoluteUrl(path = "/") {
  if (path.startsWith("http")) return path;
  return new URL(path, SITE.url).toString();
}

export function pageMetadata({
  title,
  description,
  path,
  ogImage = "/images/og.jpg",
}: {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
}): Metadata {
  const url = absoluteUrl(path);
  const branded = title.includes(SITE.name) ? title : `${title} | ${SITE.name}`;

  return {
    title: { absolute: branded },
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      url,
      siteName: SITE.name,
      title: branded,
      description,
      locale: SITE.locale,
      images: [{ url: absoluteUrl(ogImage), width: 1200, height: 630, alt: branded }],
    },
    twitter: {
      card: "summary_large_image",
      title: branded,
      description,
      images: [absoluteUrl(ogImage)],
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    image: absoluteUrl("/images/og.jpg"),
    description: SITE.description,
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    inLanguage: "en",
  };
}
