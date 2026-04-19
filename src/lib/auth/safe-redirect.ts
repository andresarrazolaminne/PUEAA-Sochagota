/** Evita open-redirect: solo rutas relativas internas. */
export function safeInternalPath(path: unknown, fallback = "/tablero"): string {
  if (typeof path !== "string" || path.length === 0) return fallback;
  if (!path.startsWith("/") || path.startsWith("//")) return fallback;
  return path;
}
