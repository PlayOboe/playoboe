import Image from "next/image";
import { ContactForm } from "@/components/ContactForm";
import { ReedPlayer } from "@/components/ReedPlayer";
import {
  jsonLdScript,
  organizationJsonLd,
  pageMetadata,
  reedsJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
import { CONTACT, REEDS, SITE } from "@/lib/site";

export const metadata = pageMetadata({
  title: `${SITE.name} | ${SITE.tagline}`,
  description: SITE.description,
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <script {...jsonLdScript([organizationJsonLd(), websiteJsonLd(), reedsJsonLd()])} />
      <header className="sticky top-0 z-40 border-b border-moss/70 bg-forest/90 backdrop-blur">
        <nav
          aria-label="Main"
          className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8"
        >
          <p className="font-display text-sm uppercase tracking-[0.3em] text-brass">
            Play Oboe
          </p>
          <ul className="flex items-center gap-5 text-sm">
            <li className="hidden sm:block">
              <a href="#reeds" className="text-cream transition hover:text-mint">
                Reeds
              </a>
            </li>
            <li className="hidden sm:block">
              <a href="#workshop" className="text-cream transition hover:text-mint">
                Workshop
              </a>
            </li>
            <li>
              <a href="#order" className="text-cream transition hover:text-mint">
                Order
              </a>
            </li>
            <li>
              <a
                href="/studio"
                data-primary
                className="rounded bg-sage px-4 py-2 font-semibold text-white transition hover:bg-leaf"
              >
                Open the Studio
              </a>
            </li>
          </ul>
        </nav>
      </header>

      <main id="content">
        <section className="relative overflow-hidden border-b border-moss/60">
          <Image
            src="/images/scene.jpg"
            alt=""
            fill
            priority
            data-decorative
            className="object-cover object-center opacity-25 mix-blend-luminosity"
          />
          <div
            aria-hidden="true"
            data-decorative
            className="absolute inset-0 bg-gradient-to-b from-forest/80 via-forest/90 to-forest"
          />


          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_minmax(0,24rem)] lg:py-28">
            <div>
              <p className="font-sans text-xs uppercase tracking-[0.34em] text-copper">
                Handmade in the workshop
              </p>
              <h1 className="mt-5 font-display text-5xl leading-[1.05] tracking-[0.02em] text-cream sm:text-6xl lg:text-7xl">
                Oboe reeds,
                <br />
                scraped one
                <br />
                at a time.
              </h1>
              <div className="mt-6 h-px w-24 bg-copper/80" />
              <p className="mt-7 max-w-lg font-serif text-xl leading-8 text-cream/90 sm:text-2xl sm:leading-9">
                Jeremy builds reeds by hand for players who need an instrument that
                answers on the first breath. Every blank is tied, scraped and tested
                before it leaves the bench.
              </p>

              <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
                <a
                  href="#order"
                  data-primary
                  className="rounded bg-sage px-7 py-3 text-center font-semibold text-white transition hover:bg-leaf"
                >
                  Order a reed
                </a>
                <a
                  href="/studio"
                  className="rounded border border-copper/70 px-7 py-3 text-center text-sm uppercase tracking-[0.18em] text-brass transition hover:bg-moss"
                >
                  Play the Studio
                </a>
              </div>

              <ReedPlayer />
            </div>

            {/* The right inset here and on the reed below are chosen so the two share
                a vertical centre line down the page, despite their different widths. */}
            <div className="flex justify-center lg:justify-end">
              <Image
                src="/images/jeremy-photo.webp"
                alt="Jeremy playing the oboe in the workshop"
                width={760}
                height={1353}
                priority
                className="h-[24rem] w-auto rounded-lg border border-moss object-cover shadow-xl sm:h-[28rem] lg:mr-[85px] lg:h-[32rem]"
              />
            </div>
          </div>
        </section>

        <section id="reeds" className="border-b border-moss/60 bg-forest">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
            <div className="flex flex-col gap-10 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-sans text-xs uppercase tracking-[0.3em] text-copper">
                  The bench
                </p>
                <h2 className="mt-4 font-display text-4xl tracking-[0.02em] text-cream sm:text-5xl">
                  Reeds
                </h2>
                <p className="mt-5 max-w-2xl font-serif text-lg leading-8 text-cream/85">
                  Three scrapes, each finished to the player rather than to a
                  catalogue. Tell Jeremy what you play and how you like a reed to push
                  back, and he will build to that.
                </p>
              </div>

              <Image
                src="/images/reed.png"
                alt="A finished oboe reed, tied and scraped by hand"
                width={437}
                height={1052}
                className="h-56 w-auto shrink-0 self-center drop-shadow-[0_14px_30px_rgba(0,0,0,0.45)] sm:h-64 lg:mr-44"
              />
            </div>

            <ul className="mt-12 grid gap-6 md:grid-cols-3">
              {REEDS.map((reed) => (
                <li
                  key={reed.name}
                  data-surface
                  className="flex flex-col rounded-lg border border-moss bg-pine p-7"
                >
                  <h3 className="font-display text-2xl text-cream">{reed.name}</h3>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-mint">
                    {reed.detail}
                  </p>
                  <p className="mt-4 flex-1 font-serif text-lg leading-7 text-cream/85">
                    {reed.blurb}
                  </p>
                  <p className="mt-6 border-t border-moss pt-4 text-sm text-muted">
                    Price on request
                  </p>
                </li>
              ))}
            </ul>

            <p className="mt-8 text-sm text-muted">
              Pricing is being finalised. For now, send an enquiry and Jeremy will
              quote for your order.
            </p>
          </div>
        </section>

        <section id="workshop" className="border-b border-moss/60 bg-pine/40">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2">
            <div>
              <p className="font-sans text-xs uppercase tracking-[0.3em] text-copper">
                Who makes them
              </p>
              <h2 className="mt-4 font-display text-4xl tracking-[0.02em] text-cream sm:text-5xl">
                The workshop
              </h2>
              <p className="mt-6 font-serif text-lg leading-8 text-cream/85">
                Jeremy has spent years at the gouging machine and the knife, learning
                what a cane blank will and will not give. Reeds are made in small
                batches, played in before they are sent, and any reed that does not
                speak cleanly never makes it into the post.
              </p>
              <p className="mt-4 font-serif text-lg leading-8 text-cream/85">
                If a reed arrives wrong for you, say so. Feedback goes straight back
                into the next scrape.
              </p>
            </div>

            <div
              data-surface
              className="flex flex-col justify-center rounded-lg border border-moss bg-pine p-8"
            >
              <h3 className="font-display text-2xl text-cream">The Studio</h3>
              <p className="mt-4 font-serif text-lg leading-7 text-cream/85">
                A playable oboe built entirely in the browser, over a generative
                trance backing that arranges itself as you play — with a recorder,
                a looper and a live accompaniment that follows your line.
              </p>
              <a
                href="/studio"
                data-primary
                className="mt-7 inline-block rounded bg-sage px-7 py-3 text-center font-semibold text-white transition hover:bg-leaf"
              >
                Open the Studio
              </a>
              <p className="mt-3 text-sm text-muted">
                Works best with headphones. Nothing is uploaded — it all runs on your
                device.
              </p>
            </div>
          </div>
        </section>

        <section id="order" className="bg-forest">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="font-sans text-xs uppercase tracking-[0.3em] text-copper">
                Orders and enquiries
              </p>
              <h2 className="mt-4 font-display text-4xl tracking-[0.02em] text-cream sm:text-5xl">
                Get in touch
              </h2>

              <dl className="mt-8 space-y-6">
                <div>
                  <dt className="text-xs uppercase tracking-[0.16em] text-muted">
                    Email
                  </dt>
                  <dd className="mt-1 font-serif text-xl text-cream">
                    {CONTACT.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.16em] text-muted">
                    Reply time
                  </dt>
                  <dd className="mt-1 font-serif text-xl text-cream">
                    {CONTACT.hours}
                  </dd>
                </div>
              </dl>
            </div>

            <div data-surface className="rounded-lg border border-moss bg-pine p-7 sm:p-9">
              <h3 className="font-display text-2xl text-cream">Order form</h3>
              <p className="mt-2 text-sm text-muted">
                Fields marked <span className="text-copper">*</span> are required.
              </p>
              <ContactForm />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-moss/60 bg-forest">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>Play Oboe — handmade oboe reeds</p>
          <p>www.playoboe.net</p>
        </div>
      </footer>
    </>
  );
}
