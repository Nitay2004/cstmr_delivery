import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { rowToConsolidatedData } from "@/lib/csv";
import { parseImportFile } from "@/lib/parse-import";
import type { ConsolidatedCreateManyInput } from "@/generated/prisma/models/Consolidated";

type CreateData = Omit<
  ConsolidatedCreateManyInput,
  "id" | "createdAt" | "updatedAt"
>;

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.permissions.importConsolidated) {
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
  if (!normalizedHeaders.includes("category")) {
    return NextResponse.json(
      {
        error: "Missing required column(s): category",
        headers,
      },
      { status: 400 }
    );
  }

  const valid: CreateData[] = [];
  const skipped: { row: number; reason: string }[] = [];

  rows.forEach((row, index) => {
    const data = rowToConsolidatedData(row);
    if (!data.category) {
      skipped.push({ row: index + 2, reason: "Missing category" });
      return;
    }
    valid.push({
      category: data.category,
      subCategory: data.subCategory,
      qty: data.qty,
      amount: data.amount,
    });
  });

  let created = 0;
  if (valid.length > 0) {
    const result = await prisma.consolidated.createMany({ data: valid });
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