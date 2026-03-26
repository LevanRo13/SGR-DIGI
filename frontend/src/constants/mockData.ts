import type { KPI, Process, Certificate, ActivityLogEntry } from '../types';

export const mockKpis: KPI[] = [
  { label: 'Guarantees Issued', value: '24', hint: 'this month' },
  { label: 'Guaranteed Volume', value: '$2.4M', hint: 'active + issued' },
  { label: 'Avg. Issuance Time', value: '18 min', hint: 'from upload to certificate' },
  { label: 'Active Processes', value: '6', hint: 'awaiting next step' },
];

export const mockProcesses: Process[] = [
  {
    id: 'proc-1',
    company: 'AgroSur Export',
    amount: '$120,000',
    state: 'AI Processing',
    date: 'Today · 11:32',
    progress: 40,
  },
  {
    id: 'proc-2',
    company: 'Metalúrgica SRL',
    amount: '$80,000',
    state: 'Human Validation',
    date: 'Yesterday · 16:18',
    progress: 70,
  },
  {
    id: 'proc-3',
    company: 'Patagonia Foods',
    amount: '$200,000',
    state: 'Registered On-Chain',
    date: '12 Mar · 09:41',
    progress: 90,
  },
];

export const mockCertificates: Certificate[] = [
  {
    id: 'cert-1',
    company: 'AgroSur Export',
    amount: '$120,000',
    issuedAt: '12 Mar 2026',
    hash: '8F3A...92K',
    network: 'Stellar Testnet',
  },
  {
    id: 'cert-2',
    company: 'Patagonia Foods',
    amount: '$200,000',
    issuedAt: '10 Mar 2026',
    hash: 'A11C...7FD',
    network: 'Stellar Testnet',
  },
];

export const mockLogs: ActivityLogEntry[] = [
  { id: 'log-1', message: '12:03 — Hash registered on Stellar Testnet', type: 'blockchain' },
  { id: 'log-2', message: '11:58 — Human validation approved', type: 'validation' },
  { id: 'log-3', message: '11:40 — AI data extraction completed', type: 'extraction' },
  { id: 'log-4', message: '11:32 — Documentation uploaded', type: 'upload' },
];
