"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { parseLogoInput } from "@/lib/services/settings/app-settings";
import { saveRankEnvironmentUpload } from "@/lib/uploads/rank-environment";

function errRedirect(code: string): never {
  redirect(`/admin/rangos?e=${code}`);
}

export async function updateRankAction(formData: FormData) {
  await requireAdmin("/admin/rangos");

  const rankIdRaw = formData.get("rankId");
  if (typeof rankIdRaw !== "string" || !rankIdRaw.trim()) {
    errRedirect("datos");
  }

  const nameCandidate = formData.get("name");
  const minPointsRaw = formData.get("minPoints");
  const imageUrlRaw = formData.get("imageUrl");
  const imageFile = formData.get("imageFile");

  if (nameCandidate === null || typeof nameCandidate !== "string") {
    errRedirect("datos");
  }
  const name = nameCandidate.trim();
  if (!name) {
    errRedirect("datos");
  }

  if (typeof minPointsRaw !== "string") {
    errRedirect("datos");
  }
  const minPoints = Number.parseInt(minPointsRaw, 10);
  if (!Number.isFinite(minPoints) || minPoints < 0 || minPoints > 1_000_000) {
    errRedirect("puntos");
  }

  const existing = await prisma.rank.findUnique({ where: { id: rankIdRaw } });
  if (!existing) {
    errRedirect("datos");
  }

  let environmentImageUrl: string;

  if (imageFile instanceof File && imageFile.size > 0) {
    const saved = await saveRankEnvironmentUpload(imageFile);
    if (!saved.ok) {
      const err =
        saved.reason === "size"
          ? "upload_size"
          : saved.reason === "type"
            ? "upload_type"
            : "upload";
      errRedirect(err);
    }
    environmentImageUrl = saved.publicPath;
  } else if (typeof imageUrlRaw === "string" && imageUrlRaw.trim()) {
    const parsed = parseLogoInput(imageUrlRaw.trim());
    if (!parsed.ok) {
      errRedirect("imagen");
    }
    environmentImageUrl = parsed.value;
  } else {
    environmentImageUrl =
      existing.environmentImageUrl?.trim() || "/pixel-placeholder.svg";
  }

  await prisma.rank.update({
    where: { id: rankIdRaw },
    data: {
      name,
      minPoints,
      environmentImageUrl,
    },
  });

  revalidatePath("/tablero");
  revalidatePath("/admin/rangos");
  redirect("/admin/rangos?ok=1");
}
