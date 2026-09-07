import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { ROLE_PRESETS, asPermissionRecord } from "../src/lib/permissions";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL ?? "";
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

const prisma = globalForPrisma.prisma ?? createClient();

async function main() {
  const email = "nitay@ditserv.com";
  const password = "Admin@123";
  const name = "Admin";

  const hashed = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { name, password: hashed, role: "ADMIN", permissions: asPermissionRecord(ROLE_PRESETS.ADMIN) },
    create: {
      email,
      password: hashed,
      name,
      role: "ADMIN",
      permissions: asPermissionRecord(ROLE_PRESETS.ADMIN),
    },
  });

  console.log(`✔ Seed user ready: ${admin.email} (${admin.role})`);

  const stale = await prisma.user.findUnique({
    where: { email: "test@example.com" },
  });
  if (stale) {
    await prisma.user.delete({ where: { id: stale.id } });
    console.log("✔ Removed stale test user: test@example.com");
  }
}

main()
  .catch((e) => {
    console.error("✖ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });