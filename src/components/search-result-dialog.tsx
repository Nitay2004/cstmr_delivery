"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowUpRight,
  BadgeCheck,
  ClipboardList,
  CreditCard,
  Cpu,
  FileSignature,
  FileText,
  HardDrive,
  LayoutGrid,
  Loader2,
  PackageOpen,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PICKUP_DEVICE_FIELDS } from "@/lib/pickup-devices";
import type { SearchResult } from "@/app/api/search/route";

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  pickup: PackageOpen,
  quote: FileText,
  po: FileSignature,
  payment: CreditCard,
  dataWiping: HardDrive,
  device: Cpu,
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
  device: [
    { key: "serialNumber", label: "Manufacturer Serial Number" },
    { key: "assetType", label: "Asset Type" },
    { key: "pickupId", label: "Pickup ID / Lot No." },
    { key: "hddSerialNumber", label: "HDD Serial Number" },
    { key: "hddAvailable", label: "HDD Available" },
    { key: "wiped", label: "Wiped" },
    { key: "wipedSoftware", label: "Wiped Software" },
    { key: "wipedDate", label: "Wiped Date" },
    { key: "size", label: "Size" },
    { key: "remarks", label: "Remarks" },
    { key: "pdfName", label: "PDF Name" },
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

interface RelatedConfig {
  title: string;
  fields: FieldDef[];
}

const RELATED_CONFIG: Record<string, RelatedConfig> = {
  pickupRequest: {
    title: "Pickup Request",
    fields: [
      { key: "stage", label: "Stage", format: "badge" },
      { key: "sourcingDealNo", label: "Sourcing Deal No." },
      { key: "pickup", label: "Pickup" },
      { key: "location", label: "Location" },
      ...PICKUP_DEVICE_FIELDS.map((f) => ({
        key: f.key,
        label: f.label,
        format: "number" as const,
      })),
    ],
  },
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

interface FileEntry {
  id: string;
  fileName?: string | null;
  storagePath?: string | null;
}

function asArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
}

function FileLinks({
  files,
  module,
}: {
  files: unknown;
  module: string;
}) {
  const list = asArray(files) as unknown as FileEntry[];
  if (list.length === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex flex-col gap-1">
      {list.map((f) => (
        <a
          key={f.id}
          href={`/api/attachments/file?module=${module}&id=${f.id}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex max-w-44 items-center gap-1 truncate font-medium text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
          title="Open attachment"
        >
          <FileText className="size-3.5 shrink-0" />
          <span className="truncate">{f.fileName || "PDF"}</span>
        </a>
      ))}
    </div>
  );
}

interface RelatedColumn {
  key: string;
  label: string;
  format?: FieldFormat;
  render?: (record: Record<string, unknown>) => React.ReactNode;
}

function cellValue(value: unknown, format?: FieldFormat): React.ReactNode {
  if (format === "badge" && !isEmpty(value)) {
    return (
      <Badge variant="outline" className="font-medium">
        {String(value)}
      </Badge>
    );
  }
  const text = formatValue(value, format);
  return text || <span className="text-muted-foreground">—</span>;
}

function RelatedTable({
  title,
  columns,
  records,
}: {
  title: string;
  columns: RelatedColumn[];
  records: Record<string, unknown>[];
}) {
  if (!records.length) return null;
  return (
    <div className="overflow-hidden rounded-lg border border-border/60">
      <div className="border-b border-border/50 bg-muted/30 px-3 py-1.5 text-xs font-medium text-foreground">
        {title}{" "}
        <span className="text-muted-foreground">({records.length})</span>
      </div>
      <div className="max-h-72 overflow-auto">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className="whitespace-nowrap text-xs"
                >
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((r, i) => (
              <TableRow key={String(r.id ?? i)}>
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    className="whitespace-nowrap py-2 align-top"
                  >
                    {col.render ? col.render(r) : cellValue(r[col.key], col.format)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function PickupRelatedTables({ related }: { related: Record<string, unknown> }) {
  const quotes = asArray(related.quotes);
  const purchaseOrders = asArray(related.purchaseOrders);
  const payments = asArray(related.payments);
  const certificates = asArray(related.certificates);
  const dataWipings = asArray(related.dataWipings);
  const grns = asArray(related.grns);
  const pickupFiles = asArray(related.files) as unknown as FileEntry[];
  const devices = asArray(related.devices);

  const anyTable = [
    quotes,
    purchaseOrders,
    payments,
    certificates,
    dataWipings,
    grns,
    devices,
  ].some((arr) => arr.length > 0);

  return (
    <div className="flex flex-col gap-3">
      {pickupFiles.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border/60">
          <div className="border-b border-border/50 bg-muted/30 px-3 py-1.5 text-xs font-medium text-foreground">
            Pickup Files{" "}
            <span className="text-muted-foreground">({pickupFiles.length})</span>
          </div>
          <div className="flex flex-col gap-1.5 p-3">
            {pickupFiles.map((f) => (
              <a
                key={f.id}
                href={`/api/attachments/file?module=pickup&id=${f.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 truncate font-medium text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
                title="Open file"
              >
                <FileText className="size-4 shrink-0" />
                <span className="truncate">{f.fileName || "File"}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {anyTable && (
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Related Records
        </div>
      )}

      <RelatedTable
        title="Quotes"
        records={quotes}
        columns={[
          { key: "stage", label: "Stage", format: "badge" },
          { key: "quoteNo", label: "Quote No." },
          { key: "totalAmount", label: "Total", format: "amount" },
          { key: "locationCode", label: "Location Code" },
          {
            key: "files",
            label: "Files",
            render: (r) => <FileLinks files={r.files} module="quote" />,
          },
        ]}
      />

      <RelatedTable
        title="Purchase Orders"
        records={purchaseOrders}
        columns={[
          { key: "stage", label: "Stage", format: "badge" },
          { key: "purchaseOrderNo", label: "PO No." },
          { key: "quoteNo", label: "Quote No." },
          { key: "locationCode", label: "Location Code" },
          {
            key: "files",
            label: "Files",
            render: (r) => (
              <FileLinks files={r.files} module="purchase-order" />
            ),
          },
        ]}
      />

      <RelatedTable
        title="Payments"
        records={payments}
        columns={[
          { key: "payment", label: "Payment" },
          { key: "purchaseOrderNo", label: "PO No." },
          { key: "totalInvoiceAmount", label: "Invoice", format: "amount" },
          { key: "totalPaymentDone", label: "Paid", format: "amount" },
          { key: "balanceAmount", label: "Balance", format: "amount" },
          { key: "stage", label: "Stage", format: "badge" },
          {
            key: "files",
            label: "Files",
            render: (r) => <FileLinks files={r.files} module="payment" />,
          },
        ]}
      />

      <RelatedTable
        title="Certificates"
        records={certificates}
        columns={[
          { key: "status", label: "Status", format: "badge" },
          { key: "sourcingDealNo", label: "Sourcing Deal No." },
          {
            key: "files",
            label: "PDFs",
            render: (r) => (
              <FileLinks files={r.files} module="certificate" />
            ),
          },
        ]}
      />

      <RelatedTable
        title="Data Wiping"
        records={dataWipings}
        columns={[
          { key: "status", label: "Status", format: "badge" },
          { key: "dataWipingId", label: "Data Wiping ID" },
          { key: "laptop", label: "Laptop", format: "number" },
          { key: "desktop", label: "Desktop", format: "number" },
          { key: "total", label: "Total", format: "number" },
          {
            key: "files",
            label: "Files",
            render: (r) => <FileLinks files={r.files} module="data-wiping" />,
          },
        ]}
      />

      <RelatedTable
        title="Chain of Custody / GRN"
        records={grns}
        columns={[
          { key: "stage", label: "Stage", format: "badge" },
          { key: "grnDetails", label: "GRN Details" },
          { key: "invoiceNumber", label: "Invoice No." },
          { key: "invoiceDate", label: "Invoice Date" },
          {
            key: "files",
            label: "Files",
            render: (r) => <FileLinks files={r.files} module="grn" />,
          },
        ]}
      />

      <RelatedTable
        title="Assets / Serial Numbers"
        records={devices}
        columns={[
          { key: "serialNumber", label: "Serial Number" },
          { key: "assetType", label: "Asset Type" },
          { key: "hddSerialNumber", label: "HDD Serial No." },
          { key: "wiped", label: "Wiped" },
          { key: "hddAvailable", label: "HDD Available" },
          {
            key: "pdf",
            label: "PDF",
            render: (r) =>
              r.id && r.pdfName ? (
                <a
                  href={`/api/data-wiping-master/file?assetId=${String(r.id)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex max-w-44 items-center gap-1 truncate font-medium text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
                  title="Open PDF"
                >
                  <FileText className="size-3.5 shrink-0" />
                  <span className="truncate">{String(r.pdfName)}</span>
                </a>
              ) : (
                <span className="text-muted-foreground">—</span>
              ),
          },
        ]}
      />
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
  const [related, setRelated] = React.useState<Record<string, unknown> | null>(
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
        if (data.related) setRelated(data.related);
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

  const hasPickupRelated =
    (result.type === "pickup" || result.type === "device") && related;
  const pickupRequestRecord =
    result.type === "device"
      ? (related?.["pickupRequest"] as
          | Record<string, unknown>
          | null
          | undefined) ?? null
      : null;

  return (
    <>
      <DialogHeader className="flex-none border-b border-border/50 p-4">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <IconComponent className="size-4 text-primary" />
          {result.typeLabel}
        </div>
        <DialogTitle className="mt-0.5 break-words pr-6 text-lg">
          {result.title}
        </DialogTitle>
        {result.subtitle && (
          <DialogDescription className="break-words">
            {result.subtitle}
          </DialogDescription>
        )}
      </DialogHeader>

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
          <div className="flex flex-col gap-3 py-1">
            <div className="divide-y divide-border/60">
              {fields.map((field) => (
                <FieldRow
                  key={field.key}
                  label={field.label}
                  value={record?.[field.key]}
                  format={field.format}
                />
              ))}
            </div>

            {pickupRequestRecord && (
              <div className="mt-4">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Pickup Details
                </div>
                <div className="rounded-lg border border-border/60">
                  <div className="border-b border-border/50 bg-muted/30 px-3 py-1.5 text-xs font-medium text-foreground">
                    {RELATED_CONFIG.pickupRequest.title}
                  </div>
                  <div className="divide-y divide-border/60">
                    {RELATED_CONFIG.pickupRequest.fields.map((field) => (
                      <FieldRow
                        key={field.key}
                        label={field.label}
                        value={pickupRequestRecord[field.key]}
                        format={field.format}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {hasPickupRelated && (
              <div className="mt-4">
                <PickupRelatedTables related={related} />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-none border-t border-border/50 p-4">
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
      </div>
    </>
  );
}

interface Props {
  result: SearchResult | null;
  onOpenChange: (open: boolean) => void;
}

export function SearchResultDialog({ result, onOpenChange }: Props) {
  return (
    <Dialog open={!!result} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex max-h-[85vh] w-full max-w-3xl flex-col gap-0 p-0"
      >
        {result ? (
          <ResultBody
            key={result.id}
            result={result}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}