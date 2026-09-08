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
  if (!user.permissions.editGrn) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.grn.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "GRN record not found" }, { status: 404 });
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
  if ("grnDetails" in body) data.grnDetails = str(body.grnDetails);
  if ("invoiceNumber" in body) data.invoiceNumber = str(body.invoiceNumber);
  if ("invoiceDate" in body) data.invoiceDate = str(body.invoiceDate);
  if ("materialReceivedDate" in body)
    data.materialReceivedDate = str(body.materialReceivedDate);

  const finalSourcing =
    data.sourcingDealNo && data.sourcingDealNo !== existing.sourcingDealNo
      ? String(data.sourcingDealNo)
      : existing.sourcingDealNo;
  const linked = await resolvePickupRequestId(finalSourcing);
  if (linked.pickupRequestId !== undefined) {
    data.pickupRequestId = linked.pickupRequestId;
  }

  const updated = await prisma.grn.update({ where: { id }, data });

  return NextResponse.json({ grn: updated });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.permissions.deleteGrn) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.grn.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "GRN record not found" }, { status: 404 });
  }

  await prisma.grn.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}