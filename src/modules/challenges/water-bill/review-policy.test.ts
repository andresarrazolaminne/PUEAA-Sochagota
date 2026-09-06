import assert from "node:assert/strict";
import { EvidenceStatus } from "@/generated/prisma/enums";

/** Política: declaraciones nuevas entran PENDING (no auto-APPROVED). */
function initialWaterBillStatus(): EvidenceStatus {
  return EvidenceStatus.PENDING;
}

assert.equal(initialWaterBillStatus(), EvidenceStatus.PENDING);
assert.notEqual(initialWaterBillStatus(), EvidenceStatus.APPROVED);

console.log("ok: water-bill review policy constant");
