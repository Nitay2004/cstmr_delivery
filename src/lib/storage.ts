import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET ?? "attachments";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment."
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

export type SavedFile = {
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
};

export function buildStoragePath(
  folder: string,
  ext: string
): string {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${folder}/${id}${ext || ""}`.replace(/^\/+/, "");
}

export function getPublicUrl(path: string): string {
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);
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

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
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
  // Extract the object key from a public URL if present.
  const marker = "/object/public/";
  const idx = storagePath.lastIndexOf(marker);
  const objectKey = idx !== -1 ? storagePath.slice(idx + marker.length) : storagePath;
  await supabase.storage.from(STORAGE_BUCKET).remove([objectKey]);
}
