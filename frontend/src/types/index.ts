export interface KPI {
  label: string;
  value: string;
  hint: string;
}

export type ProcessState =
  | 'Documento Cargado'
  | 'Procesamiento IA'
  | 'Validación Humana'
  | 'Registrado On-Chain'
  | 'Certificado Emitido';

export interface Process {
  id: string;
  company: string;
  amount: string;
  state: ProcessState;
  date: string;
  progress: number;
}

export interface Certificate {
  id: string;
  company: string;
  amount: string;
  issuedAt: string;
  hash: string;
  network: string;
}

export interface ActivityLogEntry {
  id: string;
  message: string;
  type: 'blockchain' | 'validation' | 'extraction' | 'upload';
}
