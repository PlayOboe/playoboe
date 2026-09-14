import { type NextRequest, NextResponse } from "next/server";
import { checkCredentials, editingConfigured, isSameOrigin, startSession } from "@/lib/auth";

// A slow brake on password guessing. It lives in memory, so it resets when the server
// instance does — together with the scrypt cost and the delay below it is enough for a
// single-editor site, not a substitute for a strong password.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 8;
const failures = new Map<string, { count: number; since: number }>();

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if (!editingConfigured()) {
    return NextResponse.json({ error: "Editing is not set up on this server." }, { status: 503 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const record = failures.get(ip);
  const current = record && now - record.since < WINDOW_MS ? record : { count: 0, since: now };
  if (current.count >= MAX_FAILURES) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait 15 minutes and try again." },
      { status: 429 }
    );
  }

  let body: { username?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!checkCredentials(body.username, body.password)) {
    failures.set(ip, { count: current.count + 1, since: current.since });
    await new Promise((resolve) => setTimeout(resolve, 600));
    return NextResponse.json({ error: "Wrong username or password." }, { status: 401 });
  }

  failures.delete(ip);
  const response = NextResponse.json({ ok: true });
  startSession(response, String(body.username).trim().toLowerCase());
  return response;
}
