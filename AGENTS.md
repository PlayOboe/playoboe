# AGENTS.md

This repository is the Next.js site for Play Oboe — Jeremy's handmade oboe reed workshop, plus a browser instrument at /studio. Keep changes surgical, preserve the brand tone, and favor small, high-confidence edits over broad refactors.

## Project context

- See [agent-workspace/project-standards/architecture.md](agent-workspace/project-standards/architecture.md) for the canonical product and hosting notes.
- See [MEMORY.md](MEMORY.md) for operational constraints, host and deployment notes, and production history.
- The app is a Next.js App Router site with three routes (`/`, `/studio`, and the `/admin` editor sign-in) and static assets in [public](public).
- See [agent-workspace/project-standards/seo.md](agent-workspace/project-standards/seo.md) before any SEO, metadata or social-card change.

## Key files

- [app/page.tsx](app/page.tsx) — the one-page site: hero, reeds, workshop, order form.
- [app/studio/page.tsx](app/studio/page.tsx) and [public/studio/engine.js](public/studio/engine.js) — the browser instrument and its Web Audio engine.
- [app/layout.tsx](app/layout.tsx) — global metadata, fonts, canonical URL, and SEO tags.
- [components/ReedPlayer.tsx](components/ReedPlayer.tsx) — one-shot audio player behavior.
- [lib/site.ts](lib/site.ts) — brand, contact details, and the default copy, reed range and prices. Single source of truth for defaults.
- [lib/content-model.ts](lib/content-model.ts), [lib/content.ts](lib/content.ts), [lib/auth.ts](lib/auth.ts) and [components/PageEditor.tsx](components/PageEditor.tsx) — on-page editing of the home page's text. Once Jeremy has saved, the live copy is in the Blob store, not in the code.
- [lib/seo.ts](lib/seo.ts) — shared metadata helpers.
- [app/sitemap.ts](app/sitemap.ts) and [app/robots.ts](app/robots.ts) — sitemap and robots configuration.

## Commands

- Install dependencies: `npm install`
- Start local dev server: `npm run dev`
- Production build: `npm run build`
- Serve production build: `npm run start`
- The dev and start scripts are configured for port 3020.
- Never run the build while the dev server is running — they share .next and the build corrupts it.
- Post-deploy verification: `node agent-workspace/verify-production.mjs`

## Constraints

- English only.
- Three routes today: /, /studio and /admin. Do not add more without asking.
- Deep forest green with copper accents. The opera-house styling has been replaced.
- Do not add extra routes or major feature work without explicit approval.
- Do not deploy to production or push code unless the user asks for it.
- Favor the existing App Router, TypeScript, and Tailwind patterns already in place.

## Working style for agents

- Keep edits scoped to the current page or component unless the task requires otherwise.
- Prefer existing naming, imports, and alias usage (`@/*`) over introducing new patterns.
- Maintain accessibility: descriptive alt text, meaningful labels, and skip links.
- When changing brand, metadata, hosting, or deployment assumptions, check [MEMORY.md](MEMORY.md) and [agent-workspace/project-standards/architecture.md](agent-workspace/project-standards/architecture.md) first.
- If the task is purely content or styling, keep it minimal and aligned with the current visual design.
