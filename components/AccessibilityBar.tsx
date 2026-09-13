"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "playoboe:a11y";
const FONT_STEPS = [1, 1.15, 1.3, 1.5, 1.75];

type Prefs = {
  fontStep: number;
  contrast: boolean;
  readableFont: boolean;
  underlineLinks: boolean;
  wideSpacing: boolean;
  reducedMotion: boolean;
};

const DEFAULTS: Prefs = {
  fontStep: 0,
  contrast: false,
  readableFont: false,
  underlineLinks: false,
  wideSpacing: false,
  reducedMotion: false,
};

function apply(prefs: Prefs) {
  const root = document.documentElement;
  root.style.setProperty("--a11y-scale", String(FONT_STEPS[prefs.fontStep] ?? 1));
  toggleAttr(root, "data-a11y-contrast", prefs.contrast ? "high" : null);
  toggleAttr(root, "data-a11y-font", prefs.readableFont ? "readable" : null);
  toggleAttr(root, "data-a11y-links", prefs.underlineLinks ? "underline" : null);
  toggleAttr(root, "data-a11y-spacing", prefs.wideSpacing ? "wide" : null);
  toggleAttr(root, "data-a11y-motion", prefs.reducedMotion ? "reduced" : null);
}

function toggleAttr(el: HTMLElement, name: string, value: string | null) {
  if (value === null) el.removeAttribute(name);
  else el.setAttribute(name, value);
}

export function AccessibilityBar() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setPrefs({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {
      // storage unavailable — defaults stand
    }
  }, []);

  useEffect(() => {
    apply(prefs);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // storage unavailable — the preference still applies for this visit
    }
  }, [prefs]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const update = useCallback((patch: Partial<Prefs>) => {
    setPrefs((current) => ({ ...current, ...patch }));
  }, []);

  const fontPercent = Math.round((FONT_STEPS[prefs.fontStep] ?? 1) * 100);

  return (
    <div className="fixed right-4 top-1/2 z-[60] -translate-y-1/2 print:hidden">
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="a11y-panel"
        className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-brass bg-forest text-brass shadow-lg transition hover:bg-moss focus-visible:outline focus-visible:outline-3"
      >
        <span className="sr-only">
          {open ? "Close accessibility options" : "Open accessibility options"}
        </span>
        <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" aria-hidden="true">
          <circle cx="12" cy="4" r="2" />
          <path d="M20.5 7.5 15 9v5l2 7h-2l-2-6h-2l-2 6H7l2-7V9L3.5 7.5 4 6l6 1.6h4L20 6z" />
        </svg>
      </button>

      {open && (
        <div
          id="a11y-panel"
          ref={panelRef}
          role="dialog"
          aria-label="Accessibility options"
          data-surface
          className="absolute right-16 top-1/2 max-h-[80vh] w-[19rem] max-w-[calc(100vw-6rem)] -translate-y-1/2 overflow-y-auto rounded-lg border border-moss bg-pine p-4 shadow-2xl"
        >
          <h2 className="font-display text-sm uppercase tracking-[0.18em] text-brass">
            Accessibility
          </h2>

          <div className="mt-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Text size — {fontPercent}%
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => update({ fontStep: Math.max(0, prefs.fontStep - 1) })}
                disabled={prefs.fontStep === 0}
                className="flex-1 rounded border border-moss bg-forest px-3 py-2 text-base font-semibold text-cream transition hover:bg-moss disabled:opacity-40"
              >
                <span aria-hidden="true">A−</span>
                <span className="sr-only">Decrease text size</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  update({ fontStep: Math.min(FONT_STEPS.length - 1, prefs.fontStep + 1) })
                }
                disabled={prefs.fontStep === FONT_STEPS.length - 1}
                className="flex-1 rounded border border-moss bg-forest px-3 py-2 text-base font-semibold text-cream transition hover:bg-moss disabled:opacity-40"
              >
                <span aria-hidden="true">A+</span>
                <span className="sr-only">Increase text size</span>
              </button>
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            <ToggleRow
              label="High contrast"
              pressed={prefs.contrast}
              onClick={() => update({ contrast: !prefs.contrast })}
            />
            <ToggleRow
              label="Readable font"
              pressed={prefs.readableFont}
              onClick={() => update({ readableFont: !prefs.readableFont })}
            />
            <ToggleRow
              label="Underline links"
              pressed={prefs.underlineLinks}
              onClick={() => update({ underlineLinks: !prefs.underlineLinks })}
            />
            <ToggleRow
              label="Wider text spacing"
              pressed={prefs.wideSpacing}
              onClick={() => update({ wideSpacing: !prefs.wideSpacing })}
            />
            <ToggleRow
              label="Reduce motion"
              pressed={prefs.reducedMotion}
              onClick={() => update({ reducedMotion: !prefs.reducedMotion })}
            />
          </ul>

          <button
            type="button"
            onClick={() => setPrefs(DEFAULTS)}
            className="mt-4 w-full rounded border border-copper/60 px-3 py-2 text-xs uppercase tracking-[0.16em] text-brass transition hover:bg-moss"
          >
            Reset all
          </button>
        </div>
      )}
    </div>
  );
}

function ToggleRow({
  label,
  pressed,
  onClick,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-pressed={pressed}
        className="flex w-full items-center justify-between rounded border border-moss bg-forest px-3 py-2 text-left text-sm text-cream transition hover:bg-moss"
      >
        {label}
        <span
          aria-hidden="true"
          className={`ml-3 flex h-5 w-9 shrink-0 items-center rounded-full border px-0.5 transition ${
            pressed ? "border-mint bg-sage" : "border-muted/50 bg-forest"
          }`}
        >
          <span
            className={`h-3.5 w-3.5 rounded-full bg-cream transition ${
              pressed ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </span>
      </button>
    </li>
  );
}
