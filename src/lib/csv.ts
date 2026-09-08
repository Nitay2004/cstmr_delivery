export type CsvRow = Record<string, string>;

export function parseCsv(text: string): { rows: CsvRow[]; headers: string[] } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return { rows: [], headers: [] };
  }

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (inQuotes) {
        if (char === '"') {
          if (line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ",") {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows: CsvRow[] = lines.slice(1).map((line) => {
    const values = parseLine(line);
    const row: CsvRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });

  return { rows, headers };
}

const toDate = (value: string): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

export const normalizeHeader = (header: string): string =>
  header
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");

export const DATE_FIELDS = ["actualpickupdate", "actualdelivereddate"];

export function rowToPickupData(row: CsvRow): {
  stage: string;
  sourcingDealNo: string;
  pickup?: string;
  location?: string;
  actualPickupDate?: Date;
  actualDeliveredDate?: Date;
} {
  const normalized: Record<string, string> = {};
  Object.entries(row).forEach(([key, value]) => {
    normalized[normalizeHeader(key)] = (value ?? "").trim();
  });

  return {
    stage: normalized["stage"] ?? "",
    sourcingDealNo: normalized["sourcingdealno"] ?? "",
    pickup: normalized["pickup"] || undefined,
    location: normalized["location"] || undefined,
    actualPickupDate: toDate(normalized["actualpickupdate"] ?? "") ?? undefined,
    actualDeliveredDate:
      toDate(normalized["actualdelivereddate"] ?? "") ?? undefined,
  };
}

export function normalizeRow(row: CsvRow): Record<string, string> {
  const normalized: Record<string, string> = {};
  Object.entries(row).forEach(([key, value]) => {
    normalized[normalizeHeader(key)] = (value ?? "").trim();
  });
  return normalized;
}

export const toFloat = (value: string): number | undefined => {
  if (!value) return undefined;
  const num = Number(value.replace(/,/g, "").replace(/\s/g, ""));
  return isNaN(num) ? undefined : num;
};

export type QuoteCsvData = {
  stage: string;
  sourcingDealNo: string;
  pickup?: string;
  quoteNo?: string;
  totalAmount?: number;
  locationCode?: string;
};

export function rowToQuoteData(row: CsvRow): QuoteCsvData {
  const n = normalizeRow(row);
  return {
    stage: n["quotestage"] ?? n["stage"] ?? "",
    sourcingDealNo: n["sourcingdealno"] ?? "",
    pickup: n["pickupnumber"] ?? (n["pickup"] || undefined),
    quoteNo: n["quoteno"] || undefined,
    totalAmount: toFloat(n["totalamount"] ?? ""),
    locationCode: n["locationcode"] || undefined,
  };
}

export type PurchaseOrderCsvData = {
  stage: string;
  sourcingDealNo: string;
  pickup?: string;
  quoteNo?: string;
  purchaseOrderNo?: string;
  locationCode?: string;
};

export function rowToPurchaseOrderData(row: CsvRow): PurchaseOrderCsvData {
  const n = normalizeRow(row);
  return {
    stage: n["postage"] ?? n["stage"] ?? "",
    sourcingDealNo: n["sourcingdealno"] ?? "",
    pickup: n["pickup"] || undefined,
    quoteNo: n["quote"] || undefined,
    purchaseOrderNo: n["purchaseorder"] || undefined,
    locationCode: n["locationcode"] || undefined,
  };
}

export type PaymentCsvData = {
  stage: string;
  sourcingDealNo: string;
  pickup?: string;
  purchaseOrderNo?: string;
  payment?: string;
  totalInvoiceAmount?: number;
  totalPaymentDone?: number;
  balanceAmount?: number;
};

export function rowToPaymentData(row: CsvRow): PaymentCsvData {
  const n = normalizeRow(row);
  return {
    stage: n["stage"] ?? "",
    sourcingDealNo: n["sourcingdealno"] ?? "",
    pickup: n["pickup"] || undefined,
    purchaseOrderNo: n["purchaseorderno"] || undefined,
    payment: n["payment"] || undefined,
    totalInvoiceAmount: toFloat(n["totalinvoiceamount"] ?? ""),
    totalPaymentDone: toFloat(n["totalpaymentdone"] ?? ""),
    balanceAmount: toFloat(n["balanceamount"] ?? ""),
  };
}
