import { redirect } from "next/navigation";

/** Motivo mínimo de rechazo (caracteres), alineado con validación HTML5 `minLength`. */
export const MIN_REJECT_REASON_LENGTH = 10;

/**
 * Solo rutas internas de administración de retos (evita open redirect).
 */
export function parseAdminReviewRedirectTarget(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.startsWith("/admin/retos/")) return null;
  if (raw.includes("..") || raw.includes("\n")) return null;
  return raw;
}

export function redirectAfterReviewAction(redirectTo: string, outcome: "approved" | "rejected") {
  const url = new URL(redirectTo, "http://local.invalid");
  url.searchParams.set("ok", outcome);
  const qs = url.searchParams.toString();
  redirect(qs ? `${url.pathname}?${qs}` : url.pathname);
}
