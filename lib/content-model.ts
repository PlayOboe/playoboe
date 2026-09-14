import { CONTACT, PAGE_COPY, PRICING, REEDS } from "./site";

/**
 * The shape of the home page's editable copy, its defaults, and the rules a save must
 * pass. Kept free of storage and Node imports so the page, the structured data and the
 * API can all share it.
 */

export type ReedContent = {
  name: string;
  detail: string;
  blurb: string;
  price: number;
  priceLabel: string;
  bundlePrice: number;
  bundleLabel: string;
};

export type SiteContent = {
  hero: { eyebrow: string; title: string; intro: string };
  reeds: {
    eyebrow: string;
    title: string;
    intro: string;
    items: ReedContent[];
    note: string;
  };
  workshop: {
    eyebrow: string;
    title: string;
    story: string;
    feedback: string;
    studioTitle: string;
    studioText: string;
    studioNote: string;
  };
  contact: { eyebrow: string; title: string; email: string; hours: string };
  footer: { tagline: string };
};

export const DEFAULT_CONTENT: SiteContent = {
  hero: { ...PAGE_COPY.hero },
  reeds: {
    ...PAGE_COPY.reeds,
    items: REEDS.map((reed) => ({ ...reed })),
    note: PRICING.note,
  },
  workshop: { ...PAGE_COPY.workshop },
  contact: { ...PAGE_COPY.contact, email: CONTACT.email, hours: CONTACT.hours },
  footer: { ...PAGE_COPY.footer },
};

/** How a field is edited: one line, running text that may break lines, or a number. */
export type FieldKind = "line" | "text" | "number";

const NUMBER_FIELDS = [/^reeds\.items\.\d+\.(price|bundlePrice)$/];
const TEXT_FIELDS = [
  /^hero\.(title|intro)$/,
  /^reeds\.(intro|note)$/,
  /^reeds\.items\.\d+\.blurb$/,
  /^workshop\.(story|feedback|studioText)$/,
];

export function fieldKind(path: string): FieldKind {
  if (NUMBER_FIELDS.some((pattern) => pattern.test(path))) return "number";
  if (TEXT_FIELDS.some((pattern) => pattern.test(path))) return "text";
  return "line";
}

const LIMITS = { line: 160, text: 1500 } as const;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Problem = { field: string; error: string };
type Checked<T> = { value: T; problem?: Problem };

function checkString(input: unknown, fallback: string, path: string): Checked<string> {
  if (typeof input !== "string") {
    return { value: fallback, problem: { field: path, error: "This text is missing." } };
  }
  const kind = fieldKind(path);
  let value = input.replace(/\r\n?/g, "\n").replace(/ /g, " ");
  value =
    kind === "line"
      ? value.replace(/\s+/g, " ").trim()
      : value.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const limit = kind === "text" ? LIMITS.text : LIMITS.line;
  if (!value) return { value: fallback, problem: { field: path, error: "This text can’t be empty." } };
  if (value.length > limit) {
    return {
      value: fallback,
      problem: { field: path, error: `This text is too long — ${limit} characters at most.` },
    };
  }
  if (path === "contact.email" && !EMAIL.test(value)) {
    return { value: fallback, problem: { field: path, error: "That isn’t a valid email address." } };
  }
  return { value };
}

function checkNumber(input: unknown, fallback: number, path: string): Checked<number> {
  const value = typeof input === "string" && input.trim() !== "" ? Number(input) : input;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 100000) {
    return {
      value: fallback,
      problem: { field: path, error: "This must be a whole number, 1 or more." },
    };
  }
  return { value };
}

/**
 * Walks the input along the shape of the defaults. Every field that is missing or
 * invalid takes its default and is reported; anything not in the shape is dropped.
 */
function walk(input: unknown, defaults: unknown, path: string, problems: Problem[]): unknown {
  if (typeof defaults === "string") {
    const { value, problem } = checkString(input, defaults, path);
    if (problem) problems.push(problem);
    return value;
  }
  if (typeof defaults === "number") {
    const { value, problem } = checkNumber(input, defaults, path);
    if (problem) problems.push(problem);
    return value;
  }
  if (Array.isArray(defaults)) {
    // The reed range has a fixed number of cards; the editor changes them, not how many.
    const list = Array.isArray(input) ? input : [];
    return defaults.map((item, i) => walk(list[i], item, `${path}.${i}`, problems));
  }
  const source = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  return Object.fromEntries(
    Object.entries(defaults as Record<string, unknown>).map(([key, value]) => [
      key,
      walk(source[key], value, path ? `${path}.${key}` : key, problems),
    ])
  );
}

/** Strict: for a save. Reports the first problem so the editor can point at it. */
export function validateContent(
  input: unknown
): { ok: true; content: SiteContent } | ({ ok: false } & Problem) {
  const problems: Problem[] = [];
  const content = walk(input, DEFAULT_CONTENT, "", problems) as SiteContent;
  return problems.length ? { ok: false, ...problems[0] } : { ok: true, content };
}

/**
 * Copy saved before 2026-09-15 held one bundle size and discount for all reeds, and
 * the note held only the words after the bundle sentence. Rebuild the texts that
 * replaced them, so whatever was saved then still shows.
 */
function fromSharedDiscount(input: unknown): unknown {
  const source = input as { reeds?: Record<string, unknown> } | null;
  const reeds = source?.reeds;
  if (!reeds || typeof reeds.bundleSize !== "number" || typeof reeds.bundleDiscount !== "number") {
    return input;
  }
  const { bundleSize, bundleDiscount, note, ...rest } = reeds;
  const items = Array.isArray(reeds.items) ? reeds.items : [];
  return {
    ...source,
    reeds: {
      ...rest,
      items: items.map((item: Record<string, unknown>) => ({
        ...item,
        bundlePrice: typeof item?.price === "number" ? item.price - bundleDiscount : undefined,
        bundleLabel: `each in a bundle of ${bundleSize}`,
      })),
      note: `Order a bundle of ${bundleSize} and every reed in it is $${bundleDiscount} less. ${
        typeof note === "string" ? note : ""
      }`.trim(),
    },
  };
}

/** Lenient: for reading stored copy. Anything unusable falls back to the default. */
export function withDefaults(input: unknown): SiteContent {
  return walk(fromSharedDiscount(input), DEFAULT_CONTENT, "", []) as SiteContent;
}
