import { spawnSync } from "node:child_process";
import { DB_TARGETS } from "../prisma7.config";

const missing = DB_TARGETS.filter((t) => !t.url);
if (missing.length > 0) {
  console.error(
    `Missing DB connection strings in .env for: ${missing.map((t) => t.name).join(", ")}`
  );
  process.exit(1);
}

const failures: string[] = [];

for (const target of DB_TARGETS) {
  console.log(`\n=====> Applying migrations to ${target.name} ...`);
  const res = spawnSync("npx prisma migrate deploy", {
    shell: true,
    stdio: "inherit",
    env: { ...process.env, DIRECT_URL: target.url, DATABASE_URL: target.url },
  });
  if (res.status !== 0) {
    failures.push(target.name);
    console.error(`Migrations FAILED on ${target.name}`);
  }
}

if (failures.length > 0) {
  console.error(`\nDone with errors. Failed targets: ${failures.join(", ")}`);
  process.exit(1);
}

console.log("\nAll migrations applied to all databases.");