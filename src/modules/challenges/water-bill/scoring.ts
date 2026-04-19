/**
 * Política de puntos (ajustable): mejora vs mantenerse en línea óptima (per cápita).
 * Ver comentarios en código para supuestos de negocio.
 */

/** Si el reto no define meta, usar este valor (m³/persona/mes). */
export const DEFAULT_OPTIMAL_PER_CAPITA_M3 = 12;

export const MAINTENANCE_POINTS = 12;
export const IMPROVEMENT_MULTIPLIER = 8;
export const IMPROVEMENT_CAP = 24;
/** Primer periodo declarado en la campaña (sin mes anterior comparable). */
export const FIRST_PERIOD_BONUS = 5;

export type WaterBillScoreInput = {
  currentPerCapitaM3: number;
  previousPerCapitaM3: number | null;
  optimalPerCapitaM3: number;
  /** True si no existía ningún WaterBillPeriod previo para este empleado+reto. */
  isFirstEverPeriod: boolean;
};

export type WaterBillScoreResult = {
  improvementPoints: number;
  maintenancePoints: number;
};

/**
 * - Mantenimiento: per cápita <= meta global del reto.
 * - Mejora: reducción de per cápita respecto al mes anterior (tope).
 * - Primer mes: bonus pequeño de participación si aún no hay historial (no suma “mejora” ficticia).
 */
export function scoreWaterBillPeriod(input: WaterBillScoreInput): WaterBillScoreResult {
  const { currentPerCapitaM3, previousPerCapitaM3, optimalPerCapitaM3, isFirstEverPeriod } = input;

  let maintenancePoints = 0;
  if (currentPerCapitaM3 <= optimalPerCapitaM3) {
    maintenancePoints = MAINTENANCE_POINTS;
  }

  let improvementPoints = 0;
  if (previousPerCapitaM3 !== null) {
    const gain = previousPerCapitaM3 - currentPerCapitaM3;
    if (gain > 0) {
      improvementPoints = Math.min(
        IMPROVEMENT_CAP,
        Math.round(gain * IMPROVEMENT_MULTIPLIER),
      );
    }
  } else if (isFirstEverPeriod) {
    improvementPoints = FIRST_PERIOD_BONUS;
  }

  return { improvementPoints, maintenancePoints };
}
