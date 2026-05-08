import * as XLSX from "xlsx";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import {
  buildParticipationMatrixFromSummaryRows,
  buildParticipationSummaryRows,
  filterParticipationRowsByActivities,
  parseParticipationReportRange,
  parseParticipationActivities,
} from "@/lib/services/admin/participation-report";

export async function GET(request: Request) {
  await requireAdmin("/admin/reportes");

  const url = new URL(request.url);
  const desde = url.searchParams.get("desde") ?? "";
  const hasta = url.searchParams.get("hasta") ?? "";
  const selectedActivities = parseParticipationActivities(
    url.searchParams.getAll("actividad"),
  );

  const parsed = parseParticipationReportRange(desde, hasta);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { start, endExclusive } = parsed;

  const rows = await prisma.pointLedger.findMany({
    where: {
      createdAt: { gte: start, lt: endExclusive },
    },
    include: {
      employee: { select: { fullName: true, cedula: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const summaryRows = buildParticipationSummaryRows(rows);
  const filteredRows = filterParticipationRowsByActivities(
    summaryRows,
    selectedActivities,
  );
  const aoa = buildParticipationMatrixFromSummaryRows(filteredRows);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  XLSX.utils.book_append_sheet(wb, ws, "Participacion");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

  const desdeSlug = desde.trim().replace(/-/g, "");
  const hastaSlug = hasta.trim().replace(/-/g, "");
  const filename = `participacion-${desdeSlug}-${hastaSlug}.xlsx`;

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
