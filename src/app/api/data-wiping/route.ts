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
  if (!user.permissions.viewDataWiping) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const dataWipings = await prisma.dataWiping.findMany({
    orderBy: { createdAt: "desc" },
    include: { files: true },
  });
  const total = await prisma.dataWiping.count();

  return NextResponse.json({ total, dataWipings });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.permissions.createDataWiping) {
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

  const status = typeof body.status === "string" ? body.status.trim() : "";
  const sourcingDealNo =
    typeof body.sourcingDealNo === "string" ? body.sourcingDealNo.trim() : "";

  if (!status || !sourcingDealNo) {
    return NextResponse.json(
      { error: "Status and sourcingDealNo are required" },
      { status: 400 }
    );
  }

  const str = (v: unknown) =>
    typeof v === "string" && v.trim() !== "" ? v.trim() : null;
  const int = (v: unknown) =>
    typeof v === "number" && !isNaN(v) ? Math.round(v) : null;

  const linked = await resolvePickupRequestId(sourcingDealNo);

  const record = await prisma.dataWiping.create({
    data: {
      status,
      sourcingDealNo,
      pickup: str(body.pickup),
      dataWipingId: str(body.dataWipingId),
      laptop: int(body.laptop),
      desktop: int(body.desktop),
      total: int(body.total),
      laptopSsdHddReceived: int(body.laptopSsdHddReceived),
      laptopWiped: int(body.laptopWiped),
      laptopShreddingDone: int(body.laptopShreddingDone),
      laptopNotWiped: int(body.laptopNotWiped),
      desktopSsdHddReceived: int(body.desktopSsdHddReceived),
      desktopWiped: int(body.desktopWiped),
      desktopShreddingDone: int(body.desktopShreddingDone),
      desktopNotWiped: int(body.desktopNotWiped),
      ...linked,
    },
  });

  return NextResponse.json({ dataWiping: record }, { status: 201 });
}