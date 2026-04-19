import { normalizeCedula } from "@/lib/auth/normalize-cedula";
import { prisma } from "@/lib/prisma";
import { setImportedParticipationScore } from "@/lib/services/points/participation-import";
import { cellNumber, cellStr, isRowEmpty, normalizeRow } from "@/lib/import/excel-read";
import type { ImportRowError, ImportStats } from "@/lib/import/run-employees";

export async function runScoresImport(rows: Record<string, unknown>[]): Promise<ImportStats> {
  const errors: ImportRowError[] = [];
  let ok = 0;
  let excelRow = 2;

  for (const raw of rows) {
    if (isRowEmpty(raw)) {
      excelRow += 1;
      continue;
    }
    const row = normalizeRow(raw);
    const cedula = normalizeCedula(cellStr(row.cedula ?? row.documento));
    const codeRaw = cellStr(row.codigo_reto ?? row.codigo ?? row.code ?? row.reto);
    const code = codeRaw ? codeRaw.toUpperCase().replace(/\s+/g, "-") : "";
    const points = cellNumber(row.puntos ?? row.puntaje ?? row.puntos_otorgados);
    const nota = cellStr(row.nota ?? row.comentario ?? row.observacion) || null;

    if (!cedula || !code || points === null) {
      errors.push({ row: excelRow, message: "Falta cédula, codigo de reto o puntos." });
      excelRow += 1;
      continue;
    }

    const employee = await prisma.employee.findUnique({ where: { cedula } });
    if (!employee) {
      errors.push({ row: excelRow, message: `No hay empleado con cédula ${cedula}.` });
      excelRow += 1;
      continue;
    }

    const challenge = await prisma.challenge.findUnique({ where: { code } });
    if (!challenge) {
      errors.push({ row: excelRow, message: `No hay reto con código ${code}.` });
      excelRow += 1;
      continue;
    }

    try {
      await setImportedParticipationScore(employee.id, challenge.id, points, nota);
      ok += 1;
    } catch (e) {
      errors.push({
        row: excelRow,
        message: e instanceof Error ? e.message : "Error al aplicar puntos.",
      });
    }
    excelRow += 1;
  }

  return { ok, errors };
}
