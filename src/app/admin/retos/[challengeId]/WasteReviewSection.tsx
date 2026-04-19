import Link from "next/link";
import { PhotoModalTrigger } from "@/components/PhotoModalTrigger";
import { EvidenceStatus } from "@/generated/prisma/enums";
import type {
  WasteEvidencePendingRow,
  WasteEvidenceRecentRow,
} from "@/lib/services/challenges/waste-evidence";
import { approveWasteEvidenceAction, rejectWasteEvidenceAction } from "../waste-evidence-actions";
import { formatDateTimeChallengeAdmin } from "./format-challenge-admin";
import { MIN_REJECT_REASON_LENGTH } from "@/lib/admin/review-action-redirect";

const rejectTextareaClass =
  "resize-y rounded border border-[#243d30] bg-[#0d1512] px-2 py-1 font-mono text-[10px] text-[#e8f5ee]";

type Props = {
  challengeId: string;
  basePoints: number;
  wastePending: WasteEvidencePendingRow[];
  wasteRecent: WasteEvidenceRecentRow[];
  /** Destino tras aprobar/rechazar (p. ej. detalle o cola con filtros). */
  redirectTo: string;
  /** Enlace opcional arriba del bloque (cola ↔ detalle). */
  navLink?: { href: string; label: string };
};

function revisionCell(r: WasteEvidenceRecentRow) {
  const when = r.reviewedAt ?? r.updatedAt;
  if (r.reviewedBy) {
    return (
      <div className="max-w-[14rem] space-y-0.5 font-mono text-[10px] text-[#9ed4b4]">
        <p>
          <span className="text-[#6a8c78]">Por </span>
          {r.reviewedBy.fullName}
        </p>
        <p className="whitespace-nowrap text-[#6a8c78]">{formatDateTimeChallengeAdmin(when)}</p>
      </div>
    );
  }
  return (
    <span className="font-mono text-xs whitespace-nowrap text-[#6a8c78]">
      {formatDateTimeChallengeAdmin(when)}
    </span>
  );
}

