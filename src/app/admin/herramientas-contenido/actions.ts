"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

const PATHS = [
  "/admin/herramientas-contenido",
  "/tablero/herramientas/tips-agua",
  "/tablero/herramientas/contacto",
];

function revalidateHerramientasContent() {
  for (const p of PATHS) revalidatePath(p);
}

export async function createWaterTipAction(formData: FormData) {
  await requireAdmin("/admin/herramientas-contenido");
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  const agg = await prisma.waterTip.aggregate({ _max: { sortOrder: true } });
  const nextOrder = (agg._max.sortOrder ?? 0) + 1;
  await prisma.waterTip.create({
    data: { body, sortOrder: nextOrder },
  });
  revalidateHerramientasContent();
}

export async function updateWaterTipAction(formData: FormData) {
  await requireAdmin("/admin/herramientas-contenido");
  const id = String(formData.get("id") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!id || !body) return;
  await prisma.waterTip.update({
    where: { id },
    data: { body },
  });
  revalidateHerramientasContent();
}

export async function deleteWaterTipAction(formData: FormData) {
  await requireAdmin("/admin/herramientas-contenido");
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  await prisma.waterTip.delete({ where: { id } });
  revalidateHerramientasContent();
}

export async function createContactChannelAction(formData: FormData) {
  await requireAdmin("/admin/herramientas-contenido");
  const label = String(formData.get("label") ?? "").trim();
  const value = String(formData.get("value") ?? "").trim();
  if (!label || !value) return;
  const agg = await prisma.contactChannel.aggregate({ _max: { sortOrder: true } });
  const nextOrder = (agg._max.sortOrder ?? 0) + 1;
  await prisma.contactChannel.create({
    data: { label, value, sortOrder: nextOrder },
  });
  revalidateHerramientasContent();
}

export async function updateContactChannelAction(formData: FormData) {
  await requireAdmin("/admin/herramientas-contenido");
  const id = String(formData.get("id") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const value = String(formData.get("value") ?? "").trim();
  if (!id || !label || !value) return;
  await prisma.contactChannel.update({
    where: { id },
    data: { label, value },
  });
  revalidateHerramientasContent();
}

export async function deleteContactChannelAction(formData: FormData) {
  await requireAdmin("/admin/herramientas-contenido");
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  await prisma.contactChannel.delete({ where: { id } });
  revalidateHerramientasContent();
}
