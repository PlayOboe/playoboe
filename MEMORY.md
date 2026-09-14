# Memory

- Canonical public host is `www.playoboe.net`. Apex 308s to www. The typed host `palyoboe.net` does not resolve. Brand and GitHub are PlayOboe / playoboe.
- Vercel Hobby team is `Mcontrol`. The GitHub repo `PlayOboe/playoboe` must stay **public** or Hobby cannot deploy from the org.
- Local preview: `npm run dev` → http://localhost:3020
- The reed image (`public/images/reed.png`) is Jeremy's own photograph of a reed, cut out of its paper background and cast shadow by `_work/cut-reed-photo.mjs` (source `_work/img/reed.jpeg`; `_work/` is gitignored). The favicons were generated from the earlier painted reed and have not been regenerated. Source video audio is trimmed to 16.346s (last 2s removed).
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

## On-page editor

- Jeremy edits the home page's text in place after signing in at `/admin` — a deliberate choice over a separate CMS. Username `randaj2016@gmail.com`. The password is stored only as a scrypt hash in `.env.local` and must go to Vercel the same way — never into the repo, which is public.
- Local development saves to `.data/content.json` (gitignored). Delete that folder to go back to the defaults in `lib/site.ts`.
- Once live, the page copy lives in the Blob store. A wording change made in `lib/site.ts` after Jeremy has saved will not show — edit it from the page instead.
- Browser test of the whole flow: `_work/editor-test.mjs` (Chrome on `--remote-debugging-port=9223`, `PW` env var set to the password).

## Still open

- **The editor is not live yet.** Production needs: a private Blob store connected to the Vercel project (`vercel blob create-store playoboe-content --access private --yes`, which adds `BLOB_READ_WRITE_TOKEN`), and `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET` added to the project's Production environment from `.env.local`. Then test save against the store before deploying. Without the store the site renders the defaults and Save returns 503.

- Google and Bing verification tokens are blank in `lib/site.ts`. Paste them there after opening Search Console; the process is written up in `agent-workspace/project-standards/seo.md`.
- Reed prices were set by Jeremy on 2026-09-14: Student $20, Orchestral $30, Solo $40 per reed; a bundle of 5 takes $5 off every reed; shipping not included. The currency is assumed to be US dollars — confirm with Jeremy. Prices live in `REEDS` and `PRICING` in `lib/site.ts`.
