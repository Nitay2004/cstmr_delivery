import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.permissions.editConsolidated) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.consolidated.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Consolidated record not found" },
      { status: 404 }
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const str = (v: unknown) =>
    typeof v === "string" && v.trim() !== "" ? v.trim() : null;
  const int = (v: unknown) =>
    typeof v === "number" && !isNaN(v) ? Math.round(v) : null;
  const num = (v: unknown) =>
    typeof v === "number" && !isNaN(v) ? v : null;

  const data: Record<string, unknown> = {};

  if ("category" in body) {
    const category = str(body.category);
    if (!category) {
      return NextResponse.json(
        { error: "Category cannot be empty" },
        { status: 400 }
      );
    }
    data.category = category;
  }
  if ("subCategory" in body) data.subCategory = str(body.subCategory);
  if ("qty" in body) data.qty = int(body.qty);
  if ("amount" in body) data.amount = num(body.amount);

  const updated = await prisma.consolidated.update({ where: { id }, data });

  return NextResponse.json({ consolidated: updated });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.permissions.deleteConsolidated) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.consolidated.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Consolidated record not found" },
      { status: 404 }
    );
  }

  await prisma.consolidated.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}