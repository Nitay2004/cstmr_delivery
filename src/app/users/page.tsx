"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertCircle,
  CheckCircle2,
  Inbox,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Shield,
  ShieldCheck,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import {
  ROLES,
  PERMISSION_DEFS,
  ROLE_PRESETS,
  roleLabel,
  type Role,
  type PermissionKey,
  type Permissions,
} from "@/lib/permissions";
import { useUser } from "@/components/user-provider";

interface AppUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  permissions: Permissions;
}

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "VIEWER" as Role,
};

function permissionSummary(p: Permissions) {
  const labels: string[] = [];
  if (p.manageUsers) labels.push("Users");
  if (p.viewPickupRequests) labels.push("Pickup");
  return labels.length > 0 ? labels.join(" • ") : "No access";
}

function RoleBadge({ role }: { role: Role }) {
  const styles: Record<Role, string> = {
    ADMIN:
      "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30",
    EDITOR:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30",
    VIEWER:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-500/30",
  };
  return (
    <Badge variant="outline" className={`font-medium ${styles[role]}`}>
      {roleLabel(role)}
    </Badge>
  );
}

export default function UsersPage() {
  const { user: me } = useUser();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [form, setForm] = useState<typeof emptyForm>({ ...emptyForm });
  const [perms, setPerms] = useState<Permissions>({ ...ROLE_PRESETS.VIEWER });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load users");
      setUsers(data.users);
      setError(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/users", { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (controller.signal.aborted) return;
        if (data.error) throw new Error(data.error ?? "Failed to load users");
        setUsers(data.users);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error ? err.message : "Failed to load users"
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setPerms({ ...ROLE_PRESETS.VIEWER });
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (u: AppUser) => {
    setEditing(u);
    setForm({
      name: u.name ?? "",
      email: u.email,
      password: "",
      role: u.role,
    });
    setPerms({ ...u.permissions });
    setFormError(null);
    setFormOpen(true);
  };

  const changeRole = (role: Role) => {
    setForm((f) => ({ ...f, role }));
    if (!editing || (editing && editing.role !== role)) {
      setPerms({ ...ROLE_PRESETS[role] });
    }
  };

  const togglePerm = (key: PermissionKey) => {
    setPerms((p) => ({ ...p, [key]: !p[key] }));
  };

  const handleSave = async () => {
    setFormError(null);
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email.trim())) {
      setFormError("A valid email is required");
      return;
    }
    if (!editing && form.password.length < 6) {
      setFormError("Password must be at least 6 characters");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
        permissions: perms,
      };
      const url = editing ? `/api/users/${editing.id}` : "/api/users";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Failed to save user");
        return;
      }
      setFormOpen(false);
      load();
    } catch {
      setFormError("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete user");
      setDeleteTarget(null);
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to delete user");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = { ADMIN: 0, EDITOR: 0, VIEWER: 0 };
    for (const u of users) counts[u.role]++;
    return counts;
  }, [users]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight sm:text-3xl text-foreground">
            <ShieldCheck className="size-7 text-primary" />
            User Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create users and control what they can see and edit.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={load} disabled={loading}>
            <RefreshCcw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button size="lg" onClick={openCreate}>
            <Plus className="size-4" />
            New User
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="shadow-sm border-border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="size-4 text-purple-500" />
              Admins
            </CardTitle>
            <CardDescription className="text-2xl font-semibold text-foreground">
              {roleCounts.ADMIN}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="shadow-sm border-border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Pencil className="size-4 text-blue-500" />
              Editors
            </CardTitle>
            <CardDescription className="text-2xl font-semibold text-foreground">
              {roleCounts.EDITOR}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="shadow-sm border-border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserIcon className="size-4 text-slate-500" />
              Viewers
            </CardTitle>
            <CardDescription className="text-2xl font-semibold text-foreground">
              {roleCounts.VIEWER}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card className="shadow-sm border-border">
        <CardHeader className="flex items-center justify-between border-b border-border/50 pb-4">
          <div>
            <CardTitle className="text-lg">Users</CardTitle>
            <CardDescription>
              {users.length} user{users.length === 1 ? "" : "s"} in the system
            </CardDescription>
          </div>
        </CardHeader>

        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Access</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-40 text-center">
                  <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={4} className="h-40 text-center text-destructive">
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="size-8 text-destructive/60" />
                    <p className="text-sm">{error}</p>
                    <Button variant="outline" size="sm" onClick={load}>
                      Try again
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-40 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Inbox className="size-8 text-muted-foreground/60" />
                    <p className="text-sm font-medium text-foreground">No users</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-foreground">
                        {(u.name ?? u.email)[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {u.name || "—"}
                          {me?.id === u.id && (
                            <span className="ml-1.5 text-xs text-muted-foreground">
                              (you)
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={u.role} />
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-muted-foreground">
                      {permissionSummary(u.permissions)}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(u)}
                        aria-label={`Edit ${u.email}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setFormError(null);
                          setDeleteTarget(u);
                        }}
                        disabled={me?.id === u.id}
                        aria-label={`Delete ${u.email}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent side="right" showCloseButton className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing ? "Edit User" : "New User"}</SheetTitle>
            <SheetDescription>
              Set the role and fine-tune the permissions below.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-4 pb-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Rahul Sharma"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email *</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="user@example.com"
                disabled={!!editing}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Password {editing ? "(leave blank to keep current)" : "*"}
              </label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder={editing ? "••••••••" : "Min 6 characters"}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Role</label>
              <select
                value={form.role}
                onChange={(e) => changeRole(e.target.value as Role)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {roleLabel(r)} — {ROLE_PRESETS[r].manageUsers
                      ? "Full access"
                      : r === "EDITOR"
                        ? "Create/Edit"
                        : "View only"}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Selected role pre-fills the permissions below. You can customize them.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Permissions</label>
              <div className="grid gap-1.5">
                {PERMISSION_DEFS.map((def) => (
                  <label
                    key={def.key}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      className="size-4 accent-[var(--primary)]"
                      checked={perms[def.key]}
                      onChange={() => togglePerm(def.key)}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-foreground">
                        {def.label}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {def.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {formError && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  {editing ? "Save Changes" : "Create User"}
                </>
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
      >
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="sm:max-w-md mx-auto"
        >
          <SheetHeader>
            <SheetTitle>Delete user?</SheetTitle>
            <SheetDescription>
              {deleteTarget?.name || deleteTarget?.email} will lose access
              immediately. This cannot be undone.
            </SheetDescription>
          </SheetHeader>
          {formError && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          <div className="flex justify-end gap-2 p-4">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>Delete</>
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}