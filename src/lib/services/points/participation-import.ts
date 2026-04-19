import { prisma } from "@/lib/prisma";
import { ParticipationStatus } from "@/generated/prisma/enums";

/** Ledger vinculado a una participación (un movimiento neto por reto/importación). */
export const LEDGER_REF_PARTICIPATION = "PARTICIPATION";

/**
 * Asigna puntos importados a un empleado en un reto: participación aprobada + un movimiento en el ledger.
 * Reimportar con otro valor reemplaza el movimiento anterior (misma participación).
 */
export async function setImportedParticipationScore(
  employeeId: string,
  challengeId: string,
  points: number,
  reasonNote?: string | null,
) {
  const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
  if (!challenge) throw new Error("Reto no encontrado.");

  const base = `Reto: ${challenge.title}`;
  const reason =
    reasonNote && reasonNote.trim().length > 0
      ? `${base} — ${reasonNote.trim()}`
      : `${base} (importación)`;

  await prisma.$transaction(async (tx) => {
    const p = await tx.challengeParticipation.upsert({
      where: {
        employeeId_challengeId: { employeeId, challengeId },
      },
      create: {
        employeeId,
        challengeId,
        status: ParticipationStatus.APPROVED,
        score: points,
        submittedAt: new Date(),
      },
      update: {
        status: ParticipationStatus.APPROVED,
        score: points,
        submittedAt: new Date(),
      },
    });

    await tx.pointLedger.deleteMany({
      where: { refType: LEDGER_REF_PARTICIPATION, refId: p.id },
    });

    if (points !== 0) {
      await tx.pointLedger.create({
        data: {
          employeeId,
          delta: points,
          reason,
          refType: LEDGER_REF_PARTICIPATION,
          refId: p.id,
        },
      });
    }
  });
}
