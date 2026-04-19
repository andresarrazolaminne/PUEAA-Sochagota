import { prisma } from "@/lib/prisma";

export const SETTING_CARNET_LOGO_PATH = "carnet_logo_path";
export const SETTING_CARNET_LOGO_CAPTION = "carnet_logo_caption";

/** Logo Compañía Termoeléctrica de Sochagota (cabecera del sitio), independiente del carné PUEAA. */
export const SETTING_SITE_LOGO_PATH = "site_logo_path";

const DEFAULT_LOGO = "/carnet-cazadores-gastos-fantasma.png";
/** Logo corporativo por defecto en `public/logo-ces.png` (versión con transparencia). */
const DEFAULT_SITE_LOGO = "/logo-ces.png";
const DEFAULT_CAPTION = "Cazadores de gastos fantasma";

export type CarnetDisplaySettings = {
  logoSrc: string;
  caption: string;
};

export async function getCarnetDisplaySettings(): Promise<CarnetDisplaySettings> {
  const keys = [SETTING_CARNET_LOGO_PATH, SETTING_CARNET_LOGO_CAPTION];
  const rows = await prisma.appSetting.findMany({
    where: { key: { in: keys } },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    logoSrc: map.get(SETTING_CARNET_LOGO_PATH)?.trim() || DEFAULT_LOGO,
    caption: map.get(SETTING_CARNET_LOGO_CAPTION)?.trim() || DEFAULT_CAPTION,
  };
}

export type SiteLogoSettings = {
  logoSrc: string;
};

export async function getSiteLogoSettings(): Promise<SiteLogoSettings> {
  const row = await prisma.appSetting.findUnique({ where: { key: SETTING_SITE_LOGO_PATH } });
  return {
    logoSrc: row?.value?.trim() || DEFAULT_SITE_LOGO,
  };
}

/** Valida ruta local (/public) o URL https. */
export function parseLogoInput(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  const v = raw.trim();
  if (!v) return { ok: false, error: "La ruta o URL del logo es obligatoria." };
  if (v.startsWith("/")) {
    if (v.includes("..") || v.includes("\\")) {
      return { ok: false, error: "Ruta no válida." };
    }
    if (!/^\/[a-zA-Z0-9._/-]+$/.test(v)) {
      return { ok: false, error: "Usa solo letras, números, guiones y barras (ej. /mi-logo.png)." };
    }
    return { ok: true, value: v };
  }
  try {
    const u = new URL(v);
    if (u.protocol !== "https:" && u.protocol !== "http:") {
      return { ok: false, error: "Solo se permiten URLs http o https." };
    }
    return { ok: true, value: v };
  } catch {
    return { ok: false, error: "URL no válida." };
  }
}

export function parseCaptionInput(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  const v = raw.trim();
  if (v.length > 240) return { ok: false, error: "Leyenda demasiado larga (máx. 240 caracteres)." };
  return { ok: true, value: v };
}
