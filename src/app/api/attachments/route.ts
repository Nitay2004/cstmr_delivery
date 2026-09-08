import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isAllowedFile, saveUploadedFile } from "@/lib/files";

export const runtime = "nodejs";

type SavedFile = {
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
};

const MODULES = ["quote", "purchase-order", "payment"] as const;
export type AttachmentModule = (typeof MODULES)[number];

async function entityMissing(module: AttachmentModule, entityId: string) {
  switch (module) {
    case "quote":
      return !(await prisma.quote.findUnique({ where: { id: entityId } }));
    case "purchase-order":
      return !(await prisma.purchaseOrder.findUnique({
        where: { id: entityId },
      }));
    case "payment":
      return !(await prisma.payment.findUnique({ where: { id: entityId } }));
  }
}

async function createFileRecord(module: AttachmentModule, entityId: string, f: SavedFile) {
  switch (module) {
    case "quote":
      return prisma.quoteFile.create({
        data: { quoteId: entityId, ...f },
      });
    case "purchase-order":
      return prisma.purchaseOrderFile.create({
        data: { purchaseOrderId: entityId, ...f },
      });
    case "payment":
      return prisma.paymentFile.create({
        data: { paymentId: entityId, ...f },
      });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.permissions.uploadFiles) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const moduleName = formData.get("module");
  const entityId = formData.get("entityId");
  const rawFiles = formData.getAll("files");

  if (
    typeof moduleName !== "string" ||
    !(MODULES as readonly string[]).includes(moduleName)
  ) {
    return NextResponse.json(
      { error: "module must be quote, purchase-order or payment" },
      { status: 400 }
    );
  }
  if (typeof entityId !== "string" || !entityId) {
    return NextResponse.json(
      { error: "entityId is required" },
      { status: 400 }
    );
  }

  if (await entityMissing(moduleName as AttachmentModule, entityId)) {
    return NextResponse.json(
      { error: "Record not found" },
      { status: 404 }
    );
  }

  const files = rawFiles.filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json(
      { error: "At least one file is required" },
      { status: 400 }
    );
  }

  const rejected = files.filter((f) => !isAllowedFile(f));
  if (rejected.length > 0) {
    return NextResponse.json(
      {
        error: `Only PDF, JPG, JPEG and PNG files are allowed (rejected: ${rejected
          .map((f) => f.name)
          .join(", ")})`,
      },
      { status: 400 }
    );
  }

  const saved: SavedFile[] = [];
  for (const file of files) {
    saved.push(await saveUploadedFile(file));
  }

  const records = [];
  for (const f of saved) {
    records.push(
      await createFileRecord(moduleName as AttachmentModule, entityId, f)
    );
  }

  return NextResponse.json({ uploaded: records.length, files: records });
}