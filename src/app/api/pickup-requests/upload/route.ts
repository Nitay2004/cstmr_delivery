import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isAllowedFile, saveUploadedFile } from "@/lib/files";

export const runtime = "nodejs";

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

  const rejected = validFiles.filter((f) => !isAllowedFile(f));
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

  const saved: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    storagePath: string;
  }[] = [];

  for (const file of validFiles) {
    saved.push(await saveUploadedFile(file));
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
