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
 * Antepone el prefijo a rutas absolutas internas (`/api/...`, `/foo.svg`).
 * Idempotente: no duplica si la ruta ya incluye el prefijo (útil con datos antiguos en BD).
 */
export function withBasePath(path: string): string {
  const base = normalizedPublicBasePath();
  if (!path.startsWith("/") || !base) return path;
  if (path === base || path.startsWith(`${base}/`)) return path;
  return `${base}${path}`;
}

/**
 * Para `<img>` y enlaces a rutas internas guardadas en BD (`/api/...`).
 * No modifica archivos en `/public` ni URLs absolutas / blob (Next/Image añade `basePath` solo).
 */
export function withBasePathIfNeeded(path: string): string {
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("blob:")
  ) {
    return path;
  }
  if (path.startsWith("/api/")) return withBasePath(path);
  return path;
}
