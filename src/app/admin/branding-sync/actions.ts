"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  applyBrandingBundleImport,
  SETTING_UI_THEME_JSON,
} from "@/lib/services/settings/campaign-branding-bundle";
import { prisma } from "@/lib/prisma";
import { DEFAULT_UI_THEME, normalizeThemeForImport } from "@/lib/services/settings/ui-theme";

function errRedirect(code: string): never {
  redirect(`/admin/branding-sync?e=${code}`);
}

export async function importBrandingBundleAction(formData: FormData) {
  await requireAdmin("/admin/branding-sync");

  const raw = formData.get("bundleJson");
  if (typeof raw !== "string") {
    errRedirect("json");
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    errRedirect("vacio");
  }

  const result = await applyBrandingBundleImport(trimmed);
  if (!result.ok) {
    redirect(`/admin/branding-sync?e=${encodeURIComponent(result.error.slice(0, 180))}`);
  }

  revalidatePath("/", "layout");
  revalidatePath("/tablero");
  revalidatePath("/admin");
  revalidatePath("/admin/carnet");
  revalidatePath("/admin/sitio");
  revalidatePath("/admin/branding-sync");
  redirect("/admin/branding-sync?ok=1");
}

export async function saveLocalUiThemeAction(formData: FormData) {
  await requireAdmin("/admin/branding-sync");

  const raw = formData.get("themeJson");
  if (typeof raw !== "string") {
    errRedirect("tjson");
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    await prisma.appSetting.deleteMany({ where: { key: SETTING_UI_THEME_JSON } });
    revalidatePath("/", "layout");
    revalidatePath("/tablero");
    revalidatePath("/admin/branding-sync");
    redirect("/admin/branding-sync?ok=theme_reset");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    errRedirect("tparse");
  }

  const nt = normalizeThemeForImport(parsed);
  if (!nt.ok) {
    redirect(`/admin/branding-sync?e=${encodeURIComponent(nt.error.slice(0, 180))}`);
  }

  if (Object.keys(nt.theme).length === 0) {
    await prisma.appSetting.deleteMany({ where: { key: SETTING_UI_THEME_JSON } });
  } else {
    const merged: Record<string, string> = { ...DEFAULT_UI_THEME };
    for (const [k, v] of Object.entries(nt.theme)) {
      merged[k] = v;
    }
    await prisma.appSetting.upsert({
      where: { key: SETTING_UI_THEME_JSON },
      create: { key: SETTING_UI_THEME_JSON, value: JSON.stringify(merged) },
      update: { value: JSON.stringify(merged) },
    });
  }

  revalidatePath("/", "layout");
  revalidatePath("/tablero");
  revalidatePath("/admin/branding-sync");
  redirect("/admin/branding-sync?ok=theme");
}

export async function clearLocalUiThemeAction() {
  await requireAdmin("/admin/branding-sync");
  await prisma.appSetting.deleteMany({ where: { key: SETTING_UI_THEME_JSON } });
  revalidatePath("/", "layout");
  revalidatePath("/tablero");
  revalidatePath("/admin/branding-sync");
  redirect("/admin/branding-sync?ok=theme_reset");
}
