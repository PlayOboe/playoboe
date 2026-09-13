"use client";

import { useEffect, useState } from "react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function toTop() {
    const reduced =
      document.documentElement.getAttribute("data-a11y-motion") === "reduced" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={toTop}
      className="fixed bottom-6 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border-2 border-copper/70 bg-forest text-brass shadow-lg transition hover:bg-moss print:hidden"
    >
      <span className="sr-only">Back to top</span>
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true">
        <path d="M12 5.5 4.5 13l1.6 1.6L12 8.7l5.9 5.9 1.6-1.6z" />
      </svg>
    </button>
  );
}
