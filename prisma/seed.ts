import "dotenv/config";
import { createPrismaClient } from "../src/lib/db";
import { ChallengeType, Role } from "../src/generated/prisma/enums";

const prisma = createPrismaClient();

async function main() {
  const ranks = [
    { name: "Burbuja en prácticas", sortOrder: 0, minPoints: 0, shieldAssetUrl: null as string | null },
    { name: "Aprendiz del grifo", sortOrder: 1, minPoints: 75, shieldAssetUrl: null },
    { name: "Navegante del caudal", sortOrder: 2, minPoints: 180, shieldAssetUrl: null },
    { name: "Domador de válvulas", sortOrder: 3, minPoints: 380, shieldAssetUrl: null },
    { name: "Guardián de cuenca", sortOrder: 4, minPoints: 650, shieldAssetUrl: null },
    { name: "Alquimista de la gota", sortOrder: 5, minPoints: 1000, shieldAssetUrl: null },
    { name: "Custodio del manantial", sortOrder: 6, minPoints: 1500, shieldAssetUrl: null },
    { name: "Embajador PUEAA", sortOrder: 7, minPoints: 2200, shieldAssetUrl: null },
    { name: "Sabio del flujo eficiente", sortOrder: 8, minPoints: 3100, shieldAssetUrl: null },
    { name: "Leyenda del grifo dorado", sortOrder: 9, minPoints: 4500, shieldAssetUrl: null },
  ];
  for (const r of ranks) {
    await prisma.rank.upsert({
      where: { sortOrder: r.sortOrder },
      create: r,
      update: { name: r.name, minPoints: r.minPoints, shieldAssetUrl: r.shieldAssetUrl },
    });
  }

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

  const envAssets = [
    { minPoints: 0, assetUrl: "/pixel-placeholder.svg", label: "Inicial" },
    { minPoints: 200, assetUrl: "/pixel-placeholder.svg", label: "Mejorando" },
    { minPoints: 500, assetUrl: "/pixel-placeholder.svg", label: "Florecido" },
  ];
  for (const a of envAssets) {
    await prisma.environmentAsset.upsert({
      where: { minPoints: a.minPoints },
      create: a,
      update: { assetUrl: a.assetUrl, label: a.label },
    });
  }

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
