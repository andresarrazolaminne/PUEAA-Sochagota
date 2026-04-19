"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import {
  parseCaptionInput,
  parseLogoInput,
  SETTING_CARNET_LOGO_CAPTION,
  SETTING_CARNET_LOGO_PATH,
} from "@/lib/services/settings/app-settings";
import { saveCarnetLogoUpload } from "@/lib/uploads/carnet-logo";

export async function saveCarnetBrandingAction(formData: FormData) {
  await requireAdmin("/admin/carnet");

  const captionRaw = formData.get("caption");
  if (typeof captionRaw !== "string") {
    redirect("/admin/carnet?e=datos");
  }

  const logoFile = formData.get("logoFile");
  let logoValue: string;

  if (logoFile instanceof File && logoFile.size > 0) {
    const saved = await saveCarnetLogoUpload(logoFile);
    if (!saved.ok) {
      const err =
        saved.reason === "size"
          ? "upload_size"
          : saved.reason === "type"
            ? "upload_type"
            : "upload";
      redirect(`/admin/carnet?e=${err}`);
    }
    logoValue = saved.publicPath;
  } else {
    const logoRaw = formData.get("logoPath");
    if (typeof logoRaw !== "string") {
      redirect("/admin/carnet?e=datos");
    }
    const logo = parseLogoInput(logoRaw);
    if (!logo.ok) redirect("/admin/carnet?e=logo");
    logoValue = logo.value;
  }

  const cap = parseCaptionInput(captionRaw);
  if (!cap.ok) redirect("/admin/carnet?e=caption");

  await prisma.$transaction([
    prisma.appSetting.upsert({
      where: { key: SETTING_CARNET_LOGO_PATH },
      create: { key: SETTING_CARNET_LOGO_PATH, value: logoValue },
      update: { value: logoValue },
    }),
    prisma.appSetting.upsert({
      where: { key: SETTING_CARNET_LOGO_CAPTION },
      create: { key: SETTING_CARNET_LOGO_CAPTION, value: cap.value },
      update: { value: cap.value },
    }),
  ]);

  revalidatePath("/tablero");
  revalidatePath("/admin/carnet");
  redirect("/admin/carnet?ok=1");
}
