"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { parseLogoInput, SETTING_SITE_LOGO_PATH } from "@/lib/services/settings/app-settings";
import { saveSiteLogoUpload } from "@/lib/uploads/site-logo";

export async function saveSiteLogoBrandingAction(formData: FormData) {
  await requireAdmin("/admin/sitio");

  const logoFile = formData.get("logoFile");
  let logoValue: string;

  if (logoFile instanceof File && logoFile.size > 0) {
    const saved = await saveSiteLogoUpload(logoFile);
    if (!saved.ok) {
      const err =
        saved.reason === "size"
          ? "upload_size"
          : saved.reason === "type"
            ? "upload_type"
            : "upload";
      redirect(`/admin/sitio?e=${err}`);
    }
    logoValue = saved.publicPath;
  } else {
    const logoRaw = formData.get("logoPath");
    if (typeof logoRaw !== "string") {
      redirect("/admin/sitio?e=datos");
    }
    const logo = parseLogoInput(logoRaw);
    if (!logo.ok) redirect("/admin/sitio?e=logo");
    logoValue = logo.value;
  }

  await prisma.appSetting.upsert({
    where: { key: SETTING_SITE_LOGO_PATH },
    create: { key: SETTING_SITE_LOGO_PATH, value: logoValue },
    update: { value: logoValue },
  });

  revalidatePath("/", "layout");
  revalidatePath("/login");
  revalidatePath("/tablero");
  revalidatePath("/admin");
  revalidatePath("/admin/sitio");
  redirect("/admin/sitio?ok=1");
}
