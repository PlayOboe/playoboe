"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "playoboe:cookie-choice";

export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function choose(choice: "accepted" | "declined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // storage unavailable — the notice simply returns next visit
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      data-surface
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-moss bg-pine/95 px-4 py-4 backdrop-blur print:hidden sm:px-6"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm leading-6 text-cream">
          This site stores a small amount of data in your browser to remember your
          accessibility settings and this choice. Nothing is used for advertising and
          nothing leaves your device unless you send the order form.
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => choose("declined")}
            className="rounded border border-moss px-4 py-2 text-sm text-cream transition hover:bg-moss"
          >
            Essential only
          </button>
          <button
            type="button"
            data-primary
            onClick={() => choose("accepted")}
            className="rounded bg-sage px-4 py-2 text-sm font-semibold text-white transition hover:bg-leaf"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
