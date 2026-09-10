import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

const TYPE_PERMISSION: Record<string, string> = {
  pickup: "viewPickupRequests",
  quote: "viewQuotes",
  po: "viewPurchaseOrders",
  payment: "viewPayments",
  dataWiping: "viewDataWiping",
  certificate: "viewCertificate",
  grn: "viewGrn",
  consolidated: "viewConsolidated",
  user: "manageUsers",
};

const TYPE_MODEL: Record<
  string,
  { findUnique: (args: { where: { id: string } }) => Promise<unknown> }
> = {
  pickup: prisma.pickupRequest,
  quote: prisma.quote,
  po: prisma.purchaseOrder,
  payment: prisma.payment,
  dataWiping: prisma.dataWiping,
  certificate: prisma.certificate,
  grn: prisma.grn,
  consolidated: prisma.consolidated,
  user: prisma.user,
};

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = request.nextUrl.searchParams.get("type")?.trim();
  const id = request.nextUrl.searchParams.get("id")?.trim();

  if (!type || !id) {
    return NextResponse.json(
      { error: "type and id are required" },
      { status: 400 }
    );
  }

  const permission = TYPE_PERMISSION[type];
  const model = TYPE_MODEL[type];

  if (!permission || !model) {
    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  }

  if (!user.permissions[permission as keyof typeof user.permissions]) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const record = await model.findUnique({ where: { id } });
  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ record });
}