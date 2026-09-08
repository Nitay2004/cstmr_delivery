import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { deleteUploadedFile } from "@/lib/files";
import type { AttachmentModule } from "@/app/api/attachments/route";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

const MODULES = ["quote", "purchase-order", "payment", "pickup"];

type FileRecord = {
  id: string;
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
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.permissions.uploadFiles) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const moduleName = request.nextUrl.searchParams.get("module");

  if (typeof moduleName !== "string" || !MODULES.includes(moduleName)) {
    return NextResponse.json(
      { error: "module must be quote, purchase-order, payment or pickup" },
      { status: 400 }
    );
  }

  const record = await findFileRecord(
    moduleName as AttachmentModule,
    id
  );
  if (!record) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  await deleteUploadedFile(record.storagePath);

  switch (moduleName as AttachmentModule) {
    case "quote":
      await prisma.quoteFile.delete({ where: { id } });
      break;
    case "purchase-order":
      await prisma.purchaseOrderFile.delete({ where: { id } });
      break;
    case "payment":
      await prisma.paymentFile.delete({ where: { id } });
      break;
    case "pickup":
      await prisma.pickupFile.delete({ where: { id } });
      break;
  }

  return NextResponse.json({ deleted: true });
}