import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { type Role, ROLES, resolvePermissions, asPermissionRecord, normalizePermsOverrides } from "@/lib/permissions";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

async function guard(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return { user: null as null };
  if (!user.permissions.manageUsers) {
    return { forbidden: true as const, user: null as null };
  }
  return { user };
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const g = await guard(request);
  if (!g.user) {
    const status = g.forbidden ? 403 : 401;
    return NextResponse.json(
      { error: g.forbidden ? "Forbidden" : "Unauthorized" },
      { status }
    );
  }
  const current = g.user;
  const { id } = await params;

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : undefined;
  const role: Role = ROLES.includes(body.role) ? body.role : undefined;

  if (current.id === target.id && role && role !== "ADMIN") {
    return NextResponse.json(
      { error: "You cannot remove your own Admin role" },
      { status: 400 }
    );
  }

  const nextRole = role ?? target.role;
  const permissions = resolvePermissions(
    nextRole,
    normalizePermsOverrides(
      body.permissions && typeof body.permissions === "object"
        ? body.permissions
        : target.permissions
    )
  );

  const updated = await prisma.user.update({
    where: { id },
    data: {
      name: name === "" ? null : name,
      role: role,
      permissions: asPermissionRecord(permissions),
      password:
        typeof body.password === "string" && body.password.length >= 6
          ? await hashPassword(body.password)
          : undefined,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      permissions: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ user: { ...updated, permissions } });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const g = await guard(request);
  if (!g.user) {
    const status = g.forbidden ? 403 : 401;
    return NextResponse.json(
      { error: g.forbidden ? "Forbidden" : "Unauthorized" },
      { status }
    );
  }
  const current = g.user;
  const { id } = await params;

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (current.id === target.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 }
    );
  }

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}