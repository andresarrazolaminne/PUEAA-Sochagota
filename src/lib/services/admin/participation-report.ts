import { LEDGER_REF_PARTICIPATION } from "@/lib/services/points/participation-import";
import { LEDGER_REF_PLACE_DOCUMENTATION_APPROVAL } from "@/modules/challenges/place-documentation/ledger";
import { LEDGER_REF_TRIVIA_CORRECT } from "@/modules/challenges/trivia/ledger";
import {
  LEDGER_REF_WATER_IMPROVEMENT,
  LEDGER_REF_WATER_MAINTENANCE,
} from "@/modules/challenges/water-bill/ledger";
import { LEDGER_REF_WASTE_EVIDENCE_COMPLETION } from "@/modules/challenges/waste-evidence/ledger";

const MAX_RANGE_DAYS = 366;

export type ParticipationActivityId =
  | "agua"
  | "residuos"
  | "centros"
  | "trivia"
  | "importacion";

export const PARTICIPATION_ACTIVITY_ORDER: {
  id: ParticipationActivityId;
  label: string;
}[] = [
  { id: "agua", label: "Agua" },
  { id: "residuos", label: "Residuos" },
  { id: "centros", label: "Centros de acopio" },
  { id: "trivia", label: "Trivia" },
  { id: "importacion", label: "Importacion participacion" },
];

export type ParticipationLedgerRow = {
  employeeId: string;
  delta: number;
  refType: string | null;
  createdAt: Date;
  employee: { fullName: string; cedula: string };
};

const dateTimeFmt = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "short",
  timeStyle: "short",
});

export function formatParticipationReportDate(d: Date): string {
  return dateTimeFmt.format(d);
}

function parseYmdUtc(ymd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const da = Number(m[3]);
  if (mo < 1 || mo > 12 || da < 1 || da > 31) return null;
  const d = new Date(Date.UTC(y, mo - 1, da));
  if (
    d.getUTCFullYear() !== y ||
    d.getUTCMonth() !== mo - 1 ||
    d.getUTCDate() !== da
  ) {
    return null;
  }
  return d;
}

function ymdFromUtcDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Últimos 30 días (inclusive) en calendario UTC, como `YYYY-MM-DD`. */
export function participationReportDefaultRangeUtcYmd(): {
  desde: string;
  hasta: string;
} {
  const today = new Date();
  const end = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 29);
  return { desde: ymdFromUtcDate(start), hasta: ymdFromUtcDate(end) };
}

/**
 * Rango `desde`–`hasta` (inclusive en `hasta`). Para Prisma: `createdAt >= start` y `createdAt < endExclusive`.
 */
export function parseParticipationReportRange(
  desde: string,
  hasta: string,
):
  | { ok: true; start: Date; endExclusive: Date }
  | { ok: false; error: string } {
  const desdeTrim = desde.trim();
  const hastaTrim = hasta.trim();
  if (!desdeTrim || !hastaTrim) {
    return { ok: false, error: "Indica fecha desde y hasta." };
  }
  const start = parseYmdUtc(desdeTrim);
  const hastaDay = parseYmdUtc(hastaTrim);
  if (!start || !hastaDay) {
    return { ok: false, error: "Las fechas deben tener formato YYYY-MM-DD." };
  }
  const endExclusive = new Date(hastaDay);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
  if (endExclusive.getTime() <= start.getTime()) {
    return {
      ok: false,
      error: "La fecha hasta debe ser igual o posterior a desde.",
    };
  }
  const maxMs = MAX_RANGE_DAYS * 24 * 60 * 60 * 1000;
  if (endExclusive.getTime() - start.getTime() > maxMs) {
    return {
      ok: false,
      error: `El rango no puede superar ${MAX_RANGE_DAYS} días.`,
    };
  }
  return { ok: true, start, endExclusive };
}

function refTypeToActivityId(
  refType: string | null,
): ParticipationActivityId | null {
  if (!refType) return null;
  if (
    refType === LEDGER_REF_WATER_IMPROVEMENT ||
    refType === LEDGER_REF_WATER_MAINTENANCE
  ) {
    return "agua";
  }
  if (refType === LEDGER_REF_WASTE_EVIDENCE_COMPLETION) return "residuos";
  if (refType === LEDGER_REF_PLACE_DOCUMENTATION_APPROVAL) return "centros";
  if (refType === LEDGER_REF_TRIVIA_CORRECT) return "trivia";
  if (refType === LEDGER_REF_PARTICIPATION) return "importacion";
  return null;
}

