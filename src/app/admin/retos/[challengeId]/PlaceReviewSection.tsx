import Link from "next/link";
import { EvidenceZoomImage } from "@/components/EvidenceZoomImage";
import { PhotoModalTrigger } from "@/components/PhotoModalTrigger";
import { EvidenceStatus } from "@/generated/prisma/enums";
import type { PlaceDocumentationAdminRow } from "@/lib/services/challenges/place-documentation";
import { getDuplicatePlaceExamplesForChallenge } from "@/lib/services/challenges/place-documentation";
import { approvePlaceDocumentationAction, rejectPlaceDocumentationAction } from "../place-documentation-actions";
import { AcopioCategoryFields } from "./AcopioCategoryFields";
import { formatDateTimeChallengeAdmin } from "./format-challenge-admin";
import { MIN_REJECT_REASON_LENGTH } from "@/lib/admin/review-action-redirect";
import { buildPlaceSupervisionRedirectTo } from "@/lib/admin/revision-filters";

const rejectTextareaClass =
  "resize-y rounded border border-[#243d30] bg-[#0d1512] px-2 py-1 font-mono text-[10px] text-[#e8f5ee]";

export type PlaceSupervisionMode = "detail" | "revision";

export type PlaceSupervisionQuery = {
  pq: string;
  pstatus: "all" | "pending" | "approved" | "rejected";
  psort: "created_desc" | "created_asc" | "place_asc" | "place_desc";
  pid: string;
};

type Props = {
  challengeId: string;
  basePoints: number;
  placeRows: PlaceDocumentationAdminRow[];
  placeQuery: PlaceSupervisionQuery;
  /** Si se omite, se arma con filtros actuales y el registro seleccionado (evita desalinear tras filtrar). */
  redirectTo?: string;
  supervisionMode: PlaceSupervisionMode;
  navLink?: { href: string; label: string };
};

function buildSelectHref(
  challengeId: string,
  mode: PlaceSupervisionMode,
  rowId: string,
  q: PlaceSupervisionQuery,
): string {
  const params = new URLSearchParams();
  if (q.pq.trim()) params.set("pq", q.pq.trim());
  if (q.pstatus !== "all") params.set("pstatus", q.pstatus);
  if (q.psort !== "created_desc") params.set("psort", q.psort);
  params.set("pid", rowId);
  const base =
    mode === "revision"
      ? `/admin/retos/${challengeId}/revision`
      : `/admin/retos/${challengeId}`;
  const qs = params.toString();
  return qs ? `${base}?${qs}` : `${base}?pid=${encodeURIComponent(rowId)}`;
}

