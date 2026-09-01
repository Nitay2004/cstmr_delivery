import { parseCsv, type CsvRow } from "./csv";
import * as XLSX from "xlsx";

export type ParsedSheet = {
  rows: CsvRow[];
  headers: string[];
};

function normalizeValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? "" : value.toISOString().split("T")[0];
  }
  if (typeof value === "number") return String(value);
  return String(value).trim();
}

function xlsxToRows(buffer: Buffer): ParsedSheet {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) return { rows: [], headers: [] };

  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
    defval: "",
  });

  if (json.length === 0) return { rows: [], headers: [] };

  const headers = Object.keys(json[0]);
  const rows: CsvRow[] = json.map((row) => {
    const out: CsvRow = {};
    headers.forEach((h) => {
      out[h] = normalizeValue(row[h]);
    });
    return out;
  });

  return { rows, headers };
}

export async function parseImportFile(file: File): Promise<ParsedSheet> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const buffer = Buffer.from(await file.arrayBuffer());
    return xlsxToRows(buffer);
  }

  const text = await file.text();
  return parseCsv(text);
}
