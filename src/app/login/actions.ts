"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { safeInternalPath } from "@/lib/auth/safe-redirect";
import { normalizeCedula } from "@/lib/auth/normalize-cedula";
import { sessionCookieFlags, sessionCookieMaxAgeSeconds } from "@/lib/auth/cookie-options";
import { prisma } from "@/lib/prisma";
import {
  defaultSessionExpiresAt,
  hashSessionToken,
  newSessionToken,
  SESSION_COOKIE,
} from "@/lib/services/auth/session";

export async function loginWithCedula(formData: FormData) {
  const next = safeInternalPath(formData.get("next"), "/tablero");

  const raw = formData.get("cedula");
  if (typeof raw !== "string") {
    redirect(`/login?error=invalido&next=${encodeURIComponent(next)}`);
  }

  const cedula = normalizeCedula(raw);
  if (!cedula) {
    redirect(`/login?error=invalido&next=${encodeURIComponent(next)}`);
  }

  const employee = await prisma.employee.findUnique({ where: { cedula } });
  if (!employee?.active) {
    redirect(`/login?error=no_registrado&next=${encodeURIComponent(next)}`);
  }

  const token = newSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = defaultSessionExpiresAt();

  await prisma.session.create({
    data: {
      employeeId: employee.id,
      tokenHash,
      expiresAt,
    },
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    ...sessionCookieFlags(),
    maxAge: sessionCookieMaxAgeSeconds(expiresAt),
  });

  const welcomeUrl = appendSearchParam(next, "bienvenida", "1");
  redirect(welcomeUrl);
}

function appendSearchParam(path: string, key: string, value: string): string {
  if (!path.startsWith("/")) return path;
  try {
    const u = new URL(path, "http://local.invalid");
    u.searchParams.set(key, value);
    return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    return path;
  }
}
