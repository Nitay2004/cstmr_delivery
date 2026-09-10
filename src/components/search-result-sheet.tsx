"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowUpRight,
  BadgeCheck,
  ClipboardList,
  CreditCard,
  FileSignature,
  FileText,
  HardDrive,
  LayoutGrid,
  Loader2,
  PackageOpen,
  Users,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PICKUP_DEVICE_FIELDS } from "@/lib/pickup-devices";
import type { SearchResult } from "@/app/api/search/route";

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  pickup: PackageOpen,
  quote: FileText,
  po: FileSignature,
  payment: CreditCard,
  dataWiping: HardDrive,
  certificate: BadgeCheck,
  grn: ClipboardList,
  consolidated: LayoutGrid,
  user: Users,
};

type FieldFormat = "date" | "amount" | "badge" | "number";

interface FieldDef {
  key: string;
  label: string;
  format?: FieldFormat;
}

const pickupDeviceFields: FieldDef[] = PICKUP_DEVICE_FIELDS.map((f) => ({
  key: f.key,
  label: f.label,
  format: "number",
}));

const FIELD_CONFIG: Record<string, FieldDef[]> = {
  pickup: [
    { key: "stage", label: "Stage", format: "badge" },
    { key: "sourcingDealNo", label: "Sourcing Deal No." },
    { key: "pickup", label: "Pickup" },
    { key: "location", label: "Location" },
    { key: "actualPickupDate", label: "Actual Pickup Date", format: "date" },
    {
      key: "actualDeliveredDate",
      label: "Actual Delivered Date",
      format: "date",
    },
    ...pickupDeviceFields,
  ],
  quote: [
    { key: "stage", label: "Stage", format: "badge" },
    { key: "sourcingDealNo", label: "Sourcing Deal No." },
    { key: "pickup", label: "Pickup" },
    { key: "quoteNo", label: "Quote No." },
    { key: "totalAmount", label: "Total Amount", format: "amount" },
    { key: "locationCode", label: "Location Code" },
  ],
  po: [
    { key: "stage", label: "Stage", format: "badge" },
    { key: "sourcingDealNo", label: "Sourcing Deal No." },
    { key: "pickup", label: "Pickup" },
    { key: "quoteNo", label: "Quote No." },
    { key: "purchaseOrderNo", label: "Purchase Order No." },
    { key: "locationCode", label: "Location Code" },
  ],
  payment: [
    { key: "stage", label: "Stage", format: "badge" },
    { key: "sourcingDealNo", label: "Sourcing Deal No." },
    { key: "pickup", label: "Pickup" },
    { key: "purchaseOrderNo", label: "Purchase Order No." },
    { key: "payment", label: "Payment" },
    {
      key: "totalInvoiceAmount",
      label: "Total Invoice Amount",
      format: "amount",
    },
    { key: "totalPaymentDone", label: "Total Payment Done", format: "amount" },
    { key: "balanceAmount", label: "Balance Amount", format: "amount" },
  ],
  dataWiping: [
    { key: "status", label: "Status", format: "badge" },
    { key: "sourcingDealNo", label: "Sourcing Deal No." },
    { key: "pickup", label: "Pickup" },
    { key: "dataWipingId", label: "Data Wiping ID" },
    { key: "laptop", label: "Laptop", format: "number" },
    { key: "desktop", label: "Desktop", format: "number" },
    { key: "total", label: "Total", format: "number" },
    {
      key: "laptopSsdHddReceived",
      label: "Laptop SSD/HDD Received",
      format: "number",
    },
    { key: "laptopWiped", label: "Laptop Wiped", format: "number" },
    {
      key: "laptopShreddingDone",
      label: "Laptop Shredding Done",
      format: "number",
    },
    { key: "laptopNotWiped", label: "Laptop Not Wiped", format: "number" },
    {
      key: "desktopSsdHddReceived",
      label: "Desktop SSD/HDD Received",
      format: "number",
    },
    { key: "desktopWiped", label: "Desktop Wiped", format: "number" },
    {
      key: "desktopShreddingDone",
      label: "Desktop Shredding Done",
      format: "number",
    },
    { key: "desktopNotWiped", label: "Desktop Not Wiped", format: "number" },
  ],
  certificate: [
    { key: "status", label: "Status", format: "badge" },
    { key: "sourcingDealNo", label: "Sourcing Deal No." },
    { key: "pickup", label: "Pickup" },
  ],
  grn: [
    { key: "stage", label: "Stage", format: "badge" },
    { key: "sourcingDealNo", label: "Sourcing Deal No." },
    { key: "pickup", label: "Pickup" },
    { key: "grnDetails", label: "GRN Details" },
    { key: "invoiceNumber", label: "Invoice Number" },
    { key: "invoiceDate", label: "Invoice Date" },
    { key: "materialReceivedDate", label: "Material Received Date" },
  ],
  consolidated: [
    { key: "category", label: "Category" },
    { key: "subCategory", label: "Sub-Category" },
    { key: "qty", label: "Qty", format: "number" },
    { key: "amount", label: "Amount", format: "amount" },
  ],
  user: [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role", format: "badge" },
    { key: "createdAt", label: "Created", format: "date" },
  ],
};

