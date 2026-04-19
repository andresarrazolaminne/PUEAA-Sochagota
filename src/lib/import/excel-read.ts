import * as XLSX from "xlsx";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 4000;

export type ExcelReadResult =
  | { ok: true; rows: Record<string, unknown>[] }
  | { ok: false; error: string };

export function readExcelFirstSheet(buffer: Buffer): ExcelReadResult {
  if (buffer.length > MAX_BYTES) {
    return { ok: false, error: "El archivo supera 5 MB." };
  }
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const name = wb.SheetNames[0];
  if (!name) return { ok: false, error: "El libro no tiene hojas." };
  const sheet = wb.Sheets[name];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });
  if (rows.length > MAX_ROWS) {
    return { ok: false, error: `Máximo ${MAX_ROWS} filas de datos.` };
  }
  return { ok: true, rows };
}

/** Quita tildes y unifica claves de columnas (primera fila del Excel). */
export function normalizeHeaderKey(key: string): string {
  return key
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_");
}

export function normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    out[normalizeHeaderKey(k)] = v;
  }
  return out;
}

export function cellStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString();
  return String(v).trim();
}

export function cellInt(v: unknown): number | null {
  if (v === "" || v === null || v === undefined) return null;
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  const n = Number.parseInt(String(v).replace(/\s/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

/** Igual que cellInt pero admite decimales (trunca). */
export function cellNumber(v: unknown): number | null {
  if (v === "" || v === null || v === undefined) return null;
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  const n = Number.parseFloat(String(v).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

export function cellBool(v: unknown, defaultValue: boolean): boolean {
  const s = cellStr(v).toLowerCase();
  if (!s) return defaultValue;
  if (["no", "false", "0", "inactivo", "f", "n"].includes(s)) return false;
  if (["si", "sí", "true", "1", "activo", "s", "y"].includes(s)) return true;
  return defaultValue;
}

export function isRowEmpty(row: Record<string, unknown>): boolean {
  const n = normalizeRow(row);
  return Object.values(n).every((v) => cellStr(v) === "");
}

export function parseDateCell(v: unknown): Date | null {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
  const s = cellStr(v);
  if (!s) return null;
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d;
  return null;
}
