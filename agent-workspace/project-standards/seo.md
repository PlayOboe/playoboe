# SEO standards for Play Oboe

Read this before making any SEO, metadata, structured-data or social-preview change.
It records where each thing lives, what may be edited freely, and which changes have
consequences that are not obvious from the code.

## The one rule that matters

Almost everything is driven from [lib/site.ts](../../lib/site.ts). Change the brand
name, description, keywords, contact details or reed range there, and the page copy,
the meta tags, the JSON-LD and the social card all follow. Do not hard-code any of it
into a component: two copies will drift, and a description that disagrees with the
page is worse than no description.

The home page's visible text, reed range and prices are also editable from the page
itself (see the on-page editing section of [architecture.md](architecture.md)). The
JSON-LD reads that same saved copy, so an edited price or email is what gets marked
up; `lib/site.ts` holds the defaults. The meta description and keywords are not
editable from the page.

## Where each piece lives

| Concern | File |
| --- | --- |
| Brand, descriptions, keywords, founder, verification tokens | `lib/site.ts` |
| Contact details used in copy and structured data | `lib/site.ts` (`CONTACT`) |
| Reed range, shared by the page and the Product schema | `lib/site.ts` (`REEDS`) |
| Social card dimensions and alt text | `lib/site.ts` (`OG_IMAGE`) |
| Per-page title, description, canonical, robots, Open Graph, Twitter | `lib/seo.ts` (`pageMetadata`) |
| Organization / WebSite / Product / Breadcrumb JSON-LD | `lib/seo.ts` |
| Site-wide defaults, title template, verification | `app/layout.tsx` |
| Crawl rules | `app/robots.ts` |
| URL list for crawlers | `app/sitemap.ts` |
| Install metadata | `app/manifest.ts` |
| Icons | `app/favicon.ico`, `app/icon.png`, `app/apple-icon.png` |
| Social card image | `public/images/og.jpg` |

## Adding a page

1. Export `metadata` from the page using `pageMetadata({ title, description, path })`.
   Never reuse another page's description — duplicated descriptions are a common
   reason a page gets crawled but not shown in results.
2. Add the URL to `app/sitemap.ts` with a realistic `lastModified`.
3. If the page sits below the home page, add a `breadcrumbJsonLd` block to it, the way
   [app/studio/page.tsx](../../app/studio/page.tsx) does.
4. Give the page exactly one `<h1>`, and use `<h2>` for each section below it.

## Writing titles and descriptions

- Title: aim for 50-60 characters including the brand suffix. The `%s | Play Oboe`
  template in `app/layout.tsx` appends the brand automatically for pages that do not
  already contain it.
- Description: 140-160 characters. Lead with what is actually offered. It is not a
  ranking factor, but it decides whether someone clicks.
- Write for the person reading the search result, not for the crawler. Keyword
  stuffing is actively harmful now.

## Structured data

The home page emits `Organization`, `WebSite` and an `ItemList` of the reeds. The
studio page emits a `BreadcrumbList`.

Each reed carries one `Offer` at its per-reed price, built in `reedsJsonLd()` in
`lib/seo.ts` from the page's current copy — the same values the cards show, so the
markup and the page cannot disagree. The bundle price is deliberately left out: a
search result should never advertise a price a single reed cannot be bought for.

Likewise, do not add `AggregateRating`, `Review` or `FAQPage` markup until there is
real content on the page to back it. Markup describing content a visitor cannot see is
a violation, not a shortcut.

After any structured-data change, validate at
`https://search.google.com/test/rich-results` against the deployed URL.

## Search Console and Bing

1. Get the verification token from the console.
2. Paste it into `SITE.verification.google` (or `.bing`) in `lib/site.ts`. Blank values
   are omitted, so no empty tags are emitted while they are unset.
3. Deploy, then verify.
4. Submit `https://www.playoboe.net/sitemap.xml`.

Use the `www` host everywhere. The apex redirects to it, and mixing the two splits
signals between what search engines treat as two different sites.

## The social card

`public/images/og.jpg` is what appears in WhatsApp, Slack, iMessage, LinkedIn, X and
Facebook. It must stay 1200x630. Regenerate it with
[_work/make-brand-images.mjs](../../_work/make-brand-images.mjs), which composes it
from `public/images/reed.png` over the brand gradient using `sharp`.

Two things to know:

- Some platforms cache the card for a long time. After replacing the image, re-scrape
  it through Facebook's Sharing Debugger and LinkedIn's Post Inspector, or the old one
  will keep appearing for weeks.
- Keep any text well inside the frame. WhatsApp and several chat clients crop the card
  to a square or a narrow strip, and text near the edge is the first thing lost.

## Icons

`app/favicon.ico` carries 16, 32 and 48 pixel versions so browsers pick a size rather
than badly downscaling one large image. All three are the reed photograph on a
transparent background, rotated to run corner to corner — at its natural angle the
reed is a tall sliver that all but disappears at tab size.

`app/apple-icon.png` is deliberately **not** transparent: iOS composites touch icons
onto black, so a transparent reed would sit on a black tile. It gets the brand green
behind it instead. Regenerate the set with
[_work/build-icons.mjs](../../_work/build-icons.mjs).

## Things not to do

- Do not add a `SearchAction` to the `WebSite` schema. There is no site search, and
  markup for a feature that does not exist is invalid.
- Do not set `robots: noindex` on the home page, even temporarily. Recovery is slow.
- Do not add a second `<h1>` to a page.
- Do not let `/api/` or `/admin` become crawlable. Both are disallowed in `app/robots.ts`,
  and `/admin` is also `noindex`.
- Do not change the canonical host away from `https://www.playoboe.net` without also
  changing the DNS and the Vercel domain configuration. See
  [MEMORY.md](../../MEMORY.md) for the apex and DNS history.
