"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * On-page editing. Loads only for a browser that has signed in at /admin: every text
 * marked with <Editable> becomes editable in place, and Save sends the whole copy to
 * /api/admin/content, which republishes the page. Visitors never fetch anything here.
 */

const EDITOR_COOKIE = "po_editor";

type Content = Record<string, unknown>;
type Status =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "error"; message: string }
  | { kind: "signed-out" };

const editables = () => Array.from(document.querySelectorAll<HTMLElement>("[data-edit]"));

/**
 * The text as typed. Not innerText: that applies CSS, and would save the uppercase
 * eyebrows in capitals. Line breaks the browser inserts as <br> or <div> become "\n".
 */
function readText(node: Node): string {
  let text = "";
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) text += child.textContent ?? "";
    else if (child.nodeName === "BR") text += "\n";
    else if (child.nodeName === "DIV" || child.nodeName === "P") text += `\n${readText(child)}`;
    else text += readText(child);
  });
  return text;
}

function readValue(el: HTMLElement): string | number {
  const text = readText(el).replace(/ /g, " ");
  if (el.dataset.editKind === "number") return Number(text.replace(/\D/g, "") || NaN);
  if (el.dataset.editKind === "line") return text.replace(/\s+/g, " ").trim();
  return text.trim();
}

function setPath(target: Content, path: string, value: unknown) {
  const keys = path.split(".");
  let node = target as Record<string, unknown>;
  for (const key of keys.slice(0, -1)) node = node[key] as Record<string, unknown>;
  node[keys[keys.length - 1]] = value;
}

