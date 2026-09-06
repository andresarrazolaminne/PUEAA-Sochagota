import { prisma } from "@/lib/prisma";
import {
  getCarnetDisplaySettings,
  getSiteLogoSettings,
  parseCaptionInput,
  parseLogoInput,
  SETTING_CARNET_LOGO_CAPTION,
  SETTING_CARNET_LOGO_PATH,
  SETTING_SITE_LOGO_PATH,
} from "@/lib/services/settings/app-settings";
import {
  DEFAULT_UI_THEME,
  parseStoredThemeJson,
  type UiThemeCssVar,
  normalizeThemeForImport,
} from "@/lib/services/settings/ui-theme";

export const SETTING_UI_THEME_JSON = "ui_theme_json";

export const BRANDING_BUNDLE_VERSION = 1 as const;

export type BrandingBundleV1 = {
  pueaaBrandingBundle: typeof BRANDING_BUNDLE_VERSION;
  exportedAt: string;
  logos: {
    [SETTING_CARNET_LOGO_PATH]: string;
    [SETTING_CARNET_LOGO_CAPTION]: string;
    [SETTING_SITE_LOGO_PATH]: string;
  };
  /**
   * null = borrar tema personalizado en destino.
   * Omitido = no modificar `ui_theme_json` al importar (solo logos).
   */
  theme?: Partial<Record<UiThemeCssVar, string>> | null;
};

export function isBrandingBundleV1(x: unknown): x is BrandingBundleV1 {
  if (x === null || typeof x !== "object" || Array.isArray(x)) return false;
  const o = x as Record<string, unknown>;
  if (o.pueaaBrandingBundle !== BRANDING_BUNDLE_VERSION) return false;
  if (typeof o.exportedAt !== "string") return false;
  if (o.logos === null || typeof o.logos !== "object" || Array.isArray(o.logos)) return false;
  const logos = o.logos as Record<string, unknown>;
  if (typeof logos[SETTING_CARNET_LOGO_PATH] !== "string") return false;
  if (typeof logos[SETTING_CARNET_LOGO_CAPTION] !== "string") return false;
  if (typeof logos[SETTING_SITE_LOGO_PATH] !== "string") return false;
  if ("theme" in o && o.theme !== undefined && o.theme !== null) {
    if (typeof o.theme !== "object" || Array.isArray(o.theme)) return false;
  }
  return true;
}

export async function buildBrandingBundleExport(): Promise<BrandingBundleV1> {
  const keys = [SETTING_CARNET_LOGO_PATH, SETTING_CARNET_LOGO_CAPTION, SETTING_SITE_LOGO_PATH, SETTING_UI_THEME_JSON];
  const rows = await prisma.appSetting.findMany({ where: { key: { in: keys } } });
  const map = new Map(rows.map((r) => [r.key, r.value]));

  const carnetPath = map.get(SETTING_CARNET_LOGO_PATH)?.trim();
  const carnetCap = map.get(SETTING_CARNET_LOGO_CAPTION)?.trim();
  const sitePath = map.get(SETTING_SITE_LOGO_PATH)?.trim();

  const carnet = await getCarnetDisplaySettings();
  const site = await getSiteLogoSettings();

  const themeRaw = map.get(SETTING_UI_THEME_JSON);
  const parsedTheme = parseStoredThemeJson(themeRaw);
  const hasCustomTheme = parsedTheme !== null && Object.keys(parsedTheme).length > 0;

  const bundle: BrandingBundleV1 = {
    pueaaBrandingBundle: BRANDING_BUNDLE_VERSION,
    exportedAt: new Date().toISOString(),
    logos: {
      [SETTING_CARNET_LOGO_PATH]: carnetPath && carnetPath.length > 0 ? carnetPath : carnet.logoSrc,
      [SETTING_CARNET_LOGO_CAPTION]: carnetCap && carnetCap.length > 0 ? carnetCap : carnet.caption,
      [SETTING_SITE_LOGO_PATH]: sitePath && sitePath.length > 0 ? sitePath : site.logoSrc,
    },
  };
  if (hasCustomTheme && parsedTheme) {
    bundle.theme = parsedTheme as Partial<Record<UiThemeCssVar, string>>;
  }
  return bundle;
}

export type ApplyBrandingImportResult =
  | { ok: true }
  | { ok: false; error: string };

export async function applyBrandingBundleImport(rawJson: string): Promise<ApplyBrandingImportResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return { ok: false, error: "JSON no válido." };
  }

  if (!isBrandingBundleV1(parsed)) {
    return {
      ok: false,
      error: "Formato de paquete incorrecto (se espera pueaaBrandingBundle: 1 y logos).",
    };
  }

  const lp = parseLogoInput(parsed.logos[SETTING_CARNET_LOGO_PATH]);
  if (!lp.ok) return { ok: false, error: `Logo del carné: ${lp.error}` };
  const sp = parseLogoInput(parsed.logos[SETTING_SITE_LOGO_PATH]);
  if (!sp.ok) return { ok: false, error: `Logo del sitio: ${sp.error}` };
  const cap = parseCaptionInput(parsed.logos[SETTING_CARNET_LOGO_CAPTION]);
  if (!cap.ok) return { ok: false, error: cap.error };

  let themeUpsert: { key: string; value: string } | null = null;
  let themeDelete = false;
  const themeInBundle = "theme" in parsed && parsed.theme !== undefined;

  if (themeInBundle) {
    if (parsed.theme === null) {
      themeDelete = true;
    } else {
      const nt = normalizeThemeForImport(parsed.theme);
      if (!nt.ok) return { ok: false, error: nt.error };
      if (Object.keys(nt.theme).length === 0) {
        themeDelete = true;
      } else {
        const merged: Record<string, string> = { ...DEFAULT_UI_THEME };
        for (const [k, v] of Object.entries(nt.theme)) {
          merged[k] = v;
        }
        themeUpsert = { key: SETTING_UI_THEME_JSON, value: JSON.stringify(merged) };
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.appSetting.upsert({
      where: { key: SETTING_CARNET_LOGO_PATH },
      create: { key: SETTING_CARNET_LOGO_PATH, value: lp.value },
      update: { value: lp.value },
    });
    await tx.appSetting.upsert({
      where: { key: SETTING_CARNET_LOGO_CAPTION },
      create: { key: SETTING_CARNET_LOGO_CAPTION, value: cap.value },
      update: { value: cap.value },
    });
    await tx.appSetting.upsert({
      where: { key: SETTING_SITE_LOGO_PATH },
      create: { key: SETTING_SITE_LOGO_PATH, value: sp.value },
      update: { value: sp.value },
    });

    if (themeInBundle) {
      if (themeDelete) {
        await tx.appSetting.deleteMany({ where: { key: SETTING_UI_THEME_JSON } });
      } else if (themeUpsert) {
        await tx.appSetting.upsert({
          where: { key: themeUpsert.key },
          create: { key: themeUpsert.key, value: themeUpsert.value },
          update: { value: themeUpsert.value },
        });
      }
    }
  });

  return { ok: true };
}

export async function getUiThemeForLayout(): Promise<Record<UiThemeCssVar, string> | null> {
  const row = await prisma.appSetting.findUnique({ where: { key: SETTING_UI_THEME_JSON } });
  return parseStoredThemeJson(row?.value ?? null);
}
