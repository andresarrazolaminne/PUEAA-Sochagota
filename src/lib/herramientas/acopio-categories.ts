import { AcopioCategory } from "@/generated/prisma/enums";

/** Orden estable para UI (checkboxes, filtros). */
export const ACOPIO_CATEGORY_ORDER: AcopioCategory[] = [
  AcopioCategory.BATTERIES_PORTABLE,
  AcopioCategory.BATTERIES_AUTO_INDUSTRIAL,
  AcopioCategory.WEEE_SMALL,
  AcopioCategory.WEEE_LARGE,
  AcopioCategory.COOKING_OIL_USED,
  AcopioCategory.MOTOR_OIL_USED,
  AcopioCategory.OIL_FILTERS,
  AcopioCategory.DEBRIS_RCD,
  AcopioCategory.WOOD_PRUNING_BULKY,
  AcopioCategory.HAZARDOUS_CHEMICALS,
  AcopioCategory.PAINTS_SOLVENTS_AEROSOLS,
  AcopioCategory.AGROCHEMICAL_CONTAINERS,
  AcopioCategory.EXPIRED_MEDICINES,
  AcopioCategory.USED_TIRES,
  AcopioCategory.LAMPS_FLUORESCENT,
  AcopioCategory.PLASTIC_RECYCLING,
  AcopioCategory.PAPER_CARDBOARD,
  AcopioCategory.GLASS,
  AcopioCategory.TEXTILE,
  AcopioCategory.ORGANIC_COMPOST,
];

const LABELS: Record<AcopioCategory, string> = {
  [AcopioCategory.BATTERIES_PORTABLE]: "Pilas y baterías portátiles",
  [AcopioCategory.BATTERIES_AUTO_INDUSTRIAL]: "Baterías de auto / industriales",
  [AcopioCategory.WEEE_SMALL]: "RAEE pequeño (cables, celulares, etc.)",
  [AcopioCategory.WEEE_LARGE]: "RAEE grande (electrodomésticos)",
  [AcopioCategory.COOKING_OIL_USED]: "Aceite de cocina usado",
  [AcopioCategory.MOTOR_OIL_USED]: "Aceite lubricante / motor usado",
  [AcopioCategory.OIL_FILTERS]: "Filtros de aceite usados",
  [AcopioCategory.DEBRIS_RCD]: "Escombros y RCD",
  [AcopioCategory.WOOD_PRUNING_BULKY]: "Madera, poda y voluminosos",
  [AcopioCategory.HAZARDOUS_CHEMICALS]: "Químicos y residuos peligrosos",
  [AcopioCategory.PAINTS_SOLVENTS_AEROSOLS]: "Pinturas, solventes y aerosoles",
  [AcopioCategory.AGROCHEMICAL_CONTAINERS]: "Envases de agroquímicos (vacíos)",
  [AcopioCategory.EXPIRED_MEDICINES]: "Medicamentos vencidos",
  [AcopioCategory.USED_TIRES]: "Neumáticos usados",
  [AcopioCategory.LAMPS_FLUORESCENT]: "Bombillas y tubos fluorescentes",
  [AcopioCategory.PLASTIC_RECYCLING]: "Plástico (reciclaje)",
  [AcopioCategory.PAPER_CARDBOARD]: "Papel y cartón",
  [AcopioCategory.GLASS]: "Vidrio",
  [AcopioCategory.TEXTILE]: "Textil y ropa",
  [AcopioCategory.ORGANIC_COMPOST]: "Orgánicos / compostaje",
};

export function acopioCategoryLabel(c: AcopioCategory): string {
  return LABELS[c] ?? c;
}

export function isAcopioCategory(raw: string): raw is AcopioCategory {
  return Object.values(AcopioCategory).includes(raw as AcopioCategory);
}

/** Valores únicos válidos enviados en formulario (`name="categories"`). */
export function parseAcopioCategoriesFromFormData(formData: FormData): AcopioCategory[] {
  const raw = formData.getAll("categories");
  const out = new Set<AcopioCategory>();
  for (const v of raw) {
    if (typeof v === "string" && isAcopioCategory(v)) out.add(v);
  }
  return [...out];
}
