"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  Trash2,
  Upload,
} from "lucide-react";

export interface AttachmentFile {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
}

export type AttachmentModule = "quote" | "purchase-order" | "payment";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  module: AttachmentModule;
  entityId: string;
  files: AttachmentFile[];
  onChanged: () => void;
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

export function AttachmentDialog({
  open,
  onOpenChange,
  title,
  module,
  entityId,
  files,
  onChanged,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (selected: FileList | null) => {
    if (!selected || selected.length === 0) return;
    const pick = Array.from(selected);
    const invalid = pick.find((f) => !/\.(pdf|jpe?g|png)$/i.test(f.name));
    if (invalid) {
      setError(`"${invalid.name}" — only PDF, JPG, JPEG and PNG are allowed.`);
      return;
    }
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("module", module);
    formData.append("entityId", entityId);
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
      const res = await fetch(
        `/api/attachments/${file.id}?module=${module}`,
        { method: "DELETE" }
      );
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{title} Attachments</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Paperclip className="size-4" />
            <span>
              {files.length} file{files.length === 1 ? "" : "s"} attached
            </span>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {files.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No attachments yet.
              </p>
            ) : (
              files.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  {fileIcon(f.fileName)}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      <a
                        href={f.storagePath}
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
          <p className="text-xs text-muted-foreground">
            PDF, JPG, JPEG or PNG files only.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}