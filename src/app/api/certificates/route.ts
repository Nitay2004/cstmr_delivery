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
  if (!user.permissions.viewCertificate) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const certificates = await prisma.certificate.findMany({
    orderBy: { createdAt: "desc" },
    include: { files: true },
  });
  const total = await prisma.certificate.count();

  return NextResponse.json({ total, certificates });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.permissions.createCertificate) {
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

  const linked = await resolvePickupRequestId(sourcingDealNo);

  const record = await prisma.certificate.create({
    data: {
      status,
      sourcingDealNo,
      pickup: str(body.pickup),
      ...linked,
    },
  });

  return NextResponse.json({ certificate: record }, { status: 201 });
}