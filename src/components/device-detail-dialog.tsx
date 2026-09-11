"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertTriangle, FileText, Inbox, Loader2 } from "lucide-react";

interface Item {
  id: string;
  pickupId?: string | null;
  serialNumber?: string | null;
  assetType?: string | null;
  hddSerialNumber?: string | null;
  wiped?: string | null;
  wipedSoftware?: string | null;
  wipedDate?: string | null;
  hddAvailable?: string | null;
  size?: string | null;
  remarks?: string | null;
  pdfName?: string | null;
  storagePath?: string | null;
}

const API_PATH = "/api/data-wiping-master";

const COLUMNS: { key: keyof Item; label: string }[] = [
  { key: "serialNumber", label: "Manufacturer Serial Number" },
  { key: "assetType", label: "Asset Type" },
  { key: "hddSerialNumber", label: "HDD Serial Number" },
  { key: "wiped", label: "Wiped" },
  { key: "wipedSoftware", label: "Wiped Software" },
  { key: "wipedDate", label: "Wiped Date" },
  { key: "hddAvailable", label: "HDD Available" },
  { key: "size", label: "Size" },
  { key: "remarks", label: "Remarks" },
  { key: "pdfName", label: "PDF Name" },
];

function display(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pickup: string;
  deviceType: "Laptop" | "Desktop";
  wiped?: string;
  hddAvailable?: string;
}

export function DeviceDetailDialog({
  open,
  onOpenChange,
  pickup,
  deviceType,
  wiped,
  hddAvailable,
}: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const resetKey = `${open ? "1" : "0"}|${pickup}|${deviceType}|${wiped ?? ""}|${hddAvailable ?? ""}`;
  const [prevKey, setPrevKey] = useState(resetKey);
  if (prevKey !== resetKey) {
    setPrevKey(resetKey);
    setItems([]);
    setTotal(0);
    setLoading(true);
    setError(null);
    setPage(1);
  }

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      pickupId: pickup,
      assetType: deviceType,
    });
    if (wiped) params.set("wiped", wiped);
    if (hddAvailable) params.set("hddAvailable", hddAvailable);
    fetch(`${API_PATH}?${params.toString()}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (controller.signal.aborted) return;
        if (Array.isArray(data.items)) setItems(data.items);
        else setItems([]);
        setTotal(
          typeof data.total === "number"
            ? data.total
            : Array.isArray(data.items)
              ? data.items.length
              : 0
        );
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [open, pickup, deviceType, page, pageSize, wiped, hddAvailable]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);

  const goToPage = (p: number) => {
    setPage(p);
    setLoading(true);
    setError(null);
  };

  const changePageSize = (n: number) => {
    setPageSize(n);
    setPage(1);
    setLoading(true);
    setError(null);
  };

  const filtered =
    typeof wiped === "string" &&
    wiped !== "" &&
    typeof hddAvailable === "string" &&
    hddAvailable !== "";
  const title = filtered
    ? `${deviceType} Data Sanitized — ${pickup || "Unknown Pickup"}`
    : `${deviceType} details — ${pickup || "Unknown Pickup"}`;
  const description = filtered
    ? `${total.toLocaleString("en-IN")} ${deviceType.toLowerCase()}${
        total === 1 ? "" : "s"
      } wiped with HDD available for this pick up.`
    : `${total.toLocaleString("en-IN")} ${deviceType.toLowerCase()}${
        total === 1 ? "" : "s"
      } for this pick up.`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  {COLUMNS.map((col) => (
                    <TableHead key={col.key} className="whitespace-nowrap">
                      {col.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={COLUMNS.length} className="h-40 text-center">
                      <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={COLUMNS.length}
                      className="h-40 text-center text-destructive"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <AlertTriangle className="size-8 text-destructive/60" />
                        <p className="text-sm">{error}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={COLUMNS.length}
                      className="h-40 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Inbox className="size-8 text-muted-foreground/60" />
                        <p className="text-sm font-medium text-foreground">
                          No {deviceType.toLowerCase()} records for this pick up
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((r) => (
                    <TableRow key={r.id} className="hover:bg-muted/50">
                      {COLUMNS.map((col) => (
                        <TableCell
                          key={col.key}
                          className={
                            col.key === "serialNumber"
                              ? "whitespace-nowrap font-medium text-foreground"
                              : "whitespace-nowrap"
                          }
                        >
                            {col.key === "pdfName" ? (
                             r.storagePath ? (
                               <a
                                 href={`/api/data-wiping-master/file?assetId=${r.id}`}
                                 target="_blank"
                                 rel="noreferrer"
                                 className="inline-flex max-w-56 items-center gap-1.5 truncate font-medium text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
                                 title="Open PDF"
                               >
                                 <FileText className="size-4 shrink-0" />
                                 {display(r.pdfName)}
                               </a>
                             ) : (
                               <span className="text-muted-foreground">—</span>
                             )
                          ) : (
                            display(r[col.key])
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="shrink-0">
            {total > 0 && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>
                    Showing {(currentPage - 1) * pageSize + 1}–
                    {Math.min(currentPage * pageSize, total)} of{" "}
                    {total.toLocaleString("en-IN")}
                  </span>
                  <select
                    value={pageSize}
                    onChange={(e) => changePageSize(Number(e.target.value))}
                    className="rounded-md border bg-transparent px-2 py-1 text-sm"
                  >
                    {[5, 10, 20, 50].map((n) => (
                      <option key={n} value={n}>
                        {n} / page
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    disabled={currentPage <= 1}
                    onClick={() => goToPage(Math.max(1, currentPage - 1))}
                  >
                    ←
                  </Button>
                  <span className="px-2 text-sm text-muted-foreground">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                  >
                    →
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}