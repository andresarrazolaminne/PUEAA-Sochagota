import { ChallengeType } from "@/generated/prisma/enums";

const MAP: Record<string, ChallengeType> = {
  other: ChallengeType.OTHER,
  otro: ChallengeType.OTHER,
  trivia: ChallengeType.TRIVIA,
  minigame: ChallengeType.MINIGAME,
  mini_juego: ChallengeType.MINIGAME,
  water_bill: ChallengeType.WATER_BILL,
  recibo_agua: ChallengeType.WATER_BILL,
  waste_evidence: ChallengeType.WASTE_EVIDENCE,
  evidencia: ChallengeType.WASTE_EVIDENCE,
  acopio: ChallengeType.WASTE_EVIDENCE,
  place_documentation: ChallengeType.PLACE_DOCUMENTATION,
  lugares: ChallengeType.PLACE_DOCUMENTATION,
  directorio: ChallengeType.PLACE_DOCUMENTATION,
};

export function parseChallengeType(raw: string): ChallengeType | null {
  const k = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_");
  return MAP[k] ?? null;
}
