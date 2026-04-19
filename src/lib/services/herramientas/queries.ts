import type { AcopioCategory } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export type DirectoryPlaceWithCategories = Awaited<ReturnType<typeof listDirectoryPlacesPublic>>[number];

/**
 * Lista puntos del directorio. Si `categoriesOr` tiene valores, solo sitios que aceptan
 * al menos una de esas fracciones (OR).
 */
export async function listDirectoryPlacesPublic(opts?: { categoriesOr?: AcopioCategory[] }) {
  const cats = opts?.categoriesOr?.filter(Boolean);
  const where =
    cats && cats.length > 0
      ? { categories: { some: { category: { in: cats } } } }
      : undefined;

  return prisma.directoryPlace.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      categories: { orderBy: { category: "asc" } },
    },
  });
}

export async function listWaterTipsPublic() {
  return prisma.waterTip.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
}

export async function listContactChannelsPublic() {
  return prisma.contactChannel.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
}
