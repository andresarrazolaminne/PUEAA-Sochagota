import Link from "next/link";
import { PhotoModalTrigger } from "@/components/PhotoModalTrigger";
import { EvidenceStatus } from "@/generated/prisma/enums";
import type {
  PlaceDocumentationPendingRow,
  PlaceDocumentationRecentRow,
} from "@/lib/services/challenges/place-documentation";
import { approvePlaceDocumentationAction, rejectPlaceDocumentationAction } from "../place-documentation-actions";
import { AcopioCategoryFields } from "./AcopioCategoryFields";
import { formatDateTimeChallengeAdmin } from "./format-challenge-admin";
import { MIN_REJECT_REASON_LENGTH } from "@/lib/admin/review-action-redirect";

const rejectTextareaClass =
  "resize-y rounded border border-[#243d30] bg-[#0d1512] px-2 py-1 font-mono text-[10px] text-[#e8f5ee]";

type Props = {
  challengeId: string;
  basePoints: number;
  placePending: PlaceDocumentationPendingRow[];
  placeRecent: PlaceDocumentationRecentRow[];
  redirectTo: string;
  navLink?: { href: string; label: string };
};

function revisionCell(r: PlaceDocumentationRecentRow) {
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

export function PlaceReviewSection({
  challengeId,
  basePoints,
  placePending,
  placeRecent,
  redirectTo,
  navLink,
}: Props) {
  return (
    <section className="rounded-lg border border-[#1f3328] bg-[#111916] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="font-mono text-[11px] font-medium uppercase tracking-widest text-[#6a9c80]">
          Lugares documentados — revisión
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
        Cada envío incluye nombre, dirección, categorías de residuo (declaradas por el jugador) y datos opcionales. Al
        aprobar se pueden otorgar <strong className="text-[#c8e6d4]">{basePoints} pts</strong> por lugar y, si lo
        marcas, crear una entrada en el directorio de acopio. Las casillas de categorías se precargan con lo enviado; puedes
        ajustarlas antes de publicar.
      </p>

      <h3 className="mt-6 font-mono text-[10px] uppercase tracking-wider text-[#5a8f72]">Pendientes</h3>
      {placePending.length === 0 ? (
        <p className="mt-2 font-mono text-sm text-[#6a8c78]">No hay lugares pendientes.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#243d30] font-mono text-[10px] uppercase tracking-wider text-[#5a8f72]">
                <th className="py-2 pr-3">Empleado</th>
                <th className="py-2 pr-3">Lugar</th>
                <th className="py-2 pr-3">Duplicado</th>
                <th className="py-2 pr-3">Dirección</th>
                <th className="py-2 pr-3">Tel.</th>
                <th className="py-2 pr-3">Enviado</th>
                <th className="py-2 pr-3">Foto</th>
                <th className="py-2 pr-0">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {placePending.map((row) => (
                <tr key={row.id} className="border-b border-[#1a2820] align-top text-[#c8e6d4]">
                  <td className="py-2.5 pr-3">
                    <Link
                      href={`/admin/puntajes/${row.employee.id}`}
                      className="text-[#8fd4a8] underline-offset-2 hover:underline"
                    >
                      {row.employee.fullName}
                    </Link>
                    <span className="ml-1 font-mono text-[10px] text-[#4d7a62]">{row.employee.cedula}</span>
                  </td>
                  <td className="py-2.5 pr-3 max-w-[14rem]">{row.placeName}</td>
                  <td className="py-2.5 pr-3 font-mono text-[10px]">
                    {row.possibleDuplicate ? (
                      <span className="rounded border border-[#b45309] bg-[#1a1208] px-1.5 py-0.5 text-[#fde68a]">
                        Posible duplicado
                      </span>
                    ) : (
                      <span className="text-[#6a8c78]">—</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 max-w-[18rem] whitespace-pre-wrap text-xs">{row.address}</td>
                  <td className="py-2.5 pr-3 font-mono text-xs">{row.phone ?? "—"}</td>
                  <td className="py-2.5 pr-3 font-mono text-xs whitespace-nowrap">
                    {formatDateTimeChallengeAdmin(row.createdAt)}
                  </td>
                  <td className="py-2.5 pr-3">
                    {row.photoFilePath ? (
                      <PhotoModalTrigger
                        imageSrc={row.photoFilePath}
                        className="font-mono text-xs text-[#8fd4a8] underline-offset-2 hover:underline"
                        imageAlt="Foto del lugar documentado"
                      >
                        Ver foto
                      </PhotoModalTrigger>
                    ) : (
                      <span className="text-[#6a8c78]">—</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-0">
                    <div className="flex max-w-md flex-col gap-2">
                      <form action={approvePlaceDocumentationAction} className="flex flex-col gap-2">
                        <input type="hidden" name="submissionId" value={row.id} />
                        <input type="hidden" name="challengeId" value={challengeId} />
                        <input type="hidden" name="redirectTo" value={redirectTo} />
                        <label className="flex cursor-pointer items-center gap-2 text-xs text-[#7aab8c]">
                          <input
                            type="checkbox"
                            name="addToDirectory"
                            value="true"
                            defaultChecked
                            className="rounded border-[#243d30]"
                          />
                          Añadir al directorio de acopio
                        </label>
                        <AcopioCategoryFields defaultSelected={row.categories} />
                        <button
                          type="submit"
                          className="w-fit rounded border border-[#2a4a38] bg-[#0d1512] px-2 py-1 font-mono text-[10px] text-[#8fd4a8] hover:border-[#35664a]"
                        >
                          Aprobar
                        </button>
                      </form>
                      <form action={rejectPlaceDocumentationAction} className="flex max-w-xs flex-col gap-1">
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
      {placeRecent.length === 0 ? (
        <p className="mt-2 font-mono text-sm text-[#6a8c78]">Sin decisiones aún.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#243d30] font-mono text-[10px] uppercase tracking-wider text-[#5a8f72]">
                <th className="py-2 pr-3">Estado</th>
                <th className="py-2 pr-3">Empleado</th>
                <th className="py-2 pr-3">Lugar</th>
                <th className="py-2 pr-3">Duplicado</th>
                <th className="py-2 pr-3">Revisión</th>
                <th className="py-2 pr-0">Nota</th>
              </tr>
            </thead>
            <tbody>
              {placeRecent.map((r) => (
                <tr key={r.id} className="border-b border-[#1a2820] text-[#c8e6d4]">
                  <td className="py-2.5 pr-3 font-mono text-xs">
                    {r.status === EvidenceStatus.APPROVED ? (
                      <span className="text-[#8fd4a8]">Aprobado</span>
                    ) : (
                      <span className="text-[#f0b4b4]">Rechazado</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3">{r.participation.employee.fullName}</td>
                  <td className="py-2.5 pr-3 max-w-[16rem] text-xs">{r.placeName}</td>
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
