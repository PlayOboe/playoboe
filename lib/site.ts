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

// Every price and its wording is plain editable text on the page — nothing is worked out
// from anything else, so a changed price does not change its bundle price. The Product
// structured data uses the single-reed `price`.
export const PRICING = {
  currency: "USD",
  note: "Order a bundle of 5 and every reed in it is $5 less. Prices are in US dollars. Shipping is not included.",
} as const;

export const REEDS = [
  {
    name: "Student",
    detail: "Medium-soft · quick response",
    blurb:
      "An easy-blowing reed with a forgiving crow. Built for players still finding a steady embouchure, and for long rehearsal days.",
    price: 20,
    priceLabel: "per reed",
    bundlePrice: 15,
    bundleLabel: "each in a bundle of 5",
  },
  {
    name: "Orchestral",
    detail: "Medium · balanced scrape",
    blurb:
      "The workhorse. Enough resistance to carry a hall, enough flexibility to shape a phrase down to nothing.",
    price: 30,
    priceLabel: "per reed",
    bundlePrice: 25,
    bundleLabel: "each in a bundle of 5",
  },
  {
    name: "Solo",
    detail: "Medium-hard · wide dynamic range",
    blurb:
      "Scraped for colour and projection, with a darker low register. Made one at a time for recital and concerto work.",
    price: 40,
    priceLabel: "per reed",
    bundlePrice: 35,
    bundleLabel: "each in a bundle of 5",
  },
] as const;

// The words on the home page, section by section. These are the defaults: once Jeremy
// saves an edit from the page itself, the saved copy is what renders — see
// lib/content.ts. Line breaks in `hero.title` are kept.
export const PAGE_COPY = {
  hero: {
    eyebrow: "Handmade in the workshop",
    title: "Oboe reeds,\nscraped one\nat a time.",
    intro:
      "Built by hand, with patience and love, for players who need an instrument that answers on the first breath. Every blank is tied, scraped and tested before it leaves the bench.",
  },
  reeds: {
    eyebrow: "The bench",
    title: "Reeds",
    intro:
      "The reed is where the oboe’s voice actually starts. Cane is a natural material — no two pieces share a density or a grain — and a scrape a few hundredths of a millimetre out is the difference between a reed that sings and one that will not speak at all. Learning to read a blank takes years at the bench.",
  },
  workshop: {
    eyebrow: "Who makes them",
    title: "The workshop",
    story:
      "Jeremy has spent years at the gouging machine and the knife, learning what a cane blank will and will not give. Reeds are made in small batches, played in before they are sent, and any reed that does not speak cleanly never makes it into the post.",
    feedback:
      "If a reed arrives wrong for you, say so. Feedback goes straight back into the next scrape.",
    studioTitle: "The Studio",
    studioText:
      "A playable oboe built entirely in the browser, over a generative trance backing that arranges itself as you play — with a recorder, a looper and a live accompaniment that follows your line.",
    studioNote: "Works best with headphones. Nothing is uploaded — it all runs on your device.",
  },
  contact: {
    eyebrow: "Orders and enquiries",
    title: "Get in touch",
  },
  footer: {
    tagline: "Play Oboe — handmade oboe reeds",
  },
} as const;

export const OG_IMAGE = {
  path: "/images/og.jpg",
  width: 1200,
  height: 630,
  alt: "Play Oboe — handmade oboe reeds, scraped one at a time, by hand",
} as const;
