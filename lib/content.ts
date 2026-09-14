import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { get, put } from "@vercel/blob";
import { unstable_cache } from "next/cache";
import { type SiteContent, withDefaults } from "./content-model";

/**
 * Where the home page's edited copy lives.
 *
 * - Production: a private Vercel Blob store (BLOB_READ_WRITE_TOKEN, added to the project
 *   when the store is connected). Every save also writes a dated copy under
 *   content/history/, so an unwanted change can be put back.
 * - Local development without a store: .data/content.json (gitignored).
 * - On Vercel with no store connected: the defaults from lib/site.ts render, and saving
 *   reports that storage is not set up.
 *
 * The page reads through a cache tagged CONTENT_TAG, so it stays static for visitors;
 * a save revalidates the tag and the page.
 */

export const CONTENT_TAG = "site-content";

const BLOB_PATH = "content/site.json";
const LOCAL_DIR = path.join(process.cwd(), ".data");

export class StorageNotConfiguredError extends Error {
  constructor() {
    super("No content storage is connected to this deployment.");
  }
}

const useBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
const stamp = () => new Date().toISOString().replace(/[:.]/g, "-");

async function readStored(): Promise<unknown> {
  if (useBlob()) {
    // useCache: false reads straight from storage, so a save is never followed by a
    // regeneration that picks up the previous copy from the CDN.
    const result = await get(BLOB_PATH, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200) return null;
    return JSON.parse(await new Response(result.stream).text());
  }
  if (process.env.VERCEL) return null;
  try {
    return JSON.parse(await readFile(path.join(LOCAL_DIR, "content.json"), "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

/** The current copy, read fresh. For the editor, which must not start from a stale copy. */
export async function loadContent(): Promise<SiteContent> {
  return withDefaults(await readStored());
}

/** The current copy, cached until the next save. For rendering the page. */
export const getContent = unstable_cache(loadContent, [CONTENT_TAG], { tags: [CONTENT_TAG] });

export async function saveContent(content: SiteContent): Promise<void> {
  const json = JSON.stringify(content, null, 2);

  if (useBlob()) {
    const options = { access: "private", contentType: "application/json" } as const;
    await put(BLOB_PATH, json, { ...options, allowOverwrite: true });
    await put(`content/history/${stamp()}.json`, json, options);
    return;
  }
  if (process.env.VERCEL) throw new StorageNotConfiguredError();

  await mkdir(path.join(LOCAL_DIR, "history"), { recursive: true });
  await writeFile(path.join(LOCAL_DIR, "content.json"), json);
  await writeFile(path.join(LOCAL_DIR, "history", `${stamp()}.json`), json);
}
