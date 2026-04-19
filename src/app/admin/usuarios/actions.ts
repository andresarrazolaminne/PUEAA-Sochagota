"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizeCedula } from "@/lib/auth/normalize-cedula";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma/enums";

function parseRole(raw: FormDataEntryValue | null): Role {
  const s = raw === null || raw === undefined ? "" : String(raw);
  if (s === Role.ADMIN || s === "ADMIN") return Role.ADMIN;
  return Role.USER;
}

export async function createEmployeeAction(formData: FormData) {
  await requireAdmin("/admin/usuarios");

  const cedulaRaw = formData.get("cedula");
  const fullNameRaw = formData.get("fullName");
  if (typeof cedulaRaw !== "string" || typeof fullNameRaw !== "string") {
    redirect("/admin/usuarios?error=datos");
  }

  const cedula = normalizeCedula(cedulaRaw);
  const fullName = fullNameRaw.trim();
  if (!cedula || !fullName) {
    redirect("/admin/usuarios?error=datos");
  }

  const role = parseRole(formData.get("role"));

  try {
    await prisma.employee.create({
      data: { cedula, fullName, role, active: true },
    });
  } catch {
    redirect("/admin/usuarios?error=duplicado");
  }


  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/puntajes");
  redirect("/admin/usuarios?ok=1");
}

export async function updateEmployeeAction(employeeId: string, formData: FormData) {
  await requireAdmin(`/admin/usuarios/${employeeId}`);

  const fullNameRaw = formData.get("fullName");
  if (typeof fullNameRaw !== "string") {
    redirect(`/admin/usuarios/${employeeId}?error=datos`);
  }
  const fullName = fullNameRaw.trim();
  if (!fullName) {
    redirect(`/admin/usuarios/${employeeId}?error=datos`);
  }

  const role = parseRole(formData.get("role"));
  const active = formData.get("active") === "true";

  let photoUrl: string | null | undefined = undefined;
  const photoRaw = formData.get("photoUrl");
  if (typeof photoRaw === "string") {
    const t = photoRaw.trim();
    photoUrl = t.length ? t : null;
  }

  await prisma.employee.update({
    where: { id: employeeId },
    data: { fullName, role, active, ...(photoUrl !== undefined ? { photoUrl } : {}) },
  });

  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios/${employeeId}`);
  revalidatePath("/admin/puntajes");
  redirect(`/admin/usuarios/${employeeId}?ok=1`);
}
