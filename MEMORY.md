# Memory

- Canonical public host is `www.playoboe.net`. Apex 308s to www. The typed host `palyoboe.net` does not resolve. Brand and GitHub are PlayOboe / playoboe.
- Vercel Hobby team is `Mcontrol`. The GitHub repo `PlayOboe/playoboe` must stay **public** or Hobby cannot deploy from the org.
- Local preview: `npm run dev` → http://localhost:3020
- Reed photograph was painted into the opera-house scene so the cane isolates cleanly against the cream bokeh. Source video audio is trimmed to 16.346s (last 2s removed).
- Production verify: `node agent-workspace/verify-production.mjs`
- Never run `npm run build` while the dev server is running — they share `.next` and the build corrupts it under the running server (`Cannot find module './<n>.js'`). Recovery: stop dev, delete `.next`, restart.
- Apex DNS is split: some resolvers still return GoDaddy Website Builder IPs. `curl` to the Vercel A record 308s to www. Point the GoDaddy A record for `playoboe.net` at `216.198.79.1` only.

## Deploy history

- First production ship rollback SHA: `1b04070`.
- Coming-soon era final SHA: `038db0d`, then `400ad95`.
- **Current production SHA: `6793d21`** — the reed-workshop site in green. Roll back to `400ad95` to return to the opera-house coming-soon page.
- Pre-deploy snapshots in `backups/pre-deploy.20260912-1825/` and `backups/pre-deploy.20260914-0200/`.

## Order form

- The order form posts to `/api/orders`, which sends the enquiry by email through **Resend**.
- Production environment variables live in the Vercel project as secrets: `RESEND_API_KEY` and `ORDERS_TO_EMAIL`. They are also in the local, gitignored `.env.local`. **Never commit them** — the repo is public.
- **Orders currently go to `gavriel.kr@gmail.com`, not to the address shown on the site.** Resend will only send to the account owner until a domain is verified at resend.com/domains. Once `playoboe.net` is verified, set `ORDERS_FROM_EMAIL` to an address on that domain and change `ORDERS_TO_EMAIL` to `randaj2016@gmail.com`.
- The email shown publicly on the site is `randaj2016@gmail.com` (in `lib/site.ts`). There is no phone number on the site.

## Still open

- Google and Bing verification tokens are blank in `lib/site.ts`. Paste them there after opening Search Console; the process is written up in `agent-workspace/project-standards/seo.md`.
- Reed prices are not published. The reeds are deliberately marked up without an `offers` object — see the SEO standards before adding one.
