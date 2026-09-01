import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const requests = await prisma.pickupRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { files: true },
  });

  const total = await prisma.pickupRequest.count();

  return NextResponse.json({ total, requests });
}

export async function POST(request: NextRequest) {
  let body: {
    stage?: string;
    sourcingDealNo?: string;
    pickup?: string;
    location?: string;
    actualPickupDate?: string;
    actualDeliveredDate?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const stage = body.stage?.trim();
  const sourcingDealNo = body.sourcingDealNo?.trim();

  if (!stage || !sourcingDealNo) {
    return NextResponse.json(
      { error: "Stage and sourcingDealNo are required" },
      { status: 400 }
    );
  }

  const existing = await prisma.pickupRequest.findUnique({
    where: { sourcingDealNo },
  });
  if (existing) {
    return NextResponse.json(
      { error: `sourcingDealNo "${sourcingDealNo}" already exists` },
      { status: 409 }
    );
  }

  const date = (v?: string) => {
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  };

  const request_record = await prisma.pickupRequest.create({
    data: {
      stage,
      sourcingDealNo,
      pickup: body.pickup?.trim() || null,
      location: body.location?.trim() || null,
      actualPickupDate: date(body.actualPickupDate),
      actualDeliveredDate: date(body.actualDeliveredDate),
    },
  });

  return NextResponse.json({ request: request_record }, { status: 201 });
}
