# Play Oboe architecture

Public coming-soon site for Play Oboe (`https://www.playoboe.net`).
English only. One route. Production is the Vercel Hobby project on team `Mcontrol`, deployed from the public GitHub repo `PlayOboe/playoboe`.

## Stack

- Next.js App Router, React, TypeScript, Tailwind CSS
- Original images in `public/images/`
- Reed phrase in `public/audio/oboe.mp3` (source video trimmed: last two seconds removed, no loop)

## Layers

- `lib/site.ts` — canonical URL and brand constants
- `lib/seo.ts` — metadata helpers and JSON-LD
- `app/` — single page, sitemap, robots, icons
- `components/ReedPlayer.tsx` — one-shot audio control with replay

## Hosting

Production points `www.playoboe.net` at the Vercel Hobby project `playoboe` under the `Mcontrol` team. Apex redirects to www. The GitHub repo must stay **public** or Hobby cannot deploy from the org.

## Constraints

- English only
- Single public page until the full house is built
- Audio plays once per press; replay is explicit
- No production deploy, no git push, unless the user asks
