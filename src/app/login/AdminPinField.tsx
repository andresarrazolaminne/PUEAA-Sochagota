"use client";

import { useState } from "react";

/** Campo PIN opcional: oculto por defecto para no confundir a empleados. */
export function AdminPinField() {
  const [show, setShow] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="self-start font-mono text-[10px] uppercase tracking-widest text-[#5b7cb8] underline-offset-2 hover:underline"
      >
        {show ? "Ocultar acceso admin" : "Soy administrador"}
      </button>
      {show ? (
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#3d5670]">
            PIN admin
          </span>
          <input
            name="adminPin"
            type="password"
            autoComplete="current-password"
            placeholder="PIN de administrador"
            className="rounded-lg border-2 border-[#1e3a5f] bg-white px-3 py-2.5 font-mono text-[#132238] shadow-[inset_0_2px_4px_rgba(30,58,95,0.08)] outline-none placeholder:text-[#6b8cb8] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/30"
          />
        </label>
      ) : null}
    </div>
  );
}
