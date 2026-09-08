import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"];
export const ALLOWED_MIMES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

export const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export function isAllowedFile(file: File): boolean {
  const ext = path.extname(file.name).toLowerCase();
  const mime = (file.type || "").toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext) || ALLOWED_MIMES.has(mime);
}

export async function saveUploadedFile(
  file: File
): Promise<{ fileName: string; fileSize: number; mimeType: string; storagePath: string }> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name).toLowerCase();
  const storeName = `${randomUUID()}${ext}`;
  await writeFile(path.join(UPLOAD_DIR, storeName), buffer);

  return {
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type || "application/octet-stream",
    storagePath: `/uploads/${storeName}`,
  };
}

export async function deleteUploadedFile(storagePath: string): Promise<void> {
  if (!storagePath || !storagePath.startsWith("/uploads/")) return;
  const name = path.basename(storagePath);
  try {
    await unlink(path.join(UPLOAD_DIR, name));
  } catch {
    // ignore: file may not exist on disk
  }
}