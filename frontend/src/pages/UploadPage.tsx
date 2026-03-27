import { useState, useCallback, useRef } from 'react';
import {
  Upload,
  FileCheck2,
  AlertCircle,
  X,
  FileText,
  Image,
  ArrowRight,
} from 'lucide-react';
import Layout from '../components/Layout';
import EmissionConfirmationModal from '../components/EmissionConfirmationModal';
import type { GuaranteeData, EmissionResult } from '../types/guarantee';

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

const ACCEPTED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

function getFileIcon(type: string) {
  if (type === 'application/pdf') return <FileText className="w-6 h-6" />;
  return <Image className="w-6 h-6" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = useCallback((incoming: File) => {
    setError(null);

    if (!ACCEPTED_TYPES.includes(incoming.type)) {
      const ext = incoming.name.split('.').pop()?.toLowerCase() ?? '';
      setError(
        `El formato ".${ext}" no es válido. Solo se aceptan archivos PDF, JPG y PNG.`
      );
      setFile(null);
      return;
    }

    // 20 MB limit
    if (incoming.size > 20 * 1024 * 1024) {
      setError('El archivo excede el tamaño máximo de 20 MB.');
      setFile(null);
      return;
    }

    setFile(incoming);
  }, []);

  // ---- Drag & Drop handlers ----
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files?.[0];
      if (droppedFile) validateAndSetFile(droppedFile);
    },
    [validateAndSetFile]
  );

  // ---- Traditional selector ----
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) validateAndSetFile(selected);
    },
    [validateAndSetFile]
  );

  const handleRemoveFile = useCallback(() => {
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const handleContinue = () => {
    console.log('Continuar con archivo:', file?.name);
    // TODO: En una implementación real, aquí se procesarían las HU-02 a HU-05
    // Por ahora, abrimos directamente el modal de confirmación
    setShowConfirmationModal(true);
  };

  // Mock data - En producción, estos datos vendrían de las HU anteriores (HU-02 a HU-05)
  const getMockGuaranteeData = (): GuaranteeData => {
    return {
      company: {
        businessName: 'PyME Example SRL',
        cuit: '30-12345678-9',
        activity: 'Comercio Minorista',
      },
      document: {
        type: 'Factura',
        number: 'FC-0001-00012345',
        date: new Date().toLocaleDateString('es-AR'),
        amount: 100000,
        issuer: 'Proveedor XYZ SA',
      },
      calculation: {
        baseValue: 100000,
        riskFactor: 1.0,
        multiplier: 1.5,
        finalAval: 150000, // 1.5 x 100000 x 1.0
      },
      blockchain: {
        network: 'Stellar Testnet',
        hash: '7a8f9b2e4d6c1f3e8a9b2c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f',
      },
      uploadedFile: file || undefined,
    };
  };

  // Función que simula el envío a blockchain - En producción, llamaría al backend
  const handleConfirmEmission = async (
    data: GuaranteeData
  ): Promise<EmissionResult> => {
    // Simular delay de red (1.5 segundos)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // TODO: Aquí iría la llamada real al backend para emitir en Stellar
    // Ejemplo: const response = await fetch('/api/guarantee/emit', { method: 'POST', body: JSON.stringify(data) })

    // Simulación de respuesta exitosa
    return {
      success: true,
      transactionId: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
      explorerUrl: 'https://stellar.expert/explorer/testnet/tx/a1b2c3d4e5f6',
    };

    // Simulación de error (descomentar para probar):
    // return {
    //   success: false,
    //   error: 'Error al conectar con Stellar Horizon API',
    // };
  };

  const isReady = file !== null;

  return (
    <Layout>
      {/* Modal de confirmación (HU-06) */}
      <EmissionConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        data={getMockGuaranteeData()}
        onConfirm={handleConfirmEmission}
      />

      <div className="max-w-2xl">
        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-600 text-xs font-bold ring-1 ring-blue-200">
            1
          </span>
          <div>
            <p className="text-sm font-medium text-slate-900">
              Cargar documento de respaldo
            </p>
            <p className="text-xs text-slate-500">
              Suba el comprobante para iniciar la solicitud de aval
            </p>
          </div>
        </div>

        {/* Upload card */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="p-8">
            {/* Drop zone */}
            <div
              id="upload-dropzone"
              role="button"
              tabIndex={0}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
              }}
              className={`
                relative group cursor-pointer rounded-xl border-2 border-dashed
                transition-all duration-300 ease-out
                flex flex-col items-center justify-center text-center
                px-8 py-14
                ${
                  isDragging
                    ? 'border-blue-400 bg-blue-50 scale-[1.01]'
                    : file
                      ? 'border-emerald-400 bg-emerald-50'
                      : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50'
                }
              `}
            >
              {/* Decorative glow on drag */}
              {isDragging && (
                <div className="absolute inset-0 rounded-xl bg-blue-100/50 animate-pulse pointer-events-none" />
              )}

              {!file ? (
                <>
                  <div
                    className={`
                      mb-4 p-4 rounded-2xl transition-all duration-300
                      ${
                        isDragging
                          ? 'bg-blue-100 text-blue-600 scale-110'
                          : 'bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-500'
                      }
                    `}
                  >
                    <Upload className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    {isDragging
                      ? 'Suelte el archivo aquí'
                      : 'Arrastre su documento aquí'}
                  </p>
                  <p className="text-xs text-slate-500 mb-4">
                    o haga clic para seleccionar desde su equipo
                  </p>
                  <div className="flex items-center gap-2">
                    {['PDF', 'JPG', 'PNG'].map((fmt) => (
                      <span
                        key={fmt}
                        className="px-2.5 py-1 rounded-md text-[10px] font-semibold tracking-wider uppercase bg-slate-200 text-slate-600 border border-slate-300"
                      >
                        {fmt}
                      </span>
                    ))}
                    <span className="text-[10px] text-slate-500 ml-1">
                      máx. 20 MB
                    </span>
                  </div>
                </>
              ) : (
                /* Success state */
                <div className="flex items-center gap-4 w-full">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 shrink-0">
                    <FileCheck2 className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {file.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">
                        {formatFileSize(file.size)}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                        {getFileIcon(file.type)}
                        <span>Archivo válido</span>
                      </span>
                    </div>
                  </div>
                  <button
                    id="btn-remove-file"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile();
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    aria-label="Eliminar archivo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={inputRef}
                id="file-input"
                type="file"
                accept={ACCEPTED_EXTENSIONS.join(',')}
                onChange={handleInputChange}
                className="hidden"
                aria-label="Seleccionar archivo"
              />
            </div>

            {/* Error message */}
            {error && (
              <div
                id="upload-error"
                role="alert"
                className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700">
                    Archivo rechazado
                  </p>
                  <p className="text-xs text-red-600 mt-0.5">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer with continue button */}
          <div className="border-t border-slate-200 bg-slate-50 px-8 py-5 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {isReady
                ? 'Documento listo para análisis'
                : 'Seleccione un documento para continuar'}
            </p>
            <button
              id="btn-continue"
              type="button"
              disabled={!isReady}
              onClick={handleContinue}
              className={`
                inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                transition-all duration-300 ease-out
                ${
                  isReady
                    ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:shadow-md active:scale-[0.98]'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }
              `}
            >
              Continuar
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Helper info */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { label: 'Formatos', value: 'PDF, JPG, PNG' },
            { label: 'Tamaño máx.', value: '20 MB' },
            { label: 'Seguridad', value: 'Cifrado E2E' },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center shadow-sm"
            >
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-0.5">
                {item.label}
              </p>
              <p className="text-xs font-medium text-slate-700">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
