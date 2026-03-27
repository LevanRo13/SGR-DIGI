import Layout from '../components/Layout';
import {
  KPICard,
  ProcessTable,
  CertificateCard,
  WorkflowSteps,
  ActivityLog,
  NewGuaranteeWidget,
} from '../components/Dashboard';
import { mockProcesses, mockCertificates, mockLogs } from '../constants/mockData';
import { useGuarantee } from '../context/GuaranteeContext';
import type { KPI } from '../types';

export default function DashboardPage() {
  const {
    dynamicProcesses,
    dynamicCertificates,
    dynamicLogs,
    kpiOverrides,
  } = useGuarantee();

  // Merge dynamic data with mock data
  const allProcesses = [...dynamicProcesses, ...mockProcesses];
  const allCertificates = [...dynamicCertificates, ...mockCertificates];
  const allLogs = [...dynamicLogs, ...mockLogs];

  // Override KPI values with dynamic counts
  const computedKpis: KPI[] = [
    { label: 'Garantías Emitidas', value: String(kpiOverrides.guaranteesIssued), hint: 'este mes' },
    {
      label: 'Volumen en Adelantos',
      value: `$${(kpiOverrides.guaranteedVolume / 1000000).toFixed(1)}M`,
      hint: 'activos + emitidos',
    },
    { label: 'Tiempo Prom. Emisión', value: '18 min', hint: 'desde carga hasta certificado' },
    { label: 'Procesos Activos', value: String(kpiOverrides.activeProcesses), hint: 'en espera de siguiente paso' },
  ];

  return (
    <Layout>
      {/* KPIs Grid */}
      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {computedKpis.map((kpi) => (
          <KPICard key={kpi.label} kpi={kpi} />
        ))}
      </section>

      {/* Hero Section */}
      <section className="mb-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              Flujo de emisión acelerado
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Emití garantías digitales en minutos, no en semanas.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
              Cargá documentación, extraé datos estructurados con IA, validá manualmente y
              registrá evidencia verificable en Stellar Testnet.
            </p>
          </div>

          <WorkflowSteps />
        </div>
      </section>

      {/* Main content grid */}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Guided path notification for recently uploaded documents */}
          {dynamicProcesses.length > 0 && (
            <section className="rounded-[28px] border border-emerald-200 bg-gradient-to-r from-emerald-50 to-blue-50 p-5 shadow-sm animate-in">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Documento cargado y procesado exitosamente
                  </p>
                  <p className="text-xs text-slate-500">
                    Se registró la garantía en el historial del dashboard
                  </p>
                </div>
              </div>
              {/* Guided path steps */}
              <div className="flex items-center gap-1 mt-2">
                {[
                  { label: 'Documento cargado', done: true },
                  { label: 'Datos extraídos', done: true },
                  { label: 'Validación', done: true },
                  { label: 'Registrado on-chain', done: dynamicProcesses.some(p => p.progress === 100) },
                  { label: 'Token emitido', done: dynamicCertificates.length > 0 },
                ].map((step, idx, arr) => (
                  <div key={step.label} className="flex items-center gap-1">
                    <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      step.done
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {step.done ? (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="w-3 h-3 rounded-full border-2 border-slate-300" />
                      )}
                      {step.label}
                    </div>
                    {idx < arr.length - 1 && (
                      <div className={`w-4 h-0.5 ${step.done ? 'bg-emerald-300' : 'bg-slate-200'}`} />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <ProcessTable processes={allProcesses} />

          {/* Issued Certificates */}
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Certificados emitidos</h2>
                <p className="text-sm text-slate-500">
                  Garantías recientes con trazabilidad y verificación on-chain.
                </p>
              </div>
              <button className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Abrir explorador
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {allCertificates.map((cert) => (
                <CertificateCard key={cert.id} certificate={cert} />
              ))}
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <NewGuaranteeWidget />
          <ActivityLog entries={allLogs} />
        </div>
      </div>
    </Layout>
  );
}