type EmployeeAcc = {
  employeeId: string;
  fullName: string;
  cedula: string;
  sumDelta: number;
  count: number;
  lastGlobal: Date | null;
  activityLast: Partial<Record<ParticipationActivityId, Date>>;
};

export type ParticipationSummaryRow = {
  employeeId: string;
  fullName: string;
  cedula: string;
  sumDelta: number;
  count: number;
  lastGlobal: Date | null;
  activityLast: Partial<Record<ParticipationActivityId, Date>>;
};

export function parseParticipationActivities(
  values: string[],
): ParticipationActivityId[] {
  const allowed = new Set(PARTICIPATION_ACTIVITY_ORDER.map((x) => x.id));
  const out: ParticipationActivityId[] = [];
  for (const value of values) {
    if (allowed.has(value as ParticipationActivityId)) {
      const activity = value as ParticipationActivityId;
      if (!out.includes(activity)) out.push(activity);
    }
  }
  return out;
}

/**
 * Filtro aditivo (OR): si selecciona varias actividades, incluye empleados activos en cualquiera.
 */
export function filterParticipationRowsByActivities(
  rows: ParticipationSummaryRow[],
  selectedActivities: ParticipationActivityId[],
): ParticipationSummaryRow[] {
  if (selectedActivities.length === 0) return rows;
  return rows.filter((row) =>
    selectedActivities.some((activityId) => row.activityLast[activityId] != null),
  );
}

export function buildParticipationSummaryRows(
  rows: ParticipationLedgerRow[],
): ParticipationSummaryRow[] {
  const byEmp = new Map<string, EmployeeAcc>();

  for (const row of rows) {
    let acc = byEmp.get(row.employeeId);
    if (!acc) {
      acc = {
        employeeId: row.employeeId,
        fullName: row.employee.fullName,
        cedula: row.employee.cedula,
        sumDelta: 0,
        count: 0,
        lastGlobal: null,
        activityLast: {},
      };
      byEmp.set(row.employeeId, acc);
    }
    acc.sumDelta += row.delta;
    acc.count += 1;
    const ts = row.createdAt.getTime();
    if (!acc.lastGlobal || ts > acc.lastGlobal.getTime()) {
      acc.lastGlobal = row.createdAt;
    }
    const act = refTypeToActivityId(row.refType);
    if (act) {
      const prev = acc.activityLast[act];
      if (!prev || ts > prev.getTime()) {
        acc.activityLast[act] = row.createdAt;
      }
    }
  }

  return [...byEmp.values()].sort((a, b) =>
    a.fullName.localeCompare(b.fullName, "es"),
  );
}

export function buildParticipationMatrixFromSummaryRows(
  rows: ParticipationSummaryRow[],
): (string | number)[][] {
  const data: (string | number)[][] = [buildParticipationHeaderRow()];
  for (const row of rows) {
    const out: (string | number)[] = [
      row.fullName,
      row.cedula,
      row.sumDelta,
      row.count,
      row.lastGlobal ? formatParticipationReportDate(row.lastGlobal) : "",
    ];
    for (const { id } of PARTICIPATION_ACTIVITY_ORDER) {
      const last = row.activityLast[id];
      const activa = last != null;
      out.push(activa ? "Activa" : "Inactiva");
      out.push(activa && last ? formatParticipationReportDate(last) : "");
    }
    data.push(out);
  }
  return data;
}

function buildParticipationHeaderRow(): (string | number)[] {
  const header: (string | number)[] = [
    "Nombre completo",
    "Cedula",
    "Total puntos en el rango",
    "Cantidad total de actividades en el rango",
    "Fecha del ultimo registro (global, dentro del rango)",
  ];
  for (const { label } of PARTICIPATION_ACTIVITY_ORDER) {
    header.push(`${label} (estado)`);
    header.push(`${label} (ultimo registro)`);
  }
  return header;
}

/**
 * Agrupa movimientos del ledger por empleado y devuelve una matriz (cabecera + filas) lista para Excel.
 */
export function buildParticipationMatrix(
  rows: ParticipationLedgerRow[],
): (string | number)[][] {
  return buildParticipationMatrixFromSummaryRows(
    buildParticipationSummaryRows(rows),
  );
}
