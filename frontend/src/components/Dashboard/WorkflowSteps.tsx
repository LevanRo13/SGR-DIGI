import { WORKFLOW_STEPS } from '../../constants/styles';

export function WorkflowSteps() {
  return (
    <div className="grid min-w-[280px] gap-3 rounded-3xl bg-slate-50 p-4 sm:grid-cols-2 lg:w-[440px] lg:grid-cols-1 xl:grid-cols-5">
      {WORKFLOW_STEPS.map((step, idx) => (
        <div
          key={step}
          className="flex items-center gap-3 rounded-2xl bg-white px-3 py-3 ring-1 ring-slate-200 xl:flex-col xl:items-start"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
            {idx + 1}
          </div>
          <div className="text-sm font-medium leading-5">{step}</div>
        </div>
      ))}
    </div>
  );
}