export async function PlaceReviewSection({
  challengeId,
  basePoints,
  placeRows,
  placeQuery,
  redirectTo: redirectToProp,
  supervisionMode,
  navLink,
}: Props) {
  const pq = placeQuery.pq.trim().toLowerCase();
  const filtered = placeRows
    .filter((row) => {
      if (placeQuery.pstatus === "pending" && row.status !== EvidenceStatus.PENDING) return false;
      if (placeQuery.pstatus === "approved" && row.status !== EvidenceStatus.APPROVED) return false;
      if (placeQuery.pstatus === "rejected" && row.status !== EvidenceStatus.REJECTED) return false;
      if (!pq) return true;
      const haystack = `${row.employee.fullName} ${row.employee.cedula}`.toLowerCase();
      return haystack.includes(pq);
    })
    .sort((a, b) => {
      if (placeQuery.psort === "created_asc") return a.createdAt.getTime() - b.createdAt.getTime();
      if (placeQuery.psort === "created_desc") return b.createdAt.getTime() - a.createdAt.getTime();
      if (placeQuery.psort === "place_asc") return a.placeName.localeCompare(b.placeName, "es");
      return b.placeName.localeCompare(a.placeName, "es");
    });

  const selectedRow =
    filtered.find((r) => r.id === placeQuery.pid) ?? filtered[0] ?? null;

  const redirectTo =
    redirectToProp ??
    buildPlaceSupervisionRedirectTo(challengeId, supervisionMode, {
      pq: placeQuery.pq,
      pstatus: placeQuery.pstatus,
      psort: placeQuery.psort,
      pid: selectedRow?.id ?? placeQuery.pid,
    });

  const duplicateExamples =
    selectedRow && selectedRow.possibleDuplicate
      ? await getDuplicatePlaceExamplesForChallenge(
          challengeId,
          selectedRow.placeName,
          selectedRow.address,
          selectedRow.employee.id,
          5,
        )
      : [];

  const byEmployee = new Map<
    string,
    { employeeId: string; fullName: string; cedula: string; rows: PlaceDocumentationAdminRow[] }
  >();
  for (const row of filtered) {
    const prev = byEmployee.get(row.employee.id);
    if (prev) {
      prev.rows.push(row);
    } else {
      byEmployee.set(row.employee.id, {
        employeeId: row.employee.id,
        fullName: row.employee.fullName,
        cedula: row.employee.cedula,
        rows: [row],
      });
    }
  }
  const groups = [...byEmployee.values()].sort((a, b) =>
    a.fullName.localeCompare(b.fullName, "es"),
  );

  function statusLabel(s: EvidenceStatus) {
    if (s === EvidenceStatus.PENDING) return "Pendiente";
    if (s === EvidenceStatus.APPROVED) return "Aprobado";
    if (s === EvidenceStatus.REJECTED) return "Rechazado";
    return s;
  }

  return (
    <section className="rounded-lg border border-[#1f3328] bg-[#111916] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="font-mono text-[11px] font-medium uppercase tracking-widest text-[#6a9c80]">
          Lugares documentados — supervisión
        </h2>
        {navLink ? (
          <Link
            href={navLink.href}
            scroll={false}
            className="shrink-0 rounded border border-[#35664a] bg-[#142018] px-3 py-1 font-mono text-[10px] text-[#b8f0cc] shadow-[0_1px_0_#050807] hover:border-[#4a8060]"
          >
            {navLink.label}
          </Link>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-[#7aab8c]">
        Cada envío incluye nombre, dirección, categorías de residuo y datos opcionales. Al aprobar se pueden otorgar{" "}
        <strong className="text-[#c8e6d4]">{basePoints} pts</strong> por lugar y, si lo marcas, crear una entrada en el
        directorio de acopio. Puedes rechazar un aprobado (revoca puntos y quita el directorio si existía) o volver a
        aprobar un rechazado.
      </p>

      <form
        method="get"
        action={
          supervisionMode === "revision"
            ? `/admin/retos/${challengeId}/revision`
            : `/admin/retos/${challengeId}`
        }
        className="mt-4 flex flex-wrap items-end gap-3 rounded border border-[#243d30] bg-[#0d1512] p-3"
      >
        <label className="flex min-w-[14rem] flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-wide text-[#6a9c80]">
            Buscar usuario (nombre o cédula)
          </span>
          <input
            name="pq"
            defaultValue={placeQuery.pq}
            className="rounded border border-[#243d30] bg-[#111916] px-2.5 py-2 font-mono text-xs text-[#e8f5ee]"
            placeholder="Ej: García o 123456"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-wide text-[#6a9c80]">Estado</span>
          <select
            name="pstatus"
            defaultValue={placeQuery.pstatus}
            className="rounded border border-[#243d30] bg-[#111916] px-2.5 py-2 font-mono text-xs text-[#e8f5ee]"
          >
            <option value="all">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="approved">Aprobados</option>
            <option value="rejected">Rechazados</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-wide text-[#6a9c80]">Orden</span>
          <select
            name="psort"
            defaultValue={placeQuery.psort}
            className="rounded border border-[#243d30] bg-[#111916] px-2.5 py-2 font-mono text-xs text-[#e8f5ee]"
          >
            <option value="created_desc">Envío más reciente primero</option>
            <option value="created_asc">Envío más antiguo primero</option>
            <option value="place_asc">Nombre del lugar A–Z</option>
            <option value="place_desc">Nombre del lugar Z–A</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded border border-[#35664a] bg-[#142018] px-3 py-2 font-mono text-xs text-[#b8f0cc] hover:border-[#4a8060]"
        >
          Aplicar filtros
        </button>
      </form>

      <div className="mt-3 grid gap-2 font-mono text-xs text-[#7aab8c] sm:grid-cols-3">
        <p>
          Usuarios en vista: <span className="text-[#8fd4a8]">{groups.length}</span>
        </p>
        <p>
          Registros en vista: <span className="text-[#8fd4a8]">{filtered.length}</span>
        </p>
        <p>
          Total en reto: <span className="text-[#8fd4a8]">{placeRows.length}</span>
        </p>
      </div>

      {placeRows.length === 0 ? (
        <p className="mt-4 font-mono text-sm text-[#6a8c78]">Aún no hay envíos.</p>
      ) : filtered.length === 0 ? (
        <p className="mt-4 font-mono text-sm text-[#6a8c78]">No hay resultados con los filtros seleccionados.</p>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(360px,1fr)_minmax(460px,1.2fr)]">
          <div className="rounded-lg border border-[#243d30] bg-[#0d1512] p-3">
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-[#5a8f72]">
              Lista de registros (selecciona uno)
            </h3>
            <div className="mt-3 max-h-[70vh] space-y-4 overflow-auto pr-1">
              {groups.map((group) => (
                <div key={group.employeeId} className="rounded border border-[#243d30] bg-[#111916] p-2.5">
                  <p className="text-xs text-[#c8e6d4]">
                    <Link
                      href={`/admin/puntajes/${group.employeeId}`}
                      className="text-[#8fd4a8] underline-offset-2 hover:underline"
                    >
                      {group.fullName}
                    </Link>
                    <span className="ml-2 font-mono text-[10px] text-[#6a8c78]">{group.cedula}</span>
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-[#6a8c78]">Registros: {group.rows.length}</p>
                  <div className="mt-2 space-y-1">
                    {group.rows.map((row) => (
                      <Link
                        key={row.id}
                        href={buildSelectHref(challengeId, supervisionMode, row.id, placeQuery)}
                        scroll={false}
                        className={`block rounded border px-2 py-1.5 font-mono text-[10px] ${
                          selectedRow?.id === row.id
                            ? "border-[#4a8060] bg-[#142018] text-[#b8f0cc]"
                            : "border-[#243d30] bg-[#0d1512] text-[#9ed4b4] hover:border-[#35664a]"
                        }`}
                      >
                        <span className="font-medium">{row.placeName}</span>
                        <span className="mx-1 text-[#6a8c78]">·</span>
                        <span>{formatDateTimeChallengeAdmin(row.createdAt)}</span>
                        <span className="mx-1 text-[#6a8c78]">·</span>
                        <span>{statusLabel(row.status)}</span>
                        {row.possibleDuplicate ? (
                          <span className="ml-1 rounded border border-[#b45309] bg-[#1a1208] px-1 py-0.5 text-[#fde68a]">
                            dup
                          </span>
                        ) : null}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#243d30] bg-[#0d1512] p-4">
            {selectedRow ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#243d30] pb-3">
                  <div>
                    <p className="text-sm text-[#c8e6d4]">
                      {selectedRow.employee.fullName}
                      <span className="ml-2 font-mono text-xs text-[#6a8c78]">{selectedRow.employee.cedula}</span>
                    </p>
                    <p className="mt-1 font-mono text-xs text-[#7aab8c]">
                      {selectedRow.placeName} · Enviado {formatDateTimeChallengeAdmin(selectedRow.createdAt)}
                    </p>
                  </div>
                  <p className="font-mono text-xs text-[#8fd4a8]">{statusLabel(selectedRow.status)}</p>
                </div>

                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <p className="rounded border border-[#243d30] bg-[#111916] px-3 py-2 sm:col-span-2">
                    <span className="font-mono text-[10px] text-[#6a8c78]">Dirección</span>
                    <br />
                    <span className="whitespace-pre-wrap text-[#c8e6d4]">{selectedRow.address}</span>
                  </p>
                  <p className="rounded border border-[#243d30] bg-[#111916] px-3 py-2">
                    <span className="font-mono text-[10px] text-[#6a8c78]">Teléfono</span>
                    <br />
                    <strong className="font-mono text-[#c8e6d4]">{selectedRow.phone ?? "—"}</strong>
                  </p>
                  <p className="rounded border border-[#243d30] bg-[#111916] px-3 py-2">
                    <span className="font-mono text-[10px] text-[#6a8c78]">Puntos si se aprueba</span>
                    <br />
                    <strong className="font-mono text-[#c8e6d4]">+{basePoints} pts</strong>
                  </p>
                  <p className="rounded border border-[#243d30] bg-[#111916] px-3 py-2 sm:col-span-2">
                    <span className="font-mono text-[10px] text-[#6a8c78]">Categorías declaradas</span>
                    <br />
                    <span className="font-mono text-xs text-[#9ed4b4]">
                      {selectedRow.categories.length > 0
                        ? selectedRow.categories.join(", ")
                        : "—"}
                    </span>
                  </p>
                </div>

                {selectedRow.possibleDuplicate && duplicateExamples.length > 0 ? (
                  <div className="rounded border border-[#b45309] bg-[#1a1208] px-3 py-2 text-xs text-[#fde68a]">
                    <p className="font-mono text-[10px] uppercase tracking-wide">Posible duplicado</p>
                    <p className="mt-1 text-[#fde68a]">
                      Otros envíos con la misma clave de lugar:{" "}
                      {duplicateExamples.map((e) => e.fullName).join(" · ")}
                    </p>
                  </div>
                ) : null}

                <div className="rounded border border-[#243d30] bg-[#111916] px-3 py-2 text-xs text-[#9ed4b4]">
                  {selectedRow.reviewedBy ? (
                    <p>
                      Última revisión: {selectedRow.reviewedBy.fullName}
                      {selectedRow.reviewedAt
                        ? ` · ${formatDateTimeChallengeAdmin(selectedRow.reviewedAt)}`
                        : ""}
                    </p>
                  ) : (
                    <p>Sin revisión administrativa registrada.</p>
                  )}
                  {selectedRow.rejectReason ? (
                    <p className="mt-1 text-[#f0c4c4]">
                      <span className="text-[#6a8c78]">Motivo rechazo: </span>
                      {selectedRow.rejectReason}
                    </p>
                  ) : null}
                  {selectedRow.directoryPlaceId ? (
                    <p className="mt-1 font-mono text-[10px] text-[#6a8c78]">
                      Vinculado al directorio (id: {selectedRow.directoryPlaceId})
                    </p>
                  ) : null}
                </div>

                <div className="rounded border border-[#243d30] bg-[#111916] px-3 py-2">
                  <p className="font-mono text-[10px] uppercase tracking-wide text-[#6a9c80]">Foto del lugar</p>
                  <div className="mt-2">
                    {selectedRow.photoFilePath ? (
                      <div className="space-y-2">
                        <EvidenceZoomImage
                          imageSrc={selectedRow.photoFilePath}
                          alt="Foto del lugar documentado"
                        />
                        <PhotoModalTrigger
                          imageSrc={selectedRow.photoFilePath}
                          className="font-mono text-xs text-[#8fd4a8] underline-offset-2 hover:underline"
                          imageAlt="Foto del lugar documentado"
                        >
                          Ver imagen (ampliar)
                        </PhotoModalTrigger>
                      </div>
                    ) : (
                      <span className="text-xs text-[#6a8c78]">Sin foto adjunta.</span>
                    )}
                  </div>
                </div>

                <div className="rounded border border-[#243d30] bg-[#111916] px-3 py-2">
                  <p className="font-mono text-[10px] uppercase tracking-wide text-[#6a9c80]">
                    Acciones de supervisión
                  </p>
                  {(selectedRow.status === EvidenceStatus.PENDING ||
                    selectedRow.status === EvidenceStatus.REJECTED) && (
                    <form action={approvePlaceDocumentationAction} className="mt-2 flex max-w-md flex-col gap-2">
                      <input type="hidden" name="submissionId" value={selectedRow.id} />
                      <input type="hidden" name="challengeId" value={challengeId} />
                      <input type="hidden" name="redirectTo" value={redirectTo} />
                      <label className="flex cursor-pointer items-center gap-2 text-xs text-[#7aab8c]">
                        <input
                          type="checkbox"
                          name="addToDirectory"
                          value="true"
                          defaultChecked={selectedRow.categories.length > 0}
                          className="rounded border-[#243d30]"
                        />
                        Añadir al directorio de acopio
                      </label>
                      <AcopioCategoryFields defaultSelected={selectedRow.categories} />
                      <button
                        type="submit"
                        className="w-fit rounded border border-[#2a4a38] bg-[#0d1512] px-2.5 py-1.5 font-mono text-[11px] text-[#8fd4a8] hover:border-[#35664a]"
                      >
                        Aprobar
                      </button>
                    </form>
                  )}
                  {(selectedRow.status === EvidenceStatus.PENDING ||
                    selectedRow.status === EvidenceStatus.APPROVED) && (
                    <form action={rejectPlaceDocumentationAction} className="mt-3 flex max-w-md flex-col gap-1.5">
                      <input type="hidden" name="submissionId" value={selectedRow.id} />
                      <input type="hidden" name="challengeId" value={challengeId} />
                      <input type="hidden" name="redirectTo" value={redirectTo} />
                      <textarea
                        name="rejectReason"
                        rows={3}
                        placeholder="Motivo del rechazo (obligatorio para auditoría)"
                        className={rejectTextareaClass}
                        required
                        minLength={MIN_REJECT_REASON_LENGTH}
                      />
                      <button
                        type="submit"
                        className="w-fit rounded border border-[#6a3030] bg-[#1a1010] px-2.5 py-1.5 font-mono text-[11px] text-[#f0b4b4] hover:border-[#8a4040]"
                      >
                        Rechazar
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
