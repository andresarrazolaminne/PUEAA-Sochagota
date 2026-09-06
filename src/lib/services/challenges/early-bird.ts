import type { Challenge, PrismaClient } from "@/generated/prisma/client";

export const LEDGER_REF_EARLY_BIRD = "EARLY_BIRD_BONUS";

/** Bonus por defecto si el reto no define cupos/ventana (no se aplica). */
export const DEFAULT_EARLY_BIRD_BONUS_FRACTION = 0.25;

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

type EarlyBirdChallengeFields = Pick<
  Challenge,
  "id" | "title" | "basePoints" | "earlyBirdEndsAt" | "earlyBirdSlots"
>;

/**
 * Si el reto tiene early bird activo y quedan cupos, marca la participación
 * y escribe un delta extra en el ledger (idempotente por participación).
 */
export async function applyEarlyBirdIfEligible(
  tx: Tx,
  params: {
    employeeId: string;
    participationId: string;
    challenge: EarlyBirdChallengeFields;
    /** Puntos base del bonus; por defecto 25% de basePoints (mín. 1 si base>0). */
    bonusPoints?: number;
    now?: Date;
  },
): Promise<{ applied: boolean; bonus: number }> {
  const { employeeId, participationId, challenge } = params;
  const now = params.now ?? new Date();

  const slots = challenge.earlyBirdSlots;
  if (slots == null || slots <= 0) {
    return { applied: false, bonus: 0 };
  }
  if (challenge.earlyBirdEndsAt && now.getTime() > challenge.earlyBirdEndsAt.getTime()) {
    return { applied: false, bonus: 0 };
  }

  const participation = await tx.challengeParticipation.findUnique({
    where: { id: participationId },
  });
  if (!participation || participation.employeeId !== employeeId) {
    return { applied: false, bonus: 0 };
  }
  if (participation.isEarlyBird) {
    return { applied: true, bonus: 0 };
  }

  const alreadyAwarded = await tx.challengeParticipation.count({
    where: { challengeId: challenge.id, isEarlyBird: true },
  });
  if (alreadyAwarded >= slots) {
    return { applied: false, bonus: 0 };
  }

  const bonus =
    params.bonusPoints ??
    Math.max(
      challenge.basePoints > 0 ? 1 : 0,
      Math.round(challenge.basePoints * DEFAULT_EARLY_BIRD_BONUS_FRACTION),
    );

  await tx.challengeParticipation.update({
    where: { id: participationId },
    data: { isEarlyBird: true },
  });

  await tx.pointLedger.deleteMany({
    where: {
      employeeId,
      refType: LEDGER_REF_EARLY_BIRD,
      refId: participationId,
    },
  });

  if (bonus > 0) {
    await tx.pointLedger.create({
      data: {
        employeeId,
        delta: bonus,
        reason: `Early bird · ${challenge.title}`,
        refType: LEDGER_REF_EARLY_BIRD,
        refId: participationId,
      },
    });
  }

  return { applied: true, bonus };
}

export async function removeEarlyBirdLedger(
  tx: Tx,
  params: { employeeId: string; participationId: string },
): Promise<void> {
  await tx.pointLedger.deleteMany({
    where: {
      employeeId: params.employeeId,
      refType: LEDGER_REF_EARLY_BIRD,
      refId: params.participationId,
    },
  });
  await tx.challengeParticipation.updateMany({
    where: { id: params.participationId, isEarlyBird: true },
    data: { isEarlyBird: false },
  });
}
