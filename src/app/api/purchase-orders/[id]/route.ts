import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { resolveQuoteId } from "@/lib/links";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.permissions.editPurchaseOrder) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Purchase order not found" },
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

  const data: Record<string, unknown> = {};

  if ("stage" in body) {
    const stage = str(body.stage);
    if (!stage) {
      return NextResponse.json(
        { error: "Stage cannot be empty" },
        { status: 400 }
      );
    }
    data.stage = stage;
  }
  if ("sourcingDealNo" in body) {
    const sourcingDealNo = str(body.sourcingDealNo);
    if (!sourcingDealNo) {
      return NextResponse.json(
        { error: "sourcingDealNo cannot be empty" },
        { status: 400 }
      );
    }
    data.sourcingDealNo = sourcingDealNo;
  }
  if ("pickup" in body) data.pickup = str(body.pickup);
  if ("quoteNo" in body) data.quoteNo = str(body.quoteNo);
  if ("purchaseOrderNo" in body) data.purchaseOrderNo = str(body.purchaseOrderNo);
  if ("locationCode" in body) data.locationCode = str(body.locationCode);

  const finalQuoteNo =
    data.quoteNo !== undefined
      ? (data.quoteNo as string | null)
      : existing.quoteNo;
  const linked = await resolveQuoteId(finalQuoteNo ?? undefined);
  if (linked.quoteId !== undefined) {
    data.quoteId = linked.quoteId;
  }

  const updated = await prisma.purchaseOrder.update({ where: { id }, data });

  return NextResponse.json({ order: updated });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.permissions.deletePurchaseOrder) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Purchase order not found" },
      { status: 404 }
    );
  }

  await prisma.purchaseOrder.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}