export function WasteReviewSection({ challengeId, basePoints, wastePending, wasteRecent, redirectTo, navLink }: Props) {
  return (
    <section className="rounded-lg border border-[#1f3328] bg-[#111916] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="font-mono text-[11px] font-medium uppercase tracking-widest text-[#6a9c80]">
          Evidencias residuos / acopio — revisión
        </h2>
        {navLink ? (
          <Link
            href={navLink.href}
            className="shrink-0 rounded border border-[#35664a] bg-[#142018] px-3 py-1 font-mono text-[10px] text-[#b8f0cc] shadow-[0_1px_0_#050807] hover:border-[#4a8060]"
          >
            {navLink.label}
          </Link>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-[#7aab8c]">
        Las fotos quedan pendientes hasta que apruebes o rechaces. Los puntos base ({basePoints} pts) se registran en
        el ledger al aprobar la <strong>primera</strong> evidencia de cada persona.
      </p>

      <h3 className="mt-6 font-mono text-[10px] uppercase tracking-wider text-[#5a8f72]">Pendientes</h3>
      {wastePending.length === 0 ? (
        <p className="mt-2 font-mono text-sm text-[#6a8c78]">No hay evidencias pendientes.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#243d30] font-mono text-[10px] uppercase tracking-wider text-[#5a8f72]">
                <th className="py-2 pr-3">Empleado</th>
                <th className="py-2 pr-3">Sitio declarado</th>
                <th className="py-2 pr-3">Duplicado</th>
                <th className="py-2 pr-3">Enviado</th>
                <th className="py-2 pr-3">Vista</th>
                <th className="py-2 pr-0">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {wastePending.map((row) => (
                <tr key={row.id} className="border-b border-[#1a2820] text-[#c8e6d4]">
                  <td className="py-2.5 pr-3">
                    <Link
                      href={`/admin/puntajes/${row.employee.id}`}
                      className="text-[#8fd4a8] underline-offset-2 hover:underline"
                    >
                      {row.employee.fullName}
                    </Link>
                    <span className="ml-1 font-mono text-[10px] text-[#4d7a62]">{row.employee.cedula}</span>
                  </td>
                  <td className="py-2.5 pr-3 max-w-[14rem] text-xs">
                    {row.siteName?.trim() || row.siteAddress?.trim() ? (
                      <>
                        {row.siteName?.trim() || "—"}
                        {row.siteAddress?.trim() ? (
                          <span className="text-[#6a8c78]"> · {row.siteAddress.trim()}</span>
                        ) : null}
                      </>
                    ) : (
                      <span className="text-[#6a8c78]">—</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 font-mono text-[10px]">
                    {row.possibleDuplicate ? (
                      <span className="rounded border border-[#b45309] bg-[#1a1208] px-1.5 py-0.5 text-[#fde68a]">
                        Posible duplicado
                      </span>
                    ) : (
                      <span className="text-[#6a8c78]">—</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 font-mono text-xs whitespace-nowrap">
                    {formatDateTimeChallengeAdmin(row.createdAt)}
                  </td>
                  <td className="py-2.5 pr-3">
                    <PhotoModalTrigger
                      imageSrc={row.filePath}
                      className="font-mono text-xs text-[#8fd4a8] underline-offset-2 hover:underline"
                      imageAlt="Evidencia de residuos o acopio"
                    >
                      Abrir imagen
                    </PhotoModalTrigger>
                  </td>
                  <td className="py-2.5 pr-0">
                    <div className="flex flex-wrap items-start gap-2">
                      <form action={approveWasteEvidenceAction} className="inline">
                        <input type="hidden" name="submissionId" value={row.id} />
                        <input type="hidden" name="challengeId" value={challengeId} />
                        <input type="hidden" name="redirectTo" value={redirectTo} />
                        <button
                          type="submit"
                          className="rounded border border-[#2a4a38] bg-[#0d1512] px-2 py-1 font-mono text-[10px] text-[#8fd4a8] hover:border-[#35664a]"
                        >
                          Aprobar
                        </button>
                      </form>
                      <form action={rejectWasteEvidenceAction} className="flex max-w-xs flex-col gap-1">
                        <input type="hidden" name="submissionId" value={row.id} />
                        <input type="hidden" name="challengeId" value={challengeId} />
                        <input type="hidden" name="redirectTo" value={redirectTo} />
                        <textarea
                          name="rejectReason"
                          rows={2}
                          placeholder="Motivo del rechazo (obligatorio para auditoría)"
                          className={rejectTextareaClass}
                          required
                          minLength={MIN_REJECT_REASON_LENGTH}
                        />
                        <button
                          type="submit"
                          className="w-fit rounded border border-[#6a3030] bg-[#1a1010] px-2 py-1 font-mono text-[10px] text-[#f0b4b4] hover:border-[#8a4040]"
                        >
                          Rechazar
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3 className="mt-8 font-mono text-[10px] uppercase tracking-wider text-[#5a8f72]">Historial reciente</h3>
      {wasteRecent.length === 0 ? (
        <p className="mt-2 font-mono text-sm text-[#6a8c78]">Sin decisiones aún.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[1020px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#243d30] font-mono text-[10px] uppercase tracking-wider text-[#5a8f72]">
                <th className="py-2 pr-3">Estado</th>
                <th className="py-2 pr-3">Empleado</th>
                <th className="py-2 pr-3">Sitio</th>
                <th className="py-2 pr-3">Duplicado</th>
                <th className="py-2 pr-3">Revisión</th>
                <th className="py-2 pr-0">Nota</th>
              </tr>
            </thead>
            <tbody>
              {wasteRecent.map((r) => (
                <tr key={r.id} className="border-b border-[#1a2820] text-[#c8e6d4]">
                  <td className="py-2.5 pr-3 font-mono text-xs">
                    {r.status === EvidenceStatus.APPROVED ? (
                      <span className="text-[#8fd4a8]">Aprobada</span>
                    ) : (
                      <span className="text-[#f0b4b4]">Rechazada</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3">{r.participation.employee.fullName}</td>
                  <td className="py-2.5 pr-3 max-w-[12rem] text-xs">
                    {r.siteName?.trim() || r.siteAddress?.trim() ? (
                      <>
                        {r.siteName?.trim() || "—"}
                        {r.siteAddress?.trim() ? (
                          <span className="text-[#6a8c78]"> · {r.siteAddress.trim()}</span>
                        ) : null}
                      </>
                    ) : (
                      <span className="text-[#6a8c78]">—</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 font-mono text-[10px]">
                    {r.possibleDuplicate ? (
                      <span className="rounded border border-[#b45309] bg-[#1a1208] px-1.5 py-0.5 text-[#fde68a]">
                        Posible duplicado
                      </span>
                    ) : (
                      <span className="text-[#6a8c78]">—</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 align-top">{revisionCell(r)}</td>
                  <td className="py-2.5 pr-0 text-xs text-[#7aab8c]">{r.rejectReason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
