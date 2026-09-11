import { NextRequest, NextResponse } from "next/server";
import { createReadStream, promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.permissions.viewDataWipingMaster && !user.permissions.viewDataWiping) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const assetId = request.nextUrl.searchParams.get("assetId");
  if (!assetId) {
    return NextResponse.json({ error: "assetId is required" }, { status: 400 });
  }

  const asset = await prisma.dataWipingMaster.findUnique({
    where: { id: assetId },
    select: { storagePath: true, pdfName: true },
  });
  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }
  if (!asset.storagePath) {
    return NextResponse.json({ error: "No PDF attached" }, { status: 404 });
  }

  const root = process.env.DATA_WIPING_MASTER_PDF_ROOT ?? "";
  if (!root) {
    return NextResponse.json(
      { error: "PDF storage is not configured on this server" },
      { status: 503 }
    );
  }

  const resolved = path.resolve(root, asset.storagePath);
  const rootPrefix = path.resolve(root) + path.sep;
  if (!resolved.startsWith(rootPrefix)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  let stat: Awaited<ReturnType<typeof fs.stat>>;
  try {
    stat = await fs.stat(resolved);
    if (!stat.isFile()) {
      return NextResponse.json({ error: "PDF not found" }, { status: 404 });
    }
  } catch {
    return NextResponse.json({ error: "PDF not found" }, { status: 404 });
  }

  const stream = createReadStream(resolved);
  return new NextResponse(stream as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${asset.pdfName || "doc.pdf"}"`,
      "Content-Length": String(stat.size),
      "Cache-Control": "private, max-age=3600",
    },
  });
}