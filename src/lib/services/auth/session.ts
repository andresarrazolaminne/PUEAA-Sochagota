import { createHash, randomBytes } from "node:crypto";

const TOKEN_BYTES = 32;

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function newSessionToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export const SESSION_COOKIE = "pueaa_session";

/** Duración por defecto: 14 días */
export function defaultSessionExpiresAt(from = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + 14);
  return d;
}
