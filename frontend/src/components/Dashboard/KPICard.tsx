import type { KPI } from '../../types';

interface KPICardProps {
  kpi: KPI;
}

export function KPICard({ kpi }: KPICardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm text-slate-500">{kpi.label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight">{kpi.value}</div>
      <div className="mt-1 text-sm text-slate-500">{kpi.hint}</div>
    </div>
  );
}
