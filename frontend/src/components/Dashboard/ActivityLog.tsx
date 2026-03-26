import type { ActivityLogEntry } from '../../types';

interface ActivityLogProps {
  entries: ActivityLogEntry[];
}

const TYPE_COLORS: Record<ActivityLogEntry['type'], string> = {
  blockchain: 'bg-violet-600',
  validation: 'bg-amber-500',
  extraction: 'bg-blue-600',
  upload: 'bg-slate-400',
};

export function ActivityLog({ entries }: ActivityLogProps) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">Blockchain activity log</h2>
        <p className="text-sm text-slate-500">
          Transparent operational history with verifiable evidence.
        </p>
      </div>
      <div className="space-y-3">
        {entries.map((entry) => (
          <div key={entry.id} className="flex gap-3 rounded-2xl bg-slate-50 px-4 py-3">
            <div className={`mt-1 h-2.5 w-2.5 rounded-full ${TYPE_COLORS[entry.type]}`} />
            <div className="text-sm leading-6 text-slate-700">{entry.message}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
