/**
 * Clave estable para comparar el mismo centro/punto entre envíos (reto residuos).
 * Rechazados no entran en la clave de duplicado para “ya registrado” en queries.
 */

function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "");
}

export function normalizeSitePart(s: string | null | undefined): string {
  if (!s) return "";
  return stripDiacritics(s.trim().toLowerCase()).replace(/\s+/g, " ");
}

/** Concatena nombre y dirección normalizados; vacío si no hay nombre ni dirección útil. */
export function computeSiteKey(siteName: string, siteAddress: string | null | undefined): string {
  const n = normalizeSitePart(siteName);
  const a = normalizeSitePart(siteAddress ?? "");
  if (!n && !a) return "";
  return `${n}|${a}`;
}
