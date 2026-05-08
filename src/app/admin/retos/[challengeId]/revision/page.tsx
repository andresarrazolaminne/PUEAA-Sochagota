import Link from "next/link";
import { notFound } from "next/navigation";
import { getChallengeById } from "@/lib/services/challenges/queries";
import {
  listPendingWasteEvidenceForChallenge,
  listRecentWasteEvidenceDecisionsForChallenge,
} from "@/lib/services/challenges/waste-evidence";
import { listAllPlaceDocumentationForChallengeAdmin } from "@/lib/services/challenges/place-documentation";
import { ChallengeType } from "@/generated/prisma/enums";
import { challengeAdminBasePath } from "@/modules/challenges/registry";
import {
  buildRevisionRedirectTo,
  filterWastePendingForRevision,
  type RevisionSort,
} from "@/lib/admin/revision-filters";
import { ReviewAlerts } from "../ReviewAlerts";
import { WasteReviewSection } from "../WasteReviewSection";
import { PlaceReviewSection, type PlaceSupervisionQuery } from "../PlaceReviewSection";

export default async function AdminChallengeRevisionPage({
  params,
  searchParams,
}: {
  params: Promise<{ challengeId: string }>;
  searchParams: Promise<{
    q?: string;
    dup?: string;
    sort?: string;
    ok?: string;
    err?: string;
    pq?: string;
    pstatus?: string;
    psort?: string;
    pid?: string;
  }>;
}) {
  const { challengeId } = await params;
  const sp = await searchParams;
  const challenge = await getChallengeById(challengeId);
  if (!challenge) notFound();
  if (challenge.type !== ChallengeType.WASTE_EVIDENCE && challenge.type !== ChallengeType.PLACE_DOCUMENTATION) {
    notFound();
  }

  const q = sp.q ?? "";
  const dupOnly = sp.dup === "1";
  const sort: RevisionSort = sp.sort === "newest" ? "newest" : "oldest";

  const placePq = typeof sp.pq === "string" ? sp.pq : "";
  const placePstatus =
    sp.pstatus === "pending" ||
    sp.pstatus === "approved" ||
    sp.pstatus === "rejected" ||
    sp.pstatus === "all"
      ? sp.pstatus
      : "all";
  const placePsort =
    sp.psort === "created_asc" ||
    sp.psort === "created_desc" ||
    sp.psort === "place_asc" ||
    sp.psort === "place_desc"
      ? sp.psort
      : "created_desc";
  const placePid = typeof sp.pid === "string" ? sp.pid : "";

  const [wastePendingRaw, wasteRecent, placeDocumentationRows] = await Promise.all([
    challenge.type === ChallengeType.WASTE_EVIDENCE
      ? listPendingWasteEvidenceForChallenge(challengeId)
      : Promise.resolve([]),
    challenge.type === ChallengeType.WASTE_EVIDENCE
      ? listRecentWasteEvidenceDecisionsForChallenge(challengeId, 40)
      : Promise.resolve([]),
    challenge.type === ChallengeType.PLACE_DOCUMENTATION
      ? listAllPlaceDocumentationForChallengeAdmin(challengeId)
      : Promise.resolve([]),
  ]);

  const wastePending =
    challenge.type === ChallengeType.WASTE_EVIDENCE
      ? filterWastePendingForRevision(wastePendingRaw, q, dupOnly, sort)
      : [];

  const redirectTo = buildRevisionRedirectTo(challengeId, { q, dupOnly, sort });

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/retos"
          className="font-mono text-xs text-[#7aab8c] underline-offset-2 hover:text-[#c8e6d4] hover:underline"
        >
          Volver a retos
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-[#e8f5ee]">Cola de revisión</h1>
            <p className="mt-1 font-mono text-xs text-[#6a8c78]">
              {challenge.title} · <span className="text-[#8fd4a8]">{challenge.type}</span>
            </p>
          </div>
          <Link
            href={challengeAdminBasePath(challengeId)}
            className="mt-1 shrink-0 rounded border border-[#35664a] bg-[#142018] px-3 py-1.5 font-mono text-xs text-[#b8f0cc] shadow-[0_2px_0_#050807] hover:border-[#4a8060]"
          >
            Volver al detalle del reto
          </Link>
        </div>
      </div>

      <ReviewAlerts ok={sp.ok} err={sp.err} />

      {challenge.type === ChallengeType.WASTE_EVIDENCE ? (
        <>
          <section className="rounded-lg border border-[#1f3328] bg-[#111916] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <h2 className="font-mono text-[10px] uppercase tracking-wider text-[#5a8f72]">Filtros</h2>
            <form method="get" className="mt-3 flex flex-wrap items-end gap-3">
              <div className="flex min-w-[12rem] flex-col gap-1">
                <label htmlFor="rev-q" className="font-mono text-[10px] text-[#6a8c78]">
                  Buscar (nombre o cédula)
                </label>
                <input
                  id="rev-q"
                  name="q"
                  defaultValue={q}
                  className="rounded border border-[#243d30] bg-[#0d1512] px-2 py-1.5 font-mono text-xs text-[#e8f5ee]"
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2 font-mono text-xs text-[#7aab8c]">
                <input type="checkbox" name="dup" value="1" defaultChecked={dupOnly} className="rounded border-[#243d30]" />
                Solo posible duplicado
              </label>
              <div className="flex flex-col gap-1">
                <label htmlFor="rev-sort" className="font-mono text-[10px] text-[#6a8c78]">
                  Orden pendientes
                </label>
                <select
                  id="rev-sort"
                  name="sort"
                  defaultValue={sort}
                  className="rounded border border-[#243d30] bg-[#0d1512] px-2 py-1.5 font-mono text-xs text-[#e8f5ee]"
                >
                  <option value="oldest">Más antiguos primero</option>
                  <option value="newest">Más recientes primero</option>
                </select>
              </div>
              <button
                type="submit"
                className="rounded border border-[#35664a] bg-[#142018] px-3 py-1.5 font-mono text-xs text-[#b8f0cc] hover:border-[#4a8060]"
              >
                Aplicar
              </button>
            </form>
          </section>

          <WasteReviewSection
            challengeId={challengeId}
            basePoints={challenge.basePoints}
            wastePending={wastePending}
            wasteRecent={wasteRecent}
            redirectTo={redirectTo}
            navLink={{ href: challengeAdminBasePath(challengeId), label: "Volver al detalle del reto" }}
          />
        </>
      ) : (
        <PlaceReviewSection
          challengeId={challengeId}
          basePoints={challenge.basePoints}
          placeRows={placeDocumentationRows}
          placeQuery={{
            pq: placePq,
            pstatus: placePstatus as PlaceSupervisionQuery["pstatus"],
            psort: placePsort as PlaceSupervisionQuery["psort"],
            pid: placePid,
          }}
          supervisionMode="revision"
          navLink={{ href: challengeAdminBasePath(challengeId), label: "Volver al detalle del reto" }}
        />
      )}
    </div>
  );
}
