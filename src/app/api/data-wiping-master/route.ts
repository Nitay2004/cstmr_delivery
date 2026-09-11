import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

const SEARCH_FIELDS = [
  "pickupId",
  "serialNumber",
  "assetType",
  "hddSerialNumber",
  "uuid",
  "size",
  "pdfName",
] as const;

function parseIntSafe(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const canMaster = user.permissions.viewDataWipingMaster;
  if (!canMaster && !user.permissions.viewDataWiping) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const page = parseIntSafe(searchParams.get("page"), 1);
  const pageSize = Math.min(parseIntSafe(searchParams.get("pageSize"), 10), 100);
  const search = (searchParams.get("search") ?? "").trim();
  const pickupId = (searchParams.get("pickupId") ?? "").trim();
  const assetType = (searchParams.get("assetType") ?? "").trim();

  const where: Record<string, unknown> = {};
  if (search !== "") {
    where.OR = SEARCH_FIELDS.map((field) => ({
      [field]: { contains: search, mode: "insensitive" as const },
    }));
  } else if (!canMaster && pickupId === "") {
    return NextResponse.json({ total: 0, items: [], page, pageSize });
  }
  if (pickupId !== "") {
    where.pickupId = pickupId;
  }
  if (assetType !== "") {
    where.assetType = { equals: assetType, mode: "insensitive" as const };
  }

  const [total, items] = await Promise.all([
    prisma.dataWipingMaster.count({ where }),
    prisma.dataWipingMaster.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({ total, items, page, pageSize });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.permissions.createDataWipingMaster) {
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

  const str = (v: unknown) =>
    typeof v === "string" && v.trim() !== "" ? v.trim() : null;

  const record = await prisma.dataWipingMaster.create({
    data: {
      pickupId: str(body.pickupId),
      serialNumber: str(body.serialNumber),
      assetType: str(body.assetType),
      hddSerialNumber: str(body.hddSerialNumber),
      dataWipingDate: str(body.dataWipingDate),
      uuid: str(body.uuid),
      size: str(body.size),
      pdfName: str(body.pdfName),
    },
  });

  return NextResponse.json({ item: record }, { status: 201 });
}