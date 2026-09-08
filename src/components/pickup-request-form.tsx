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
import {
  AttachmentSection,
  type AttachmentFile,
} from "@/components/attachment-section";
import { useUser, can } from "@/components/user-provider";

export interface PickupRequestFormValues {
  id?: string;
  stage: string;
  sourcingDealNo: string;
  pickup: string;
  location: string;
  actualPickupDate: string;
  actualDeliveredDate: string;
  files?: AttachmentFile[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initial?: PickupRequestFormValues | null;
  onSaved: () => void;
}

const empty: PickupRequestFormValues = {
  stage: "",
  sourcingDealNo: "",
  pickup: "",
  location: "",
  actualPickupDate: "",
  actualDeliveredDate: "",
};

function toDateInput(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
}

export function PickupRequestForm({
  open,
  onOpenChange,
  mode,
  initial,
  onSaved,
}: Props) {
  const { user } = useUser();
  const canUpload = can(user, "uploadFiles");
  const [files, setFiles] = useState<AttachmentFile[]>(() => {
    const raw = initial?.files;
    return Array.isArray(raw) ? (raw as AttachmentFile[]) : [];
  });
  const [values, setValues] = useState<PickupRequestFormValues>(() => {
    if (!initial) return empty;
    return {
      stage: initial.stage ?? "",
      sourcingDealNo: initial.sourcingDealNo ?? "",
      pickup: initial.pickup ?? "",
      location: initial.location ?? "",
      actualPickupDate: toDateInput(initial.actualPickupDate),
      actualDeliveredDate: toDateInput(initial.actualDeliveredDate),
    };
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof PickupRequestFormValues, value: string) =>
    setValues((v) => ({ ...v, [key]: value }));

  const refreshFiles = async () => {
    if (!initial?.id) return;
    try {
      const res = await fetch("/api/pickup-requests");
      const data = await res.json();
      const row = (data.requests as
        | { id: string; files?: unknown }[]
        | undefined)?.find((r) => r.id === initial.id);
      if (row && Array.isArray(row.files)) {
        setFiles(row.files as AttachmentFile[]);
      }
    } catch {
      // ignore refresh errors; files stay unchanged
    }
  };

  const handleSubmit = async () => {
    if (!values.stage.trim() || !values.sourcingDealNo.trim()) {
      setError("Stage and Sourcing Deal No. are required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url =
        mode === "create"
          ? "/api/pickup-requests"
          : `/api/pickup-requests/${initial?.id}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
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
            {mode === "create" ? "New Pickup Request" : "Edit Pickup Request"}
          </SheetTitle>
          <SheetDescription>
            Fill in the details below. Fields marked * are required.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Stage *</label>
            <Input
              value={values.stage}
              onChange={(e) => set("stage", e.target.value)}
              placeholder="e.g. Picked Up, In Transit, Delivered"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Sourcing Deal No. *</label>
            <Input
              value={values.sourcingDealNo}
              onChange={(e) => set("sourcingDealNo", e.target.value)}
              placeholder="e.g. SD-1001"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Pickup</label>
            <Input
              value={values.pickup}
              onChange={(e) => set("pickup", e.target.value)}
              placeholder="e.g. John's Warehouse"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Location</label>
            <Input
              value={values.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="e.g. Mumbai"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Actual Pickup Date</label>
            <Input
              type="date"
              value={values.actualPickupDate}
              onChange={(e) => set("actualPickupDate", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Actual Delivered Date</label>
            <Input
              type="date"
              value={values.actualDeliveredDate}
              onChange={(e) => set("actualDeliveredDate", e.target.value)}
            />
          </div>

          {mode === "edit" && canUpload && typeof initial?.id === "string" && (
            <AttachmentSection
              title="Pickup Request"
              module="pickup"
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

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="size-4" />
                {mode === "create" ? "Create Request" : "Save Changes"}
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
