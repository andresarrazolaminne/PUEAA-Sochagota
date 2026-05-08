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

/** URL para supervisión de acopio (detalle o cola), preservando filtros y registro seleccionado. */
export function buildPlaceSupervisionRedirectTo(
  challengeId: string,
  mode: "detail" | "revision",
  opts: {
    pq?: string;
    pstatus?: string;
    psort?: string;
    pid?: string;
    q?: string;
    dupOnly?: boolean;
    sort?: RevisionSort;
  },
): string {
  const params = new URLSearchParams();
  if (mode === "revision") {
    const q = opts.q?.trim();
    if (q) params.set("q", q);
    if (opts.dupOnly) params.set("dup", "1");
    if (opts.sort === "newest") params.set("sort", "newest");
  }
  const pq = opts.pq?.trim();
  if (pq) params.set("pq", pq);
  if (opts.pstatus && opts.pstatus !== "all") params.set("pstatus", opts.pstatus);
  if (opts.psort && opts.psort !== "created_desc") params.set("psort", opts.psort);
  if (opts.pid) params.set("pid", opts.pid);

  const base =
    mode === "revision"
      ? `/admin/retos/${challengeId}/revision`
      : `/admin/retos/${challengeId}`;
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
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
