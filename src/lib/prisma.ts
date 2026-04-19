import { createPrismaClient } from "@/lib/db";

type PrismaClientInstance = ReturnType<typeof createPrismaClient>;

/**
 * Incrementar cuando el esquema Prisma cambie de forma que un cliente antiguo en memoria
 * falle en runtime (p. ej. nuevos modelos o campos en `where`). En dev, HMR puede conservar un
 * singleton generado antes de `prisma generate`.
 */
const PRISMA_CLIENT_CACHE_REVISION = 10;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientInstance | undefined;
  prismaCacheRevision: number | undefined;
};

function hasAppSettingDelegate(client: PrismaClientInstance): boolean {
  return typeof (client as unknown as { appSetting?: { findMany?: unknown } }).appSetting?.findMany === "function";
}

function getPrisma(): PrismaClientInstance {
  const cachedRev = globalForPrisma.prismaCacheRevision ?? 0;
  let client = globalForPrisma.prisma ?? createPrismaClient();
  const stale =
    cachedRev !== PRISMA_CLIENT_CACHE_REVISION || !hasAppSettingDelegate(client);
  if (stale) {
    client = createPrismaClient();
  }
  globalForPrisma.prisma = client;
  globalForPrisma.prismaCacheRevision = PRISMA_CLIENT_CACHE_REVISION;
  return client;
}

export const prisma = getPrisma();
