import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { normalizedPublicBasePath } from "@/lib/base-path";
import { prisma } from "@/lib/prisma";
import { hashSessionToken, SESSION_COOKIE } from "@/lib/services/auth/session";

export async function GET() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({
      where: { tokenHash: hashSessionToken(token) },
    });
  }
  jar.delete(SESSION_COOKIE);

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const base = normalizedPublicBasePath();
  const path = base ? `${base}/?salida=1` : "/?salida=1";
  return NextResponse.redirect(`${proto}://${host}${path}`);
}
