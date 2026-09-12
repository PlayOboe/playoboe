import Image from "next/image";
import { ReedPlayer } from "@/components/ReedPlayer";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = pageMetadata({
  title: `${SITE.name} | ${SITE.tagline}`,
  description: SITE.description,
  path: "/",
});

export default function HomePage() {
  return (
    <main
      id="content"
      className="relative min-h-dvh overflow-hidden bg-navy text-ivory"
    >
      <Image
        src="/images/scene.jpg"
        alt=""
        fill
        priority
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-navy/25" />

      <Image
        src="/images/reed.png"
        alt="An illustrated oboe reed"
        width={437}
        height={1052}
        priority
        className="pointer-events-none absolute right-[6%] top-[12%] hidden h-[76vh] w-auto drop-shadow-[0_18px_40px_rgba(0,0,0,0.45)] lg:block"
      />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl flex-col justify-between px-6 py-10 sm:px-10 lg:px-16">
        <header className="flex items-center justify-between gap-6">
          <p className="font-display text-[0.7rem] uppercase tracking-[0.38em] text-gold">
            Play Oboe
          </p>
          <p className="hidden font-sans text-[0.65rem] uppercase tracking-[0.28em] text-mist sm:block">
            The voice of the opera
          </p>
        </header>

        <section className="max-w-xl pb-8 pt-16 lg:pt-8">
          <Image
            src="/images/reed.png"
            alt="An illustrated oboe reed"
            width={220}
            height={530}
            className="mx-auto mb-10 h-48 w-auto lg:hidden"
          />

          <p className="font-sans text-[0.7rem] uppercase tracking-[0.34em] text-gold">
            Coming soon
          </p>
          <h1 className="mt-4 font-display text-5xl leading-tight tracking-[0.06em] text-ivory sm:text-6xl lg:text-7xl">
            Play Oboe
          </h1>
          <div className="mt-5 h-px w-24 bg-gold/80" />
          <p className="mt-6 max-w-md font-serif text-xl leading-8 text-parchment sm:text-2xl sm:leading-9">
            A house for the reed, the breath, and the instrument that speaks in the opera.
          </p>
          <ReedPlayer />
        </section>

        <footer className="flex flex-col gap-3 pt-8 font-sans text-[0.65rem] uppercase tracking-[0.24em] text-mist sm:flex-row sm:items-end sm:justify-between">
          <p>The house is being prepared</p>
          <p>www.playoboe.net</p>
        </footer>
      </div>
    </main>
  );
}
