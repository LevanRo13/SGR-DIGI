import type { Process } from '../../types';
import { StatusBadge } from '../ui';

interface ProcessTableProps {
  processes: Process[];
  onViewAll?: () => void;
  onViewProcess?: (id: string) => void;
}

export function ProcessTable({ processes, onViewAll, onViewProcess }: ProcessTableProps) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Processes in progress</h2>
          <p className="text-sm text-slate-500">
            Current workflows across upload, validation, and blockchain registration.
          </p>
        </div>
        <button
          onClick={onViewAll}
          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          View all
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-slate-500">Company</th>
              <th className="px-6 py-3 text-left font-medium text-slate-500">Amount</th>
              <th className="px-6 py-3 text-left font-medium text-slate-500">Status</th>
              <th className="px-6 py-3 text-left font-medium text-slate-500">Date</th>
              <th className="px-6 py-3 text-left font-medium text-slate-500">Progress</th>
              <th className="px-6 py-3 text-right font-medium text-slate-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {processes.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/70">
                <td className="px-6 py-4 font-medium text-slate-900">{row.company}</td>
                <td className="px-6 py-4 text-slate-700">{row.amount}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={row.state} />
                </td>
                <td className="px-6 py-4 text-slate-600">{row.date}</td>
                <td className="px-6 py-4">
                  <div className="h-2 w-28 rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-blue-600"
                      style={{ width: `${row.progress}%` }}
                    />
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => onViewProcess?.(row.id)}
                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
