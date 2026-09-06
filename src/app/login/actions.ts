"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { safeInternalPath } from "@/lib/auth/safe-redirect";
import { normalizeCedula } from "@/lib/auth/normalize-cedula";
import { sessionCookieFlags, sessionCookieMaxAgeSeconds } from "@/lib/auth/cookie-options";
import {
  clearLoginAttempts,
  consumeLoginAttempt,
  loginRateLimitKey,
} from "@/lib/auth/login-rate-limit";
import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma/enums";
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

  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "local";
  const rlKey = loginRateLimitKey(cedula, ip);
  if (!consumeLoginAttempt(rlKey)) {
    redirect(`/login?error=rate_limit&next=${encodeURIComponent(next)}`);
  }

  const employee = await prisma.employee.findUnique({ where: { cedula } });
  if (!employee?.active) {
    redirect(`/login?error=no_registrado&next=${encodeURIComponent(next)}`);
  }

  if (employee.role === Role.ADMIN) {
    const requiredPin = process.env.ADMIN_ACCESS_PIN?.trim();
    if (requiredPin) {
      const pinRaw = formData.get("adminPin");
      const pin = typeof pinRaw === "string" ? pinRaw.trim() : "";
      if (pin !== requiredPin) {
        redirect(`/login?error=admin_pin&next=${encodeURIComponent(next)}`);
      }
    }
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

  clearLoginAttempts(rlKey);

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
