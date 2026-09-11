import { parseCsv, parseCsvMatrix, type CsvRow } from "./csv";
import * as XLSX from "xlsx";

export type ParsedSheet = {
  rows: CsvRow[];
  headers: string[];
};

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function normalizeValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? "" : value.toISOString().split("T")[0];
  }
  if (typeof value === "number") {
    if (value >= 20000 && value <= 100000) {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (parsed) {
        return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(
          parsed.d
        ).padStart(2, "0")}`;
      }
    }
    return String(value);
  }
  return String(value).trim();
}

function scoreSheetKeys(keys: string[]): number {
  const set = new Set(keys.map(normalizeKey));
  let score = 0;
  if (set.has("serialnumber")) score += 4;
  if (set.has("pickupnumber") || set.has("pickupid")) score += 2;
  if (set.has("assettype")) score += 1;
  return score;
}

function pickBestSheet(
  workbook: XLSX.WorkBook
): { sheet: XLSX.WorkSheet; score: number } | null {
  let best: { sheet: XLSX.WorkSheet; score: number } | null = null;
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    if (!sheet) continue;
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });
    if (json.length === 0) continue;
    const score = scoreSheetKeys(Object.keys(json[0]));
    if (!best || score > best.score) {
      best = { sheet, score };
    }
  }
  return best;
}

function xlsxToRows(buffer: Buffer): ParsedSheet {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const picked = pickBestSheet(workbook);
  const sheet = picked ? picked.sheet : null;
  if (!sheet) return { rows: [], headers: [] };

  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
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

function tsvToRows(text: string): ParsedSheet {
  const workbook = XLSX.read(text, {
    type: "string",
    cellDates: true,
    FS: "\t",
  });
  const picked = pickBestSheet(workbook);
  const firstSheet = picked ? picked.sheet : null;
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

function firstLineCounts(text: string) {
  const first = text.split(/\r?\n/, 1)[0] ?? "";
  return {
    tabs: (first.match(/\t/g) ?? []).length,
    commas: (first.match(/,/g) ?? []).length,
  };
}

export async function parseImportFile(file: File): Promise<ParsedSheet> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const buffer = Buffer.from(await file.arrayBuffer());
    return xlsxToRows(buffer);
  }

  const text = await file.text();
  const { tabs, commas } = firstLineCounts(text);
  if (tabs > commas) return tsvToRows(text);
  return parseCsv(text);
}

export async function parseImportMatrix(
  file: File
): Promise<{ headers: string[]; rows: string[][] }> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const picked = pickBestSheet(workbook);
    const sheet = picked ? picked.sheet : null;
    if (!sheet) return { headers: [], rows: [] };

    const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: "",
      raw: false,
    });
    if (aoa.length === 0) return { headers: [], rows: [] };

    const headers = (aoa[0] ?? []).map((h) => String(h ?? "").trim());
    const rows: string[][] = aoa.slice(1).map((row) =>
      headers.map((_, index) => normalizeValue(row?.[index]))
    );

    return { headers, rows };
  }

  const text = await file.text();
  const { tabs, commas } = firstLineCounts(text);
  if (tabs > commas) {
    const workbook = XLSX.read(text, {
      type: "string",
      cellDates: true,
      FS: "\t",
    });
    const picked = pickBestSheet(workbook);
    const sheet = picked ? picked.sheet : null;
    if (!sheet) return { headers: [], rows: [] };
    const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: "",
      raw: false,
    });
    if (aoa.length === 0) return { headers: [], rows: [] };
    const headers = (aoa[0] ?? []).map((h) => String(h ?? "").trim());
    const rows: string[][] = aoa.slice(1).map((row) =>
      headers.map((_, index) => normalizeValue(row?.[index]))
    );
    return { headers, rows };
  }

  return parseCsvMatrix(text);
}
