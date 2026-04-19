import {
  importChallengesExcelAction,
  importEmployeesExcelAction,
  importScoresExcelAction,
} from "./actions";
import { ExcelImportBlock } from "./ExcelImportBlock";

export default function AdminImportacionesPage() {
  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-[#1f3328] bg-[#111916] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <h1 className="text-lg font-semibold text-[#e8f5ee]">Importación desde Excel</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#7aab8c]">
          Usa la primera hoja del libro con encabezados en la fila 1. Las columnas admiten varios nombres
          (ver plantillas). Los puntajes por reto actualizan el ledger: volver a importar la misma fila
          sustituye el movimiento anterior de ese empleado en ese reto.
        </p>
      </div>

      <ExcelImportBlock
        title="Empleados"
        description="Columnas: cédula, nombre completo, rol (USER o ADMIN, opcional), activo (sí/no, opcional). Crea o actualiza por cédula."
        templateHref="/api/import/plantilla/empleados"
        templateLabel="Descargar plantilla empleados.xlsx"
        importAction={importEmployeesExcelAction}
      />

      <ExcelImportBlock
        title="Retos"
        description="Columnas: codigo (único), titulo, descripcion, tipo (OTHER, TRIVIA, …), inicio, fin, puntos_base, activo, fuera_plataforma (sí = solo puntajes/importación, no aparece como reto jugable en el tablero)."
        templateHref="/api/import/plantilla/retos"
        templateLabel="Descargar plantilla retos.xlsx"
        importAction={importChallengesExcelAction}
      />

      <ExcelImportBlock
        title="Puntajes por empleado y reto"
        description="Requiere empleados y retos ya existentes (mismo código de reto que en la importación de retos). Columnas: cédula, codigo_reto, puntos, nota (opcional, aparece en el motivo del ledger)."
        templateHref="/api/import/plantilla/puntajes"
        templateLabel="Descargar plantilla puntajes.xlsx"
        importAction={importScoresExcelAction}
      />
    </div>
  );
}
