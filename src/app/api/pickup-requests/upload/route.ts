import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.permissions.uploadFiles) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const pickupRequestId = formData.get("pickupRequestId");
  const files = formData.getAll("files");

  if (!pickupRequestId || typeof pickupRequestId !== "string") {
    return NextResponse.json(
      { error: "pickupRequestId is required" },
      { status: 400 }
    );
  }

  const pickup = await prisma.pickupRequest.findUnique({
    where: { id: pickupRequestId },
  });

  if (!pickup) {
    return NextResponse.json(
      { error: "Pickup request not found" },
      { status: 404 }
    );
  }

  const validFiles = files.filter((f): f is File => f instanceof File);
  if (validFiles.length === 0) {
    return NextResponse.json(
      { error: "At least one file is required" },
      { status: 400 }
    );
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const saved: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    storagePath: string;
  }[] = [];

  for (const file of validFiles) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name);
    const storeName = `${randomUUID()}${ext}`;
    const storagePath = path.join(UPLOAD_DIR, storeName);
    await writeFile(storagePath, buffer);

    saved.push({
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
      storagePath: `/uploads/${storeName}`,
    });
  }

  const records = await Promise.all(
    saved.map((s) =>
      prisma.pickupFile.create({
        data: {
          pickupRequestId,
          ...s,
        },
      })
    )
  );

  return NextResponse.json({ uploaded: records.length, files: records });
}
