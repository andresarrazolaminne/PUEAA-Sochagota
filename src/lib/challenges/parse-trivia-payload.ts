/** Estructura enviada desde el asistente (JSON en campo oculto). */
export type TriviaQuestionParsed = {
  prompt: string;
  answers: string[];
  correctIndex: number;
};

const MIN_ANSWERS = 2;
const MAX_ANSWERS = 8;

export function parseTriviaPayload(raw: unknown): { ok: true; questions: TriviaQuestionParsed[] } | { ok: false; message: string } {
  if (raw == null || (typeof raw === "string" && raw.trim() === "")) {
    return { ok: false, message: "Añade al menos una pregunta con respuestas para la trivia." };
  }

  let data: unknown;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw) as unknown;
    } catch {
      return { ok: false, message: "Datos de trivia no válidos (JSON)." };
    }
  } else {
    data = raw;
  }

  if (!data || typeof data !== "object" || !("questions" in data)) {
    return { ok: false, message: "Formato de trivia incorrecto." };
  }

  const questionsRaw = (data as { questions?: unknown }).questions;
  if (!Array.isArray(questionsRaw) || questionsRaw.length === 0) {
    return { ok: false, message: "La trivia debe tener al menos una pregunta." };
  }

  const questions: TriviaQuestionParsed[] = [];

  for (let qi = 0; qi < questionsRaw.length; qi++) {
    const q = questionsRaw[qi];
    if (!q || typeof q !== "object") {
      return { ok: false, message: `Pregunta ${qi + 1}: formato inválido.` };
    }
    const prompt = typeof (q as { prompt?: unknown }).prompt === "string" ? (q as { prompt: string }).prompt.trim() : "";
    if (!prompt) {
      return { ok: false, message: `Pregunta ${qi + 1}: el texto no puede estar vacío.` };
    }

    const answersRaw = (q as { answers?: unknown }).answers;
    if (!Array.isArray(answersRaw)) {
      return { ok: false, message: `Pregunta ${qi + 1}: faltan opciones de respuesta.` };
    }

    const answers: string[] = [];
    for (const a of answersRaw) {
      if (typeof a !== "string") {
        return { ok: false, message: `Pregunta ${qi + 1}: cada respuesta debe ser texto.` };
      }
      const t = a.trim();
      if (!t) {
        return { ok: false, message: `Pregunta ${qi + 1}: ninguna respuesta puede estar vacía.` };
      }
      answers.push(t);
    }

    if (answers.length < MIN_ANSWERS || answers.length > MAX_ANSWERS) {
      return {
        ok: false,
        message: `Pregunta ${qi + 1}: indica entre ${MIN_ANSWERS} y ${MAX_ANSWERS} respuestas.`,
      };
    }

    const correctRaw = (q as { correctIndex?: unknown }).correctIndex;
    const correctIndex =
      typeof correctRaw === "number" && Number.isInteger(correctRaw) ? correctRaw : Number.NaN;
    if (!Number.isFinite(correctIndex) || correctIndex < 0 || correctIndex >= answers.length) {
      return { ok: false, message: `Pregunta ${qi + 1}: marca cuál respuesta es la correcta.` };
    }

    questions.push({ prompt, answers, correctIndex });
  }

  return { ok: true, questions };
}
