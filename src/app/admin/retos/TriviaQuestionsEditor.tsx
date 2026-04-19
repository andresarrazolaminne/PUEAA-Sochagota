"use client";

import type { TriviaQuestionDraft } from "@/lib/services/challenges/trivia";

const MIN_ANSWERS = 2;
const MAX_ANSWERS = 8;

type Props = {
  value: TriviaQuestionDraft[];
  onChange: (next: TriviaQuestionDraft[]) => void;
};

function clampCorrectIndex(answers: string[], prevIndex: number): number {
  if (answers.length === 0) return 0;
  if (prevIndex < 0) return 0;
  if (prevIndex >= answers.length) return answers.length - 1;
  return prevIndex;
}

export function TriviaQuestionsEditor({ value, onChange }: Props) {
  function updateQuestion(index: number, patch: Partial<TriviaQuestionDraft>) {
    const next = value.map((q, i) => (i === index ? { ...q, ...patch } : q));
    onChange(next);
  }

  function addQuestion() {
    onChange([...value, { prompt: "", answers: ["", ""], correctIndex: 0 }]);
  }

  function removeQuestion(index: number) {
    if (value.length <= 1) return;
    onChange(value.filter((_, i) => i !== index));
  }

  function setAnswer(qIndex: number, aIndex: number, text: string) {
    const q = value[qIndex];
    const answers = q.answers.map((a, i) => (i === aIndex ? text : a));
    updateQuestion(qIndex, {
      answers,
      correctIndex: clampCorrectIndex(answers, q.correctIndex),
    });
  }

  function addAnswer(qIndex: number) {
    const q = value[qIndex];
    if (q.answers.length >= MAX_ANSWERS) return;
    const answers = [...q.answers, ""];
    updateQuestion(qIndex, { answers, correctIndex: q.correctIndex });
  }

  function removeAnswer(qIndex: number, aIndex: number) {
    const q = value[qIndex];
    if (q.answers.length <= MIN_ANSWERS) return;
    const answers = q.answers.filter((_, i) => i !== aIndex);
    let correctIndex = q.correctIndex;
    if (aIndex === correctIndex) correctIndex = 0;
    else if (aIndex < correctIndex) correctIndex -= 1;
    correctIndex = clampCorrectIndex(answers, correctIndex);
    updateQuestion(qIndex, { answers, correctIndex });
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-[#7aab8c]">
        Cada pregunta puede tener entre {MIN_ANSWERS} y {MAX_ANSWERS} respuestas. Marca la opción correcta con el
        botón de radio.
      </p>

      {value.map((q, qi) => (
        <div
          key={qi}
          className="rounded-lg border border-[#2a4a38]/80 bg-[#0d1512]/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#5a8f72]">
              Pregunta {qi + 1}
            </span>
            {value.length > 1 ? (
              <button
                type="button"
                onClick={() => removeQuestion(qi)}
                className="rounded border border-[#4a3030] bg-[#1a1010] px-2 py-1 font-mono text-[10px] text-[#e8b4b4] hover:border-[#6a4040]"
              >
                Quitar pregunta
              </button>
            ) : null}
          </div>

          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] text-[#6a8c78]">Texto de la pregunta</span>
            <textarea
              value={q.prompt}
              onChange={(e) => updateQuestion(qi, { prompt: e.target.value })}
              rows={2}
              className="rounded border border-[#243d30] bg-[#0a120e] px-3 py-2 text-sm text-[#e8f5ee]"
              placeholder="Enunciado claro y sin ambigüedades…"
            />
          </label>

          <div className="mt-4 space-y-2">
            <span className="font-mono text-[10px] text-[#6a8c78]">Respuestas (elige la correcta)</span>
            {q.answers.map((label, ai) => (
              <div key={ai} className="flex flex-wrap items-center gap-2">
                <label className="flex shrink-0 cursor-pointer items-center gap-1.5 font-mono text-[10px] text-[#8fd4a8]">
                  <input
                    type="radio"
                    name={`trivia-correct-${qi}`}
                    checked={q.correctIndex === ai}
                    onChange={() => updateQuestion(qi, { correctIndex: ai })}
                    className="border-[#35664a]"
                  />
                  OK
                </label>
                <input
                  value={label}
                  onChange={(e) => setAnswer(qi, ai, e.target.value)}
                  className="min-w-0 flex-1 rounded border border-[#243d30] bg-[#0a120e] px-3 py-2 text-sm text-[#e8f5ee]"
                  placeholder={`Opción ${ai + 1}`}
                />
                {q.answers.length > MIN_ANSWERS ? (
                  <button
                    type="button"
                    onClick={() => removeAnswer(qi, ai)}
                    className="shrink-0 rounded border border-[#243d30] px-2 py-1 font-mono text-[10px] text-[#7aab8c] hover:border-[#4a3030] hover:text-[#f0b4b4]"
                  >
                    ✕
                  </button>
                ) : null}
              </div>
            ))}
            {q.answers.length < MAX_ANSWERS ? (
              <button
                type="button"
                onClick={() => addAnswer(qi)}
                className="mt-1 rounded border border-[#243d30] bg-[#111916] px-3 py-1.5 font-mono text-[10px] text-[#8fd4a8] hover:border-[#35664a]"
              >
                + Añadir respuesta
              </button>
            ) : null}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addQuestion}
        className="w-full rounded-lg border border-dashed border-[#35664a] bg-[#0d1512] py-3 font-mono text-sm text-[#8fd4a8] hover:bg-[#142018]"
      >
        + Añadir otra pregunta
      </button>
    </div>
  );
}

export function isTriviaDraftValid(value: TriviaQuestionDraft[]): boolean {
  if (value.length === 0) return false;
  for (const q of value) {
    if (!q.prompt.trim()) return false;
    if (q.answers.length < MIN_ANSWERS || q.answers.length > MAX_ANSWERS) return false;
    if (!q.answers.every((a) => a.trim())) return false;
    if (q.correctIndex < 0 || q.correctIndex >= q.answers.length) return false;
  }
  return true;
}
