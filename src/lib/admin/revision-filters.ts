import type { WasteEvidencePendingRow } from "@/lib/services/challenges/waste-evidence";
import type { PlaceDocumentationPendingRow } from "@/lib/services/challenges/place-documentation";

export type RevisionSort = "oldest" | "newest";

/** URL de la cola con filtros actuales (para `redirectTo` en formularios). */
export function buildRevisionRedirectTo(
  challengeId: string,
  opts: { q?: string; dupOnly?: boolean; sort?: RevisionSort },
): string {
  const params = new URLSearchParams();
  const q = opts.q?.trim();
  if (q) params.set("q", q);
  if (opts.dupOnly) params.set("dup", "1");
  if (opts.sort === "newest") params.set("sort", "newest");
  const qs = params.toString();
  return qs ? `/admin/retos/${challengeId}/revision?${qs}` : `/admin/retos/${challengeId}/revision`;
}

function matchesEmployeeQuery(
  fullName: string,
  cedula: string,
  q: string,
): boolean {
  const n = q.trim().toLowerCase();
  if (!n) return true;
  return fullName.toLowerCase().includes(n) || cedula.toLowerCase().includes(n);
}

export function filterWastePendingForRevision(
  rows: WasteEvidencePendingRow[],
  q: string,
  dupOnly: boolean,
  sort: RevisionSort,
): WasteEvidencePendingRow[] {
  let r = rows;
  if (dupOnly) r = r.filter((row) => row.possibleDuplicate);
  if (q.trim()) {
    r = r.filter((row) => matchesEmployeeQuery(row.employee.fullName, row.employee.cedula, q));
  }
  const sorted = [...r];
  sorted.sort((a, b) =>
    sort === "newest"
      ? b.createdAt.getTime() - a.createdAt.getTime()
      : a.createdAt.getTime() - b.createdAt.getTime(),
  );
  return sorted;
}

export function filterPlacePendingForRevision(
  rows: PlaceDocumentationPendingRow[],
  q: string,
  dupOnly: boolean,
  sort: RevisionSort,
): PlaceDocumentationPendingRow[] {
  let r = rows;
  if (dupOnly) r = r.filter((row) => row.possibleDuplicate);
  if (q.trim()) {
    r = r.filter((row) => matchesEmployeeQuery(row.employee.fullName, row.employee.cedula, q));
  }
  const sorted = [...r];
  sorted.sort((a, b) =>
    sort === "newest"
      ? b.createdAt.getTime() - a.createdAt.getTime()
      : a.createdAt.getTime() - b.createdAt.getTime(),
  );
  return sorted;
}
