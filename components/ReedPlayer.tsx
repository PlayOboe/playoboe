"use client";

import { useRef, useState } from "react";

type PlayState = "idle" | "playing" | "ended";

export function ReedPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [state, setState] = useState<PlayState>("idle");

  async function toggle() {
    const audio = audioRef.current;
    if (!audio) return;

    if (state === "playing") {
      audio.pause();
      audio.currentTime = 0;
      setState("idle");
      return;
    }

    audio.currentTime = 0;
    try {
      await audio.play();
      setState("playing");
    } catch {
      setState("idle");
    }
  }

  const playing = state === "playing";
  const label = playing ? "Stop" : state === "ended" ? "Play again" : "Hear the reed";

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
        onClick={toggle}
        aria-label={playing ? "Stop the reed" : label}
        className="group inline-flex items-center gap-3 rounded border border-copper/70 bg-forest/50 px-6 py-3 text-sm uppercase tracking-[0.22em] text-cream transition hover:border-copper hover:bg-moss"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-copper/80 text-copper">
          {playing ? (
            <span className="h-2.5 w-2.5 bg-copper" />
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
