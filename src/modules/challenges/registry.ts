import { ChallengeType } from "@/generated/prisma/enums";

/**
 * Ruta jugable en el tablero: módulo específico (agua) o ficha genérica del reto.
 * Siempre devuelve una URL para poder abrir la tarjeta sin mostrar "próximamente".
 */
export function challengePlayerModulePath(type: ChallengeType, challengeId: string): string {
  switch (type) {
    case ChallengeType.WATER_BILL:
      return `/tablero/retos/${challengeId}/water`;
    case ChallengeType.WASTE_EVIDENCE:
      return `/tablero/retos/${challengeId}/waste`;
    case ChallengeType.PLACE_DOCUMENTATION:
      return `/tablero/retos/${challengeId}/places`;
    case ChallengeType.TRIVIA:
      return `/tablero/retos/${challengeId}/trivia`;
    default:
      return `/tablero/retos/${challengeId}`;
  }
}

/** Detalle de gestión en admin (común a todos los retos). */
export function challengeAdminBasePath(challengeId: string): string {
  return `/admin/retos/${challengeId}`;
}

/** Cola de revisión (aprobación / rechazo de envíos de jugadores). */
export function challengeAdminRevisionPath(challengeId: string): string {
  return `/admin/retos/${challengeId}/revision`;
}

/** Si el tipo incluye panel extra en la página de detalle admin (p. ej. periodos de agua). */
export function challengeTypeHasAdminModuleExtension(type: ChallengeType): boolean {
  switch (type) {
    case ChallengeType.WATER_BILL:
    case ChallengeType.WASTE_EVIDENCE:
    case ChallengeType.PLACE_DOCUMENTATION:
    case ChallengeType.TRIVIA:
      return true;
    default:
      return false;
  }
}
