import * as XLSX from "xlsx";
import { NextResponse } from "next/server";

const FILES: Record<
  string,
  { filename: string; sheet: string; rows: (string | number)[][] }
> = {
  empleados: {
    filename: "plantilla-empleados.xlsx",
    sheet: "empleados",
    rows: [
      ["cedula", "nombre_completo", "rol", "activo"],
      [1234567890, "Nombre Ejemplo", "USER", "si"],
    ],
  },
  retos: {
    filename: "plantilla-retos.xlsx",
    sheet: "retos",
    rows: [
      ["codigo", "titulo", "descripcion", "tipo", "inicio", "fin", "puntos_base", "activo", "fuera_plataforma"],
      [
        "RETO-EJEMPLO-1",
        "Reto demostración",
        "Texto opcional",
        "OTHER",
        "2025-01-01",
        "2026-12-31",
        50,
        "si",
        "no",
      ],
    ],
  },
  puntajes: {
    filename: "plantilla-puntajes.xlsx",
    sheet: "puntajes",
    rows: [
      ["cedula", "codigo_reto", "puntos", "nota"],
      [1234567890, "RETO-EJEMPLO-1", 25, "Importación inicial"],
    ],
  },
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ kind: string }> },
) {
  const { kind } = await context.params;
  const spec = FILES[kind];
  if (!spec) {
    return new NextResponse("Not found", { status: 404 });
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(spec.rows);
  XLSX.utils.book_append_sheet(wb, ws, spec.sheet);
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${spec.filename}"`,
    },
  });
}
