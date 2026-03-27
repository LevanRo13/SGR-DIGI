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
import DataCorrectionForm, { ExtractedData } from '../components/DataCorrectionForm';

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
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
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
    setExtractedData(null);
    setProcessingError(null);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const handleContinue = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProcessingError(null);

    try {
      // TODO: Cambiar 'http://localhost:8000' por tu URL del backend real
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8000/api/extract', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.statusText}`);
      }

      const data = await response.json();

      // data debería tener estructura como:
      // { extracted_data: { field1: value1, field2: value2, ... } }
      const extractedFields = data.extracted_data || data;
      setExtractedData(extractedFields);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al procesar el archivo';
      setProcessingError(message);
      console.error('Processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDataCorrectionSubmit = async (correctedData: ExtractedData) => {
    setIsProcessing(true);
    setProcessingError(null);

    try {
      // TODO: Enviar datos corregidos al backend
      const response = await fetch('http://localhost:8000/api/process-guarantee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_name: file?.name,
          extracted_data: correctedData,
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.statusText}`);
      }

      console.log('Datos guardados correctamente:', correctedData);
      // TODO: Redirigir a la siguiente página o mostrar éxito
      // Por ahora, limpiar el formulario
      setFile(null);
      setExtractedData(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar los datos';
      setProcessingError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelCorrection = () => {
    setExtractedData(null);
    setProcessingError(null);
  };

  return (
    <Layout>
      <div className="max-w-2xl">
        {/* Si hay datos extraídos, mostrar el formulario de corrección en lugar del upload */}
        {extractedData ? (
          <>
            {/* Step indicator para paso 2 */}
            <div className="flex items-center gap-3 mb-8">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-600 text-xs font-bold ring-1 ring-blue-200">
                2
              </span>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Verificar datos extraídos
                </p>
                <p className="text-xs text-slate-500">
                  Revise y corrija los datos extraídos del documento
                </p>
              </div>
            </div>

            {/* Error processing */}
            {processingError && (
              <div
                role="alert"
                className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700">
                    Error al procesar
                  </p>
                  <p className="text-xs text-red-600 mt-0.5">{processingError}</p>
                </div>
              </div>
            )}

            {/* Data Correction Form */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm p-8">
              <DataCorrectionForm
                data={extractedData}
                fileName={file?.name || 'Documento'}
                onSubmit={handleDataCorrectionSubmit}
                onCancel={handleCancelCorrection}
                isLoading={isProcessing}
              />
            </div>
          </>
        ) : (
          <>
            {/* Step indicator para paso 1 */}
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
                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Eliminar archivo"
                        disabled={isProcessing}
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
                    disabled={isProcessing}
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

                {/* Processing error */}
                {processingError && (
                  <div
                    role="alert"
                    className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-700">
                        Error al procesar
                      </p>
                      <p className="text-xs text-red-600 mt-0.5">{processingError}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer with continue button */}
              <div className="border-t border-slate-200 bg-slate-50 px-8 py-5 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  {isProcessing
                    ? 'Extrayendo datos...'
                    : file
                      ? 'Documento listo para análisis'
                      : 'Seleccione un documento para continuar'}
                </p>
                <button
                  id="btn-continue"
                  type="button"
                  disabled={!file || isProcessing}
                  onClick={handleContinue}
                  className={`
                  inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                  transition-all duration-300 ease-out
                  ${
                    !file || isProcessing
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:shadow-md active:scale-[0.98]'
                  }
                `}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-400 rounded-full animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      Continuar
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
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
          </>
        )}
      </div>
    </Layout>
  );
}
