import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";
import {
  type Role,
  ROLES,
  resolvePermissions,
  asPermissionRecord,
  normalizePermsOverrides,
} from "@/lib/permissions";

export const runtime = "nodejs";

async function guard(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return null;
  if (!user.permissions.manageUsers) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }
  return user;
}

export async function GET(request: NextRequest) {
  const g = await guard(request);
  if (!g) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (g instanceof NextResponse) return g;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      permissions: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    users: users.map((u) => ({
      ...u,
      permissions: resolvePermissions(
        u.role,
        normalizePermsOverrides(u.permissions)
      ),
    })),
  });
}

export async function POST(request: NextRequest) {
  const g = await guard(request);
  if (!g) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (g instanceof NextResponse) return g;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const role: Role = ROLES.includes(body.role) ? body.role : "VIEWER";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "User already exists" }, { status: 409 });
  }

  const permissions = resolvePermissions(
    role,
    body.permissions && typeof body.permissions === "object" ? body.permissions : null
  );

  const user = await prisma.user.create({
    data: {
      email,
      password: await hashPassword(password),
      name,
      role,
      permissions: asPermissionRecord(permissions),
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      permissions: true,
    },
  });

  return NextResponse.json({ user }, { status: 201 });
}