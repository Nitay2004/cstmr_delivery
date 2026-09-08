"use client";

import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  FileUp,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";

interface Props {
  apiPath: string;
  title?: string;
  description: string;
  requiredColumns: string;
  optionalColumns?: string;
  sampleCsv: string;
}

interface SkippedRow {
  row: number;
  reason: string;
}

interface ImportResult {
  imported?: number;
  total?: number;
  duplicates?: number;
  skipped?: SkippedRow[];
  headers?: string[];
  error?: string;
}

export function ModuleBulkUpload({
  apiPath,
  title = "Bulk Upload",
  description,
  requiredColumns,
  optionalColumns,
  sampleCsv,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const selectFile = useCallback((selected: File) => {
    setFile(selected);
    setError(null);
    setResult(null);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) selectFile(selected);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const selected = e.dataTransfer.files?.[0];
    if (selected) selectFile(selected);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(apiPath, {
        method: "POST",
        body: formData,
      });
      const data: ImportResult = await res.json();
      if (!res.ok) setError(data.error ?? "Import failed");
      else setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setFile(null);
      setResult(null);
      setError(null);
      setDragOver(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger render={<Button size="lg" />}>
        <FileUp className="size-4" />
        Bulk Upload
      </SheetTrigger>

      <SheetContent side="right" showCloseButton>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileSpreadsheet className="size-5 text-primary" />
            {title}
          </SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4">
          <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-sm">
            <p className="font-medium text-foreground">Required columns</p>
            <code className="mt-1 block text-xs leading-relaxed text-muted-foreground">
              {requiredColumns}
              {optionalColumns ? `, optional: ${optionalColumns}` : ""}
            </code>
          </div>

          <div
            className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40 hover:bg-muted/30"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <div
              className={`flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform ${
                dragOver ? "scale-110" : ""
              }`}
            >
              <UploadCloud className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {dragOver
                  ? "Drop here"
                  : (file?.name ?? "Drag & drop your file")}
              </p>
              <p className="text-xs text-muted-foreground">or click to browse</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt,.xlsx,.xls"
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={handleFileChange}
            />
          </div>

          {file && (
            <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm">
              <FileSpreadsheet className="size-4 text-green-600" />
              <span className="min-w-0 flex-1 truncate font-medium">
                {file.name}
              </span>
              <button
                onClick={() => {
                  setFile(null);
                  setResult(null);
                  setError(null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="shrink-0 text-muted-foreground hover:text-foreground"
                aria-label="Remove file"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          <Button
            onClick={handleImport}
            disabled={!file || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Importing...
              </>
            ) : (
              <>
                <FileUp className="size-4" /> Import File
              </>
            )}
          </Button>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && !error && (
            <div className="space-y-2 rounded-lg border border-green-600/30 bg-green-50 p-3 text-sm dark:bg-green-600/10">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle2 className="size-4 shrink-0" />
                <span className="font-semibold">
                  Imported {result.imported} of {result.total} rows
                </span>
              </div>
              {result.duplicates && result.duplicates > 0 && (
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  {result.duplicates} duplicate row
                  {result.duplicates === 1 ? "" : "s"} skipped.
                </p>
              )}
              {result.skipped && result.skipped.length > 0 && (
                <ul className="list-inside list-disc text-xs text-muted-foreground">
                  {result.skipped.map((s) => (
                    <li key={s.row}>
                      Row {s.row}: {s.reason}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <details className="text-sm">
            <summary className="cursor-pointer font-medium text-muted-foreground">
              View sample CSV format
            </summary>
            <pre className="mt-2 overflow-x-auto rounded-md bg-background p-2 text-[10px] leading-tight">
              {sampleCsv}
            </pre>
          </details>
        </div>
      </SheetContent>
    </Sheet>
  );
}