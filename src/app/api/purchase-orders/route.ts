import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { resolveQuoteId } from "@/lib/links";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.permissions.viewPurchaseOrders) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orders = await prisma.purchaseOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: { files: true },
  });
  const total = await prisma.purchaseOrder.count();

  return NextResponse.json({ total, orders });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.permissions.createPurchaseOrder) {
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

  const stage = typeof body.stage === "string" ? body.stage.trim() : "";
  const sourcingDealNo =
    typeof body.sourcingDealNo === "string" ? body.sourcingDealNo.trim() : "";

  if (!stage || !sourcingDealNo) {
    return NextResponse.json(
      { error: "Stage and sourcingDealNo are required" },
      { status: 400 }
    );
  }

  const str = (v: unknown) =>
    typeof v === "string" && v.trim() !== "" ? v.trim() : null;

  const quoteNo = str(body.quoteNo);
  const linked = await resolveQuoteId(quoteNo ?? undefined);

  const order = await prisma.purchaseOrder.create({
    data: {
      stage,
      sourcingDealNo,
      pickup: str(body.pickup),
      quoteNo,
      purchaseOrderNo: str(body.purchaseOrderNo),
      locationCode: str(body.locationCode),
      ...linked,
    },
  });

  return NextResponse.json({ order }, { status: 201 });
}