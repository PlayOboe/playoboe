"use client";

import { useRef, useState } from "react";

type PlayState = "idle" | "playing" | "ended";

export function ReedPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [state, setState] = useState<PlayState>("idle");

  async function play() {
    const audio = audioRef.current;
    if (!audio || state === "playing") return;
    audio.currentTime = 0;
    try {
      await audio.play();
      setState("playing");
    } catch {
      setState("idle");
    }
  }

  const label = state === "playing" ? "Playing" : state === "ended" ? "Play again" : "Hear the reed";

  return (
    <div className="mt-10">
      <audio
        ref={audioRef}
        src="/audio/oboe.mp3"
        preload="auto"
        onEnded={() => setState("ended")}
      />
      <button
        type="button"
        onClick={play}
        disabled={state === "playing"}
        aria-label={label}
        className="group inline-flex items-center gap-3 border border-gold/70 bg-navy/35 px-6 py-3 text-sm uppercase tracking-[0.22em] text-ivory transition hover:border-gold hover:bg-navy/55 disabled:cursor-default disabled:opacity-80"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/80 text-gold">
          {state === "playing" ? (
            <span className="h-2.5 w-2.5 bg-gold" />
          ) : (
            <svg viewBox="0 0 12 12" className="ml-0.5 h-3 w-3 fill-current" aria-hidden="true">
              <path d="M3 1.6v8.8L11 6 3 1.6Z" />
            </svg>
          )}
        </span>
        {label}
      </button>
    </div>
  );
}
