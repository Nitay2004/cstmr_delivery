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
