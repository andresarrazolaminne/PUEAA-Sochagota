"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChallengeType } from "@/generated/prisma/enums";
import type { TriviaQuestionDraft } from "@/lib/services/challenges/trivia";
import { createChallengeAction, updateChallengeAction } from "./actions";
import { isTriviaDraftValid, TriviaQuestionsEditor } from "./TriviaQuestionsEditor";

const STEPS = 4;

const TYPE_LABELS: Record<ChallengeType, string> = {
  [ChallengeType.WATER_BILL]: "Recibo de agua (WATER_BILL)",
  [ChallengeType.WASTE_EVIDENCE]: "Evidencia residuos (WASTE_EVIDENCE)",
  [ChallengeType.PLACE_DOCUMENTATION]: "Documentar lugares (PLACE_DOCUMENTATION)",
  [ChallengeType.TRIVIA]: "Trivia (TRIVIA)",
  [ChallengeType.MINIGAME]: "Minijuego (MINIGAME)",
  [ChallengeType.OTHER]: "Otro (OTHER)",
};

export type ChallengeFormInitial = {
  code: string;
  title: string;
  description: string;
  type: ChallengeType;
  startsAt: string;
  endsAt: string;
  basePoints: string;
  active: boolean;
  platformManaged: boolean;
  optimalPerCapitaM3: string;
  requiresEvidence: boolean;
  earlyBirdEndsAt: string;
  earlyBirdSlots: string;
  /** Solo tipo TRIVIA: preguntas cargadas al editar. */
  triviaQuestions?: TriviaQuestionDraft[];
};

type Props =
  | { mode: "create" }
  | { mode: "edit"; challengeId: string; initial: ChallengeFormInitial };

