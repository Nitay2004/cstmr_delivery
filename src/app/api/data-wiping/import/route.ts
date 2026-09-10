import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { normalizeHeader, rowToDataWipingMatrix } from "@/lib/csv";
import { parseImportMatrix } from "@/lib/parse-import";
import { pickupDealIdMap } from "@/lib/links";
import type { DataWipingCreateManyInput } from "@/generated/prisma/models/DataWiping";

type CreateData = Omit<
  DataWipingCreateManyInput,
  "id" | "createdAt" | "updatedAt"
>;

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.permissions.importDataWiping) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json(
      { error: "A CSV or Excel file is required" },
      { status: 400 }
    );
  }

  const { headers, rows } = await parseImportMatrix(file);
  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No data rows found in the file" },
      { status: 400 }
    );
  }

  const normalizedHeaders = headers.map((h) => normalizeHeader(h));
  const missing: string[] = [];
  const hasStatus =
    normalizedHeaders.includes("status") ||
    normalizedHeaders.includes("datawipingstatus");
  if (!hasStatus) {
    missing.push("status");
  }
  if (!normalizedHeaders.includes("sourcingdealno")) {
    missing.push("sourcingdealno");
  }
  if (
    !normalizedHeaders.includes("pickup") &&
    !normalizedHeaders.includes("pickupnumber")
  ) {
    missing.push("pickup");
  }
  if (!normalizedHeaders.includes("datawipingid")) {
    missing.push("datawipingid");
  }

  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: `Missing required column(s): ${missing.join(", ")}`,
        headers,
      },
      { status: 400 }
    );
  }

  const pickupMap = await pickupDealIdMap();

  const valid: CreateData[] = [];
  const skipped: { row: number; reason: string }[] = [];

  rows.forEach((rowValues, index) => {
    const data = rowToDataWipingMatrix(headers, rowValues);
    if (!data.status || !data.sourcingDealNo || !data.pickup || !data.dataWipingId) {
      skipped.push({
        row: index + 2,
        reason: "Missing status, sourcingDealNo, pickup or dataWipingId",
      });
      return;
    }
    valid.push({
      status: data.status,
      sourcingDealNo: data.sourcingDealNo,
      pickup: data.pickup,
      dataWipingId: data.dataWipingId,
      laptop: data.laptop,
      desktop: data.desktop,
      total: data.total,
      laptopSsdHddReceived: data.laptopSsdHddReceived,
      laptopWiped: data.laptopWiped,
      laptopShreddingDone: data.laptopShreddingDone,
      laptopNotWiped: data.laptopNotWiped,
      desktopSsdHddReceived: data.desktopSsdHddReceived,
      desktopWiped: data.desktopWiped,
      desktopShreddingDone: data.desktopShreddingDone,
      desktopNotWiped: data.desktopNotWiped,
      pickupRequestId: data.sourcingDealNo
        ? pickupMap.get(data.sourcingDealNo)
        : undefined,
    });
  });

  let created = 0;
  if (valid.length > 0) {
    const result = await prisma.dataWiping.createMany({ data: valid });
    created = result.count;
  }

  return NextResponse.json({
    imported: created,
    total: rows.length,
    duplicates: 0,
    skipped,
    headers,
  });
}