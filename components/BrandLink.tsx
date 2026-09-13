"use client";

import { SITE } from "@/lib/site";

export function BrandLink() {
  function toTop(event: React.MouseEvent<HTMLAnchorElement>) {
    // Without JS the href still navigates home, which is also the top of the page.
    event.preventDefault();
    const reduced =
      document.documentElement.getAttribute("data-a11y-motion") === "reduced" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    // Drops any section hash so the URL matches where the reader now is.
    history.replaceState(null, "", window.location.pathname);
  }

  return (
    <a
      href="/"
      onClick={toTop}
      className="rounded font-display text-sm uppercase tracking-[0.3em] text-brass transition hover:text-copper"
    >
      {SITE.name}
      <span className="sr-only"> — back to top</span>
    </a>
  );
}
