import { useState, useCallback, useRef } from 'react'
import {
  Upload,
  FileCheck2,
  AlertCircle,
  X,
  FileText,
  Image,
  ArrowRight,
  Shield,
} from 'lucide-react'

const ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
]

const ACCEPTED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png']

function getFileIcon(type: string) {
  if (type === 'application/pdf') return <FileText className="w-6 h-6" />
  return <Image className="w-6 h-6" />
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateAndSetFile = useCallback((incoming: File) => {
    setError(null)

    if (!ACCEPTED_TYPES.includes(incoming.type)) {
      const ext = incoming.name.split('.').pop()?.toLowerCase() ?? ''
      setError(
        `El formato ".${ext}" no es válido. Solo se aceptan archivos PDF, JPG y PNG.`
      )
      setFile(null)
      return
    }

    // 20 MB limit
    if (incoming.size > 20 * 1024 * 1024) {
      setError('El archivo excede el tamaño máximo de 20 MB.')
      setFile(null)
      return
    }

    setFile(incoming)
  }, [])

  // ---- Drag & Drop handlers ----
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const droppedFile = e.dataTransfer.files?.[0]
      if (droppedFile) validateAndSetFile(droppedFile)
    },
    [validateAndSetFile]
  )

  // ---- Traditional selector ----
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0]
      if (selected) validateAndSetFile(selected)
    },
    [validateAndSetFile]
  )

  const handleRemoveFile = useCallback(() => {
    setFile(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  const handleContinue = () => {
    console.log('Continuar con archivo:', file?.name)
    // TODO: Enviar archivo al backend para extracción IA (HU-02)
  }

  const isReady = file !== null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-white/5 bg-slate-950/50 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide">
              AURA SGR
            </h2>
            <p className="text-[11px] text-slate-500 leading-none">
              Plataforma de Garantías Digitales
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold ring-1 ring-indigo-500/30">
            1
          </span>
          <div>
            <p className="text-sm font-medium text-white">
              Cargar documento de respaldo
            </p>
            <p className="text-xs text-slate-500">
              Suba el comprobante para iniciar la solicitud de aval
            </p>
          </div>
        </div>

        {/* Upload card */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/20">
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
                if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
              }}
              className={`
                relative group cursor-pointer rounded-xl border-2 border-dashed
                transition-all duration-300 ease-out
                flex flex-col items-center justify-center text-center
                px-8 py-14
                ${
                  isDragging
                    ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
                    : file
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-white/10 bg-white/[0.01] hover:border-indigo-500/40 hover:bg-indigo-500/5'
                }
              `}
            >
              {/* Decorative glow on drag */}
              {isDragging && (
                <div className="absolute inset-0 rounded-xl bg-indigo-500/5 animate-pulse pointer-events-none" />
              )}

              {!file ? (
                <>
                  <div
                    className={`
                      mb-4 p-4 rounded-2xl transition-all duration-300
                      ${
                        isDragging
                          ? 'bg-indigo-500/20 text-indigo-300 scale-110'
                          : 'bg-white/5 text-slate-400 group-hover:bg-indigo-500/10 group-hover:text-indigo-400'
                      }
                    `}
                  >
                    <Upload className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-medium text-slate-200 mb-1">
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
                        className="px-2.5 py-1 rounded-md text-[10px] font-semibold tracking-wider uppercase bg-white/5 text-slate-400 border border-white/5"
                      >
                        {fmt}
                      </span>
                    ))}
                    <span className="text-[10px] text-slate-600 ml-1">
                      máx. 20 MB
                    </span>
                  </div>
                </>
              ) : (
                /* Success state */
                <div className="flex items-center gap-4 w-full">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0">
                    <FileCheck2 className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-white truncate">
                      {file.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">
                        {formatFileSize(file.size)}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-700" />
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                        {getFileIcon(file.type)}
                        <span>Archivo válido</span>
                      </span>
                    </div>
                  </div>
                  <button
                    id="btn-remove-file"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveFile()
                    }}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
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
                className="mt-4 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 animate-in fade-in slide-in-from-top-1"
              >
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-300">
                    Archivo rechazado
                  </p>
                  <p className="text-xs text-red-400/70 mt-0.5">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer with continue button */}
          <div className="border-t border-white/[0.06] bg-white/[0.01] px-8 py-5 flex items-center justify-between">
            <p className="text-xs text-slate-600">
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
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-white/5 text-slate-600 cursor-not-allowed'
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
            {
              label: 'Formatos',
              value: 'PDF, JPG, PNG',
            },
            {
              label: 'Tamaño máx.',
              value: '20 MB',
            },
            {
              label: 'Seguridad',
              value: 'Cifrado E2E',
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-white/[0.04] bg-white/[0.015] px-4 py-3 text-center"
            >
              <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-0.5">
                {item.label}
              </p>
              <p className="text-xs font-medium text-slate-400">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
