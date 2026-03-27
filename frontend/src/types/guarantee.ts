// Tipos para el sistema de avales (SGR-DIGI)

export interface Company {
  businessName: string;
  cuit: string;
  address?: string;
  activity?: string;
}

export interface Document {
  type: string;
  number: string;
  date: string;
  amount: number;
  issuer?: string;
}

export interface AvalCalculation {
  baseValue: number;
  riskFactor: number;
  multiplier: number;
  finalAval: number;
}

export interface BlockchainData {
  network: 'Stellar Testnet' | 'Stellar Mainnet';
  hash: string;
  timestamp?: string;
}

export interface GuaranteeData {
  company: Company;
  document: Document;
  calculation: AvalCalculation;
  blockchain: BlockchainData;
  uploadedFile?: File;
}

export interface EmissionResult {
  success: boolean;
  transactionId?: string;
  explorerUrl?: string;
  error?: string;
}
