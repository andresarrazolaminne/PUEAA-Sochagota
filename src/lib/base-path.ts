/**
 * Prefijo público cuando la app se sirve bajo una subruta (ej. /pueaa en Nginx).
 * Debe coincidir con `basePath` en next.config y con `NEXT_PUBLIC_BASE_PATH` en build/runtime.
 */
export function normalizedPublicBasePath(): string {
  const raw = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? "";
  if (!raw) return "";
  const withLeading = raw.startsWith("/") ? raw : `/${raw}`;
  const trimmed = withLeading.replace(/\/+$/, "");
  return trimmed.length > 0 ? trimmed : "";
}

/**
 * Prefijos históricos (Lightsail bajo /pueaa). Al servir en raíz/subdominio hay que quitarlos
 * de rutas guardadas en BD; si no, next/image trata `/pueaa/api/...` como asset local y falla 400.
 */
const LEGACY_PUBLIC_BASE_PATHS = ["/pueaa"] as const;

/** Quita prefijos legacy de rutas absolutas internas. No toca http(s)/blob. */
export function stripLegacyPublicBasePath(path: string): string {
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("blob:")
  ) {
    return path;
  }
  let out = path;
  for (const legacy of LEGACY_PUBLIC_BASE_PATHS) {
    if (out === legacy) return "/";
    if (out.startsWith(`${legacy}/`)) {
      out = out.slice(legacy.length) || "/";
    }
  }
  return out;
}

/**
 * Antepone el prefijo a rutas absolutas internas (`/api/...`, `/foo.svg`).
 * Idempotente: no duplica si la ruta ya incluye el prefijo (útil con datos antiguos en BD).
 */
export function withBasePath(path: string): string {
  const cleaned = stripLegacyPublicBasePath(path);
  const base = normalizedPublicBasePath();
  if (!cleaned.startsWith("/") || !base) return cleaned;
  if (cleaned === base || cleaned.startsWith(`${base}/`)) return cleaned;
  return `${base}${cleaned}`;
}

/**
 * Para `<img>` y enlaces a rutas internas guardadas en BD (`/api/...`).
 * Normaliza `/pueaa/api/...` legacy. Archivos en `/public` y URLs absolutas / blob sin cambio de host.
 */
export function withBasePathIfNeeded(path: string): string {
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("blob:")
  ) {
    return path;
  }
  const cleaned = stripLegacyPublicBasePath(path);
  if (cleaned.startsWith("/api/")) return withBasePath(cleaned);
  return cleaned;
}
