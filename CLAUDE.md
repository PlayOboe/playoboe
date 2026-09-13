# Claude instructions

Use [AGENTS.md](AGENTS.md) as the project source of truth for the repo.

This project is the Play Oboe marketing site — Jeremy's handmade oboe reed workshop —
built with Next.js App Router, TypeScript and Tailwind, plus a browser instrument at
`/studio`. Keep work narrow, English-only, and aligned with the current brand and
hosting constraints.

Before making a change, check:

- [agent-workspace/project-standards/architecture.md](agent-workspace/project-standards/architecture.md)
- [agent-workspace/project-standards/seo.md](agent-workspace/project-standards/seo.md) — before any SEO, metadata or social-card change
- [MEMORY.md](MEMORY.md)
- [app/page.tsx](app/page.tsx)
- [lib/site.ts](lib/site.ts) — brand, copy and contact details all come from here

Follow these repo rules:

- Do not broaden the scope beyond the existing two routes unless requested.
- Respect the canonical URL and site metadata in [lib/site.ts](lib/site.ts). Do not
  hard-code brand copy into components; it belongs in that file.
- Keep the public-facing copy in English. The palette is deep forest green with copper
  accents — the earlier opera-house styling has been replaced.
- Do not deploy or push to production without explicit approval.
- Never run `npm run build` while the dev server is running: they share `.next` and the
  build corrupts it underneath the running server.
- Verify visual changes by actually rendering the page before reporting them done.
  Chrome is installed and can screenshot headlessly.
