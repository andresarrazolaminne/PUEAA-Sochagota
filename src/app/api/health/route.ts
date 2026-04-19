import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true, db: "sqlite" });
  } catch (e) {
    console.error(e);
    return Response.json({ ok: false, db: "sqlite" }, { status: 503 });
  }
}
