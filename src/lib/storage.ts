import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET ?? "attachments";

function getClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY to your environment."
    );
  }
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}

export type SavedFile = {
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
};

export function buildStoragePath(folder: string, ext: string): string {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${folder}/${id}${ext || ""}`.replace(/^\/+/, "");
}

export function getPublicUrl(path: string): string {
  const { data } = getClient().storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadFile(
  folder: string,
  file: File
): Promise<SavedFile> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const extMatch = /\.([a-zA-Z0-9]+)$/.exec(file.name);
  const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : "";
  const storagePath = buildStoragePath(folder, ext);

  const { error } = await getClient()
    .storage.from(STORAGE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  return {
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type || "application/octet-stream",
    storagePath: getPublicUrl(storagePath),
  };
}

export async function deleteFileByPath(storagePath: string): Promise<void> {
  if (!storagePath) return;
  const marker = "/object/public/";
  const idx = storagePath.lastIndexOf(marker);
  const objectKey =
    idx !== -1 ? storagePath.slice(idx + marker.length) : storagePath;
  await getClient().storage.from(STORAGE_BUCKET).remove([objectKey]);
}
