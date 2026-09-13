"use client";

import { useId, useRef, useState } from "react";

type Status = "idle" | "sending" | "sent" | "error";

const REED_OPTIONS = [
  "Not sure yet — please advise",
  "Soft / easy-blowing",
  "Medium",
  "Hard / resistant",
  "American scrape",
  "European scrape",
];

export function ContactForm() {
  const formId = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const statusRef = useRef<HTMLParagraphElement>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    setStatus("sending");
    setErrors({});

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.status === 422) {
        const payload = await response.json();
        setErrors(payload.errors ?? {});
        setStatus("error");
        return;
      }
      if (!response.ok) {
        setStatus("error");
        return;
      }

      form.reset();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-8 grid gap-5 sm:grid-cols-2">
      <Field
        id={`${formId}-name`}
        name="name"
        label="Your name"
        autoComplete="name"
        required
        error={errors.name}
      />
      <Field
        id={`${formId}-email`}
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        required
        error={errors.email}
      />
      <Field
        id={`${formId}-phone`}
        name="phone"
        type="tel"
        label="Phone (optional)"
        autoComplete="tel"
      />

      <div className="flex flex-col gap-2">
        <label
          htmlFor={`${formId}-reed`}
          className="text-xs uppercase tracking-[0.16em] text-muted"
        >
          Reed preference
        </label>
        <select
          id={`${formId}-reed`}
          name="reed"
          defaultValue={REED_OPTIONS[0]}
          className="rounded border border-moss bg-forest px-3 py-3 text-cream focus-visible:outline focus-visible:outline-3"
        >
          {REED_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2 sm:col-span-2">
        <label
          htmlFor={`${formId}-message`}
          className="text-xs uppercase tracking-[0.16em] text-muted"
        >
          Your order <span className="text-copper">*</span>
        </label>
        <textarea
          id={`${formId}-message`}
          name="message"
          rows={5}
          required
          aria-describedby={errors.message ? `${formId}-message-error` : undefined}
          aria-invalid={errors.message ? true : undefined}
          placeholder="How many reeds, what you play on now, and anything Jeremy should know about your setup."
          className="rounded border border-moss bg-forest px-3 py-3 text-cream placeholder:text-muted/70 focus-visible:outline focus-visible:outline-3"
        />
        {errors.message && (
          <p id={`${formId}-message-error`} className="text-sm text-brass">
            {errors.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center">
        <button
          type="submit"
          data-primary
          disabled={status === "sending"}
          className="rounded bg-sage px-7 py-3 font-semibold text-white transition hover:bg-leaf disabled:opacity-60"
        >
          {status === "sending" ? "Sending…" : "Send order enquiry"}
        </button>

        <p
          ref={statusRef}
          role="status"
          aria-live="polite"
          className="text-sm text-cream"
        >
          {status === "sent" && "Thank you — your enquiry is in. Jeremy will reply by email."}
          {status === "error" &&
            Object.keys(errors).length === 0 &&
            "Something went wrong sending that. Please try again, or email the workshop directly."}
        </p>
      </div>
    </form>
  );
}

function Field({
  id,
  name,
  label,
  type = "text",
  required,
  autoComplete,
  error,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-xs uppercase tracking-[0.16em] text-muted">
        {label} {required && <span className="text-copper">*</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={error ? true : undefined}
        className="rounded border border-moss bg-forest px-3 py-3 text-cream placeholder:text-muted/70 focus-visible:outline focus-visible:outline-3"
      />
      {error && (
        <p id={`${id}-error`} className="text-sm text-brass">
          {error}
        </p>
      )}
    </div>
  );
}
