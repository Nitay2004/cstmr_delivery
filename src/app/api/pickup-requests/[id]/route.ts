import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;

  const existing = await prisma.pickupRequest.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Pickup request not found" },
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
    typeof v === "string" ? v.trim() : undefined;
  const date = (v: unknown) => {
    if (typeof v !== "string" || !v) return undefined;
    const d = new Date(v);
    return isNaN(d.getTime()) ? undefined : d;
  };

  const data: {
    stage?: string;
    sourcingDealNo?: string;
    pickup?: string | null;
    location?: string | null;
    actualPickupDate?: Date | null;
    actualDeliveredDate?: Date | null;
  } = {};

  if ("stage" in body) data.stage = str(body.stage);
  if ("sourcingDealNo" in body) data.sourcingDealNo = str(body.sourcingDealNo);
  if ("pickup" in body) data.pickup = str(body.pickup) ?? null;
  if ("location" in body) data.location = str(body.location) ?? null;
  if ("actualPickupDate" in body)
    data.actualPickupDate = date(body.actualPickupDate) ?? null;
  if ("actualDeliveredDate" in body)
    data.actualDeliveredDate = date(body.actualDeliveredDate) ?? null;

  if (data.stage !== undefined && data.stage === "")
    return NextResponse.json(
      { error: "Stage cannot be empty" },
      { status: 400 }
    );
  if (data.sourcingDealNo !== undefined && data.sourcingDealNo === "")
    return NextResponse.json(
      { error: "sourcingDealNo cannot be empty" },
      { status: 400 }
    );

  if (data.sourcingDealNo && data.sourcingDealNo !== existing.sourcingDealNo) {
    const clash = await prisma.pickupRequest.findUnique({
      where: { sourcingDealNo: data.sourcingDealNo },
    });
    if (clash && clash.id !== id) {
      return NextResponse.json(
        { error: `sourcingDealNo "${data.sourcingDealNo}" already exists` },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.pickupRequest.update({
    where: { id },
    data,
  });

  return NextResponse.json({ request: updated });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  const existing = await prisma.pickupRequest.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Pickup request not found" },
      { status: 404 }
    );
  }

  await prisma.pickupRequest.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}
