import assert from "node:assert/strict";
import { EvidenceStatus } from "@/generated/prisma/enums";

/**
 * Política de puntos ante revisión admin.
 * Fuente de verdad: PointLedger. REJECTED/PENDING nunca deben crear delta.
 */

export type ReviewOutcome = "approve" | "reject";

/** ¿Se puede escribir puntos de recibo/acopio/residuos por este outcome? */
export function mayAwardChallengePoints(outcome: ReviewOutcome): boolean {
  return outcome === "approve";
}

/** Tras rechazar, el estado del ítem no puede seguir siendo APPROVED. */
export function statusAfterReject(): EvidenceStatus {
  return EvidenceStatus.REJECTED;
}

/**
 * Orden seguro de clawback:
 * 1) borrar ledger del ítem
 * 2) marcar REJECTED
 * 3) si no quedan aprobados, quitar early bird / completitud
 */
export function rejectClawbackOrder(): readonly ["strip-item-ledger", "mark-rejected", "clawback-participation"] {
  return ["strip-item-ledger", "mark-rejected", "clawback-participation"] as const;
}

assert.equal(mayAwardChallengePoints("reject"), false);
assert.equal(mayAwardChallengePoints("approve"), true);
assert.equal(statusAfterReject(), EvidenceStatus.REJECTED);
assert.deepEqual(rejectClawbackOrder(), [
  "strip-item-ledger",
  "mark-rejected",
  "clawback-participation",
]);

console.log("ok: reject-points policy (no points on reject)");