export function ChallengeFormWizard(props: Props) {
  const isEdit = props.mode === "edit";
  const y = useMemo(() => new Date().getFullYear(), []);
  const defaultStart = `${y}-01-01`;
  const defaultEnd = `${y}-12-31`;

  const init = isEdit ? props.initial : null;

  const [step, setStep] = useState(1);
  const [code, setCode] = useState(init?.code ?? "");
  const [title, setTitle] = useState(init?.title ?? "");
  const [description, setDescription] = useState(init?.description ?? "");
  const [type, setType] = useState<ChallengeType>(init?.type ?? ChallengeType.OTHER);
  const [startsAt, setStartsAt] = useState(init?.startsAt ?? defaultStart);
  const [endsAt, setEndsAt] = useState(init?.endsAt ?? defaultEnd);
  const [basePoints, setBasePoints] = useState(init?.basePoints ?? "0");
  const [active, setActive] = useState(init?.active ?? true);
  const [platformManaged, setPlatformManaged] = useState(init?.platformManaged ?? true);
  const [optimalPerCapitaM3, setOptimalPerCapitaM3] = useState(init?.optimalPerCapitaM3 ?? "12");
  const [requiresEvidence, setRequiresEvidence] = useState(init?.requiresEvidence ?? true);
  const [earlyBirdEndsAt, setEarlyBirdEndsAt] = useState(init?.earlyBirdEndsAt ?? "");
  const [earlyBirdSlots, setEarlyBirdSlots] = useState(init?.earlyBirdSlots ?? "");

  const defaultTrivia = (): TriviaQuestionDraft[] => [
    { prompt: "", answers: ["", ""], correctIndex: 0 },
  ];
  const [trivia, setTrivia] = useState<TriviaQuestionDraft[]>(() => {
    if (init?.triviaQuestions && init.triviaQuestions.length > 0) return init.triviaQuestions;
    return defaultTrivia();
  });

  const [pending, setPending] = useState(false);

  function canGoNext(): boolean {
    if (step === 1) return title.trim().length > 0;
    if (step === 2) {
      if (!startsAt || !endsAt) return false;
      return startsAt <= endsAt;
    }
    if (step === 3 && type === ChallengeType.TRIVIA) {
      return isTriviaDraftValid(trivia);
    }
    return true;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    try {
      if (isEdit) {
        await updateChallengeAction(fd);
      } else {
        await createChallengeAction(fd);
      }
    } finally {
      setPending(false);
    }
  }

  const cancelHref = isEdit ? `/admin/retos/${props.challengeId}` : "/admin/retos";
  const submitLabel = isEdit ? "Guardar cambios" : "Crear reto";
  const pendingLabel = isEdit ? "Guardando…" : "Creando…";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-widest text-[#5a8f72]">
          Paso {step} de {STEPS}
        </p>
        <div className="flex gap-1">
          {Array.from({ length: STEPS }, (_, i) => (
            <span
              key={i}
              className={`h-1.5 w-8 rounded ${i + 1 <= step ? "bg-[#35664a]" : "bg-[#243d30]"}`}
            />
          ))}
        </div>
      </div>

      <form onSubmit={step === 4 ? onSubmit : (e) => e.preventDefault()}>
        {step === 1 ? (
          <div className="space-y-4">
            <h2 className="font-mono text-sm font-medium text-[#6a9c80]">Identidad del reto</h2>
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[10px] text-[#6a8c78]">Código (opcional, único)</span>
              <input
                name="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="rounded border border-[#243d30] bg-[#0d1512] px-3 py-2 font-mono text-sm text-[#e8f5ee]"
                placeholder="ej. WATER-2026"
                autoComplete="off"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[10px] text-[#6a8c78]">Título</span>
              <input
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="rounded border border-[#243d30] bg-[#0d1512] px-3 py-2 text-sm text-[#e8f5ee]"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[10px] text-[#6a8c78]">Descripción</span>
              <textarea
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="rounded border border-[#243d30] bg-[#0d1512] px-3 py-2 text-sm text-[#e8f5ee]"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[10px] text-[#6a8c78]">Tipo</span>
              <select
                name="type"
                value={type}
                onChange={(e) => setType(e.target.value as ChallengeType)}
                className="rounded border border-[#243d30] bg-[#0d1512] px-3 py-2 text-sm text-[#e8f5ee]"
              >
                {(Object.keys(TYPE_LABELS) as ChallengeType[]).map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
              {type === ChallengeType.WATER_BILL ? (
                <p className="text-[12px] leading-relaxed text-[#5a8f72]">
                  En el paso <strong className="text-[#7aab8c]">2 · Ventana y puntos</strong> podrás fijar la meta de
                  consumo óptimo (m³/persona/mes) según tu contexto.
                </p>
              ) : null}
            </label>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <h2 className="font-mono text-sm font-medium text-[#6a9c80]">Ventana y puntos</h2>
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[10px] text-[#6a8c78]">Inicio</span>
              <input
                type="date"
                name="startsAt"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
                className="rounded border border-[#243d30] bg-[#0d1512] px-3 py-2 font-mono text-sm text-[#e8f5ee]"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[10px] text-[#6a8c78]">Fin</span>
              <input
                type="date"
                name="endsAt"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                required
                className="rounded border border-[#243d30] bg-[#0d1512] px-3 py-2 font-mono text-sm text-[#e8f5ee]"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[10px] text-[#6a8c78]">
                {type === ChallengeType.TRIVIA ? "Puntos por respuesta correcta" : "Puntos base"}
              </span>
              <input
                type="number"
                name="basePoints"
                min={0}
                value={basePoints}
                onChange={(e) => setBasePoints(e.target.value)}
                className="rounded border border-[#243d30] bg-[#0d1512] px-3 py-2 font-mono text-sm text-[#e8f5ee]"
              />
              {type === ChallengeType.TRIVIA ? (
                <span className="text-[11px] text-[#5a8f72]">
                  Se suman por cada pregunta acertada cuando el módulo de juego esté activo.
                </span>
              ) : null}
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="rounded border-[#243d30]"
              />
              <span className="text-sm text-[#c8e6d4]">Reto activo (visible según fechas)</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={platformManaged}
                onChange={(e) => setPlatformManaged(e.target.checked)}
                className="rounded border-[#243d30]"
              />
              <span className="text-sm text-[#c8e6d4]">En plataforma (jugable en tablero)</span>
            </label>

            {type === ChallengeType.WATER_BILL ? (
              <div className="space-y-3 border-t border-[#243d30] pt-4">
                <h3 className="font-mono text-[11px] font-medium uppercase tracking-wider text-[#5a8f72]">
                  Consumo óptimo (reto agua)
                </h3>
                <p className="text-[12px] leading-relaxed text-[#6a8c78]">
                  Define la meta de <strong className="text-[#8fd4a8]">m³ por persona y mes</strong> que cuenta
                  como consumo orientativo en esta campaña. No es fijo en 12: depende de la ciudad o referencia
                  local (por ejemplo Bogotá suele usar alrededor de{" "}
                  <span className="font-mono text-[#9ed4b4]">11</span> m³/p).
                </p>
                <label className="flex flex-col gap-1">
                  <span className="font-mono text-[10px] text-[#6a8c78]">
                    Meta m³/persona/mes (consumo óptimo)
                  </span>
                  <input
                    type="number"
                    name="optimalPerCapitaM3"
                    step="0.1"
                    min="0.1"
                    max="500"
                    placeholder="ej. 11"
                    value={optimalPerCapitaM3}
                    onChange={(e) => setOptimalPerCapitaM3(e.target.value)}
                    className="rounded border border-[#243d30] bg-[#0d1512] px-3 py-2 font-mono text-sm text-[#e8f5ee]"
                  />
                  <span className="text-[11px] text-[#5a8f72]">
                    Valor por defecto al crear: 12 si no cambias el campo; ajusta según tu contexto.
                  </span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={requiresEvidence}
                    onChange={(e) => setRequiresEvidence(e.target.checked)}
                  />
                  <span className="text-sm text-[#c8e6d4]">Exigir foto del recibo</span>
                </label>
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <h2 className="font-mono text-sm font-medium text-[#6a9c80]">
              {type === ChallengeType.TRIVIA
                ? "Preguntas de la trivia"
                : type === ChallengeType.WATER_BILL
                  ? "Siguiente paso"
                  : "Opciones avanzadas"}
            </h2>
            {type === ChallengeType.WATER_BILL ? (
              <p className="text-sm leading-relaxed text-[#7aab8c]">
                La meta de consumo ({optimalPerCapitaM3} m³/p) y la evidencia fotográfica ya quedaron en el paso
                anterior. Continúa al resumen para crear el reto.
              </p>
            ) : type === ChallengeType.TRIVIA ? (
              <TriviaQuestionsEditor value={trivia} onChange={setTrivia} />
            ) : (
              <>
                <label className="flex flex-col gap-1">
                  <span className="font-mono text-[10px] text-[#6a8c78]">Early bird — fin (opcional)</span>
                  <input
                    type="date"
                    name="earlyBirdEndsAt"
                    value={earlyBirdEndsAt}
                    onChange={(e) => setEarlyBirdEndsAt(e.target.value)}
                    className="rounded border border-[#243d30] bg-[#0d1512] px-3 py-2 font-mono text-sm text-[#e8f5ee]"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-mono text-[10px] text-[#6a8c78]">Plazas early bird (opcional)</span>
                  <input
                    type="number"
                    name="earlyBirdSlots"
                    min={0}
                    value={earlyBirdSlots}
                    onChange={(e) => setEarlyBirdSlots(e.target.value)}
                    className="rounded border border-[#243d30] bg-[#0d1512] px-3 py-2 font-mono text-sm text-[#e8f5ee]"
                  />
                </label>
              </>
            )}
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            <h2 className="font-mono text-sm font-medium text-[#6a9c80]">Resumen</h2>
            <dl className="space-y-2 rounded border border-[#243d30] bg-[#0d1512] p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-[#6a8c78]">Código</dt>
                <dd className="font-mono text-[#c8e6d4]">{code.trim() || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#6a8c78]">Título</dt>
                <dd className="text-right text-[#c8e6d4]">{title}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#6a8c78]">Tipo</dt>
                <dd className="font-mono text-xs text-[#8fd4a8]">{type}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#6a8c78]">Ventana</dt>
                <dd className="font-mono text-xs text-[#c8e6d4]">
                  {startsAt} → {endsAt}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#6a8c78]">
                  {type === ChallengeType.TRIVIA ? "Pts / acierto" : "Puntos base"}
                </dt>
                <dd className="font-mono">{basePoints}</dd>
              </div>
              {type === ChallengeType.TRIVIA ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-[#6a8c78]">Preguntas</dt>
                  <dd className="font-mono text-[#8fd4a8]">{trivia.length}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-4">
                <dt className="text-[#6a8c78]">Activo / plataforma</dt>
                <dd>
                  {active ? "Sí" : "No"} / {platformManaged ? "Sí" : "Solo importación"}
                </dd>
              </div>
              {type === ChallengeType.WATER_BILL ? (
                <>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#6a8c78]">Meta m³/p</dt>
                    <dd className="font-mono">{optimalPerCapitaM3}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#6a8c78]">Evidencia</dt>
                    <dd>{requiresEvidence ? "Sí" : "No"}</dd>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#6a8c78]">Early bird</dt>
                    <dd className="font-mono text-xs">
                      {earlyBirdEndsAt || "—"} · {earlyBirdSlots || "—"} plazas
                    </dd>
                  </div>
                </>
              )}
            </dl>

            {isEdit ? <input type="hidden" name="challengeId" value={props.challengeId} /> : null}
            <input type="hidden" name="code" value={code} />
            <input type="hidden" name="title" value={title} />
            <input type="hidden" name="description" value={description} />
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="startsAt" value={startsAt} />
            <input type="hidden" name="endsAt" value={endsAt} />
            <input type="hidden" name="basePoints" value={basePoints} />
            <input type="hidden" name="active" value={active ? "true" : "false"} />
            <input type="hidden" name="platformManaged" value={platformManaged ? "true" : "false"} />
            <input type="hidden" name="optimalPerCapitaM3" value={optimalPerCapitaM3} />
            <input type="hidden" name="requiresEvidence" value={requiresEvidence ? "true" : "false"} />
            <input type="hidden" name="earlyBirdEndsAt" value={earlyBirdEndsAt} />
            <input type="hidden" name="earlyBirdSlots" value={earlyBirdSlots} />
            {type === ChallengeType.TRIVIA ? (
              <input
                type="hidden"
                name="triviaPayload"
                value={JSON.stringify({
                  questions: trivia.map((q) => ({
                    prompt: q.prompt,
                    answers: q.answers,
                    correctIndex: q.correctIndex,
                  })),
                })}
              />
            ) : null}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded border border-[#2a4034] bg-gradient-to-b from-[#1e4d35] to-[#142a1f] px-4 py-3 font-mono text-sm font-medium text-[#e8f5ee] shadow-[0_3px_0_#050807] hover:brightness-110 disabled:opacity-50"
            >
              {pending ? pendingLabel : submitLabel}
            </button>
          </div>
        ) : null}

        {step < 4 ? (
          <div className="mt-6 flex flex-wrap justify-between gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="rounded border border-[#243d30] bg-[#0d1512] px-4 py-2 font-mono text-xs text-[#7aab8c] hover:border-[#35664a]"
              >
                Atrás
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              disabled={!canGoNext()}
              onClick={() => canGoNext() && setStep((s) => Math.min(STEPS, s + 1))}
              className="rounded border border-[#35664a] bg-[#142018] px-4 py-2 font-mono text-xs text-[#b8f0cc] hover:brightness-110 disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        ) : (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="rounded border border-[#243d30] bg-[#0d1512] px-4 py-2 font-mono text-xs text-[#7aab8c] hover:border-[#35664a]"
            >
              Atrás
            </button>
          </div>
        )}
      </form>

      <p className="text-center text-xs text-[#4d7a62]">
        <Link href={cancelHref} className="text-[#7aab8c] underline-offset-2 hover:underline">
          {isEdit ? "Cancelar y volver al detalle" : "Cancelar y volver a retos"}
        </Link>
      </p>
    </div>
  );
}
