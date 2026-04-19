import {
  createContactChannelAction,
  createWaterTipAction,
  deleteContactChannelAction,
  deleteWaterTipAction,
  updateContactChannelAction,
  updateWaterTipAction,
} from "./actions";
import { listContactChannelsPublic, listWaterTipsPublic } from "@/lib/services/herramientas/queries";

const inputClass =
  "w-full rounded border border-[#243d30] bg-[#0d1512] px-2 py-1.5 font-mono text-sm text-[#e8f5ee]";
const btnPrimary =
  "rounded border border-[#35664a] bg-[#142018] px-3 py-1.5 font-mono text-xs text-[#b8f0cc] hover:border-[#4a8060]";
const btnDanger =
  "rounded border border-[#6a3030] bg-[#1a1010] px-2 py-1 font-mono text-[10px] text-[#f0b4b4] hover:border-[#8a4040]";

export default async function AdminHerramientasContenidoPage() {
  const [tips, channels] = await Promise.all([listWaterTipsPublic(), listContactChannelsPublic()]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-[#e8f5ee]">Herramientas del tablero · contenido</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#7aab8c]">
          Edita los <strong className="text-[#c8e6d4]">tips de agua</strong> y los{" "}
          <strong className="text-[#c8e6d4]">canales de contacto</strong> que ven los empleados en el tablero (
          <span className="font-mono text-[#8fd4a8]">/tablero/herramientas/…</span>). El directorio de acopio se
          alimenta al aprobar lugares documentados.
        </p>
      </div>

      <section className="rounded-lg border border-[#1f3328] bg-[#111916] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <h2 className="font-mono text-[11px] font-medium uppercase tracking-widest text-[#6a9c80]">
          Tips de agua
        </h2>
        <form action={createWaterTipAction} className="mt-4 flex max-w-2xl flex-col gap-2">
          <label className="font-mono text-[10px] text-[#5a8f72]">Nuevo tip</label>
          <textarea name="body" rows={3} className={inputClass} placeholder="Texto del consejo…" required />
          <button type="submit" className={`w-fit ${btnPrimary}`}>
            Añadir tip
          </button>
        </form>

        <ul className="mt-6 space-y-4">
          {tips.length === 0 ? (
            <li className="font-mono text-sm text-[#6a8c78]">No hay tips aún.</li>
          ) : (
            tips.map((t) => (
              <li
                key={t.id}
                className="border-t border-[#243d30] pt-4 first:border-t-0 first:pt-0"
              >
                <form action={updateWaterTipAction} className="flex max-w-2xl flex-col gap-2">
                  <input type="hidden" name="id" value={t.id} />
                  <textarea name="body" rows={3} defaultValue={t.body} className={inputClass} required />
                  <div className="flex flex-wrap gap-2">
                    <button type="submit" className={btnPrimary}>
                      Guardar
                    </button>
                  </div>
                </form>
                <form action={deleteWaterTipAction} className="mt-2">
                  <input type="hidden" name="id" value={t.id} />
                  <button type="submit" className={btnDanger}>
                    Eliminar
                  </button>
                </form>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-lg border border-[#1f3328] bg-[#111916] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <h2 className="font-mono text-[11px] font-medium uppercase tracking-widest text-[#6a9c80]">
          Canales de contacto
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[#6a8c78]">
          En <span className="font-mono">Valor</span> puedes usar URL (<span className="font-mono">https://…</span>
          ), <span className="font-mono">mailto:correo@…</span> o un teléfono (se enlazará como{" "}
          <span className="font-mono">tel:</span>).
        </p>
        <form action={createContactChannelAction} className="mt-4 flex max-w-2xl flex-col gap-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="font-mono text-[10px] text-[#5a8f72]">Etiqueta</label>
              <input name="label" className={inputClass} placeholder="Ej. Sostenibilidad" required />
            </div>
            <div>
              <label className="font-mono text-[10px] text-[#5a8f72]">Valor</label>
              <input name="value" className={inputClass} placeholder="mailto:… o https://…" required />
            </div>
          </div>
          <button type="submit" className={`w-fit ${btnPrimary}`}>
            Añadir canal
          </button>
        </form>

        <ul className="mt-6 space-y-4">
          {channels.length === 0 ? (
            <li className="font-mono text-sm text-[#6a8c78]">No hay canales aún.</li>
          ) : (
            channels.map((c) => (
              <li
                key={c.id}
                className="border-t border-[#243d30] pt-4 first:border-t-0 first:pt-0"
              >
                <form action={updateContactChannelAction} className="flex max-w-2xl flex-col gap-2">
                  <input type="hidden" name="id" value={c.id} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <label className="font-mono text-[10px] text-[#5a8f72]">Etiqueta</label>
                      <input name="label" defaultValue={c.label} className={inputClass} required />
                    </div>
                    <div>
                      <label className="font-mono text-[10px] text-[#5a8f72]">Valor</label>
                      <input name="value" defaultValue={c.value} className={inputClass} required />
                    </div>
                  </div>
                  <button type="submit" className={`w-fit ${btnPrimary}`}>
                    Guardar
                  </button>
                </form>
                <form action={deleteContactChannelAction} className="mt-2">
                  <input type="hidden" name="id" value={c.id} />
                  <button type="submit" className={btnDanger}>
                    Eliminar
                  </button>
                </form>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
