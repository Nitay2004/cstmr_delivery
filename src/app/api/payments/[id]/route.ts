import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { resolvePurchaseOrderId } from "@/lib/links";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.permissions.editPayment) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.payment.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
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
  const num = (v: unknown) =>
    typeof v === "number" && !isNaN(v) ? v : null;

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
  if ("purchaseOrderNo" in body) data.purchaseOrderNo = str(body.purchaseOrderNo);
  if ("payment" in body) data.payment = str(body.payment);
  if ("totalInvoiceAmount" in body)
    data.totalInvoiceAmount = num(body.totalInvoiceAmount);
  if ("totalPaymentDone" in body)
    data.totalPaymentDone = num(body.totalPaymentDone);
  if ("balanceAmount" in body) data.balanceAmount = num(body.balanceAmount);

  const finalPurchaseOrderNo =
    data.purchaseOrderNo !== undefined
      ? (data.purchaseOrderNo as string | null)
      : existing.purchaseOrderNo;
  const linked = await resolvePurchaseOrderId(
    finalPurchaseOrderNo ?? undefined
  );
  if (linked.purchaseOrderId !== undefined) {
    data.purchaseOrderId = linked.purchaseOrderId;
  }

  const updated = await prisma.payment.update({ where: { id }, data });

  return NextResponse.json({ payment: updated });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.permissions.deletePayment) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.payment.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  await prisma.payment.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}