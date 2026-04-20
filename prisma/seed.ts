import "dotenv/config";
import { createPrismaClient } from "../src/lib/db";
import { ChallengeType, Role } from "../src/generated/prisma/enums";

const prisma = createPrismaClient();

async function main() {
  const defaultEnvImg = "/pixel-placeholder.svg";
  const ranks = [
    { name: "Burbuja en prácticas", sortOrder: 0, minPoints: 0, shieldAssetUrl: null as string | null, environmentImageUrl: defaultEnvImg },
    { name: "Aprendiz del grifo", sortOrder: 1, minPoints: 75, shieldAssetUrl: null, environmentImageUrl: defaultEnvImg },
    { name: "Navegante del caudal", sortOrder: 2, minPoints: 180, shieldAssetUrl: null, environmentImageUrl: defaultEnvImg },
    { name: "Domador de válvulas", sortOrder: 3, minPoints: 380, shieldAssetUrl: null, environmentImageUrl: defaultEnvImg },
    { name: "Guardián de cuenca", sortOrder: 4, minPoints: 650, shieldAssetUrl: null, environmentImageUrl: defaultEnvImg },
    { name: "Alquimista de la gota", sortOrder: 5, minPoints: 1000, shieldAssetUrl: null, environmentImageUrl: defaultEnvImg },
    { name: "Custodio del manantial", sortOrder: 6, minPoints: 1500, shieldAssetUrl: null, environmentImageUrl: defaultEnvImg },
    { name: "Embajador PUEAA", sortOrder: 7, minPoints: 2200, shieldAssetUrl: null, environmentImageUrl: defaultEnvImg },
    { name: "Sabio del flujo eficiente", sortOrder: 8, minPoints: 3100, shieldAssetUrl: null, environmentImageUrl: defaultEnvImg },
    { name: "Leyenda del grifo dorado", sortOrder: 9, minPoints: 4500, shieldAssetUrl: null, environmentImageUrl: defaultEnvImg },
  ];
  for (const r of ranks) {
    await prisma.rank.upsert({
      where: { sortOrder: r.sortOrder },
      create: r,
      update: {
        name: r.name,
        minPoints: r.minPoints,
        shieldAssetUrl: r.shieldAssetUrl,
        environmentImageUrl: r.environmentImageUrl,
      },
    });
  }

  /** Tabla legacy; el visor usa `Rank.environmentImageUrl`. */
  await prisma.environmentAsset.deleteMany();

  await prisma.employee.upsert({
    where: { cedula: "1234567890" },
    create: {
      cedula: "1234567890",
      fullName: "Empleado Demo",
      role: Role.USER,
      active: true,
    },
    update: {},
  });

  await prisma.employee.upsert({
    where: { cedula: "0000000000" },
    create: {
      cedula: "0000000000",
      fullName: "Admin Demo",
      role: Role.ADMIN,
      active: true,
    },
    update: { role: Role.ADMIN },
  });

  await prisma.appSetting.upsert({
    where: { key: "carnet_logo_path" },
    create: { key: "carnet_logo_path", value: "/carnet-cazadores-gastos-fantasma.png" },
    update: {},
  });
  await prisma.appSetting.upsert({
    where: { key: "carnet_logo_caption" },
    create: { key: "carnet_logo_caption", value: "Cazadores de gastos fantasma" },
    update: {},
  });

  /** Reto anual único: seguimiento mensual vía WaterBillPeriod (no un Challenge por mes). */
  const water2026Start = new Date(Date.UTC(2026, 0, 1, 12, 0, 0));
  const water2026End = new Date(Date.UTC(2026, 11, 31, 12, 0, 0));
  await prisma.challenge.upsert({
    where: { code: "WATER-2026" },
    create: {
      code: "WATER-2026",
      title: "Reto recibos de agua 2026",
      description: "Declara el consumo de tu recibo mes a mes; la comparación es por persona (m³ ÷ habitantes).",
      type: ChallengeType.WATER_BILL,
      startsAt: water2026Start,
      endsAt: water2026End,
      basePoints: 0,
      optimalPerCapitaM3: 12,
      requiresEvidence: true,
      platformManaged: true,
      active: true,
    },
    update: {
      type: ChallengeType.WATER_BILL,
      optimalPerCapitaM3: 12,
      requiresEvidence: true,
      platformManaged: true,
      active: true,
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
