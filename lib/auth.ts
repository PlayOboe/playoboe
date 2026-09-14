import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

/**
 * Sign-in for editing the site. One editor, configured entirely through environment
 * variables — never in the repo, which is public:
 *
 * - ADMIN_USERNAME       accepted usernames, comma-separated, compared case-insensitively
 * - ADMIN_PASSWORD_HASH  from hashPassword(); the password itself is stored nowhere
 * - SESSION_SECRET       random string that signs the session cookie
 *
 * Changing the password hash or the secret signs every existing session out.
 */

export const SESSION_COOKIE = "po_session";
// Not a credential: it only tells the page to load the editor. Every read and write of
// the copy is checked against the signed, HttpOnly session cookie.
export const EDITOR_COOKIE = "po_editor";
const SESSION_SECONDS = 60 * 60 * 24 * 14;

export function editingConfigured() {
  return Boolean(
    process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD_HASH && process.env.SESSION_SECRET
  );
}

export function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = scryptSync(password.normalize("NFKC"), salt, 64);
  return `scrypt:${salt.toString("base64url")}:${hash.toString("base64url")}`;
}

function verifyPassword(password: string, stored: string) {
  const [scheme, salt, hash] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const actual = scryptSync(password.normalize("NFKC"), Buffer.from(salt, "base64url"), expected.length);
  return timingSafeEqual(actual, expected);
}

export function checkCredentials(username: unknown, password: unknown) {
  if (typeof username !== "string" || typeof password !== "string") return false;
  const allowed = (process.env.ADMIN_USERNAME ?? "")
    .split(",")
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);
  // The hash always runs, so a wrong username takes as long to refuse as a wrong password.
  const passwordOk = verifyPassword(password, process.env.ADMIN_PASSWORD_HASH ?? "");
  return allowed.includes(username.trim().toLowerCase()) && passwordOk;
}

function sign(payload: string) {
  const key = `${process.env.SESSION_SECRET}:${process.env.ADMIN_PASSWORD_HASH}`;
  return createHmac("sha256", key).update(payload).digest("base64url");
}

function readSession(token: string | undefined) {
  if (!token || !editingConfigured()) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof session.exp === "number" && session.exp > Date.now() ? session : null;
  } catch {
    return null;
  }
}

export function isEditor(request: NextRequest) {
  return readSession(request.cookies.get(SESSION_COOKIE)?.value) !== null;
}

/**
 * Browsers send Origin on every POST and PUT, same-site or not. Requiring it to match
 * the host refuses requests forged from another site.
 */
export function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

const cookieBase = {
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
} as const;

export function startSession(response: NextResponse, username: string) {
  const payload = Buffer.from(
    JSON.stringify({ u: username, exp: Date.now() + SESSION_SECONDS * 1000 })
  ).toString("base64url");
  response.cookies.set(SESSION_COOKIE, `${payload}.${sign(payload)}`, {
    ...cookieBase,
    httpOnly: true,
    maxAge: SESSION_SECONDS,
  });
  response.cookies.set(EDITOR_COOKIE, "1", { ...cookieBase, maxAge: SESSION_SECONDS });
}

export function endSession(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", { ...cookieBase, httpOnly: true, maxAge: 0 });
  response.cookies.set(EDITOR_COOKIE, "", { ...cookieBase, maxAge: 0 });
}
