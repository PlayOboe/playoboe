import { LoginForm } from "@/components/LoginForm";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = pageMetadata({
  title: `Sign in to edit | ${SITE.name}`,
  description: "Sign in to edit the Play Oboe site.",
  path: "/admin",
  index: false,
});

export default function AdminPage() {
  return (
    <main id="content" className="flex min-h-screen items-center justify-center px-5 py-16">
      <div data-surface className="w-full max-w-md rounded-lg border border-moss bg-pine p-8 shadow-xl">
        <p className="font-sans text-xs uppercase tracking-[0.3em] text-copper">{SITE.name}</p>
        <h1 className="mt-4 font-display text-3xl tracking-[0.02em] text-cream">
          Edit the site
        </h1>
        <p className="mt-3 font-serif text-lg leading-7 text-cream/85">
          Sign in, and the site opens with every text ready to change.
        </p>
        <LoginForm />
        <a
          href="/"
          className="mt-8 inline-block text-sm text-muted underline-offset-4 transition hover:text-cream hover:underline"
        >
          ← Back to {SITE.name}
        </a>
      </div>
    </main>
  );
}
