import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { rowToPickupData, normalizeHeader } from "@/lib/csv";
import { parseImportFile } from "@/lib/parse-import";
import type { PickupRequestCreateManyInput } from "@/generated/prisma/models/PickupRequest";

type CreateData = Omit<
  PickupRequestCreateManyInput,
  "id" | "files" | "createdAt" | "updatedAt"
>;

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.permissions.importPickupRequests) {
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

  const requiredHeaders = ["stage", "sourcingdealno"];
  const normalizedHeaders = headers.map(normalizeHeader);
  const missing = requiredHeaders.filter(
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

  const valid: CreateData[] = [];
  const skipped: { row: number; reason: string }[] = [];

  rows.forEach((row, index) => {
    const data = rowToPickupData(row);
    if (!data.stage || !data.sourcingDealNo) {
      skipped.push({
        row: index + 2,
        reason: "Missing stage or sourcingDealNo",
      });
      return;
    }
    valid.push(data);
  });

  let created = 0;
  let duplicates = 0;
  if (valid.length > 0) {
    const result = await prisma.pickupRequest.createMany({
      data: valid,
      skipDuplicates: true,
    });
    created = result.count;
    duplicates = valid.length - created;
  }

  return NextResponse.json({
    imported: created,
    total: rows.length,
    duplicates,
    skipped,
    headers,
  });
}
