import { prisma } from "@/lib/prisma";
import { EvidenceStatus } from "@/generated/prisma/enums";

export type EmployeeActivityItem = {
  id: string;
  at: Date;
  kind: "waste" | "place" | "water" | "ledger" | "trivia";
  title: string;
  detail: string;
  status?: string | null;
  pointsDelta?: number | null;
  href?: string | null;
  evidenceSrc?: string | null;
};

export async function getEmployeeActivityTimeline(
  employeeId: string,
  limit = 60,
): Promise<EmployeeActivityItem[]> {
  const [waste, place, water, ledger, trivia] = await Promise.all([
    prisma.evidenceSubmission.findMany({
      where: { participation: { employeeId } },
      include: {
        participation: { include: { challenge: { select: { id: true, title: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.placeDocumentationSubmission.findMany({
      where: { participation: { employeeId } },
      include: {
        participation: { include: { challenge: { select: { id: true, title: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.waterBillPeriod.findMany({
      where: { employeeId },
      include: { challenge: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.pointLedger.findMany({
      where: { employeeId },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.triviaQuestionAttempt.findMany({
      where: { employeeId },
      include: {
        question: {
          include: { challenge: { select: { id: true, title: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const items: EmployeeActivityItem[] = [];

  for (const r of waste) {
    items.push({
      id: `waste-${r.id}`,
      at: r.reviewedAt ?? r.createdAt,
      kind: "waste",
      title: r.participation.challenge.title,
      detail: `Residuos · ${statusLabel(r.status)}${r.rejectReason ? ` · ${r.rejectReason}` : ""}`,
      status: r.status,
      href: `/admin/retos/${r.participation.challenge.id}/revision?sid=${r.id}`,
      evidenceSrc: r.filePath,
    });
  }
  for (const r of place) {
    items.push({
      id: `place-${r.id}`,
      at: r.reviewedAt ?? r.createdAt,
      kind: "place",
      title: r.participation.challenge.title,
      detail: `Lugar «${r.placeName}» · ${statusLabel(r.status)}${r.rejectReason ? ` · ${r.rejectReason}` : ""}`,
      status: r.status,
      href: `/admin/retos/${r.participation.challenge.id}/revision?pid=${r.id}`,
      evidenceSrc: r.photoFilePath,
    });
  }
  for (const r of water) {
    const month = r.periodStart.toISOString().slice(0, 7);
    items.push({
      id: `water-${r.id}`,
      at: r.reviewedAt ?? r.createdAt,
      kind: "water",
      title: r.challenge.title,
      detail: `Recibo ${month} · ${r.totalM3} m³ · ${statusLabel(r.status)}${r.rejectReason ? ` · ${r.rejectReason}` : ""}`,
      status: r.status,
      href: `/admin/retos/${r.challenge.id}?wid=${r.id}`,
      evidenceSrc: r.evidenceFilePath,
    });
  }
  for (const r of ledger) {
    items.push({
      id: `ledger-${r.id}`,
      at: r.createdAt,
      kind: "ledger",
      title: r.reason,
      detail: `${r.refType ?? "LEDGER"}${r.refId ? ` · ${r.refId.slice(0, 8)}…` : ""}`,
      pointsDelta: r.delta,
    });
  }
  for (const r of trivia) {
    items.push({
      id: `trivia-${r.id}`,
      at: r.createdAt,
      kind: "trivia",
      title: r.question.challenge.title,
      detail: `Trivia · ${r.isCorrect ? "respuesta correcta" : "respuesta incorrecta"}`,
      href: `/admin/retos/${r.question.challenge.id}`,
    });
  }

  items.sort((a, b) => b.at.getTime() - a.at.getTime());
  return items.slice(0, limit);
}

function statusLabel(s: EvidenceStatus | string) {
  if (s === EvidenceStatus.APPROVED || s === "APPROVED") return "aprobado";
  if (s === EvidenceStatus.REJECTED || s === "REJECTED") return "rechazado";
  if (s === EvidenceStatus.PENDING || s === "PENDING") return "pendiente";
  return String(s);
}

export async function getEmployeeHeader(employeeId: string) {
  return prisma.employee.findUnique({
    where: { id: employeeId },
    select: { id: true, fullName: true, cedula: true, role: true, active: true, photoUrl: true },
  });
}
