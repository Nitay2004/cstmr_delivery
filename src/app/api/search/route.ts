import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export interface SearchResult {
  id: string;
  type: string;
  typeLabel: string;
  title: string;
  subtitle: string;
  href: string;
}

const PER_MODULE_LIMIT = 6;
const TOTAL_LIMIT = 30;

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ results: [] });
  }
  if (q.length > 200) {
    return NextResponse.json(
      { error: "Search term too long" },
      { status: 400 }
    );
  }

  const term = q.toLowerCase();
  const contains = { contains: term, mode: "insensitive" } as const;
  const completed: SearchResult[] = [];

  function add(
    type: string,
    typeLabel: string,
    title: string,
    subtitle: string,
    href: string,
    id: string
  ) {
    completed.push({ id, type, typeLabel, title, subtitle, href });
  }

  if (user.permissions.viewPickupRequests) {
    const rows = await prisma.pickupRequest.findMany({
      where: {
        OR: [
          { sourcingDealNo: contains },
          { pickup: contains },
          { location: contains },
          { stage: contains },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: PER_MODULE_LIMIT,
    });
    for (const r of rows) {
      add(
        "pickup",
        "Pickup Request",
        r.sourcingDealNo,
        [r.pickup, r.location].filter(Boolean).join(" • ") || r.stage,
        `/pickup-request?q=${encodeURIComponent(term)}`,
        r.id
      );
    }
  }

  if (user.permissions.viewQuotes) {
    const rows = await prisma.quote.findMany({
      where: {
        OR: [
          { sourcingDealNo: contains },
          { pickup: contains },
          { quoteNo: contains },
          { locationCode: contains },
          { stage: contains },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: PER_MODULE_LIMIT,
    });
    for (const r of rows) {
      add(
        "quote",
        "Quote",
        [r.quoteNo, r.sourcingDealNo].filter(Boolean).join(" • "),
        r.stage,
        `/quotes?q=${encodeURIComponent(term)}`,
        r.id
      );
    }
  }

  if (user.permissions.viewPurchaseOrders) {
    const rows = await prisma.purchaseOrder.findMany({
      where: {
        OR: [
          { sourcingDealNo: contains },
          { pickup: contains },
          { quoteNo: contains },
          { purchaseOrderNo: contains },
          { locationCode: contains },
          { stage: contains },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: PER_MODULE_LIMIT,
    });
    for (const r of rows) {
      add(
        "po",
        "Purchase Order",
        [r.purchaseOrderNo, r.quoteNo]
          .filter(Boolean)
          .join(" • ") || r.sourcingDealNo,
        r.stage,
        `/purchase-orders?q=${encodeURIComponent(term)}`,
        r.id
      );
    }
  }

  if (user.permissions.viewPayments) {
    const rows = await prisma.payment.findMany({
      where: {
        OR: [
          { sourcingDealNo: contains },
          { pickup: contains },
          { purchaseOrderNo: contains },
          { payment: contains },
          { stage: contains },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: PER_MODULE_LIMIT,
    });
    for (const r of rows) {
      add(
        "payment",
        "Payment",
        r.payment || r.purchaseOrderNo || r.sourcingDealNo,
        r.stage,
        `/payments?q=${encodeURIComponent(term)}`,
        r.id
      );
    }
  }

  if (user.permissions.viewDataWiping) {
    const rows = await prisma.dataWiping.findMany({
      where: {
        OR: [
          { sourcingDealNo: contains },
          { pickup: contains },
          { dataWipingId: contains },
          { status: contains },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: PER_MODULE_LIMIT,
    });
    for (const r of rows) {
      add(
        "dataWiping",
        "Data Wiping",
        r.dataWipingId || r.sourcingDealNo,
        r.status,
        `/data-wiping?q=${encodeURIComponent(term)}`,
        r.id
      );
    }
  }

  if (user.permissions.viewCertificate) {
    const rows = await prisma.certificate.findMany({
      where: {
        OR: [
          { sourcingDealNo: contains },
          { pickup: contains },
          { status: contains },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: PER_MODULE_LIMIT,
    });
    for (const r of rows) {
      add(
        "certificate",
        "Certificate",
        r.sourcingDealNo,
        r.status,
        `/certificates?q=${encodeURIComponent(term)}`,
        r.id
      );
    }
  }

  if (user.permissions.viewGrn) {
    const rows = await prisma.grn.findMany({
      where: {
        OR: [
          { sourcingDealNo: contains },
          { pickup: contains },
          { grnDetails: contains },
          { invoiceNumber: contains },
          { invoiceDate: contains },
          { materialReceivedDate: contains },
          { stage: contains },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: PER_MODULE_LIMIT,
    });
    for (const r of rows) {
      add(
        "grn",
        "Change of Custody",
        r.sourcingDealNo,
        [r.invoiceNumber, r.grnDetails].filter(Boolean).join(" • ") || r.stage,
        `/grn?q=${encodeURIComponent(term)}`,
        r.id
      );
    }
  }

  if (user.permissions.viewConsolidated) {
    const rows = await prisma.consolidated.findMany({
      where: {
        OR: [{ category: contains }, { subCategory: contains }],
      },
      orderBy: { updatedAt: "desc" },
      take: PER_MODULE_LIMIT,
    });
    for (const r of rows) {
      add(
        "consolidated",
        "Consolidated",
        [r.category, r.subCategory].filter(Boolean).join(" — "),
        r.qty != null ? `qty: ${r.qty}` : "",
        `/consolidated?q=${encodeURIComponent(term)}`,
        r.id
      );
    }
  }

  if (user.permissions.manageUsers) {
    const rows = await prisma.user.findMany({
      where: {
        OR: [{ email: contains }, { name: contains }],
      },
      orderBy: { updatedAt: "desc" },
      take: PER_MODULE_LIMIT,
    });
    for (const r of rows) {
      add(
        "user",
        "User",
        r.name || r.email,
        r.email,
        `/users?q=${encodeURIComponent(term)}`,
        r.id
      );
    }
  }

  return NextResponse.json({ results: completed.slice(0, TOTAL_LIMIT) });
}