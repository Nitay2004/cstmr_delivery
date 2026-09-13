import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { Permissions } from "@/lib/permissions";

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

async function loadPickupRelated(
  pickupRequestId: string,
  pickupRef: string | null,
  permissions: Permissions
) {
  const idMatch = { pickupRequestId };
  const refMatch = pickupRef ? { pickup: pickupRef } : null;

  let quotes: Array<Record<string, unknown>> | null = null;
  if (permissions.viewQuotes) {
    quotes = await prisma.quote.findMany({
      where: { OR: [idMatch, ...(refMatch ? [refMatch] : [])] },
      orderBy: { updatedAt: "desc" },
      include: { files: true },
    });
  }
  const quoteIds = quotes?.map((q) => String(q.id)) ?? [];

  let purchaseOrders: Array<Record<string, unknown>> | null = null;
  if (permissions.viewPurchaseOrders) {
    purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        OR: [
          ...(refMatch ? [refMatch] : []),
          ...(quoteIds.length ? [{ quoteId: { in: quoteIds } }] : []),
        ],
      },
      orderBy: { updatedAt: "desc" },
      include: { files: true },
    });
  }
  const poNumbers =
    purchaseOrders
      ?.map((p) => p.purchaseOrderNo)
      .filter((v): v is string => typeof v === "string") ?? [];

  let payments: Array<Record<string, unknown>> | null = null;
  if (permissions.viewPayments) {
    payments = await prisma.payment.findMany({
      where: {
        OR: [
          ...(refMatch ? [refMatch] : []),
          ...(poNumbers.length ? [{ purchaseOrderNo: { in: poNumbers } }] : []),
        ],
      },
      orderBy: { updatedAt: "desc" },
      include: { files: true },
    });
  }

  const [certificates, dataWipings, grns, files, devices] = await Promise.all([
    permissions.viewCertificate
      ? prisma.certificate.findMany({
          where: { OR: [idMatch, ...(refMatch ? [refMatch] : [])] },
          orderBy: { updatedAt: "desc" },
          include: { files: true },
        })
      : null,
    permissions.viewDataWiping
      ? prisma.dataWiping.findMany({
          where: { OR: [idMatch, ...(refMatch ? [refMatch] : [])] },
          orderBy: { updatedAt: "desc" },
          include: { files: true },
        })
      : null,
    permissions.viewGrn
      ? prisma.grn.findMany({
          where: { OR: [idMatch, ...(refMatch ? [refMatch] : [])] },
          orderBy: { updatedAt: "desc" },
          include: { files: true },
        })
      : null,
    prisma.pickupFile.findMany({
      where: { pickupRequestId },
      orderBy: { createdAt: "desc" },
    }),
    permissions.viewDataWipingMaster || permissions.viewDataWiping
      ? refMatch
        ? prisma.dataWipingMaster.findMany({
            where: { pickupId: pickupRef },
            orderBy: { updatedAt: "desc" },
          })
        : []
      : null,
  ]);

  return {
    quotes,
    purchaseOrders,
    payments,
    certificates,
    dataWipings,
    grns,
    files,
    devices,
  };
}

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

  if (type === "pickup") {
    const pickup = record as { id: string; pickup?: string | null };
    const related = await loadPickupRelated(
      pickup.id,
      pickup.pickup ?? null,
      user.permissions
    );
    return NextResponse.json({ record, related });
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
    const pickupRequest = pickupRef
      ? await prisma.pickupRequest.findFirst({
          where: { OR: [{ pickup: pickupRef }, { id: pickupRef }] },
        })
      : null;
    const related = pickupRequest
      ? {
          pickupRequest,
          ...(await loadPickupRelated(
            pickupRequest.id,
            pickupRequest.pickup ?? null,
            user.permissions
          )),
        }
      : { pickupRequest: null };
    return NextResponse.json({
      record,
      related,
    });
  }

  return NextResponse.json({ record });
}