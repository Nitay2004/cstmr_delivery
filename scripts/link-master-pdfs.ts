/**
 * Bulk link Data Wiping Master PDFs.
 *
 * Scans a folder for PDF files and links each one to an asset in
 * DataWipingMaster by matching the filename (without extension) against
 * `serialNumber`, then falling back to `pdfName`. Writes the relative path
 * into `storagePath` so the app can serve the file from the server disk.
 *
 * Usage (run inside the repo, with DATABASE_URL pointing to the office DB):
 *   npx tsx scripts/link-master-pdfs.ts --root /opt/dwmp-pdfs [--dry-run]
 */
import { promises as fs } from "fs";
import path from "path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(name);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

async function findAllFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await findAllFiles(full)));
    else if (/\.pdf$/i.test(e.name)) out.push(full);
  }
  return out;
}

async function main() {
  const root = arg("--root");
  const dryRun = process.argv.includes("--dry-run");
  if (!root) {
    console.error("Usage: npx tsx scripts/link-master-pdfs.ts --root <abs-path> [--dry-run]");
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set (point it to the office DB).");
    process.exit(1);
  }

  const resolvedRoot = path.resolve(root);
  const files = await findAllFiles(resolvedRoot);
  console.log(`Found ${files.length} PDF file(s) under ${resolvedRoot}`);

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  try {
    const assets = await prisma.dataWipingMaster.findMany({
      select: { id: true, serialNumber: true, pdfName: true, storagePath: true },
    });

    const bySerial = new Map<string, string>(); // key -> id
    const byPdfName = new Map<string, string>(); // key -> id
    const bySerialExisting = new Map<string, string>(); // serial -> storagePath
    for (const a of assets) {
      if (a.serialNumber) {
        const k = a.serialNumber.toLowerCase();
        if (!bySerial.has(k)) bySerial.set(k, a.id);
        bySerialExisting.set(k, a.storagePath ?? "");
      }
      if (a.pdfName) {
        const k = a.pdfName.toLowerCase();
        if (!byPdfName.has(k)) byPdfName.set(k, a.id);
      }
    }

    let matched = 0;
    let alreadyLinked = 0;
    let updated = 0;
    const unmatched: string[] = [];
    const updates: { id: string; rel: string; pdfName: string }[] = [];

    for (const file of files) {
      const basename = path.basename(file);
      const nameNoExt = basename.replace(/\.pdf$/i, "");
      const rel = path.relative(resolvedRoot, file).split(path.sep).join("/");

      const id =
        bySerial.get(nameNoExt.toLowerCase()) ??
        byPdfName.get(basename.toLowerCase()) ??
        byPdfName.get(nameNoExt.toLowerCase());

      if (!id) {
        unmatched.push(basename);
        continue;
      }
      matched++;

      if (bySerialExisting.get(nameNoExt.toLowerCase()) === rel) {
        alreadyLinked++;
        continue;
      }
      updated++;
      updates.push({ id, rel, pdfName: basename });
    }

    if (!dryRun && updates.length > 0) {
      const chunkSize = 200;
      for (let i = 0; i < updates.length; i += chunkSize) {
        const chunk = updates.slice(i, i + chunkSize);
        await Promise.all(
          chunk.map((u) =>
            prisma.dataWipingMaster.update({
              where: { id: u.id },
              data: { storagePath: u.rel, pdfName: u.pdfName },
            })
          )
        );
      }
    }

    console.log(`Matched   : ${matched} / ${files.length}`);
    console.log(`Linked    : ${dryRun ? updated + " (dry-run)" : updated}`);
    console.log(`Already   : ${alreadyLinked}`);
    console.log(`Unmatched : ${unmatched.length}`);
    for (const f of unmatched.slice(0, 25)) console.log(`  - ${f}`);
    if (unmatched.length > 25) console.log(`  ...and ${unmatched.length - 25} more`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});