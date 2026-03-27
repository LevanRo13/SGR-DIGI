import { Link } from 'react-router-dom';

export function NewGuaranteeWidget() {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Cargar documentos</h2>
          <p className="text-sm text-slate-500">Confirmar garantía vigente y generar adelanto.</p>
        </div>
        <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
          MVP
        </div>
      </div>

      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
        <div className="text-sm font-medium">
          Cargar documentación de exportación
        </div>
        <div className="mt-2 text-sm leading-6 text-slate-600">
          Suba los documentos que respaldan su garantía. La IA extraerá los datos clave,
          usted los confirma, y el sistema registra la evidencia en blockchain para generar
          su adelanto digital tokenizado.
        </div>
        <Link
          to="/guarantee"
          className="mt-5 block w-full rounded-2xl bg-blue-600 px-4 py-3 text-center text-sm font-medium text-white hover:bg-blue-700"
        >
          Cargar documentación
        </Link>
      </div>
    </section>
  );
}
