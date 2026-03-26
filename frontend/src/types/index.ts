export interface KPI {
  label: string;
  value: string;
  hint: string;
}

export type ProcessState =
  | 'Document Uploaded'
  | 'AI Processing'
  | 'Human Validation'
  | 'Registered On-Chain'
  | 'Certificate Issued';

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
