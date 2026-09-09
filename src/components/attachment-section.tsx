"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Download,
  FileText,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  Trash2,
  Upload,
  X,
} from "lucide-react";

export interface AttachmentFile {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  category?: string;
}

export interface StagedFile {
  key: string;
  file: File;
  category?: string;
}

export type AttachmentModule =
  | "quote"
  | "purchase-order"
  | "payment"
  | "pickup"
  | "data-wiping"
  | "certificate"
  | "grn";

interface Props {
  title: string;
  module: AttachmentModule;
  entityId?: string;
  files: AttachmentFile[];
  onChanged: () => void;
  category?: string;
  uploadLabel?: string;
  stagedFiles?: StagedFile[];
  onStageFiles?: (files: File[]) => void;
  onUnstageFile?: (key: string) => void;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(fileName: string) {
  return /\.(jpe?g|png)$/i.test(fileName) ? (
    <ImageIcon className="size-4 shrink-0 text-muted-foreground" />
  ) : (
    <FileText className="size-4 shrink-0 text-muted-foreground" />
  );
}

export function AttachmentSection({
  title,
  module,
  entityId,
  files,
  onChanged,
  category,
  uploadLabel,
  stagedFiles = [],
  onStageFiles,
  onUnstageFile,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const shown = category ? files.filter((f) => f.category === category) : files;
  const staged = category
    ? stagedFiles.filter((s) => s.category === category)
    : stagedFiles;

  const handleFiles = async (selected: FileList | null) => {
    if (!selected || selected.length === 0) return;
    const pick = Array.from(selected);
    const invalid = pick.find((f) => !/\.(pdf|jpe?g|png)$/i.test(f.name));
    if (invalid) {
      setError(`"${invalid.name}" — only PDF, JPG, JPEG and PNG are allowed.`);
      return;
    }
    if (onStageFiles) {
      onStageFiles(pick);
      return;
    }
    if (!entityId) {
      setError("Save the record first, then upload files.");
      return;
    }
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("module", module);
    formData.append("entityId", entityId);
    if (category) formData.append("category", category);
    pick.forEach((f) => formData.append("files", f));
    try {
      const res = await fetch("/api/attachments", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (file: AttachmentFile) => {
    setDeletingId(file.id);
    setError(null);
    try {
      const res = await fetch(`/api/attachments/${file.id}?module=${module}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
        <Paperclip className="size-4" />
        {uploadLabel ?? title}
        <span className="ml-auto text-xs font-normal text-muted-foreground">
          {shown.length + staged.length} file
          {shown.length + staged.length === 1 ? "" : "s"}
        </span>
      </div>

      {error && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mb-3 flex flex-col gap-2">
        {staged.length > 0 && (
          <>
            {staged.map((s) => (
              <div
                key={s.key}
                className="flex items-center gap-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-2.5"
              >
                {fileIcon(s.file.name)}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {s.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(s.file.size)} • will upload on save
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => onUnstageFile?.(s.key)}
                  aria-label={`Remove ${s.file.name}`}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </>
        )}
        {shown.length === 0 && staged.length === 0 ? (
          <p className="text-sm text-muted-foreground">No attachments yet.</p>
        ) : (
          shown.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-3 rounded-lg border border-border p-2.5"
            >
              {fileIcon(f.fileName)}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  <a
                    href={`/api/attachments/file?module=${module}&id=${f.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    {f.fileName}
                  </a>
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatSize(f.fileSize)}
                </p>
              </div>
              <a
                href={`/api/attachments/file?module=${module}&id=${f.id}&download=1`}
                aria-label={`Download ${f.fileName}`}
              >
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Download className="size-4" />
                </Button>
              </a>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive hover:text-destructive"
                onClick={() => handleDelete(f)}
                disabled={deletingId === f.id}
                aria-label={`Delete ${f.fileName}`}
              >
                {deletingId === f.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </Button>
            </div>
          ))
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full"
      >
        {uploading ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Uploading...
          </>
        ) : (
          <>
            <Upload className="size-4" /> Upload files
          </>
        )}
      </Button>
      <p className="mt-1.5 text-xs text-muted-foreground">
        PDF, JPG, JPEG or PNG files only.
        {onStageFiles ? " Selected files will upload after saving." : ""}
      </p>
    </div>
  );
}