import { normalizeCedula } from "@/lib/auth/normalize-cedula";
import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma/enums";
import { cellBool, cellStr, isRowEmpty, normalizeRow } from "@/lib/import/excel-read";

export type ImportRowError = { row: number; message: string };

export type ImportStats = { ok: number; errors: ImportRowError[] };

function parseRole(raw: string): Role {
  const s = raw.toUpperCase();
  if (s === "ADMIN") return Role.ADMIN;
  return Role.USER;
}

export async function runEmployeeImport(rows: Record<string, unknown>[]): Promise<ImportStats> {
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
    const fullName = cellStr(row.nombre_completo ?? row.nombre ?? row.full_name ?? row.name);
    const roleRaw = cellStr(row.rol ?? row.role);
    const active = cellBool(row.activo ?? row.active ?? row.estado, true);

    if (!cedula || !fullName) {
      errors.push({ row: excelRow, message: "Falta cédula o nombre completo." });
      excelRow += 1;
      continue;
    }

    const role = roleRaw ? parseRole(roleRaw) : Role.USER;

    try {
      await prisma.employee.upsert({
        where: { cedula },
        create: { cedula, fullName, role, active },
        update: { fullName, role, active },
      });
      ok += 1;
    } catch {
      errors.push({ row: excelRow, message: "No se pudo guardar (¿cédula duplicada?)." });
    }
    excelRow += 1;
  }

  return { ok, errors };
}
