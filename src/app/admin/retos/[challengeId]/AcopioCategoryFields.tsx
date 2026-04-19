import { AcopioCategoryFields as Shared } from "@/components/acopio/AcopioCategoryFields";
import type { AcopioCategory } from "@/generated/prisma/enums";

type Props = {
  /** Categorías que ya declaró el jugador (precarga al revisar). */
  defaultSelected?: AcopioCategory[];
};

export function AcopioCategoryFields({ defaultSelected }: Props) {
  return <Shared variant="admin" defaultSelected={defaultSelected} />;
}
