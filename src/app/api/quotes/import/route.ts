import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { rowToQuoteData } from "@/lib/csv";
import { parseImportFile } from "@/lib/parse-import";
import { pickupDealIdMap } from "@/lib/links";
import type { QuoteCreateManyInput } from "@/generated/prisma/models/Quote";

type CreateData = Omit<QuoteCreateManyInput, "id" | "createdAt" | "updatedAt">;

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.permissions.importQuotes) {
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

  const { rows, headers } = await parseImportFile(file);
  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No data rows found in the file" },
      { status: 400 }
    );
  }

  const normalizedHeaders = headers.map((h) =>
    h.trim().toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "")
  );
  const missing = ["stage", "sourcingdealno"].filter(
    (h) => !normalizedHeaders.includes(h)
  );

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

  rows.forEach((row, index) => {
    const data = rowToQuoteData(row);
    if (!data.stage || !data.sourcingDealNo) {
      skipped.push({
        row: index + 2,
        reason: "Missing stage or sourcingDealNo",
      });
      return;
    }
    valid.push({
      stage: data.stage,
      sourcingDealNo: data.sourcingDealNo,
      pickup: data.pickup,
      quoteNo: data.quoteNo,
      totalAmount: data.totalAmount,
      locationCode: data.locationCode,
      pickupRequestId: data.sourcingDealNo
        ? pickupMap.get(data.sourcingDealNo)
        : undefined,
    });
  });

  let created = 0;
  if (valid.length > 0) {
    const result = await prisma.quote.createMany({ data: valid });
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