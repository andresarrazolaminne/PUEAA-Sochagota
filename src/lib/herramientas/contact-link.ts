/** Devuelve href si el valor es claramente un enlace; si parece teléfono, `tel:`; si no, null (mostrar como texto). */
export function contactChannelHref(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  const lower = v.toLowerCase();
  if (lower.startsWith("mailto:") || lower.startsWith("http://") || lower.startsWith("https://")) {
    return v;
  }
  const digits = v.replace(/\D/g, "");
  if (digits.length >= 7 && /^[\d\s+().\-]+$/.test(v)) {
    return `tel:${digits}`;
  }
  return null;
}
