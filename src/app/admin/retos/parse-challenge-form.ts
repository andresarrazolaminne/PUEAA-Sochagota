import { ChallengeType } from "@/generated/prisma/enums";

const CHALLENGE_TYPES = new Set<string>(Object.values(ChallengeType));

function formStr(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : null;
}

function parseDateUtcNoon(ymd: string | null): Date | null {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [y, m, d] = ymd.split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

export type ParsedChallengeForm = {
  code: string | null;
  title: string;
  description: string | null;
  type: ChallengeType;
  startsAt: Date;
  endsAt: Date;
  basePoints: number;
  active: boolean;
  platformManaged: boolean;
  optimalPerCapitaM3: number | null;
  requiresEvidence: boolean;
  earlyBirdEndsAt: Date | null;
  earlyBirdSlots: number | null;
};

/** Parseo compartido crear/editar reto. */
export function parseChallengeForm(formData: FormData): { ok: true; data: ParsedChallengeForm } | { ok: false; message: string } {
  const title = formStr(formData, "title");
  if (!title) return { ok: false, message: "Indica el título del reto." };

  const codeRaw = formStr(formData, "code");
  const code = codeRaw ? codeRaw.toUpperCase().replace(/\s+/g, "-") : null;

  const description = formStr(formData, "description");

  const typeRaw = formStr(formData, "type");
  if (!typeRaw || !CHALLENGE_TYPES.has(typeRaw)) return { ok: false, message: "Tipo de reto no válido." };
  const type = typeRaw as ChallengeType;

  const startsAt = parseDateUtcNoon(formStr(formData, "startsAt"));
  const endsAt = parseDateUtcNoon(formStr(formData, "endsAt"));
  if (!startsAt || !endsAt) return { ok: false, message: "Indica fechas de inicio y fin válidas." };
  if (endsAt.getTime() < startsAt.getTime()) {
    return { ok: false, message: "La fecha de fin debe ser posterior o igual al inicio." };
  }

  const basePointsRaw = formStr(formData, "basePoints");
  const basePoints = basePointsRaw ? Number.parseInt(basePointsRaw, 10) : 0;
  if (!Number.isFinite(basePoints) || basePoints < 0) {
    return { ok: false, message: "Los puntos base deben ser un número mayor o igual a 0." };
  }

  const active = formStr(formData, "active") === "true";
  const platformManaged = formStr(formData, "platformManaged") === "true";

  let optimalPerCapitaM3: number | null = null;
  let requiresEvidence = false;
  let earlyBirdEndsAt: Date | null = null;
  let earlyBirdSlots: number | null = null;

  if (type === ChallengeType.WATER_BILL) {
    const optRaw = formStr(formData, "optimalPerCapitaM3");
    const opt = optRaw ? Number.parseFloat(optRaw.replace(",", ".")) : 12;
    if (!Number.isFinite(opt) || opt <= 0 || opt > 500) {
      return {
        ok: false,
        message:
          "La meta m³/persona debe ser un número entre 0,1 y 500 (p. ej. 11 Bogotá, 12 otra referencia).",
      };
    }
    optimalPerCapitaM3 = opt;
    requiresEvidence = formStr(formData, "requiresEvidence") === "true";
  } else {
    const ebDate = formStr(formData, "earlyBirdEndsAt");
    if (ebDate) {
      const d = parseDateUtcNoon(ebDate);
      if (d) earlyBirdEndsAt = d;
    }
    const slotsRaw = formStr(formData, "earlyBirdSlots");
    if (slotsRaw) {
      const s = Number.parseInt(slotsRaw, 10);
      if (Number.isFinite(s) && s >= 0) earlyBirdSlots = s;
    }
  }

  return {
    ok: true,
    data: {
      code,
      title,
      description: description || null,
      type,
      startsAt,
      endsAt,
      basePoints,
      active,
      platformManaged,
      optimalPerCapitaM3,
      requiresEvidence,
      earlyBirdEndsAt,
      earlyBirdSlots,
    },
  };
}

/** Valor para input type="date" (fecha almacenada en UTC mediodía, como en el resto del módulo). */
export function dateToUtcInputDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