function isEmpty(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    value === "" ||
    (typeof value === "string" && value.trim() === "")
  );
}

function formatValue(value: unknown, format?: FieldFormat): string {
  if (isEmpty(value)) return "";
  if (format === "date") {
    const d = new Date(String(value));
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  if (format === "amount") {
    const num = Number(value);
    return isNaN(num) ? String(value) : num.toLocaleString("en-IN");
  }
  return String(value);
}

function FieldRow({
  label,
  value,
  format,
}: {
  label: string;
  value: unknown;
  format?: FieldFormat;
}) {
  if (isEmpty(value)) return null;
  if (format === "badge") {
    return (
      <div className="flex items-center justify-between gap-4 py-2">
        <span className="text-muted-foreground">{label}</span>
        <Badge variant="outline" className="font-medium">
          {String(value)}
        </Badge>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">
        {formatValue(value, format) || "—"}
      </span>
    </div>
  );
}

function ResultBody({
  result,
  onClose,
}: {
  result: SearchResult;
  onClose: () => void;
}) {
  const router = useRouter();
  const [record, setRecord] = React.useState<Record<string, unknown> | null>(
    null
  );
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    fetch(
      `/api/search/detail?type=${encodeURIComponent(
        result.type
      )}&id=${encodeURIComponent(result.id)}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data.record) setRecord(data.record);
        else setError(data.error ?? "Failed to load record");
      })
      .catch(() => {
        if (active) setError("Failed to load record");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [result]);

  const IconComponent = typeIcons[result.type] ?? PackageOpen;
  const fields = FIELD_CONFIG[result.type] ?? [];

  return (
    <>
      <SheetHeader className="border-b border-border/50">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <IconComponent className="size-4 text-primary" />
          {result.typeLabel}
        </div>
        <SheetTitle className="mt-0.5 break-words pr-6 text-lg">
          {result.title}
        </SheetTitle>
        {result.subtitle && (
          <SheetDescription className="break-words">
            {result.subtitle}
          </SheetDescription>
        )}
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-4">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading record...
          </div>
        ) : error ? (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="divide-y divide-border/60 py-1">
            {fields.map((field) => (
              <FieldRow
                key={field.key}
                label={field.label}
                value={record?.[field.key]}
                format={field.format}
              />
            ))}
          </div>
        )}
      </div>

      <SheetFooter className="border-t border-border/50">
        <Button
          className="w-full"
          onClick={() => {
            onClose();
            router.push(result.href);
          }}
        >
          Open in {result.typeLabel}
          <ArrowUpRight />
        </Button>
      </SheetFooter>
    </>
  );
}

interface Props {
  result: SearchResult | null;
  onOpenChange: (open: boolean) => void;
}

export function SearchResultSheet({ result, onOpenChange }: Props) {
  return (
    <Sheet open={!!result} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton
        className="flex max-h-full w-full flex-col gap-0 sm:max-w-md"
      >
        {result ? (
          <ResultBody
            key={result.id}
            result={result}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}