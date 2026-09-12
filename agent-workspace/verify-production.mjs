/**
 * Production verification for playoboe.net
 * Run after deploy: node agent-workspace/verify-production.mjs
 */
const BASE = process.argv[2] || "https://www.playoboe.net";

const routes = [
  { path: "/", expect: 200, contains: ["Play Oboe", "Coming soon", "Hear the reed", "/audio/oboe.mp3"] },
  { path: "/sitemap.xml", expect: 200, contains: ["https://www.playoboe.net"] },
  { path: "/robots.txt", expect: 200, contains: ["Sitemap:"] },
  { path: "/images/scene.jpg", expect: 200 },
  { path: "/images/reed.png", expect: 200 },
  { path: "/images/og.jpg", expect: 200 },
  { path: "/audio/oboe.mp3", expect: 200 },
  { path: "/icon.svg", expect: 200, contains: ["<svg"] },
];

let failed = 0;

async function get(url) {
  const res = await fetch(url, { headers: { "user-agent": "playoboe-verify" } });
  const text = res.headers.get("content-type")?.includes("text") || url.endsWith(".xml") || url.endsWith(".svg") || url.endsWith("/")
    ? await res.text()
    : "";
  return { res, text };
}

async function checkRoute(route) {
  const url = BASE.replace(/\/$/, "") + route.path;
  const { res, text } = await get(url);
  const title = (text.match(/<title>(.*?)<\/title>/) || [])[1] || "";
  const missing = (route.contains || []).filter((s) => !text.includes(s));
  const ok = res.status === route.expect && missing.length === 0;
  if (!ok) failed += 1;
  console.log(
    `${ok ? "PASS" : "FAIL"} ${res.status} ${route.path}  title=${title}` +
      (missing.length ? ` missing=${missing.join("|")}` : ""),
  );
}

async function checkSeoHome() {
  const { res, text } = await get(BASE.replace(/\/$/, "") + "/");
  const canonical = (text.match(/rel="canonical" href="([^"]+)"/) || [])[1];
  const jsonld = text.includes("application/ld+json");
  const og = (text.match(/property="og:image" content="([^"]+)"/) || [])[1];
  const hebrew = text.includes("האתר") || text.includes("בקרוב");
  const ok =
    res.status === 200 &&
    (canonical === "https://www.playoboe.net/" || canonical === "https://www.playoboe.net") &&
    jsonld &&
    Boolean(og) &&
    !hebrew;
  if (!ok) failed += 1;
  console.log(
    `${ok ? "PASS" : "FAIL"} home SEO canonical=${canonical} jsonld=${jsonld} og=${og} hebrew=${hebrew}`,
  );
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
await checkApex();

console.log(failed === 0 ? `\nALL CHECKS PASSED against ${BASE}` : `\n${failed} CHECK(S) FAILED against ${BASE}`);
process.exit(failed === 0 ? 0 : 1);
