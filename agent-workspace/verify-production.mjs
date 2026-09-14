/**
 * Production verification for playoboe.net
 * Run after deploy: node agent-workspace/verify-production.mjs
 * Against a preview URL: node agent-workspace/verify-production.mjs https://<preview>.vercel.app
 *
 * The apex-redirect check only applies to the production host and is skipped for
 * any other base URL.
 */
const BASE = (process.argv[2] || "https://www.playoboe.net").replace(/\/$/, "");
const IS_PRODUCTION = BASE === "https://www.playoboe.net";

const routes = [
  {
    path: "/",
    expect: 200,
    contains: [
      "Play Oboe",
      "Handmade in the workshop",
      "Hear the reed",
      "/audio/oboe.mp3",
      "Order form",
      "per reed",
    ],
  },
  {
    path: "/studio",
    expect: 200,
    contains: ["OBOE TRANCE", "/studio/engine.js", "Accompany", "Back to Play Oboe"],
  },
  { path: "/studio/engine.js", expect: 200 },
  { path: "/admin", expect: 200, contains: ["Edit the site", 'content="noindex'] },
  // the editor's copy is never readable without signing in
  { path: "/api/admin/content", expect: 401 },
  { path: "/sitemap.xml", expect: 200, contains: ["https://www.playoboe.net", "/studio"] },
  { path: "/robots.txt", expect: 200, contains: ["Sitemap:", "Disallow: /api/", "Disallow: /admin"] },
  { path: "/manifest.webmanifest", expect: 200, contains: ["Play Oboe"] },
  { path: "/images/scene.jpg", expect: 200 },
  { path: "/images/reed.png", expect: 200 },
  { path: "/images/jeremy-photo.webp", expect: 200 },
  { path: "/images/og.jpg", expect: 200 },
  { path: "/audio/oboe.mp3", expect: 200 },
  { path: "/favicon.ico", expect: 200 },
  { path: "/icon.png", expect: 200 },
  { path: "/apple-icon.png", expect: 200 },
];

let failed = 0;

async function get(url) {
  const res = await fetch(url, { headers: { "user-agent": "playoboe-verify" } });
  const type = res.headers.get("content-type") || "";
  const textual =
    type.includes("text") ||
    type.includes("json") ||
    type.includes("javascript") ||
    type.includes("xml");
  return { res, text: textual ? await res.text() : "" };
}

async function checkRoute(route) {
  const url = BASE + route.path;
  const { res, text } = await get(url);
  const title = (text.match(/<title>(.*?)<\/title>/) || [])[1] || "";
  const missing = (route.contains || []).filter((s) => !text.includes(s));
  const ok = res.status === route.expect && missing.length === 0;
  if (!ok) failed += 1;
  console.log(
    `${ok ? "PASS" : "FAIL"} ${res.status} ${route.path}` +
      (title ? `  title=${title}` : "") +
      (missing.length ? `  missing=${missing.join("|")}` : "")
  );
}

async function checkSeoHome() {
  const { res, text } = await get(`${BASE}/`);
  const canonical = (text.match(/rel="canonical" href="([^"]+)"/) || [])[1];
  const jsonld = text.includes("application/ld+json");
  const og = (text.match(/property="og:image" content="([^"]+)"/) || [])[1];
  const types = ["Organization", "WebSite", "ItemList"].filter((t) => text.includes(`"${t}"`));
  // The public copy is English only; a stray Hebrew string means a leak from the brief.
  const hebrew = /[֐-׿]/.test(text);
  const canonicalOk = !IS_PRODUCTION || canonical === "https://www.playoboe.net";
  const ok =
    res.status === 200 && canonicalOk && jsonld && types.length === 3 && Boolean(og) && !hebrew;
  if (!ok) failed += 1;
  console.log(
    `${ok ? "PASS" : "FAIL"} home SEO canonical=${canonical} jsonld=[${types.join(",")}] og=${og} hebrew=${hebrew}`
  );
}

async function checkOrderApi() {
  const res = await fetch(`${BASE}/api/orders`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "", email: "bad", message: "x" }),
  });
  // A deliberately invalid submission must be rejected with field errors, which shows
  // the endpoint is live and validating rather than silently accepting anything.
  const ok = res.status === 422;
  if (!ok) failed += 1;
  console.log(`${ok ? "PASS" : "FAIL"} ${res.status} /api/orders rejects an invalid order`);
}

async function checkApex() {
  const res = await fetch("https://playoboe.net/", { redirect: "manual" });
  const loc = res.headers.get("location") || "";
  const ok = (res.status === 308 || res.status === 307) && loc.includes("www.playoboe.net");
  if (!ok) failed += 1;
  console.log(`${ok ? "PASS" : "FAIL"} ${res.status} apex redirect -> ${loc}`);
}

for (const route of routes) {
  await checkRoute(route);
}
await checkSeoHome();
await checkOrderApi();
if (IS_PRODUCTION) await checkApex();
else console.log("SKIP apex redirect check (not the production host)");

console.log(
  failed === 0 ? `\nALL CHECKS PASSED against ${BASE}` : `\n${failed} CHECK(S) FAILED against ${BASE}`
);
process.exit(failed === 0 ? 0 : 1);
