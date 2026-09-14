# Play Oboe architecture

Public site for Play Oboe (`https://www.playoboe.net`) — Jeremy's handmade oboe reed
workshop, plus a browser instrument. English only. Two routes. Production is the Vercel
Hobby project on team `Mcontrol`, deployed from the public GitHub repo
`PlayOboe/playoboe`.

## Stack

- Next.js App Router, React, TypeScript, Tailwind CSS
- Original images in `public/images/`
- Reed phrase in `public/audio/oboe.mp3` (source video trimmed: last two seconds removed, no loop)

## Routes

- `/` — one-page site: hero, reed range with prices, workshop, order form.
- `/studio` — "Oboe Trance": a playable oboe synth over a generative trance backing,
  with a recorder and a looper.
- `/admin` — sign-in for Jeremy to edit the home page's text in place. `noindex`,
  disallowed in robots, not in the sitemap.

## On-page editing

Jeremy signs in at `/admin` and lands on `/` with every marked text editable in place;
Save republishes the page within seconds. There is no separate CMS by design.

- `lib/content-model.ts` — the editable copy's shape, its defaults (from `lib/site.ts`)
  and validation. Adding an editable field means adding it here and wrapping it in
  `<Editable path="...">` in `app/page.tsx`.
- `lib/content.ts` — storage. Production: a private Vercel Blob store
  (`BLOB_READ_WRITE_TOKEN`), with a dated copy of every save under `content/history/`.
  Locally without a store: `.data/content.json`. On Vercel with no store, the defaults
  render and saving returns 503.
- `lib/auth.ts` — one editor; `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` (scrypt) and
  `SESSION_SECRET` in the environment only — the repo is public. Signed, HttpOnly
  session cookie; writes also require a same-origin `Origin` header.
- `app/api/admin/{login,logout,content}` — the endpoints. A save revalidates the
  `site-content` cache tag and `/`, so the page stays static for visitors.
- `components/PageEditor.tsx` — the in-page editor bar. It loads nothing for visitors;
  it activates only when the `po_editor` hint cookie is present, and every read and
  write is still checked against the session.
- Once Jeremy has saved, the live copy lives in the store, not in the code. Changing
  wording in `lib/site.ts` then only changes the defaults.

## Layers

- `lib/site.ts` — brand, copy, contact details, reed range and prices, verification tokens. The
  single source of truth; the page, the metadata and the JSON-LD all read from it.
- `lib/seo.ts` — metadata helpers and JSON-LD builders. See
  [seo.md](seo.md) before changing anything SEO-related.
- `app/` — the routes, API routes, sitemap, robots, manifest, icons.
- `app/api/orders/route.ts` — order enquiries. Validates, then appends to a local
  `.orders/orders.jsonl`. **There is no email delivery yet**: on Vercel the filesystem
  is read-only, so in production a submission is validated and logged but not stored.
  Wire up a real destination before relying on it.
- `components/` — `ReedPlayer` (one-shot audio), `ContactForm`, `AccessibilityBar`,
  `CookieNotice`, `ScrollToTop`.
- `public/studio/engine.js` — the whole Web Audio engine for `/studio`, loaded by
  `app/studio/page.tsx` via `next/script`. Around 1,500 lines, plain DOM JavaScript,
  deliberately kept out of React. The page markup must keep every element `id` the
  engine looks up, or it throws on load.

## The studio audio engine

Originally a standalone HTML file. The arrangement runs a 32-bar cycle
(intro → build → drop → breakdown), the kick sidechains the harmonic layers, and an
accompaniment voice tracks whatever the player holds. Stopping fades the generative
buses out over 0.14s — clearing the scheduler alone is not enough, because the pad
runs for two bars and the reverb tails for another two seconds.

## Accessibility

An accessibility toolbar (right edge, vertically centred) sets `data-a11y-*`
attributes on `<html>`; the rules live in `app/globals.css`. Preferences persist in
`localStorage` and are applied by a small inline script in `app/layout.tsx` before
first paint, so a saved high-contrast or text-size choice never flashes.

## Hosting

Production points `www.playoboe.net` at the Vercel Hobby project `playoboe` under the
`Mcontrol` team. Apex redirects to www. The GitHub repo must stay **public** or Hobby
cannot deploy from the org.

## Constraints

- English only in public copy.
- Green brand palette. The opera-house styling it replaced is gone; `scene.jpg` now
  survives only as a faint hero texture.
- Audio plays once per press; replay is explicit.
- No production deploy, no git push, unless the user asks.

## Verifying

- Local: `npm run dev` → http://localhost:3020
- After deploy: `node agent-workspace/verify-production.mjs`
- Against a preview: `node agent-workspace/verify-production.mjs https://<preview>.vercel.app`
- Never run `npm run build` while the dev server is running. They share `.next`, and
  the build leaves the running dev server throwing `Cannot find module './<n>.js'` on
  every request. Recovery: stop dev, delete `.next`, start dev again.
- Visual checks can be done headlessly: Chrome is installed, and
  `chrome.exe --headless=new --screenshot=out.png --window-size=1600,900 <url>` renders
  the real page. Note that on Windows the window width is clamped around 500px, so
  phone-width screenshots come out cropped and cannot be trusted.
