import { prisma } from "@/lib/prisma";
import {
  LEDGER_REF_WATER_IMPROVEMENT,
  LEDGER_REF_WATER_MAINTENANCE,
} from "@/modules/challenges/water-bill/ledger";
import { LEDGER_REF_WASTE_EVIDENCE_COMPLETION } from "@/modules/challenges/waste-evidence/ledger";
import { LEDGER_REF_PLACE_DOCUMENTATION_APPROVAL } from "@/modules/challenges/place-documentation/ledger";
import { LEDGER_REF_TRIVIA_CORRECT } from "@/modules/challenges/trivia/ledger";

/**
 * Indica si ya existen movimientos de ledger originados en el tablero (no importación Excel)
 * para este empleado y reto. La importación usa solo `PARTICIPATION`; el resto son actividad en app.
 */
export async function hasAppOriginatedLedgerForChallenge(
  employeeId: string,
  challengeId: string,
): Promise<boolean> {
  const participation = await prisma.challengeParticipation.findUnique({
    where: { employeeId_challengeId: { employeeId, challengeId } },
    select: { id: true },
  });

  const or: Array<{
    employeeId: string;
    refType: string | { in: string[] };
    refId: string | { in: string[] };
  }> = [];

  if (participation) {
    or.push({
      employeeId,
      refType: LEDGER_REF_WASTE_EVIDENCE_COMPLETION,
      refId: participation.id,
    });

    const placeIds = await prisma.placeDocumentationSubmission.findMany({
      where: { participationId: participation.id },
      select: { id: true },
    });
    if (placeIds.length > 0) {
      or.push({
        employeeId,
        refType: LEDGER_REF_PLACE_DOCUMENTATION_APPROVAL,
        refId: { in: placeIds.map((r) => r.id) },
      });
    }
  }

  const waterIds = await prisma.waterBillPeriod.findMany({
    where: { employeeId, challengeId },
    select: { id: true },
  });
  if (waterIds.length > 0) {
    or.push({
      employeeId,
      refType: { in: [LEDGER_REF_WATER_IMPROVEMENT, LEDGER_REF_WATER_MAINTENANCE] },
      refId: { in: waterIds.map((w) => w.id) },
    });
  }

  const triviaQuestionIds = await prisma.triviaQuestion.findMany({
    where: { challengeId },
    select: { id: true },
  });
  if (triviaQuestionIds.length > 0) {
    or.push({
      employeeId,
      refType: LEDGER_REF_TRIVIA_CORRECT,
      refId: { in: triviaQuestionIds.map((q) => q.id) },
    });
  }

  if (or.length === 0) return false;

  const found = await prisma.pointLedger.findFirst({
    where: { OR: or },
  });
  return found !== null;
}

/**
 * Bloquea importación de puntajes vía Excel si el reto es `platformManaged` y ya hay puntos
 * ganados por flujos del tablero (evita sumar import + actividad real en el mismo reto).
 */
export async function assertImportScoresAllowedForPlatformChallenge(
  employeeId: string,
  challengeId: string,
): Promise<void> {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    select: { platformManaged: true, title: true },
  });
  if (!challenge) throw new Error("Reto no encontrado.");
  if (!challenge.platformManaged) return;

  const blocked = await hasAppOriginatedLedgerForChallenge(employeeId, challengeId);
  if (blocked) {
    throw new Error(
      `No se puede importar puntos para «${challenge.title}»: el reto está gestionado en la plataforma y este usuario ya tiene puntos por el tablero (residuos, lugares, agua, trivia). Use un reto con «fuera de plataforma» en la importación de retos, o corrija puntos desde administración.`,
    );
  }
}
