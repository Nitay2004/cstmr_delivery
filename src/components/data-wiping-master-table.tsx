"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  AlertCircle,
  AlertTriangle,
  FileText,
  Inbox,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ModuleForm } from "@/components/module-form";
import { useUser, can } from "@/components/user-provider";
import type { FormField } from "@/lib/module-config";

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

const formFields: FormField[] = [
  { key: "pickupId", label: "Pickup ID / Lot No.", placeholder: "e.g. PICK-2026-000241" },
  {
    key: "serialNumber",
    label: "Manufacturer Serial Number",
    required: true,
    placeholder: "e.g. XYZ12345",
  },
  { key: "assetType", label: "Asset Type", placeholder: "e.g. Laptop" },
  {
    key: "hddSerialNumber",
    label: "HDD Serial Number",
    placeholder: "e.g. SN-0001",
  },
  { key: "wiped", label: "Wiped", placeholder: "e.g. Yes / No" },
  { key: "wipedSoftware", label: "Wiped Software", placeholder: "e.g. KillDisk" },
  { key: "wipedDate", label: "Wiped Date", placeholder: "e.g. 2026-09-10" },
  { key: "hddAvailable", label: "HDD Available", placeholder: "e.g. Yes / No" },
  { key: "size", label: "Size", placeholder: "e.g. 256GB" },
  { key: "remarks", label: "Remarks" },
  { key: "pdfName", label: "PDF Name" },
];

const CELL_RENDER: { key: keyof Item; label: string }[] = [
  { key: "pickupId", label: "Pickup ID / Lot No." },
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

export function DataWipingMasterTable() {
  const { user } = useUser();
  const canCreate = can(user, "createDataWipingMaster");
  const canEdit = can(user, "editDataWipingMaster");
  const canDelete = can(user, "deleteDataWipingMaster");
  const hasActions = canEdit || canDelete;
  const colCount = CELL_RENDER.length + (hasActions ? 1 : 0);

  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formInitial, setFormInitial] = useState<Record<string, unknown> | null>(
    null
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const fetchPage = useCallback(
    async (signal?: AbortSignal) => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (debouncedQuery) params.set("search", debouncedQuery);
      try {
        const res = await fetch(`${API_PATH}?${params.toString()}`, signal ? { signal } : undefined);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load");
        setItems(Array.isArray(data.items) ? data.items : []);
        setTotal(
          typeof data.total === "number" ? data.total : data.items?.length ?? 0
        );
      } catch (err) {
        if (!signal?.aborted) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      }
    },
    [page, pageSize, debouncedQuery]
  );

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (debouncedQuery) params.set("search", debouncedQuery);
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
  }, [page, pageSize, debouncedQuery]);

  const refresh = () => {
    setLoading(true);
    setError(null);
    fetchPage();
  };

  const openCreate = () => {
    setFormMode("create");
    setFormInitial(null);
    setFormOpen(true);
  };

  const openEdit = (r: Item) => {
    setFormMode("edit");
    setFormInitial({ ...r });
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    setActionError(null);
    try {
      const res = await fetch(`${API_PATH}/${deleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete");
      setDeleteId(null);
      if (items.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        refresh();
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete");
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);

  return (
    <Card className="shadow-sm border-border">
      <CardHeader className="flex flex-col gap-4 border-b border-border/50 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg">Data Wiping Master</CardTitle>
          <CardDescription>
            {total.toLocaleString("en-IN")} record
            {total === 1 ? "" : "s"}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="h-9 w-64 pl-8"
            />
          </div>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCcw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          {canCreate && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" />
              New Record
            </Button>
          )}
        </div>
      </CardHeader>

      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            {CELL_RENDER.map((col) => (
              <TableHead key={col.key}>{col.label}</TableHead>
            ))}
            {hasActions && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={colCount} className="h-40 text-center">
                <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell
                colSpan={colCount}
                className="h-40 text-center text-destructive"
              >
                <div className="flex flex-col items-center gap-2">
                  <AlertTriangle className="size-8 text-destructive/60" />
                  <p className="text-sm">{error}</p>
                  <Button variant="outline" size="sm" onClick={refresh}>
                    Try again
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={colCount}
                className="h-40 text-center text-muted-foreground"
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  <Inbox className="size-8 text-muted-foreground/60" />
                  <p className="text-sm font-medium text-foreground">
                    {debouncedQuery ? "No matching records" : "No records yet"}
                  </p>
                  <p className="text-xs">
                    {debouncedQuery
                      ? "Try a different search term."
                      : "Use Bulk Upload above to add records."}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            items.map((r) => (
              <TableRow
                key={r.id}
                className="transition-colors hover:bg-muted/50"
              >
                {CELL_RENDER.map((col) => (
                  <TableCell
                    key={col.key}
                    className={
                      col.key === "serialNumber"
                        ? "font-medium text-foreground"
                        : undefined
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
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(r)}
                        aria-label={`Edit ${String(r.serialNumber ?? r.id)}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setActionError(null);
                          setDeleteId(r.id);
                        }}
                        aria-label={`Delete ${String(r.serialNumber ?? r.id)}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                    {!canEdit && !canDelete && (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {total > 0 && (
        <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              Showing {(currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, total)} of{" "}
              {total.toLocaleString("en-IN")}
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-md border bg-transparent px-2 py-1 text-sm"
            >
              {[5, 10, 20, 50, 100].map((n) => (
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
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ←
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2
              )
              .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1)
                  acc.push("ellipsis");
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === "ellipsis" ? (
                  <span
                    key={`e${idx}`}
                    className="px-1 text-muted-foreground"
                  >
                    …
                  </span>
                ) : (
                  <Button
                    key={item}
                    variant={item === currentPage ? "default" : "outline"}
                    size="icon-sm"
                    onClick={() => setPage(item)}
                  >
                    {item}
                  </Button>
                )
              )}
            <Button
              variant="outline"
              size="icon-sm"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              →
            </Button>
          </div>
        </div>
      )}

      <ModuleForm
        key={`${formMode}-${formInitial?.id ?? "new"}`}
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        initial={formInitial}
        fields={formFields}
        apiPath={API_PATH}
        title="Data Wiping Master"
        onSaved={() => refresh()}
      />

      <Sheet
        open={!!deleteId}
        onOpenChange={(o) => {
          if (!o) setDeleteId(null);
        }}
      >
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="sm:max-w-md mx-auto"
        >
          <SheetHeader>
            <SheetTitle>Delete record?</SheetTitle>
            <SheetDescription>
              This action cannot be undone. The record will be permanently
              removed.
            </SheetDescription>
          </SheetHeader>
          {actionError && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}
          <div className="flex justify-end gap-2 p-4">
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Deleting...
                </>
              ) : (
                <>Delete</>
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </Card>
  );
}