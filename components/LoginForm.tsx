"use client";

import { useState } from "react";

export function LoginForm() {
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        window.location.assign("/");
        return;
      }
      const payload = await response.json().catch(() => ({}));
      setError(payload.error ?? "Couldn’t sign in. Please try again.");
    } catch {
      setError("No connection. Please try again.");
    }
    setSending(false);
  }

  const field =
    "rounded border border-moss bg-forest px-3 py-3 text-cream focus-visible:outline focus-visible:outline-3";
  const label = "text-xs uppercase tracking-[0.16em] text-muted";

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="admin-username" className={label}>
          Username
        </label>
        <input
          id="admin-username"
          name="username"
          type="text"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          className={field}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="admin-password" className={label}>
          Password
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={field}
        />
      </div>
      <button
        type="submit"
        data-primary
        disabled={sending}
        className="rounded bg-sage px-7 py-3 font-semibold text-white transition hover:bg-leaf disabled:opacity-60"
      >
        {sending ? "Signing in…" : "Sign in"}
      </button>
      <p role="alert" className="min-h-[1.25rem] text-sm text-brass">
        {error}
      </p>
    </form>
  );
}
