/**
 * Single source of truth for everything a search engine, a social preview or the
 * page copy needs to know about the business. Edit here rather than in components:
 * the metadata, the JSON-LD and the rendered page all read from this file.
 *
 * See agent-workspace/project-standards/seo.md before changing anything in here.
 */

export const SITE = {
  name: "Play Oboe",
  legalName: "Play Oboe",
  url: "https://www.playoboe.net",
  locale: "en_US",
  language: "en",

  // Shown after the brand name in the browser tab and in search results.
  tagline: "Handmade Oboe Reeds",

  // The default meta description. Aim for 140-160 characters: longer gets truncated
  // in Google, shorter wastes the space. Lead with what is sold, not with adjectives.
  description:
    "Handmade oboe reeds, scraped one at a time by Jeremy and tested before they leave the bench. Order student, orchestral or solo reeds direct from the workshop.",

  // A short line for social cards, where there is less room than in search results.
  socialDescription:
    "Handmade oboe reeds, scraped one at a time and tested before they leave the bench.",

  themeColor: "#0c1f17",

  // Topical signals. Modern Google ignores the keywords meta tag, so these are used
  // for the internal keyword list and nothing that can be penalised.
  keywords: [
    "oboe reeds",
    "handmade oboe reeds",
    "oboe reed maker",
    "custom oboe reeds",
    "student oboe reeds",
    "orchestral oboe reeds",
    "American scrape oboe reed",
    "European scrape oboe reed",
    "oboe",
  ],

  founder: "Jeremy",

  // Public profiles, used for the sameAs field in structured data. Add the real
  // URLs as they exist — an empty list is omitted rather than published empty.
  sameAs: [] as string[],

  // Paste the verification tokens from each console here. Blank values are omitted.
  verification: {
    google: "",
    bing: "",
  },
} as const;

export const CONTACT = {
  email: "randaj2016@gmail.com",
  hours: "Workshop replies within two working days",
  // Used for structured data. Leave country as an ISO code once it is known.
  areaServed: "Worldwide",
  countryCode: "",
} as const;

export const REEDS = [
  {
    name: "Student",
    detail: "Medium-soft · quick response",
    blurb:
      "An easy-blowing reed with a forgiving crow. Built for players still finding a steady embouchure, and for long rehearsal days.",
  },
  {
    name: "Orchestral",
    detail: "Medium · balanced scrape",
    blurb:
      "The workhorse. Enough resistance to carry a hall, enough flexibility to shape a phrase down to nothing.",
  },
  {
    name: "Solo",
    detail: "Medium-hard · wide dynamic range",
    blurb:
      "Scraped for colour and projection, with a darker low register. Made one at a time for recital and concerto work.",
  },
] as const;

export const OG_IMAGE = {
  path: "/images/og.jpg",
  width: 1200,
  height: 630,
  alt: "Play Oboe — handmade oboe reeds, scraped one at a time, by hand",
} as const;
