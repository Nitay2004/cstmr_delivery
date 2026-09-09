import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { resolvePickupRequestId } from "@/lib/links";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.permissions.editDataWiping) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.dataWiping.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Data wiping record not found" },
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

  const data: Record<string, unknown> = {};

  if ("status" in body) {
    const status = str(body.status);
    if (!status) {
      return NextResponse.json(
        { error: "Status cannot be empty" },
        { status: 400 }
      );
    }
    data.status = status;
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
  if ("dataWipingId" in body) data.dataWipingId = str(body.dataWipingId);
  if ("laptop" in body) data.laptop = int(body.laptop);
  if ("desktop" in body) data.desktop = int(body.desktop);
  if ("total" in body) data.total = int(body.total);
  if ("laptopSsdHddReceived" in body)
    data.laptopSsdHddReceived = int(body.laptopSsdHddReceived);
  if ("laptopWiped" in body) data.laptopWiped = int(body.laptopWiped);
  if ("laptopShreddingDone" in body)
    data.laptopShreddingDone = int(body.laptopShreddingDone);
  if ("laptopNotWiped" in body) data.laptopNotWiped = int(body.laptopNotWiped);
  if ("desktopSsdHddReceived" in body)
    data.desktopSsdHddReceived = int(body.desktopSsdHddReceived);
  if ("desktopWiped" in body) data.desktopWiped = int(body.desktopWiped);
  if ("desktopShreddingDone" in body)
    data.desktopShreddingDone = int(body.desktopShreddingDone);
  if ("desktopNotWiped" in body)
    data.desktopNotWiped = int(body.desktopNotWiped);

  const finalSourcing =
    data.sourcingDealNo && data.sourcingDealNo !== existing.sourcingDealNo
      ? String(data.sourcingDealNo)
      : existing.sourcingDealNo;
  const linked = await resolvePickupRequestId(finalSourcing);
  if (linked.pickupRequestId !== undefined) {
    data.pickupRequestId = linked.pickupRequestId;
  }

  const updated = await prisma.dataWiping.update({ where: { id }, data });

  return NextResponse.json({ dataWiping: updated });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.permissions.deleteDataWiping) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.dataWiping.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Data wiping record not found" },
      { status: 404 }
    );
  }

  await prisma.dataWiping.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}