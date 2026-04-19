/** Periodo mensual normalizado (mes de facturación) en UTC mediodía día 1. */

export function periodStartFromParts(year: number, month1To12: number): Date {
  if (month1To12 < 1 || month1To12 > 12) {
    throw new Error("El mes debe estar entre 1 y 12.");
  }
  return new Date(Date.UTC(year, month1To12 - 1, 1, 12, 0, 0));
}

export function formatPeriodLabelEs(periodStart: Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(periodStart);
}

/** Meses de facturación disponibles entre inicio del reto y hoy (o fin del reto). */
export function listOpenPeriodOptions(
  challengeStartsAt: Date,
  challengeEndsAt: Date,
  now = new Date(),
): { year: number; month: number; periodStart: Date; label: string }[] {
  const cap = challengeEndsAt.getTime() < now.getTime() ? challengeEndsAt : now;
  if (challengeStartsAt.getTime() > cap.getTime()) {
    return [];
  }

  let y = challengeStartsAt.getUTCFullYear();
  let m = challengeStartsAt.getUTCMonth() + 1;
  const endY = cap.getUTCFullYear();
  const endM = cap.getUTCMonth() + 1;

  const out: { year: number; month: number; periodStart: Date; label: string }[] = [];
  for (;;) {
    const periodStart = periodStartFromParts(y, m);
    out.push({
      year: y,
      month: m,
      periodStart,
      label: formatPeriodLabelEs(periodStart),
    });
    if (y === endY && m === endM) break;
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }

  return out;
}
