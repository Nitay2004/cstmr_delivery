import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

const FIELDS = [
  "pickupId",
  "serialNumber",
  "assetType",
  "hddSerialNumber",
  "wiped",
  "wipedSoftware",
  "wipedDate",
  "hddAvailable",
  "size",
  "remarks",
  "pdfName",
] as const;

export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.permissions.editDataWipingMaster) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.dataWipingMaster.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Data wiping master record not found" },
      { status: 404 }
    );
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

  const data: Record<string, unknown> = {};
  for (const field of FIELDS) {
    if (field in body) data[field] = str(body[field]);
  }

  const updated = await prisma.dataWipingMaster.update({
    where: { id },
    data,
  });

  return NextResponse.json({ item: updated });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.permissions.deleteDataWipingMaster) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.dataWipingMaster.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Data wiping master record not found" },
      { status: 404 }
    );
  }

  await prisma.dataWipingMaster.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}