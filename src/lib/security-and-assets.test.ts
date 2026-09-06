import assert from "node:assert/strict";
import {
  __resetLoginRateLimitForTests,
  consumeLoginAttempt,
  loginRateLimitKey,
} from "@/lib/auth/login-rate-limit";
import {
  stripLegacyPublicBasePath,
  withBasePathIfNeeded,
} from "@/lib/base-path";
import {
  defaultEnvironmentImageForSortOrder,
  resolveEnvironmentImageUrl,
  resolveShieldImageUrl,
} from "@/lib/environment/rank-assets";
import { DEFAULT_EARLY_BIRD_BONUS_FRACTION } from "@/lib/services/challenges/early-bird";

__resetLoginRateLimitForTests();
const key = loginRateLimitKey("123", "1.2.3.4");
for (let i = 0; i < 12; i++) {
  assert.equal(consumeLoginAttempt(key), true, `attempt ${i + 1} should pass`);
}
assert.equal(consumeLoginAttempt(key), false, "13th attempt should be blocked");

assert.equal(defaultEnvironmentImageForSortOrder(0), "/environments/rank-0.svg");
assert.equal(defaultEnvironmentImageForSortOrder(99), "/environments/rank-9.svg");
assert.equal(resolveEnvironmentImageUrl("/pixel-placeholder.svg", 3), "/environments/rank-3.svg");
assert.equal(resolveEnvironmentImageUrl("/custom.png", 3), "/custom.png");
assert.equal(resolveShieldImageUrl(null, 2), "/shields/rank-2.svg");

assert.equal(
  stripLegacyPublicBasePath("/pueaa/api/carnet-upload/x.png"),
  "/api/carnet-upload/x.png",
);
assert.equal(withBasePathIfNeeded("/pueaa/api/carnet-upload/x.png"), "/api/carnet-upload/x.png");
assert.equal(withBasePathIfNeeded("/api/carnet-upload/x.png"), "/api/carnet-upload/x.png");
assert.equal(withBasePathIfNeeded("/environments/rank-1.svg"), "/environments/rank-1.svg");

assert.ok(DEFAULT_EARLY_BIRD_BONUS_FRACTION > 0 && DEFAULT_EARLY_BIRD_BONUS_FRACTION < 1);

console.log("ok: auth rate-limit + rank assets + early-bird constants + legacy basePath");
