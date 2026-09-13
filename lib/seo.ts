import type { Metadata } from "next";
import { CONTACT, OG_IMAGE, REEDS, SITE } from "./site";

export function absoluteUrl(path = "/") {
  if (path.startsWith("http")) return path;
  return new URL(path, SITE.url).toString();
}

/**
 * Per-page metadata. Every page gets its own title, description and canonical URL —
 * duplicate descriptions across pages are one of the most common reasons a page is
 * crawled but not shown.
 */
export function pageMetadata({
  title,
  description,
  path,
  ogImage = OG_IMAGE.path,
  index = true,
}: {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  index?: boolean;
}): Metadata {
  const url = absoluteUrl(path);
  const branded = title.includes(SITE.name) ? title : `${title} | ${SITE.name}`;

  return {
    title: { absolute: branded },
    description,
    alternates: { canonical: url },
    robots: index
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            // Lets Google use the full-size image and an untruncated snippet, which
            // is what makes the result render as a rich card rather than a bare link.
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        }
      : { index: false, follow: true },
    openGraph: {
      type: "website",
      url,
      siteName: SITE.name,
      title: branded,
      description,
      locale: SITE.locale,
      images: [
        {
          url: absoluteUrl(ogImage),
          width: OG_IMAGE.width,
          height: OG_IMAGE.height,
          alt: OG_IMAGE.alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: branded,
      description,
      images: [absoluteUrl(ogImage)],
    },
  };
}

/** Verification tokens, omitted entirely while blank so no empty tags are emitted. */
export function verificationMetadata(): Metadata["verification"] {
  const { google, bing } = SITE.verification;
  const verification: Metadata["verification"] = {};
  if (google) verification.google = google;
  if (bing) verification.other = { "msvalidate.01": bing };
  return Object.keys(verification).length > 0 ? verification : undefined;
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE.url}/#organization`,
    name: SITE.name,
    legalName: SITE.legalName,
    url: SITE.url,
    logo: absoluteUrl("/icon.png"),
    image: absoluteUrl(OG_IMAGE.path),
    description: SITE.description,
    founder: { "@type": "Person", name: SITE.founder },
    ...(SITE.sameAs.length > 0 ? { sameAs: SITE.sameAs } : {}),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      email: CONTACT.email,
      areaServed: CONTACT.areaServed,
      availableLanguage: ["English"],
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE.url}/#website`,
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    inLanguage: SITE.language,
    publisher: { "@id": `${SITE.url}/#organization` },
  };
}

/**
 * The reed range. Modelled as an ItemList of Products with no Offer attached:
 * a price is required for a valid Offer, and publishing a fabricated one to win a
 * rich result is exactly the kind of thing that earns a structured-data penalty.
 * Add `offers` to each product here once real prices exist.
 */
export function reedsJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${SITE.name} reeds`,
    itemListElement: REEDS.map((reed, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: `${reed.name} oboe reed`,
        description: reed.blurb,
        category: "Oboe reeds",
        brand: { "@id": `${SITE.url}/#organization` },
        image: absoluteUrl(OG_IMAGE.path),
      },
    })),
  };
}

export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

/** Renders one or more JSON-LD blocks into a single script tag. */
export function jsonLdScript(blocks: object[]) {
  return {
    type: "application/ld+json",
    dangerouslySetInnerHTML: { __html: JSON.stringify(blocks) },
  } as const;
}
