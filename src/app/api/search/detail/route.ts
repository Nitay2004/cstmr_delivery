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
  device: "viewDataWipingMaster",
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
  device: prisma.dataWipingMaster,
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

  if (type === "device") {
    const device = record as {
      id: string;
      pickupId?: string | null;
      serialNumber?: string | null;
      assetType?: string | null;
      hddSerialNumber?: string | null;
      wiped?: string | null;
      hddAvailable?: string | null;
      [key: string]: unknown;
    };
    const pickupRef = device.pickupId ?? "";
    const [pickupRequest, wipingRecord, quote, po, payment, certificate, grn] =
      await Promise.all([
        pickupRef
          ? prisma.pickupRequest.findFirst({
              where: { OR: [{ pickup: pickupRef }, { id: pickupRef }] },
            })
          : null,
        pickupRef
          ? prisma.dataWiping.findFirst({
              where: { pickup: pickupRef },
            })
          : null,
        pickupRef
          ? prisma.quote.findFirst({ where: { pickup: pickupRef } })
          : null,
        pickupRef
          ? prisma.purchaseOrder.findFirst({ where: { pickup: pickupRef } })
          : null,
        pickupRef
          ? prisma.payment.findFirst({ where: { pickup: pickupRef } })
          : null,
        pickupRef
          ? prisma.certificate.findFirst({ where: { pickup: pickupRef } })
          : null,
        pickupRef
          ? prisma.grn.findFirst({ where: { pickup: pickupRef } })
          : null,
      ]);
    return NextResponse.json({
      record,
      related: {
        pickupRequest: pickupRequest ?? null,
        dataWiping: wipingRecord ?? null,
        quote: quote ?? null,
        po: po ?? null,
        payment: payment ?? null,
        certificate: certificate ?? null,
        grn: grn ?? null,
      },
    });
  }

  return NextResponse.json({ record });
}