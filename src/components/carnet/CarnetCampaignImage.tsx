import Image from "next/image";
import { withBasePathIfNeeded } from "@/lib/base-path";

type Props = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

/** `/public` con next/image; `/api/...` (incl. legacy `/pueaa/api/...`) y URLs externas con img. */
export function CarnetCampaignImage({ src, alt, className, sizes, priority }: Props) {
  const resolved = withBasePathIfNeeded(src);
  const local =
    resolved.startsWith("/") &&
    !resolved.startsWith("/api/") &&
    !resolved.startsWith("http://") &&
    !resolved.startsWith("https://");
  const baseClass =
    "max-h-full max-w-full object-contain [image-rendering:pixelated]" +
    (className ? ` ${className}` : "");

  if (local) {
    return (
      <Image
        src={resolved}
        alt={alt}
        width={200}
        height={200}
        className={baseClass}
        sizes={sizes ?? "(max-width: 640px) 144px, 176px"}
        priority={priority}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- URL configurable por admin (API/externa)
    <img src={resolved} alt={alt} className={baseClass} />
  );
}
