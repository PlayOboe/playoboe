import Image from "next/image";
import { BrandLink } from "@/components/BrandLink";
import { ContactForm } from "@/components/ContactForm";
import { Editable } from "@/components/Editable";
import { PageEditor } from "@/components/PageEditor";
import { ReedPlayer } from "@/components/ReedPlayer";
import { getContent } from "@/lib/content";
import {
  jsonLdScript,
  organizationJsonLd,
  pageMetadata,
  reedsJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
import { PRICING, SITE } from "@/lib/site";

export const metadata = pageMetadata({
  title: `${SITE.name} | ${SITE.tagline}`,
  description: SITE.description,
  path: "/",
});

const price = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: PRICING.currency,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
// The symbol sits outside the editable number, so only digits are ever typed into a price.
const currencySymbol = price.formatToParts(0).find((part) => part.type === "currency")?.value;

export default async function HomePage() {
  const content = await getContent();
  const { hero, reeds, workshop, contact, footer } = content;

  return (
    <>
      <script
        {...jsonLdScript([organizationJsonLd(content), websiteJsonLd(), reedsJsonLd(content)])}
      />
      <header className="sticky top-0 z-40 border-b border-moss/70 bg-forest/90 backdrop-blur">
        <nav
          aria-label="Main"
          className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8"
        >
          <BrandLink />
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
              <Editable
                as="p"
                path="hero.eyebrow"
                className="font-sans text-xs uppercase tracking-[0.34em] text-copper"
              >
                {hero.eyebrow}
              </Editable>
              <Editable
                as="h1"
                path="hero.title"
                className="mt-5 whitespace-pre-line font-display text-5xl leading-[1.05] tracking-[0.02em] text-cream sm:text-6xl lg:text-7xl"
              >
                {hero.title}
              </Editable>
              <div className="mt-6 h-px w-24 bg-copper/80" />
              <Editable
                as="p"
                path="hero.intro"
                className="mt-7 max-w-lg whitespace-pre-line font-serif text-xl leading-8 text-cream/90 sm:text-2xl sm:leading-9"
              >
                {hero.intro}
              </Editable>

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
                <Editable
                  as="p"
                  path="reeds.eyebrow"
                  className="font-sans text-xs uppercase tracking-[0.3em] text-copper"
                >
                  {reeds.eyebrow}
                </Editable>
                <Editable
                  as="h2"
                  path="reeds.title"
                  className="mt-4 font-display text-4xl tracking-[0.02em] text-cream sm:text-5xl"
                >
                  {reeds.title}
                </Editable>
                <Editable
                  as="p"
                  path="reeds.intro"
                  className="mt-5 max-w-2xl whitespace-pre-line font-serif text-lg leading-8 text-cream/85"
                >
                  {reeds.intro}
                </Editable>
              </div>

              <Image
                src="/images/reed.png"
                alt="A finished oboe reed, tied and scraped by hand"
                width={149}
                height={1093}
                className="h-56 w-auto shrink-0 self-center drop-shadow-[0_14px_30px_rgba(0,0,0,0.45)] sm:h-64 lg:mr-[212px]"
              />
            </div>

            <ul className="mt-12 grid gap-6 md:grid-cols-3">
              {reeds.items.map((reed, i) => (
                <li
                  key={i}
                  data-surface
                  className="flex flex-col rounded-lg border border-moss bg-pine p-7"
                >
                  <Editable
                    as="h3"
                    path={`reeds.items.${i}.name`}
                    className="font-display text-2xl text-cream"
                  >
                    {reed.name}
                  </Editable>
                  <Editable
                    as="p"
                    path={`reeds.items.${i}.detail`}
                    className="mt-2 text-xs uppercase tracking-[0.16em] text-mint"
                  >
                    {reed.detail}
                  </Editable>
                  <Editable
                    as="p"
                    path={`reeds.items.${i}.blurb`}
                    className="mt-4 flex-1 whitespace-pre-line font-serif text-lg leading-7 text-cream/85"
                  >
                    {reed.blurb}
                  </Editable>
                  <div className="mt-6 border-t border-moss pt-4">
                    <p className="flex items-baseline gap-2">
                      <span className="font-display text-3xl text-cream">
                        {currencySymbol}
                        <Editable path={`reeds.items.${i}.price`}>{reed.price}</Editable>
                      </span>
                      <span className="text-sm text-muted">per reed</span>
                    </p>
                    <p className="mt-1 text-sm text-brass">
                      <span data-bundle-price={i} data-currency-symbol={currencySymbol}>
                        {price.format(reed.price - reeds.bundleDiscount)}
                      </span>{" "}
                      each in a bundle of <span data-bundle-size>{reeds.bundleSize}</span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-8 text-sm text-muted">
              Order a bundle of <Editable path="reeds.bundleSize">{reeds.bundleSize}</Editable>{" "}
              and every reed in it is {currencySymbol}
              <Editable path="reeds.bundleDiscount">{reeds.bundleDiscount}</Editable> less.{" "}
              <Editable path="reeds.note">{reeds.note}</Editable>
            </p>
          </div>
        </section>

        <section id="workshop" className="border-b border-moss/60 bg-pine/40">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2">
            <div>
              <Editable
                as="p"
                path="workshop.eyebrow"
                className="font-sans text-xs uppercase tracking-[0.3em] text-copper"
              >
                {workshop.eyebrow}
              </Editable>
              <Editable
                as="h2"
                path="workshop.title"
                className="mt-4 font-display text-4xl tracking-[0.02em] text-cream sm:text-5xl"
              >
                {workshop.title}
              </Editable>
              <Editable
                as="p"
                path="workshop.story"
                className="mt-6 whitespace-pre-line font-serif text-lg leading-8 text-cream/85"
              >
                {workshop.story}
              </Editable>
              <Editable
                as="p"
                path="workshop.feedback"
                className="mt-4 whitespace-pre-line font-serif text-lg leading-8 text-cream/85"
              >
                {workshop.feedback}
              </Editable>
            </div>

            <div
              data-surface
              className="flex flex-col justify-center rounded-lg border border-moss bg-pine p-8"
            >
              <Editable as="h3" path="workshop.studioTitle" className="font-display text-2xl text-cream">
                {workshop.studioTitle}
              </Editable>
              <Editable
                as="p"
                path="workshop.studioText"
                className="mt-4 whitespace-pre-line font-serif text-lg leading-7 text-cream/85"
              >
                {workshop.studioText}
              </Editable>
              <a
                href="/studio"
                data-primary
                className="mt-7 inline-block rounded bg-sage px-7 py-3 text-center font-semibold text-white transition hover:bg-leaf"
              >
                Open the Studio
              </a>
              <Editable as="p" path="workshop.studioNote" className="mt-3 text-sm text-muted">
                {workshop.studioNote}
              </Editable>
            </div>
          </div>
        </section>

        <section id="order" className="bg-forest">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <Editable
                as="p"
                path="contact.eyebrow"
                className="font-sans text-xs uppercase tracking-[0.3em] text-copper"
              >
                {contact.eyebrow}
              </Editable>
              <Editable
                as="h2"
                path="contact.title"
                className="mt-4 font-display text-4xl tracking-[0.02em] text-cream sm:text-5xl"
              >
                {contact.title}
              </Editable>

              <dl className="mt-8 space-y-6">
                <div>
                  <dt className="text-xs uppercase tracking-[0.16em] text-muted">
                    Email
                  </dt>
                  <Editable as="dd" path="contact.email" className="mt-1 font-serif text-xl text-cream">
                    {contact.email}
                  </Editable>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.16em] text-muted">
                    Reply time
                  </dt>
                  <Editable as="dd" path="contact.hours" className="mt-1 font-serif text-xl text-cream">
                    {contact.hours}
                  </Editable>
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
          <Editable as="p" path="footer.tagline">
            {footer.tagline}
          </Editable>
          <p>www.playoboe.net</p>
        </div>
      </footer>

      <PageEditor />
    </>
  );
}
