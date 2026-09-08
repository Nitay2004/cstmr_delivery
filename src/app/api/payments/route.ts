import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { resolvePurchaseOrderId } from "@/lib/links";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.permissions.viewPayments) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
  });
  const total = await prisma.payment.count();

  return NextResponse.json({ total, payments });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.permissions.createPayment) {
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
  const num = (v: unknown) =>
    typeof v === "number" && !isNaN(v) ? v : null;

  const purchaseOrderNo = str(body.purchaseOrderNo);
  const linked = await resolvePurchaseOrderId(purchaseOrderNo ?? undefined);

  const payment = await prisma.payment.create({
    data: {
      stage,
      sourcingDealNo,
      pickup: str(body.pickup),
      purchaseOrderNo,
      payment: str(body.payment),
      totalInvoiceAmount: num(body.totalInvoiceAmount),
      totalPaymentDone: num(body.totalPaymentDone),
      balanceAmount: num(body.balanceAmount),
      ...linked,
    },
  });

  return NextResponse.json({ payment }, { status: 201 });
}