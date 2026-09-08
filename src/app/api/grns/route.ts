import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { resolvePickupRequestId } from "@/lib/links";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.permissions.viewGrn) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const grns = await prisma.grn.findMany({
    orderBy: { createdAt: "desc" },
    include: { files: true },
  });
  const total = await prisma.grn.count();

  return NextResponse.json({ total, grns });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.permissions.createGrn) {
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

  const linked = await resolvePickupRequestId(sourcingDealNo);

  const record = await prisma.grn.create({
    data: {
      stage,
      sourcingDealNo,
      pickup: str(body.pickup),
      grnDetails: str(body.grnDetails),
      invoiceNumber: str(body.invoiceNumber),
      invoiceDate: str(body.invoiceDate),
      materialReceivedDate: str(body.materialReceivedDate),
      ...linked,
    },
  });

  return NextResponse.json({ grn: record }, { status: 201 });
}