import { revalidatePath, revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { isEditor, isSameOrigin } from "@/lib/auth";
import { CONTENT_TAG, loadContent, saveContent, StorageNotConfiguredError } from "@/lib/content";
import { validateContent } from "@/lib/content-model";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

/** The current copy, for the editor to start from. */
export async function GET(request: NextRequest) {
  if (!isEditor(request)) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401, headers: noStore });
  }
  return NextResponse.json({ content: await loadContent() }, { headers: noStore });
}

/** Saves the whole copy and republishes the home page. */
export async function PUT(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if (!isEditor(request)) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }

  let body: { content?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const result = validateContent(body.content);
  if (!result.ok) {
    return NextResponse.json({ error: result.error, field: result.field }, { status: 422 });
  }

  try {
    await saveContent(result.content);
  } catch (error) {
    console.error("Saving the site copy failed:", error);
    const notSetUp = error instanceof StorageNotConfiguredError;
    return NextResponse.json(
      {
        error: notSetUp
          ? "Saving isn’t set up on this server yet."
          : "The changes could not be saved. Please try again.",
      },
      { status: notSetUp ? 503 : 502 }
    );
  }

  revalidateTag(CONTENT_TAG);
  revalidatePath("/");
  return NextResponse.json({ ok: true, content: result.content });
}
