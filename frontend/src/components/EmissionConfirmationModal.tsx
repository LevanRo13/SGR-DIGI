import { useState } from 'react';
import {
  FileText,
  Building2,
  Calculator,
  Link2,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import Modal from './ui/Modal';
import type { GuaranteeData, EmissionResult } from '../types/guarantee';

interface EmissionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: GuaranteeData;
  onConfirm: (data: GuaranteeData) => Promise<EmissionResult>;
}

export default function EmissionConfirmationModal({
  isOpen,
  onClose,
  data,
  onConfirm,
}: EmissionConfirmationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<EmissionResult | null>(null);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const emissionResult = await onConfirm(data);
      setResult(emissionResult);

      if (emissionResult.success) {
        setTimeout(() => {
          onClose();
          setResult(null);
        }, 3000);
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      onClose();
      setResult(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (result?.success) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleCancel}
        title="Emisión Exitosa"
        size="md"
        showCloseButton={false}
      >
        <div className="p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Aval emitido correctamente
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            El aval ha sido registrado en Stellar blockchain
          </p>
          {result.transactionId && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 mb-4">
              <p className="text-xs text-slate-500 mb-1">Transaction ID</p>
              <p className="text-xs font-mono text-slate-700 break-all">
                {result.transactionId}
              </p>
            </div>
          )}
          {result.explorerUrl && (
            <a
              href={result.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700 underline"
            >
              Ver en Stellar Explorer
            </a>
          )}
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Confirmar Emisión de Aval"
      size="lg"
      showCloseButton={!isSubmitting}
    >
      <div className="p-6 space-y-6">
        {/* Document Section */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">Documento</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-500">Tipo</p>
              <p className="font-medium text-slate-900">{data.document.type}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Número</p>
              <p className="font-medium text-slate-900">
                {data.document.number}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Fecha</p>
              <p className="font-medium text-slate-900">{data.document.date}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Monto</p>
              <p className="font-medium text-slate-900">
                {formatCurrency(data.document.amount)}
              </p>
            </div>
          </div>
        </section>

        <div className="border-t border-slate-200" />

        {/* Company Section */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">
              Empresa Beneficiaria
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-500">Razón Social</p>
              <p className="font-medium text-slate-900">
                {data.company.businessName}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">CUIT</p>
              <p className="font-medium text-slate-900">{data.company.cuit}</p>
            </div>
            {data.company.activity && (
              <div className="col-span-2">
                <p className="text-xs text-slate-500">Actividad</p>
                <p className="font-medium text-slate-900">
                  {data.company.activity}
                </p>
              </div>
            )}
          </div>
        </section>

        <div className="border-t border-slate-200" />

        {/* Calculation Section */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">
              Cálculo del Aval
            </h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Valor base</span>
              <span className="font-medium text-slate-900">
                {formatCurrency(data.calculation.baseValue)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Factor de riesgo</span>
              <span className="font-medium text-slate-900">
                {data.calculation.riskFactor.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Multiplicador</span>
              <span className="font-medium text-slate-900">
                {data.calculation.multiplier}x
              </span>
            </div>
            <div className="border-t border-slate-200 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-base font-semibold text-slate-900">
                  Aval Final
                </span>
                <span className="text-xl font-bold text-blue-600">
                  {formatCurrency(data.calculation.finalAval)}
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="border-t border-slate-200" />

        {/* Blockchain Section */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">Blockchain</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-500">Red</p>
              <p className="font-medium text-slate-900">
                {data.blockchain.network}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-slate-500 mb-1">Hash del documento</p>
              <p className="font-mono text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-200 break-all">
                {data.blockchain.hash}
              </p>
            </div>
          </div>
        </section>

        {/* Warning */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900">
              Acción irreversible
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Una vez confirmada, la emisión será registrada en blockchain y no
              podrá ser modificada ni eliminada.
            </p>
          </div>
        </div>

        {/* Error message */}
        {result?.error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">Error</p>
              <p className="text-xs text-red-700 mt-1">{result.error}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Emitiendo...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Confirmar Emisión
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
