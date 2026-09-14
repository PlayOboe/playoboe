import { type NextRequest, NextResponse } from "next/server";
import { endSession, isSameOrigin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const response = NextResponse.json({ ok: true });
  endSession(response);
  return response;
}
