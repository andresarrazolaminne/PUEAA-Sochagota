/** Assets por defecto del visor / escudo (pixel art progresivo Paipa). */
export function defaultEnvironmentImageForSortOrder(sortOrder: number): string {
  const n = Math.max(0, Math.min(9, Math.floor(sortOrder)));
  return `/environments/rank-${n}.svg`;
}

export function defaultShieldImageForSortOrder(sortOrder: number): string {
  const n = Math.max(0, Math.min(9, Math.floor(sortOrder)));
  return `/shields/rank-${n}.svg`;
}

export function resolveEnvironmentImageUrl(
  stored: string | null | undefined,
  sortOrder: number,
): string {
  const t = stored?.trim();
  if (!t || t === "/pixel-placeholder.svg") {
    return defaultEnvironmentImageForSortOrder(sortOrder);
  }
  return t;
}

export function resolveShieldImageUrl(
  stored: string | null | undefined,
  sortOrder: number,
): string {
  const t = stored?.trim();
  if (!t) {
    return defaultShieldImageForSortOrder(sortOrder);
  }
  return t;
}
