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
  attach?: { module: AttachmentModule; title: string } | null;
  onSaved: () => void;
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
      const list = Array.isArray(data.items)
        ? data.items
        : Array.isArray(data.rows)
          ? data.rows
          : ["quotes", "orders", "payments"]
              .map((k) => data[k])
              .find((v) => Array.isArray(v)) ?? [];
      const row = (list as { id: string; files?: unknown }[]).find(
        (r) => r.id === initial.id
      );
      if (row && Array.isArray(row.files)) {
        setFiles(row.files as AttachmentFile[]);
      }
    } catch {
      // ignore refresh errors; files stay unchanged
    }
  };

  const set = (key: string, value: string) =>
    setValues((v) => ({ ...v, [key]: value }));

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
      } else {
        onSaved();
        onOpenChange(false);
      }
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
              <Input
                type={f.inputType === "number" ? "number" : "text"}
                value={values[f.key] ?? ""}
                onChange={(e) => set(f.key, e.target.value)}
                placeholder={f.placeholder}
              />
            </div>
          ))}
          {mode === "edit" && attach && typeof initial?.id === "string" && (
            <AttachmentSection
              title={attach.title}
              module={attach.module}
              entityId={String(initial.id)}
              files={files}
              onChanged={refreshFiles}
            />
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