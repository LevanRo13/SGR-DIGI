import type { KPI, Process, Certificate, ActivityLogEntry } from '../types';

export const mockKpis: KPI[] = [
  { label: 'Garantías Emitidas', value: '24', hint: 'este mes' },
  { label: 'Volumen Avalado', value: '$2.4M', hint: 'activos + emitidos' },
  { label: 'Tiempo Prom. Emisión', value: '18 min', hint: 'desde carga hasta certificado' },
  { label: 'Procesos Activos', value: '6', hint: 'en espera de siguiente paso' },
];

export const mockProcesses: Process[] = [
  {
    id: 'proc-1',
    company: 'AgroSur Export',
    amount: '$120.000',
    state: 'Procesamiento IA',
    date: 'Hoy · 11:32',
    progress: 40,
  },
  {
    id: 'proc-2',
    company: 'Metalúrgica SRL',
    amount: '$80.000',
    state: 'Validación Humana',
    date: 'Ayer · 16:18',
    progress: 70,
  },
  {
    id: 'proc-3',
    company: 'Patagonia Foods',
    amount: '$200.000',
    state: 'Registrado On-Chain',
    date: '12 Mar · 09:41',
    progress: 90,
  },
];

export const mockCertificates: Certificate[] = [
  {
    id: 'cert-1',
    company: 'AgroSur Export',
    amount: '$120.000',
    issuedAt: '12 Mar 2026',
    hash: '8F3A...92K',
    network: 'Stellar Testnet',
  },
  {
    id: 'cert-2',
    company: 'Patagonia Foods',
    amount: '$200.000',
    issuedAt: '10 Mar 2026',
    hash: 'A11C...7FD',
    network: 'Stellar Testnet',
  },
];

export const mockLogs: ActivityLogEntry[] = [
  { id: 'log-1', message: '12:03 — Hash registrado en Stellar Testnet', type: 'blockchain' },
  { id: 'log-2', message: '11:58 — Validación humana aprobada', type: 'validation' },
  { id: 'log-3', message: '11:40 — Extracción de datos IA completada', type: 'extraction' },
  { id: 'log-4', message: '11:32 — Documentación cargada', type: 'upload' },
];
