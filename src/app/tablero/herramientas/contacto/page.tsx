import Link from "next/link";
import { requireEmployee } from "@/lib/auth/require-employee";
import { Role } from "@/generated/prisma/enums";
import { contactChannelHref } from "@/lib/herramientas/contact-link";
import { listContactChannelsPublic } from "@/lib/services/herramientas/queries";
import { HerramientasNav } from "../HerramientasNav";

export default async function ContactoHerramientasPage() {
  const employee = await requireEmployee("/tablero/herramientas/contacto");
  const channels = await listContactChannelsPublic();

  return (
    <div className="flex min-h-0 flex-1 flex-col p-4 text-[#132238] md:p-6">
      <div className="game-panel-3d mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 rounded-2xl p-4 md:p-6">
        <HerramientasNav
          title="Contacto"
          subtitle="Canales para consultas sobre la campaña PUEAA y el tablero."
        />

        {channels.length === 0 ? (
          <div className="space-y-3 text-sm leading-relaxed text-[#5b7cb8]">
            <p>No hay canales de contacto configurados aún.</p>
            {employee.role === Role.ADMIN ? (
              <p>
                Configúralos en{" "}
                <Link href="/admin/herramientas-contenido" className="font-semibold text-[#2563eb] underline">
                  Administración → Herramientas (contenido)
                </Link>
                .
              </p>
            ) : (
              <p>Para ayuda, contacta a tu área de administración o recursos humanos.</p>
            )}
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {channels.map((c) => {
              const href = contactChannelHref(c.value);
              return (
                <li
                  key={c.id}
                  className="rounded-xl border-4 border-[#1e3a5f] bg-gradient-to-b from-white to-[#e8f2fa] px-4 py-3 shadow-[0_4px_0_#1e3a5f,inset_0_1px_0_rgba(255,255,255,0.85)]"
                >
                  <p className="font-mono text-[10px] uppercase tracking-wider text-[#2563eb]">{c.label}</p>
                  {href ? (
                    <a
                      href={href}
                      className="mt-1 inline-block break-all text-sm font-semibold text-[#1e40af] underline underline-offset-2"
                    >
                      {c.value.trim()}
                    </a>
                  ) : (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-[#3d5670]">{c.value}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
