import { parseCsv, parseCsvMatrix, type CsvRow } from "./csv";
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

function tsvToRows(text: string): ParsedSheet {
  const workbook = XLSX.read(text, {
    type: "string",
    cellDates: true,
    FS: "\t",
  });
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
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!firstSheet) return { headers: [], rows: [] };

    const aoa = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, {
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
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!firstSheet) return { headers: [], rows: [] };
    const aoa = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, {
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
