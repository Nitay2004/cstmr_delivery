import { randomUUID } from "node:crypto";
import { uploadFile, deleteFileByPath } from "@/lib/storage";

export const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"];
export const ALLOWED_MIMES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

export const UPLOAD_FOLDER = "uploads";

export function isAllowedFile(file: File): boolean {
  const name = (file.name || "").toLowerCase();
  const ext = name.slice(name.lastIndexOf("."));
  const mime = (file.type || "").toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext) || ALLOWED_MIMES.has(mime);
}

export async function saveUploadedFile(
  file: File
): Promise<{ fileName: string; fileSize: number; mimeType: string; storagePath: string }> {
  const folder = `${UPLOAD_FOLDER}/${randomUUID()}`;
  return uploadFile(folder, file);
}

export async function deleteUploadedFile(storagePath: string): Promise<void> {
  await deleteFileByPath(storagePath);
}
