import assert from "node:assert/strict";
import {
  scoreWaterBillPeriod,
  DEFAULT_OPTIMAL_PER_CAPITA_M3,
  MAINTENANCE_POINTS,
} from "./scoring";

function testMaintenanceWhenBelowOptimal() {
  const r = scoreWaterBillPeriod({
    currentPerCapitaM3: 10,
    previousPerCapitaM3: 12,
    optimalPerCapitaM3: DEFAULT_OPTIMAL_PER_CAPITA_M3,
    isFirstEverPeriod: false,
  });
  assert.equal(r.maintenancePoints, MAINTENANCE_POINTS);
  assert.ok(r.improvementPoints > 0);
}

function testAlreadyEfficientStable() {
  const r = scoreWaterBillPeriod({
    currentPerCapitaM3: 10,
    previousPerCapitaM3: 10,
    optimalPerCapitaM3: 12,
    isFirstEverPeriod: false,
  });
  assert.equal(r.maintenancePoints, MAINTENANCE_POINTS);
  assert.equal(r.improvementPoints, 0);
}

function testFirstPeriod() {
  const r = scoreWaterBillPeriod({
    currentPerCapitaM3: 14,
    previousPerCapitaM3: null,
    optimalPerCapitaM3: 12,
    isFirstEverPeriod: true,
  });
  assert.ok(r.improvementPoints > 0);
  assert.equal(r.maintenancePoints, 0);
}

testMaintenanceWhenBelowOptimal();
testAlreadyEfficientStable();
testFirstPeriod();
