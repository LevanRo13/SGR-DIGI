// Estado styles siguiendo el patrón del dashboard demo
export const STATE_STYLES: Record<string, string> = {
  'Document Uploaded': 'bg-slate-100 text-slate-700',
  'AI Processing': 'bg-blue-100 text-blue-700',
  'Human Validation': 'bg-amber-100 text-amber-700',
  'Registered On-Chain': 'bg-violet-100 text-violet-700',
  'Certificate Issued': 'bg-emerald-100 text-emerald-700',
} as const;

export const WORKFLOW_STEPS = [
  'Upload docs',
  'AI extraction',
  'Human review',
  'On-chain hash',
  'Certificate',
] as const;

export const NAVIGATION_ITEMS = [
  'Dashboard',
  'New Guarantee',
  'Processes',
  'Certificates',
  'Marketplace',
  'Blockchain Explorer',
  'Companies',
  'Settings',
] as const;
