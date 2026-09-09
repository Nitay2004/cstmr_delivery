"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { AlertCircle, Loader2, Save } from "lucide-react";
import type { FormField } from "@/lib/module-config";
import {
  AttachmentSection,
  type AttachmentFile,
  type AttachmentModule,
} from "@/components/attachment-section";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initial?: Record<string, unknown> | null;
  fields: FormField[];
  apiPath: string;
  title: string;
  attach?: {
    module: AttachmentModule;
    title: string;
    categories?: { key: string; label: string }[];
  } | null;
  onSaved: () => void;
}

interface PendingFile {
  key: string;
  file: File;
  category?: string;
}

function extractId(data: Record<string, unknown>): string | undefined {
  if (typeof data.id === "string") return data.id;
  for (const value of Object.values(data)) {
    if (value && typeof value === "object") {
      const id = (value as Record<string, unknown>).id;
      if (typeof id === "string") return id;
    }
  }
  return undefined;
}

export function ModuleForm({
  open,
  onOpenChange,
  mode,
  initial,
  fields,
  apiPath,
  title,
  attach,
  onSaved,
}: Props) {
  const [files, setFiles] = useState<AttachmentFile[]>(() => {
    const raw = initial?.files;
    return Array.isArray(raw) ? (raw as AttachmentFile[]) : [];
  });
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {};
    for (const f of fields) {
      const raw = initial?.[f.key];
      v[f.key] =
        raw === null || raw === undefined
          ? ""
          : typeof raw === "number" && f.inputType === "number"
            ? String(raw)
            : String(raw);
    }
    return v;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshFiles = async () => {
    if (!initial?.id) return;
    try {
      const res = await fetch(apiPath);
      const data = await res.json();
      const list = Object.values(data).find((v) => Array.isArray(v)) as
        | { id: string; files?: unknown }[]
        | undefined;
      const row = (list ?? []).find((r) => r.id === initial.id);
      if (row && Array.isArray(row.files)) {
        setFiles(row.files as AttachmentFile[]);
      }
    } catch {
      // ignore refresh errors; files stay unchanged
    }
  };

  const set = (key: string, value: string) =>
    setValues((v) => ({ ...v, [key]: value }));

  const stageFiles = (filesToStage: File[], category?: string) => {
    setError(null);
    setPendingFiles((prev) => [
      ...prev,
      ...filesToStage.map((file, i) => ({
        key: `${category ?? "files"}-${file.name}-${Date.now()}-${i}`,
        file,
        category,
      })),
    ]);
  };

  const unstageFile = (key: string) => {
    setPendingFiles((prev) => prev.filter((p) => p.key !== key));
  };

  const uploadPending = async (
    entityId: string,
    module: string
  ): Promise<boolean> => {
    if (pendingFiles.length === 0) return true;
    const categories = [
      ...new Set(pendingFiles.map((p) => p.category ?? "")),
    ];
    try {
      for (const cat of categories) {
        const group = pendingFiles.filter(
          (p) => (p.category ?? "") === cat
        );
        const formData = new FormData();
        formData.append("module", module);
        formData.append("entityId", entityId);
        if (cat) formData.append("category", cat);
        group.forEach((p) => formData.append("files", p.file));
        const res = await fetch("/api/attachments", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
      }
      setPendingFiles([]);
      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? `Record saved, but file upload failed: ${err.message}`
          : "Record saved, but file upload failed"
      );
      return false;
    }
  };

  const handleSubmit = async () => {
    for (const f of fields) {
      if (f.required && !values[f.key]?.trim()) {
        setError(`${f.label} is required`);
        return;
      }
    }
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {};
      for (const f of fields) {
        const raw = (values[f.key] ?? "").trim();
        if (f.inputType === "number") {
          body[f.key] = raw === "" ? null : Number(raw);
        } else {
          body[f.key] = raw === "" ? null : raw;
        }
      }

      const url = mode === "create" ? apiPath : `${apiPath}/${initial?.id}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save");
        return;
      }

      const entityId = mode === "create" ? extractId(data) : initial?.id;
      if (attach && pendingFiles.length > 0 && typeof entityId === "string") {
        const uploaded = await uploadPending(entityId, attach.module);
        if (!uploaded) {
          onSaved();
          return;
        }
      }

      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton>
        <SheetHeader>
          <SheetTitle>
            {mode === "create" ? `New ${title}` : `Edit ${title}`}
          </SheetTitle>
          <SheetDescription>
            Fill in the details below. Fields marked * are required.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <label className="text-sm font-medium">
                {f.label}
                {f.required ? " *" : ""}
              </label>
              {f.options ? (
                <select
                  value={values[f.key] ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                  className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80"
                >
                  <option value="">Select {f.label.toLowerCase()}...</option>
                  {f.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  type={f.inputType === "number" ? "number" : f.inputType === "date" ? "date" : "text"}
                  value={values[f.key] ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                  placeholder={f.placeholder}
                />
              )}
            </div>
          ))}

          {attach && (
            attach.categories && attach.categories.length > 0 ? (
              attach.categories.map((cat) => (
                <AttachmentSection
                  key={cat.key}
                  title={`${attach.title} — ${cat.label}`}
                  module={attach.module}
                  entityId={mode === "edit" ? String(initial?.id) : undefined}
                  files={files}
                  category={cat.key}
                  onChanged={refreshFiles}
                  stagedFiles={pendingFiles.filter(
                    (p) => p.category === cat.key
                  )}
                  onStageFiles={(f) => stageFiles(f, cat.key)}
                  onUnstageFile={unstageFile}
                />
              ))
            ) : (
              <AttachmentSection
                title={attach.title}
                module={attach.module}
                entityId={mode === "edit" ? String(initial?.id) : undefined}
                files={files}
                onChanged={refreshFiles}
                stagedFiles={pendingFiles.filter((p) => !p.category)}
                onStageFiles={(f) => stageFiles(f, undefined)}
                onUnstageFile={unstageFile}
              />
            )
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="size-4" />
                {mode === "create" ? `Create ${title}` : "Save Changes"}
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}