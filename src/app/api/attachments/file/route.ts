import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getPublicUrl, toObjectKey } from "@/lib/storage";
import type { AttachmentModule } from "@/app/api/attachments/route";

export const runtime = "nodejs";

const MODULES = [
  "quote",
  "purchase-order",
  "payment",
  "pickup",
  "data-wiping",
  "certificate",
  "grn",
];

type FileRecord = {
  id: string;
  fileName: string;
  storagePath: string;
};

async function findFileRecord(
  module: AttachmentModule,
  id: string
): Promise<FileRecord | null> {
  switch (module) {
    case "quote":
      return prisma.quoteFile.findUnique({ where: { id } });
    case "purchase-order":
      return prisma.purchaseOrderFile.findUnique({ where: { id } });
    case "payment":
      return prisma.paymentFile.findUnique({ where: { id } });
    case "pickup":
      return prisma.pickupFile.findUnique({ where: { id } });
    case "data-wiping":
      return prisma.dataWipingFile.findUnique({ where: { id } });
    case "certificate":
      return prisma.certificateFile.findUnique({ where: { id } });
    case "grn":
      return prisma.grnFile.findUnique({ where: { id } });
  }
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  const moduleName = request.nextUrl.searchParams.get("module");

  if (typeof id !== "string" || !id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  if (typeof moduleName !== "string" || !MODULES.includes(moduleName)) {
    return NextResponse.json(
      { error: "module must be a valid attachment module" },
      { status: 400 }
    );
  }

  const record = await findFileRecord(moduleName as AttachmentModule, id);
  if (!record) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const download = request.nextUrl.searchParams.get("download") === "1";
  const publicUrl = getPublicUrl(toObjectKey(record.storagePath));
  const url =
    download && record.fileName
      ? `${publicUrl}?download=${encodeURIComponent(record.fileName)}`
      : publicUrl;
  return NextResponse.redirect(url);
}