import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { rowToDataWipingMasterData } from "@/lib/csv";
import { parseImportFile } from "@/lib/parse-import";
import type { DataWipingMasterCreateManyInput } from "@/generated/prisma/models/DataWipingMaster";

type CreateData = Omit<
  DataWipingMasterCreateManyInput,
  "id" | "createdAt" | "updatedAt"
>;

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.permissions.importDataWipingMaster) {
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
  const hasSerial =
    normalizedHeaders.includes("serialnumber") ||
    normalizedHeaders.includes("serialnumberassettag") ||
    normalizedHeaders.includes("assetag");
  if (!hasSerial) {
    return NextResponse.json(
      {
        error: `Missing required column(s): serialnumber`,
        headers,
      },
      { status: 400 }
    );
  }

  const valid: CreateData[] = [];
  const skipped: { row: number; reason: string }[] = [];

  rows.forEach((row, index) => {
    const data = rowToDataWipingMasterData(row);
    if (!data.serialNumber) {
      skipped.push({
        row: index + 2,
        reason: "Missing serial number / asset tag",
      });
      return;
    }
    valid.push({
      pickupId: data.pickupId,
      serialNumber: data.serialNumber,
      assetType: data.assetType,
      hddSerialNumber: data.hddSerialNumber,
      wiped: data.wiped,
      wipedSoftware: data.wipedSoftware,
      wipedDate: data.wipedDate,
      hddAvailable: data.hddAvailable,
      size: data.size,
      remarks: data.remarks,
      pdfName: data.pdfName,
    });
  });

  let created = 0;
  if (valid.length > 0) {
    const result = await prisma.dataWipingMaster.createMany({ data: valid });
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