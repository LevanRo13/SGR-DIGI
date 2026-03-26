import type { ProcessState } from '../../types';
import { STATE_STYLES } from '../../constants/styles';

interface StatusBadgeProps {
  status: ProcessState;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styleClass = STATE_STYLES[status] || 'bg-slate-100 text-slate-700';

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styleClass}`}>
      {status}
    </span>
  );
}
