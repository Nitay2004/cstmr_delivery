import { prisma } from "@/lib/prisma";

export async function resolvePickupRequestId(
  sourcingDealNo?: string
): Promise<{ pickupRequestId?: string }> {
  if (!sourcingDealNo) return {};
  const pickup = await prisma.pickupRequest.findUnique({
    where: { sourcingDealNo },
    select: { id: true },
  });
  return pickup ? { pickupRequestId: pickup.id } : {};
}

export async function resolveQuoteId(
  quoteNo?: string
): Promise<{ quoteId?: string }> {
  if (!quoteNo) return {};
  const quote = await prisma.quote.findFirst({
    where: { quoteNo },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  return quote ? { quoteId: quote.id } : {};
}

export async function resolvePurchaseOrderId(
  purchaseOrderNo?: string
): Promise<{ purchaseOrderId?: string }> {
  if (!purchaseOrderNo) return {};
  const po = await prisma.purchaseOrder.findFirst({
    where: { purchaseOrderNo },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  return po ? { purchaseOrderId: po.id } : {};
}

export async function pickupDealIdMap(): Promise<Map<string, string>> {
  const rows = await prisma.pickupRequest.findMany({
    select: { id: true, sourcingDealNo: true },
  });
  return new Map(rows.map((r) => [r.sourcingDealNo, r.id]));
}

export async function quoteNoIdMap(): Promise<Map<string, string>> {
  const rows = await prisma.quote.findMany({
    select: { id: true, quoteNo: true },
  });
  const map = new Map<string, string>();
  for (const r of rows) {
    if (r.quoteNo) map.set(r.quoteNo, r.id);
  }
  return map;
}

export async function purchaseOrderNoIdMap(): Promise<Map<string, string>> {
  const rows = await prisma.purchaseOrder.findMany({
    select: { id: true, purchaseOrderNo: true },
  });
  const map = new Map<string, string>();
  for (const r of rows) {
    if (r.purchaseOrderNo) map.set(r.purchaseOrderNo, r.id);
  }
  return map;
}