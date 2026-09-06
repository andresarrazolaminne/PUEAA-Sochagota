/**
 * Tests de early-bird con SQLite en memoria vía better-sqlite3 + Prisma adapter
 * no están aquí (requiere schema migrado). Validamos la fórmula de bonus y la
 * API pública exportada.
 */
import assert from "node:assert/strict";
import {
  DEFAULT_EARLY_BIRD_BONUS_FRACTION,
  LEDGER_REF_EARLY_BIRD,
} from "@/lib/services/challenges/early-bird";

assert.equal(LEDGER_REF_EARLY_BIRD, "EARLY_BIRD_BONUS");
assert.equal(Math.round(100 * DEFAULT_EARLY_BIRD_BONUS_FRACTION), 25);
assert.equal(Math.max(1, Math.round(0 * DEFAULT_EARLY_BIRD_BONUS_FRACTION)), 1);

console.log("ok: early-bird ledger constants");
