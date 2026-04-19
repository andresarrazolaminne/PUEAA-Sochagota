"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { readExcelFirstSheet } from "@/lib/import/excel-read";
import { runEmployeeImport } from "@/lib/import/run-employees";
import { runChallengeImport } from "@/lib/import/run-challenges";
import { runScoresImport } from "@/lib/import/run-scores";

export type ImportResult = {
  kind: "empleados" | "retos" | "puntajes";
  ok: number;
  errors: { row: number; message: string }[];
};

function fileError(kind: ImportResult["kind"], message: string): ImportResult {
  return { kind, ok: 0, errors: [{ row: 0, message }] };
}

export async function importEmployeesExcelAction(formData: FormData): Promise<ImportResult> {
  await requireAdmin("/admin/importaciones");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return fileError("empleados", "Selecciona un archivo .xlsx.");
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const parsed = readExcelFirstSheet(buf);
  if (!parsed.ok) return fileError("empleados", parsed.error);
  const result = await runEmployeeImport(parsed.rows);
  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/puntajes");
  return { kind: "empleados", ...result };
}

export async function importChallengesExcelAction(formData: FormData): Promise<ImportResult> {
  await requireAdmin("/admin/importaciones");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return fileError("retos", "Selecciona un archivo .xlsx.");
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const parsed = readExcelFirstSheet(buf);
  if (!parsed.ok) return fileError("retos", parsed.error);
  const result = await runChallengeImport(parsed.rows);
  revalidatePath("/admin/retos");
  revalidatePath("/tablero");
  return { kind: "retos", ...result };
}

export async function importScoresExcelAction(formData: FormData): Promise<ImportResult> {
  await requireAdmin("/admin/importaciones");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return fileError("puntajes", "Selecciona un archivo .xlsx.");
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const parsed = readExcelFirstSheet(buf);
  if (!parsed.ok) return fileError("puntajes", parsed.error);
  const result = await runScoresImport(parsed.rows);
  revalidatePath("/admin/puntajes");
  revalidatePath("/admin/retos");
  revalidatePath("/tablero");
  return { kind: "puntajes", ...result };
}
