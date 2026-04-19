"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SubmissionSuccessBanner } from "@/components/tablero/SubmissionSuccessBanner";
import { CAMPAIGN_REVIEW_TEAM_NAME } from "@/lib/campaign-messages";
import { checkWasteEvidenceDuplicateAction, submitWasteEvidenceAction } from "./actions";

export function WasteEvidenceForm({ challengeId }: { challengeId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [dupCount, setDupCount] = useState<number | null>(null);
  const [dupExamples, setDupExamples] = useState<{ fullName: string; createdAt: string }[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runDuplicateCheck = useCallback(
    (siteName: string, siteAddress: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        const name = siteName.trim();
        if (!name) {
          setDupCount(null);
          setDupExamples([]);
          return;
        }
        const res = await checkWasteEvidenceDuplicateAction(challengeId, name, siteAddress);
        if (res.ok) {
          setDupCount(res.count);
          setDupExamples(res.examples);
        }
      }, 450);
    },
    [challengeId],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOk(false);
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      try {
        await submitWasteEvidenceAction(challengeId, fd);
        form.reset();
        setDupCount(null);
        setDupExamples([]);
        setOk(true);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo enviar.");
      }
    });
  }

  return (
    <section className="game-panel-3d relative overflow-hidden rounded-[2rem] p-6 md:p-8">
      <div className="relative border-b-2 border-[#94a3b8]/40 pb-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-[#1e3a5f] bg-[#dbeafe] font-mono text-sm font-bold text-[#1e40af] shadow-[0_3px_0_#1e3a5f]">
            1
          </span>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#c2410c]">Envío de evidencia</p>
            <h2 className="mt-0.5 text-xl font-semibold text-[#132238]">Sitio y foto</h2>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-sm text-[#3d5670]">
          Identifica el centro o punto de acopio y sube la foto. La {CAMPAIGN_REVIEW_TEAM_NAME} revisará la evidencia
          antes de sumar puntos.
        </p>
      </div>

      {ok ? <SubmissionSuccessBanner variant="pending_review" /> : null}
      {error ? (
        <p className="relative mt-5 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="relative mt-6 flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[#132238]">Nombre del centro o punto de acopio</span>
          <span className="text-[11px] text-[#57534e]">Obligatorio. Ayuda a detectar duplicados entre compañeros.</span>
          <input
            name="siteName"
            required
            autoComplete="off"
            onChange={(e) => {
              const addr = (e.target.form?.elements.namedItem("siteAddress") as HTMLInputElement)?.value ?? "";
              runDuplicateCheck(e.target.value, addr);
            }}
            className="rounded-xl border-2 border-[#94a3b8]/60 bg-white px-3 py-2.5 text-sm text-[#132238] shadow-inner focus:border-[#ea580c] focus:outline-none"
            placeholder="Ej. Punto ecológico barrio Centro"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[#132238]">Dirección o referencia (opcional)</span>
          <input
            name="siteAddress"
            autoComplete="off"
            onChange={(e) => {
              const name = (e.target.form?.elements.namedItem("siteName") as HTMLInputElement)?.value ?? "";
              runDuplicateCheck(name, e.target.value);
            }}
            className="rounded-xl border-2 border-[#94a3b8]/60 bg-white px-3 py-2.5 text-sm text-[#132238] shadow-inner focus:border-[#ea580c] focus:outline-none"
            placeholder="Ej. Cra. 10 #12-34 o junto a la planta"
          />
        </label>

        {dupCount !== null && dupCount > 0 ? (
          <div
            className="rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-950"
            role="status"
          >
            <p className="font-medium">Posible duplicado</p>
            <p className="mt-1 text-[13px] leading-relaxed">
              Otro compañero ya registró este sitio ({dupCount} envío{dupCount === 1 ? "" : "s"}). Puedes enviar de todos
              modos; la administración revisará la coherencia.
            </p>
            {dupExamples.length > 0 ? (
              <ul className="mt-2 list-inside list-disc text-[12px] text-amber-900/90">
                {dupExamples.map((ex, i) => (
                  <li key={i}>
                    {ex.fullName}
                    <span className="font-mono text-[10px] text-amber-800/80">
                      {" "}
                      ·{" "}
                      {new Intl.DateTimeFormat("es-CO", { dateStyle: "short" }).format(new Date(ex.createdAt))}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <label className="flex flex-col gap-3 rounded-2xl border-2 border-dashed border-[#94a3b8]/70 bg-[#f8fafc] p-5">
          <span className="text-sm font-medium text-[#132238]">Archivo de imagen</span>
          <span className="text-[11px] leading-relaxed text-[#57534e]">
            JPEG, PNG o WebP · máximo según límite de la app (típicamente 4 MB).
          </span>
          <input
            name="evidence"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            required
            className="text-sm text-[#132238] file:mr-3 file:rounded-xl file:border-0 file:bg-[#ea580c] file:px-4 file:py-2.5 file:font-mono file:text-sm file:text-white file:shadow-md hover:file:brightness-110"
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="game-btn-primary w-full rounded-2xl py-3.5 font-mono text-sm font-bold sm:w-auto sm:min-w-[220px] sm:px-10 disabled:opacity-50"
        >
          {pending ? "Enviando…" : "Enviar evidencia"}
        </button>
      </form>
    </section>
  );
}
