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
  Search,
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  Download,
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
import type { AttachmentModule } from "@/components/attachment-section";
import { useUser, can } from "@/components/user-provider";
import type { TableColumn, FormField, ModuleRow } from "@/lib/module-config";

interface Props {
  title: string;
  singular: string;
  apiPath: string;
  listKey?: string;
  columns: TableColumn[];
  formFields: FormField[];
  searchFields?: string[];
  permissions: {
    view: string;
    create: string;
    edit: string;
    del: string;
  };
  attach?: {
    module: AttachmentModule;
    title: string;
    categories?: { key: string; label: string }[];
  };
}

const stageStyles: Record<string, string> = {
  "quote created": "bg-sky-100/80 text-sky-700 border-sky-200 dark:bg-sky-500/20 dark:text-sky-400 dark:border-sky-500/30",
  "pending for allocation": "bg-amber-100/80 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
  "quote approved": "bg-green-100/80 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30",
  "purchase order created": "bg-sky-100/80 text-sky-700 border-sky-200 dark:bg-sky-500/20 dark:text-sky-400 dark:border-sky-500/30",
  "pending for approval": "bg-amber-100/80 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
  "purchase order approved": "bg-green-100/80 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30",
  "payment created": "bg-sky-100/80 text-sky-700 border-sky-200 dark:bg-sky-500/20 dark:text-sky-400 dark:border-sky-500/30",
  "first approval pending": "bg-amber-100/80 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
  "second approval pending": "bg-orange-100/80 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30",
  "payment approved": "bg-green-100/80 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30",
  "payment pending": "bg-rose-100/80 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30",
  "data wiping created": "bg-sky-100/80 text-sky-700 border-sky-200 dark:bg-sky-500/20 dark:text-sky-400 dark:border-sky-500/30",
  "under process": "bg-amber-100/80 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
  "in progress": "bg-amber-100/80 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
  pending: "bg-amber-100/80 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
  requested: "bg-amber-100/80 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
  submitted: "bg-amber-100/80 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
  draft: "bg-slate-100/80 text-slate-700 border-slate-200 dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-500/30",
  approved: "bg-green-100/80 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30",
  confirmed: "bg-blue-100/80 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30",
  issued: "bg-blue-100/80 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30",
  completed: "bg-green-100/80 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30",
  delivered: "bg-green-100/80 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30",
  paid: "bg-green-100/80 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30",
  partial: "bg-amber-100/80 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
  overdue: "bg-red-100/80 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30",
};

function stageBadge(stage: string) {
  const base =
    stageStyles[stage.toLowerCase()] ??
    "bg-secondary text-secondary-foreground";
  return (
    <Badge
      variant="outline"
      className={`font-medium shadow-sm transition-colors ${base}`}
    >
      {stage}
    </Badge>
  );
}

function formatAmount(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  if (isNaN(num)) return String(value);
  return num.toLocaleString("en-IN");
}

function formatDateString(value: unknown) {
  if (!value) return "—";
  const d = new Date(String(value));
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ModuleTable({
  title,
  singular,
  apiPath,
  listKey,
  columns,
  formFields,
  searchFields = [],
  permissions,
  attach,
}: Props) {
  const { user } = useUser();
  const canCreate = can(user, permissions.create);
  const canEdit = can(user, permissions.edit);
  const canDelete = can(user, permissions.del);
  const canUpload = can(user, "uploadFiles");
  const colCount = columns.length + (canEdit || canDelete ? 1 : 0);

  const [rows, setRows] = useState<ModuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
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
    const controller = new AbortController();
    fetch(apiPath, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (controller.signal.aborted) return;
        const list = Array.isArray(data.items)
          ? data.items
          : Array.isArray(data.rows)
            ? data.rows
            : data[listKey ?? (singular === "Quote" ? "quotes" : `${singular.toLowerCase()}s`)] ??
              [];
        if (Array.isArray(list)) setRows(list);
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
  }, [apiPath, singular, listKey]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiPath);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      const list = Array.isArray(data.items)
        ? data.items
        : Array.isArray(data.rows)
          ? data.rows
          : data[listKey ?? (singular === "Quote" ? "quotes" : `${singular.toLowerCase()}s`)] ??
            [];
      if (Array.isArray(list)) setRows(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [apiPath, singular, listKey]);

  const openCreate = () => {
    setFormMode("create");
    setFormInitial(null);
    setFormOpen(true);
  };

  const openEdit = (r: ModuleRow) => {
    setFormMode("edit");
    setFormInitial({ ...r });
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
      const res = await fetch(`${apiPath}/${deleteId}`, {
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
    ? rows.filter((r) =>
        searchFields.some((field) =>
          String(r[field] ?? "").toLowerCase().includes(normalizedQuery)
        )
      )
    : rows;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const renderCell = (col: TableColumn, r: ModuleRow) => {
    if (col.render) return col.render(r);
    if (col.key === "download") {
      const files = Array.isArray(r.files)
        ? (r.files as { id: string; fileName: string }[])
        : [];
      if (files.length === 0 || !attach) {
        return <span className="text-muted-foreground/50">—</span>;
      }
      return (
        <div className="flex flex-col items-end gap-1">
          {files.map((f) => (
            <a
              key={f.id}
              href={`/api/attachments/file?id=${f.id}&module=${attach.module}&download=1`}
              className="inline-flex max-w-[180px] items-center gap-1 truncate text-xs text-primary hover:underline"
            >
              <Download className="size-3 shrink-0" />
              <span className="truncate">{f.fileName}</span>
            </a>
          ))}
        </div>
      );
    }
    const v = r[col.key];
    if (col.badge) return stageBadge(String(v ?? ""));
    if (col.format === "amount") return formatAmount(v);
    if (col.format === "date") return formatDateString(v);
    if (v === null || v === undefined || v === "") return "—";
    return String(v);
  };

  return (
    <Card className="shadow-sm border-border">
      <CardHeader className="flex flex-col gap-4 border-b border-border/50 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>
            {rows.length} record{rows.length === 1 ? "" : "s"} •{" "}
            {filtered.length} shown
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
              placeholder="Search..."
              className="h-9 w-64 pl-8"
            />
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCcw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          {canCreate && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" />
              New {singular}
            </Button>
          )}
        </div>
      </CardHeader>

      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={col.align === "right" ? "text-right" : undefined}
              >
                {col.label}
              </TableHead>
            ))}
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
              <TableCell
                colSpan={colCount}
                className="h-40 text-center text-destructive"
              >
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
                    {normalizedQuery ? "No matching records" : `No ${singular.toLowerCase()}s yet`}
                  </p>
                  <p className="text-xs">
                    {normalizedQuery
                      ? "Try a different search term."
                      : "Use Bulk Upload above to add records."}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            paginated.map((r) => (
              <TableRow
                key={r.id}
                className="transition-colors hover:bg-muted/50"
              >
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    className={
                      col.align === "right"
                        ? "text-right"
                        : col.key === "sourcingDealNo"
                          ? "font-medium text-foreground"
                          : undefined
                    }
                  >
                    {renderCell(col, r)}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(r)}
                        aria-label={`Edit ${String(r.sourcingDealNo ?? r.id)}`}
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
                        aria-label={`Delete ${String(r.sourcingDealNo ?? r.id)}`}
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
              Showing {(currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, filtered.length)} of{" "}
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
        apiPath={apiPath}
        title={singular}
        attach={canUpload ? attach : null}
        onSaved={handleSaved}
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
            <SheetTitle>Delete {singular.toLowerCase()}?</SheetTitle>
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