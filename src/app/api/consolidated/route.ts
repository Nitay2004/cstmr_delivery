import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.permissions.viewConsolidated) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const consolidated = await prisma.consolidated.findMany({
    orderBy: { createdAt: "desc" },
  });
  const total = await prisma.consolidated.count();

  return NextResponse.json({ total, consolidated });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.permissions.createConsolidated) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

  const category =
    typeof body.category === "string" ? body.category.trim() : "";

  if (!category) {
    return NextResponse.json(
      { error: "Category is required" },
      { status: 400 }
    );
  }

  const str = (v: unknown) =>
    typeof v === "string" && v.trim() !== "" ? v.trim() : null;
  const int = (v: unknown) =>
    typeof v === "number" && !isNaN(v) ? Math.round(v) : null;
  const num = (v: unknown) =>
    typeof v === "number" && !isNaN(v) ? v : null;

  const record = await prisma.consolidated.create({
    data: {
      category,
      subCategory: str(body.subCategory),
      qty: int(body.qty),
      amount: num(body.amount),
    },
  });

  return NextResponse.json({ consolidated: record }, { status: 201 });
}