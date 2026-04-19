import Link from "next/link";

type Props = {
  title: string;
  subtitle?: string;
};

export function HerramientasNav({ title, subtitle }: Props) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3 border-b-4 border-[#1e3a5f] pb-4">
      <div>
        <Link
          href="/tablero"
          className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#2563eb] underline-offset-2 hover:underline"
        >
          ← Volver al tablero
        </Link>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-[#132238] md:text-2xl">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-2xl text-sm text-[#3d5670]">{subtitle}</p> : null}
      </div>
    </header>
  );
}
