import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { rowToCertificateData } from "@/lib/csv";
import { parseImportFile } from "@/lib/parse-import";
import { pickupDealIdMap } from "@/lib/links";
import type { CertificateCreateManyInput } from "@/generated/prisma/models/Certificate";

type CreateData = Omit<
  CertificateCreateManyInput,
  "id" | "createdAt" | "updatedAt"
>;

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.permissions.importCertificate) {
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
  const missing: string[] = [];
  const hasStatus =
    normalizedHeaders.includes("status") ||
    normalizedHeaders.includes("certificatestatus");
  if (!hasStatus) {
    missing.push("status");
  }
  if (!normalizedHeaders.includes("sourcingdealno")) {
    missing.push("sourcingdealno");
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

  rows.forEach((row, index) => {
    const data = rowToCertificateData(row);
    if (!data.status || !data.sourcingDealNo) {
      skipped.push({
        row: index + 2,
        reason: "Missing status or sourcingDealNo",
      });
      return;
    }
    valid.push({
      status: data.status,
      sourcingDealNo: data.sourcingDealNo,
      pickup: data.pickup,
      pickupRequestId: data.sourcingDealNo
        ? pickupMap.get(data.sourcingDealNo)
        : undefined,
    });
  });

  let created = 0;
  if (valid.length > 0) {
    const result = await prisma.certificate.createMany({ data: valid });
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