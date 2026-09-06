/**
 * Variables de `:root` en `globals.css`, aplicables vía `AppSetting` para poder
 * exportar/importar la paleta entre instancias sin tocar el código.
 */
export const UI_THEME_CSS_VARS = [
  "--game-sky-top",
  "--game-sky-bottom",
  "--game-sky-mid",
  "--game-panel",
  "--game-panel-deep",
  "--game-border",
  "--game-border-soft",
  "--game-text",
  "--game-text-muted",
  "--game-accent",
  "--game-accent-hot",
  "--game-success",
  "--game-warn",
  "--game-danger",
  "--game-pixel-shadow",
  "--background",
  "--foreground",
] as const;

export type UiThemeCssVar = (typeof UI_THEME_CSS_VARS)[number];

/** Valores por defecto (deben coincidir con `globals.css`). */
export const DEFAULT_UI_THEME: Record<UiThemeCssVar, string> = {
  "--game-sky-top": "#a8c8ec",
  "--game-sky-bottom": "#dceaf8",
  "--game-sky-mid": "#c4daf2",
  "--game-panel": "#f4f8fc",
  "--game-panel-deep": "#e4eef8",
  "--game-border": "#1e3a5f",
  "--game-border-soft": "#6b8cb8",
  "--game-text": "#132238",
  "--game-text-muted": "#3d5670",
  "--game-accent": "#2563eb",
  "--game-accent-hot": "#db2777",
  "--game-success": "#0d9488",
  "--game-warn": "#c2410c",
  "--game-danger": "#b91c1c",
  "--game-pixel-shadow": "#1e3a5f",
  "--background": "var(--game-sky-bottom)",
  "--foreground": "var(--game-text)",
};

const VAR_SET = new Set<string>(UI_THEME_CSS_VARS);

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

function isAllowedVarValue(_key: UiThemeCssVar, value: string): boolean {
  const v = value.trim();
  const varMatch = /^var\(\s*([^)]+?)\s*\)$/.exec(v);
  if (varMatch) {
    const ref = varMatch[1].trim();
    return VAR_SET.has(ref);
  }
  if (HEX_RE.test(v)) return true;
  return false;
}

export function parseStoredThemeJson(raw: string | null | undefined): Record<UiThemeCssVar, string> | null {
  if (raw == null || !raw.trim()) return null;
  try {
    const data = JSON.parse(raw) as unknown;
    if (data === null || typeof data !== "object" || Array.isArray(data)) return null;
    const out: Partial<Record<UiThemeCssVar, string>> = {};
    for (const [k, v] of Object.entries(data)) {
      if (!VAR_SET.has(k)) continue;
      if (typeof v !== "string") continue;
      const key = k as UiThemeCssVar;
      if (!isAllowedVarValue(key, v)) continue;
      out[key] = v.trim();
    }
    if (Object.keys(out).length === 0) return null;
    return out as Record<UiThemeCssVar, string>;
  } catch {
    return null;
  }
}

export function normalizeThemeForImport(
  input: unknown,
): { ok: true; theme: Record<UiThemeCssVar, string> } | { ok: false; error: string } {
  if (input === null) {
    return { ok: true, theme: {} as Record<UiThemeCssVar, string> };
  }
  if (typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "El tema debe ser un objeto o null." };
  }
  const out: Partial<Record<UiThemeCssVar, string>> = {};
  for (const [k, v] of Object.entries(input)) {
    if (!VAR_SET.has(k)) {
      return { ok: false, error: `Variable de tema no reconocida: ${k}` };
    }
    if (typeof v !== "string") {
      return { ok: false, error: `Valor inválido para ${k}.` };
    }
    const key = k as UiThemeCssVar;
    if (!isAllowedVarValue(key, v)) {
      return { ok: false, error: `Color o valor no válido para ${k}.` };
    }
    out[key] = v.trim();
  }
  return { ok: true, theme: out as Record<UiThemeCssVar, string> };
}

export function themeToStyleBlock(theme: Record<UiThemeCssVar, string>): string {
  const lines = Object.entries(theme).map(([k, v]) => `  ${k}: ${v};`);
  return `:root {\n${lines.join("\n")}\n}`;
}
