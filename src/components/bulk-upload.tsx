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

const REQUIRED_COLUMNS = ["stage", "sourcingDealNo"];

const SAMPLE_CSV = `stage,sourcingDealNo,pickup,location,accessPoint,desktop,ipTelephonyEpbxDevices,laptop,mixEWaste,mixPeripherals,mobile,router,server,switch,tablet,tftMonitor,actualPickupDate,actualDeliveredDate
Picked Up,SD-1001,John's Warehouse,Mumbai,2,3,0,5,1,2,4,0,1,0,3,2,2026-08-01,2026-08-05
In Transit,SD-1002,ABC Logistics,Delhi,0,1,0,2,0,0,3,1,0,0,1,0,2026-08-10,
Delivered,SD-1003,XYZ Depot,Chennai,1,0,0,0,4,0,0,0,0,0,0,1,2026-08-12,2026-08-15`;

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

export function BulkUpload() {
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
      const res = await fetch("/api/pickup-requests/import", {
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
            Bulk Upload
          </SheetTitle>
          <SheetDescription>
            Import pickup requests from a CSV or Excel file.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4">
          {/* Required columns hint */}
          <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-sm">
            <p className="font-medium text-foreground">Required columns</p>
            <code className="mt-1 block text-xs leading-relaxed text-muted-foreground">
              {REQUIRED_COLUMNS.join(", ")}, optional: pickup, location,
              device counts (Access Point, Desktop, Laptop, ...),
              actualPickupDate, actualDeliveredDate
            </code>
          </div>

          {/* Drop zone */}
          <div
            className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40 hover:bg-muted/30"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <div className={`flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform ${dragOver ? "scale-110" : ""}`}>
              <UploadCloud className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {dragOver ? "Drop here" : (file?.name ?? "Drag & drop your file")}
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

          {/* Selected file chip */}
          {file && (
            <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm">
              <FileSpreadsheet className="size-4 text-green-600" />
              <span className="min-w-0 flex-1 truncate font-medium">{file.name}</span>
              <button
                onClick={() => { setFile(null); setResult(null); setError(null); if (fileRef.current) fileRef.current.value = ""; }}
                className="shrink-0 text-muted-foreground hover:text-foreground"
                aria-label="Remove file"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          {/* Import button */}
          <Button
            onClick={handleImport}
            disabled={!file || loading}
            className="w-full"
          >
            {loading ? (
              <><Loader2 className="size-4 animate-spin" /> Importing...</>
            ) : (
              <><FileUp className="size-4" /> Import File</>
            )}
          </Button>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success */}
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
                  {result.duplicates === 1 ? "" : "s"} skipped (same
                  sourcingDealNo already exists).
                </p>
              )}
              {result.skipped && result.skipped.length > 0 && (
                <ul className="list-inside list-disc text-xs text-muted-foreground">
                  {result.skipped.map((s) => (
                    <li key={s.row}>Row {s.row}: {s.reason}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Sample CSV */}
          <details className="text-sm">
            <summary className="cursor-pointer font-medium text-muted-foreground">
              View sample CSV format
            </summary>
            <pre className="mt-2 overflow-x-auto rounded-md bg-background p-2 text-[10px] leading-tight">
              {SAMPLE_CSV}
            </pre>
          </details>
        </div>
      </SheetContent>
    </Sheet>
  );
}
