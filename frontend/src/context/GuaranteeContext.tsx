import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { ExtractedData } from '../components/DataCorrectionForm';
import type { Process, Certificate, ActivityLogEntry } from '../types';

// Represents a completed guarantee emission
export interface CompletedGuarantee {
  id: string;
  company: string;
  documentType: string;
  amount: number;
  avalAmount: number;
  txHash: string;
  explorerUrl?: string;
  timestamp: Date;
  fileName: string;
}

// Upload page progress state that persists across navigation
export interface UploadProgress {
  file: File | null;
  extractedData: ExtractedData | null;
  step: 'upload' | 'correction' | 'confirmed';
}

interface GuaranteeContextType {
  // Completed guarantees from upload flow
  completedGuarantees: CompletedGuarantee[];
  addCompletedGuarantee: (guarantee: CompletedGuarantee) => void;

  // Dynamic processes added from upload flow
  dynamicProcesses: Process[];
  addDynamicProcess: (process: Process) => void;
  updateDynamicProcess: (id: string, updates: Partial<Process>) => void;

  // Dynamic certificates from completed emissions
  dynamicCertificates: Certificate[];

  // Dynamic activity logs
  dynamicLogs: ActivityLogEntry[];

  // Upload page progress persistence
  uploadProgress: UploadProgress;
  setUploadProgress: (progress: Partial<UploadProgress>) => void;
  resetUploadProgress: () => void;

  // KPI overrides
  kpiOverrides: {
    guaranteesIssued: number;
    guaranteedVolume: number;
    activeProcesses: number;
  };
}

const defaultUploadProgress: UploadProgress = {
  file: null,
  extractedData: null,
  step: 'upload',
};

const GuaranteeContext = createContext<GuaranteeContextType | null>(null);

export function GuaranteeProvider({ children }: { children: ReactNode }) {
  const [completedGuarantees, setCompletedGuarantees] = useState<CompletedGuarantee[]>([]);
  const [dynamicProcesses, setDynamicProcesses] = useState<Process[]>([]);
  const [dynamicCertificates, setDynamicCertificates] = useState<Certificate[]>([]);
  const [dynamicLogs, setDynamicLogs] = useState<ActivityLogEntry[]>([]);
  const [uploadProgress, setUploadProgressState] = useState<UploadProgress>(defaultUploadProgress);

  const addCompletedGuarantee = useCallback((guarantee: CompletedGuarantee) => {
    setCompletedGuarantees((prev) => [guarantee, ...prev]);

    // Add certificate
    const newCert: Certificate = {
      id: `cert-dyn-${Date.now()}`,
      company: guarantee.company,
      amount: `$${guarantee.avalAmount.toLocaleString()}`,
      issuedAt: new Date().toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      hash: guarantee.txHash.slice(0, 4) + '...' + guarantee.txHash.slice(-3),
      network: 'Stellar Testnet',
    };
    setDynamicCertificates((prev) => [newCert, ...prev]);

    // Add activity logs
    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const newLogs: ActivityLogEntry[] = [
      {
        id: `log-dyn-${Date.now()}-1`,
        message: `${timeStr} — Hash registrado en Stellar Testnet`,
        type: 'blockchain',
      },
      {
        id: `log-dyn-${Date.now()}-2`,
        message: `${timeStr} — Validación humana aprobada`,
        type: 'validation',
      },
      {
        id: `log-dyn-${Date.now()}-3`,
        message: `${timeStr} — Extracción de datos IA completada`,
        type: 'extraction',
      },
      {
        id: `log-dyn-${Date.now()}-4`,
        message: `${timeStr} — Documentación cargada: ${guarantee.fileName}`,
        type: 'upload',
      },
    ];
    setDynamicLogs((prev) => [...newLogs, ...prev]);

    // Update all dynamic processes (from this session) to "Registrado On-Chain" / 100%
    setDynamicProcesses((prev) =>
      prev.map((p) =>
        p.id.startsWith('proc-dyn-') && p.progress < 100
          ? { ...p, state: 'Registrado On-Chain' as const, progress: 100 }
          : p
      )
    );
  }, []);

  const addDynamicProcess = useCallback((process: Process) => {
    setDynamicProcesses((prev) => [process, ...prev]);
  }, []);

  const updateDynamicProcess = useCallback((id: string, updates: Partial<Process>) => {
    setDynamicProcesses((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  const setUploadProgress = useCallback((progress: Partial<UploadProgress>) => {
    setUploadProgressState((prev) => ({ ...prev, ...progress }));
  }, []);

  const resetUploadProgress = useCallback(() => {
    setUploadProgressState(defaultUploadProgress);
  }, []);

  // Compute KPI overrides
  const kpiOverrides = {
    guaranteesIssued: 24 + completedGuarantees.length,
    guaranteedVolume:
      2400000 +
      completedGuarantees.reduce((sum, g) => sum + g.avalAmount, 0),
    activeProcesses:
      6 + dynamicProcesses.filter((p) => p.progress < 100).length,
  };

  return (
    <GuaranteeContext.Provider
      value={{
        completedGuarantees,
        addCompletedGuarantee,
        dynamicProcesses,
        addDynamicProcess,
        updateDynamicProcess,
        dynamicCertificates,
        dynamicLogs,
        uploadProgress,
        setUploadProgress,
        resetUploadProgress,
        kpiOverrides,
      }}
    >
      {children}
    </GuaranteeContext.Provider>
  );
}

export function useGuarantee() {
  const ctx = useContext(GuaranteeContext);
  if (!ctx) throw new Error('useGuarantee must be used within GuaranteeProvider');
  return ctx;
}