function placeCaretAtEnd(el: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

export function PageEditor() {
  const [signedIn, setSignedIn] = useState(false);
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const base = useRef<Content | null>(null);
  const originals = useRef(new Map<HTMLElement, string>());

  const signedOut = useCallback(() => {
    document.cookie = `${EDITOR_COOKIE}=; Max-Age=0; path=/`;
    setEditing(false);
    setStatus({ kind: "signed-out" });
  }, []);

  useEffect(() => {
    const cookies = document.cookie.split(";").map((part) => part.trim());
    if (!cookies.includes(`${EDITOR_COOKIE}=1`)) return;
    setSignedIn(true);
    document.documentElement.setAttribute("data-editor", "");

    fetch("/api/admin/content", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) return signedOut();
        if (!response.ok) throw new Error(String(response.status));
        base.current = (await response.json()).content;
        originals.current = new Map(editables().map((el) => [el, readText(el)]));
        setEditing(true);
      })
      .catch(() =>
        setStatus({ kind: "error", message: "Couldn’t load the editor. Reload to try again." })
      );
  }, [signedOut]);

  useEffect(() => {
    if (!editing) return;
    const root = document.documentElement;
    root.setAttribute("data-editing", "");

    const markDirty = () =>
      setDirty(editables().some((el) => readText(el) !== originals.current.get(el)));

    const onKeyDown = (event: KeyboardEvent) => {
      const el = event.currentTarget as HTMLElement;
      if (event.key === "Escape") el.blur();
      if (event.key === "Enter" && el.dataset.editKind !== "text") {
        event.preventDefault();
        el.blur();
      }
    };
    const onInput = (event: Event) => {
      const el = event.currentTarget as HTMLElement;
      el.removeAttribute("data-invalid");
      if (el.dataset.editKind === "number") {
        const digits = readText(el).replace(/\D/g, "");
        if (digits !== readText(el)) {
          el.textContent = digits;
          placeCaretAtEnd(el);
        }
      }
      markDirty();
      setStatus({ kind: "idle" });
    };
    // Pasting from a document or email must not bring its formatting onto the page.
    const onPaste = (event: ClipboardEvent) => {
      event.preventDefault();
      const text = event.clipboardData?.getData("text/plain") ?? "";
      document.execCommand("insertText", false, text);
    };

    const elements = editables();
    for (const el of elements) {
      try {
        el.contentEditable = "plaintext-only";
      } catch {
        el.contentEditable = "true"; // browsers without plaintext-only; paste is still plain
      }
      if (el.dataset.editKind === "number") el.inputMode = "numeric";
      el.spellcheck = el.dataset.editKind !== "number";
      el.addEventListener("keydown", onKeyDown);
      el.addEventListener("input", onInput);
      el.addEventListener("paste", onPaste);
    }
    return () => {
      root.removeAttribute("data-editing");
      for (const el of elements) {
        el.removeAttribute("contenteditable");
        el.removeEventListener("keydown", onKeyDown);
        el.removeEventListener("input", onInput);
        el.removeEventListener("paste", onPaste);
      }
    };
  }, [editing]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function save() {
    if (!base.current) return;
    const content = structuredClone(base.current);
    for (const el of editables()) setPath(content, el.dataset.edit!, readValue(el));

    setStatus({ kind: "saving" });
    try {
      const response = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 401) return signedOut();
      if (!response.ok) {
        const field = payload.field
          ? document.querySelector<HTMLElement>(`[data-edit="${payload.field}"]`)
          : null;
        if (field) {
          setEditing(true);
          field.setAttribute("data-invalid", "");
          field.scrollIntoView({ block: "center" });
          field.focus();
        }
        setStatus({ kind: "error", message: payload.error ?? "The changes could not be saved." });
        return;
      }
      base.current = payload.content;
      originals.current = new Map(editables().map((el) => [el, readText(el)]));
      setDirty(false);
      setStatus({ kind: "saved" });
    } catch {
      setStatus({ kind: "error", message: "No connection. Your changes are still here — try Save again." });
    }
  }

  function discard() {
    for (const [el, text] of originals.current) {
      el.textContent = text;
      el.removeAttribute("data-invalid");
    }
    setDirty(false);
    setStatus({ kind: "idle" });
  }

  async function signOut() {
    if (dirty && !window.confirm("Sign out without saving your changes?")) return;
    setDirty(false);
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => undefined);
    window.location.assign("/");
  }

  if (!signedIn) return null;

  const message =
    status.kind === "saving"
      ? "Saving…"
      : status.kind === "saved"
        ? "Saved — the site is updated."
        : status.kind === "error"
          ? status.message
          : status.kind === "signed-out"
            ? "Your editing session has ended."
            : dirty
              ? "Unsaved changes"
              : editing
                ? "Click any outlined text to change it."
                : "Previewing the page as visitors see it.";

  return (
    <div
      role="region"
      aria-label="Page editor"
      data-surface
      className="fixed inset-x-3 bottom-3 z-[65] mx-auto flex max-w-3xl flex-wrap items-center gap-3 rounded-lg border border-copper/60 bg-pine/95 px-4 py-3 shadow-2xl backdrop-blur print:hidden"
    >
      <p
        role="status"
        aria-live="polite"
        className={`mr-auto text-sm ${status.kind === "error" ? "text-brass" : "text-cream"}`}
      >
        {message}
      </p>

      {status.kind === "signed-out" ? (
        <a
          href="/admin"
          data-primary
          className="rounded bg-sage px-4 py-2 text-sm font-semibold text-white transition hover:bg-leaf"
        >
          Sign in again
        </a>
      ) : (
        <>
          {editing && dirty && (
            <button
              type="button"
              onClick={discard}
              className="rounded border border-moss px-4 py-2 text-sm text-cream transition hover:bg-moss"
            >
              Discard
            </button>
          )}
          <button
            type="button"
            onClick={() => setEditing((on) => !on)}
            disabled={!base.current}
            className="rounded border border-moss px-4 py-2 text-sm text-cream transition hover:bg-moss disabled:opacity-50"
          >
            {editing ? "Preview" : "Edit"}
          </button>
          <button
            type="button"
            data-primary
            onClick={save}
            disabled={!dirty || status.kind === "saving"}
            className="rounded bg-sage px-5 py-2 text-sm font-semibold text-white transition hover:bg-leaf disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            onClick={signOut}
            className="rounded px-2 py-2 text-sm text-muted underline-offset-4 transition hover:text-cream hover:underline"
          >
            Sign out
          </button>
        </>
      )}
    </div>
  );
}
