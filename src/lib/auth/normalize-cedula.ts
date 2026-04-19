/** Normaliza cédula para comparar con la BD (solo dígitos). */
export function normalizeCedula(input: string): string {
  return input.trim().replace(/\D/g, "");
}
