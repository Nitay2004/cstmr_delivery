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
    pickup: normalized["pickupnumber"] ?? (normalized["pickup"] || undefined),
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

export const toInt = (value: string): number | undefined => {
  if (!value) return undefined;
  const num = Math.round(Number(value.replace(/,/g, "").replace(/\s/g, "")));
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
    pickup: n["pickupnumber"] ?? (n["pickup"] || undefined),
    quoteNo: n["quote"] ?? (n["quoteno"] || undefined),
    purchaseOrderNo:
      n["purchaseorder"] ?? (n["purchaseorderno"] ?? (n["pono"] || undefined)),
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
    pickup: n["pickupnumber"] ?? (n["pickup"] || undefined),
    purchaseOrderNo:
      n["purchaseorderno"] ?? (n["purchaseorder"] ?? (n["pono"] || undefined)),
    payment: n["payment"] || undefined,
    totalInvoiceAmount: toFloat(n["totalinvoiceamount"] ?? ""),
    totalPaymentDone: toFloat(n["totalpaymentdone"] ?? ""),
    balanceAmount: toFloat(n["balanceamount"] ?? ""),
  };
}

export type DataWipingCsvData = {
  status: string;
  sourcingDealNo: string;
  pickup?: string;
  dataWipingId?: string;
  laptop?: number;
  desktop?: number;
  total?: number;
  laptopSsdHddReceived?: number;
  laptopWiped?: number;
  laptopShreddingDone?: number;
  laptopNotWiped?: number;
  desktopSsdHddReceived?: number;
  desktopWiped?: number;
  desktopShreddingDone?: number;
  desktopNotWiped?: number;
};

export function rowToDataWipingData(row: CsvRow): DataWipingCsvData {
  const n = normalizeRow(row);
  return {
    status: n["status"] ?? "",
    sourcingDealNo: n["sourcingdealno"] ?? "",
    pickup: n["pickupnumber"] ?? (n["pickup"] || undefined),
    dataWipingId: n["datawipingid"] || undefined,
    laptop: toInt(n["laptop"] ?? ""),
    desktop: toInt(n["desktop"] ?? ""),
    total: toInt(n["total"] ?? ""),
    laptopSsdHddReceived: toInt(
      n["laptopssdhddreceived"] ?? n["laptopssdreceived"] ?? ""
    ),
    laptopWiped: toInt(n["laptopdatasanitized"] ?? n["laptopwiped"] ?? ""),
    laptopShreddingDone: toInt(n["laptopshreddingdone"] ?? ""),
    laptopNotWiped: toInt(
      n["laptopssdnotreceived"] ?? n["laptopnotwiped"] ?? ""
    ),
    desktopSsdHddReceived: toInt(
      n["desktopssdhddreceived"] ?? n["desktopssdreceived"] ?? ""
    ),
    desktopWiped: toInt(
      n["desktopdatasanitized"] ?? n["desktopwiped"] ?? ""
    ),
    desktopShreddingDone: toInt(n["desktopshreddingdone"] ?? ""),
    desktopNotWiped: toInt(
      n["desktopssdnotreceived"] ?? n["desktopnotwiped"] ?? ""
    ),
  };
}

export type CertificateCsvData = {
  status: string;
  sourcingDealNo: string;
  pickup?: string;
};

export function rowToCertificateData(row: CsvRow): CertificateCsvData {
  const n = normalizeRow(row);
  return {
    status: n["status"] ?? "",
    sourcingDealNo: n["sourcingdealno"] ?? "",
    pickup: n["pickupnumber"] ?? (n["pickup"] || undefined),
  };
}

export type GrnCsvData = {
  stage: string;
  sourcingDealNo: string;
  pickup?: string;
  grnDetails?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  materialReceivedDate?: string;
};

export function rowToGrnData(row: CsvRow): GrnCsvData {
  const n = normalizeRow(row);
  return {
    stage: n["grnstage"] ?? n["stage"] ?? "",
    sourcingDealNo: n["sourcingdealno"] ?? "",
    pickup: n["pickupnumber"] ?? (n["pickup"] || undefined),
    grnDetails: n["grndetails"] || undefined,
    invoiceNumber: n["invoicenumber"] || undefined,
    invoiceDate: n["invoicedate"] || undefined,
    materialReceivedDate: n["materialreceiveddate"] || undefined,
  };
}

export type ConsolidatedCsvData = {
  category: string;
  subCategory?: string;
  qty?: number;
  amount?: number;
};

export function rowToConsolidatedData(row: CsvRow): ConsolidatedCsvData {
  const n = normalizeRow(row);
  return {
    category: n["category"] ?? "",
    subCategory: n["subcategory"] || undefined,
    qty: toInt(n["qty"] ?? ""),
    amount: toFloat(n["amount"] ?? ""),
  };
}
