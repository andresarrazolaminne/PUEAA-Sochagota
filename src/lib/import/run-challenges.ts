import { prisma } from "@/lib/prisma";
import { ChallengeType } from "@/generated/prisma/enums";
import {
  cellBool,
  cellInt,
  cellStr,
  isRowEmpty,
  normalizeRow,
  parseDateCell,
} from "@/lib/import/excel-read";
import { parseChallengeType } from "@/lib/import/challenge-type";
import type { ImportRowError, ImportStats } from "@/lib/import/run-employees";

const START_DEFAULT = new Date("2000-01-01T05:00:00.000Z");
const END_DEFAULT = new Date("2099-12-31T05:00:00.000Z");

export async function runChallengeImport(rows: Record<string, unknown>[]): Promise<ImportStats> {
  const errors: ImportRowError[] = [];
  let ok = 0;
  let excelRow = 2;

  for (const raw of rows) {
    if (isRowEmpty(raw)) {
      excelRow += 1;
      continue;
    }
    const row = normalizeRow(raw);
    const codeRaw = cellStr(row.codigo ?? row.code ?? row.clave);
    const code = codeRaw ? codeRaw.toUpperCase().replace(/\s+/g, "-") : "";
    const title = cellStr(row.titulo ?? row.title ?? row.nombre);
    const description = cellStr(row.descripcion ?? row.description) || null;
    const typeStr = cellStr(row.tipo ?? row.type);
    const startsAt = parseDateCell(row.inicio ?? row.starts ?? row.fecha_inicio) ?? START_DEFAULT;
    const endsAt = parseDateCell(row.fin ?? row.ends ?? row.fecha_fin) ?? END_DEFAULT;
    const basePoints = cellInt(row.puntos_base ?? row.puntos ?? row.base_points) ?? 0;
    const active = cellBool(row.activo ?? row.active, true);
    const legacyOnly = cellBool(row.fuera_plataforma ?? row.solo_importacion ?? row.legacy ?? row.historico, false);

    if (!code || !title) {
      errors.push({ row: excelRow, message: "Falta codigo o titulo." });
      excelRow += 1;
      continue;
    }

    if (endsAt < startsAt) {
      errors.push({ row: excelRow, message: "La fecha fin es anterior al inicio." });
      excelRow += 1;
      continue;
    }

    const type: ChallengeType = typeStr
      ? parseChallengeType(typeStr) ?? ChallengeType.OTHER
      : ChallengeType.OTHER;

    try {
      await prisma.challenge.upsert({
        where: { code },
        create: {
          code,
          title,
          description,
          type,
          startsAt,
          endsAt,
          basePoints,
          active,
          platformManaged: !legacyOnly,
          requiresEvidence: false,
        },
        update: {
          title,
          description,
          type,
          startsAt,
          endsAt,
          basePoints,
          active,
          platformManaged: !legacyOnly,
        },
      });
      ok += 1;
    } catch (e) {
      errors.push({
        row: excelRow,
        message: e instanceof Error ? e.message : "Error al guardar el reto.",
      });
    }
    excelRow += 1;
  }

  return { ok, errors };
}
