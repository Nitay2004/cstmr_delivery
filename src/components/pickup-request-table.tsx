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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  AlertCircle,
  Inbox,
  Loader2,
  RefreshCcw,
  Paperclip,
  Search,
  AlertTriangle,
  Plus,
  Pencil,
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
import {
  PickupRequestForm,
  type PickupRequestFormValues,
} from "@/components/pickup-request-form";
import { useUser, can } from "@/components/user-provider";

interface PickupFile {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
}

interface PickupRequest {
  id: string;
  stage: string;
  sourcingDealNo: string;
  pickup: string | null;
  location: string | null;
  actualPickupDate: string | null;
  actualDeliveredDate: string | null;
  createdAt: string;
  files: PickupFile[];
}

const stageStyles: Record<string, string> = {
  "approval pending": "bg-amber-100/80 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
  pending: "bg-amber-100/80 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
  requested: "bg-amber-100/80 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
  submitted: "bg-amber-100/80 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
  "picked up": "bg-blue-100/80 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30",
  pickedup: "bg-blue-100/80 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30",
  "in transit": "bg-sky-100/80 text-sky-700 border-sky-200 dark:bg-sky-500/20 dark:text-sky-400 dark:border-sky-500/30",
  transit: "bg-sky-100/80 text-sky-700 border-sky-200 dark:bg-sky-500/20 dark:text-sky-400 dark:border-sky-500/30",
  delivered: "bg-green-100/80 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30",
  completed: "bg-green-100/80 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30",
};

function stageBadge(stage: string) {
  const base =
    stageStyles[stage.toLowerCase()] ??
    "bg-secondary text-secondary-foreground";
  return <Badge variant="outline" className={`font-medium shadow-sm transition-colors ${base}`}>{stage}</Badge>;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function PickupRequestTable() {
  const { user } = useUser();
  const canCreate = can(user, "createPickupRequest");
  const canEdit = can(user, "editPickupRequest");
  const canDelete = can(user, "deletePickupRequest");
  const colCount = 7 + (canEdit || canDelete ? 1 : 0);
  const [requests, setRequests] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formInitial, setFormInitial] =
    useState<PickupRequestFormValues | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/pickup-requests", { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (controller.signal.aborted) return;
        if (data.error) throw new Error(data.error ?? "Failed to load");
        setRequests(data.requests);
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
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pickup-requests");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setRequests(data.requests);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  const openCreate = () => {
    setFormMode("create");
    setFormInitial(null);
    setFormOpen(true);
  };

  const openEdit = (r: PickupRequest) => {
    setFormMode("edit");
    setFormInitial({
      id: r.id,
      stage: r.stage,
      sourcingDealNo: r.sourcingDealNo,
      pickup: r.pickup ?? "",
      location: r.location ?? "",
      actualPickupDate: r.actualPickupDate ?? "",
      actualDeliveredDate: r.actualDeliveredDate ?? "",
    });
    setFormOpen(true);
  };

  const handleSaved = () => {
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/pickup-requests/${deleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete");
      setDeleteId(null);
      load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete");
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? requests.filter(
        (r) =>
          r.sourcingDealNo.toLowerCase().includes(normalizedQuery) ||
          r.stage.toLowerCase().includes(normalizedQuery) ||
          (r.pickup ?? "").toLowerCase().includes(normalizedQuery) ||
          (r.location ?? "").toLowerCase().includes(normalizedQuery)
      )
    : requests;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <Card className="shadow-sm border-border">
      <CardHeader className="flex flex-col gap-4 border-b border-border/50 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg">Pickup Requests</CardTitle>
          <CardDescription>
            {requests.length} request{requests.length === 1 ? "" : "s"} • {filtered.length} shown
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search deal no, stage..."
              className="h-9 w-64 pl-8"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading}
          >
            <RefreshCcw
              className={`size-4 ${loading ? "animate-spin" : ""}`}
            />
          </Button>
{canCreate && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" />
              New Request
            </Button>
          )}
        </div>
      </CardHeader>
      
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead>Stage</TableHead>
            <TableHead>Sourcing Deal No.</TableHead>
            <TableHead>Pickup</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Actual Pickup Date</TableHead>
            <TableHead>Actual Delivered Date</TableHead>
<TableHead className="text-right">Attachments</TableHead>
            {(canEdit || canDelete) && (
              <TableHead className="text-right">Actions</TableHead>
            )}
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
              <TableCell colSpan={colCount} className="h-40 text-center text-destructive">
                <div className="flex flex-col items-center gap-2">
                  <AlertTriangle className="size-8 text-destructive/60" />
                  <p className="text-sm">{error}</p>
                  <Button variant="outline" size="sm" onClick={load}>
                    Try again
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ) : filtered.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={colCount}
                className="h-40 text-center text-muted-foreground"
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  <Inbox className="size-8 text-muted-foreground/60" />
                  <p className="text-sm font-medium text-foreground">
                    {normalizedQuery ? "No matching requests" : "No pickup requests yet"}
                  </p>
                  <p className="text-xs">
                    {normalizedQuery
                      ? "Try a different search term."
                      : "Import a CSV or Excel file above to add requests."}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            paginated.map((r) => (
              <TableRow key={r.id} className="transition-colors hover:bg-muted/50">
                <TableCell>{stageBadge(r.stage)}</TableCell>
                <TableCell className="font-medium text-foreground">
                  {r.sourcingDealNo}
                </TableCell>
                <TableCell>{r.pickup ?? "—"}</TableCell>
                <TableCell>{r.location ?? "—"}</TableCell>
                <TableCell>{formatDate(r.actualPickupDate)}</TableCell>
                <TableCell>{formatDate(r.actualDeliveredDate)}</TableCell>
                <TableCell className="text-right">
                  {r.files.length > 0 ? (
                    <span className="inline-flex items-center justify-end gap-1 text-xs text-muted-foreground">
                      <Paperclip className="size-3" />
                      {r.files.length} file{r.files.length > 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </TableCell>
<TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(r)}
                        aria-label={`Edit ${r.sourcingDealNo}`}
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
                        aria-label={`Delete ${r.sourcingDealNo}`}
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

      {filtered.length > 0 && (
        <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} of{" "}
              {filtered.length}
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-md border bg-transparent px-2 py-1 text-sm"
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>{n} / page</option>
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
                  p === 1 ||
                  p === totalPages ||
                  Math.abs(p - currentPage) <= 2
              )
              .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1)
                  acc.push("ellipsis");
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === "ellipsis" ? (
                  <span key={`e${idx}`} className="px-1 text-muted-foreground">…</span>
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

      <PickupRequestForm
        key={`${formMode}-${formInitial?.id ?? "new"}`}
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        initial={formInitial}
        onSaved={handleSaved}
      />

      <Sheet open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <SheetContent side="bottom" showCloseButton={false} className="sm:max-w-md mx-auto">
          <SheetHeader>
            <SheetTitle>Delete pickup request?</SheetTitle>
            <SheetDescription>
              This action cannot be undone. The request will be permanently removed.
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
                <><Loader2 className="size-4 animate-spin" /> Deleting...</>
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
