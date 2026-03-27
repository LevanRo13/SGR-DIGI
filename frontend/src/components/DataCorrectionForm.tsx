import { useState, useCallback } from 'react';
import { Check, AlertCircle, ChevronDown } from 'lucide-react';

export interface ExtractedData {
  [key: string]: string | number | boolean;
}

interface DataCorrectionFormProps {
  data: ExtractedData;
  fileName: string;
  onSubmit: (correctedData: ExtractedData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

interface FormErrors {
  [key: string]: string;
}

export default function DataCorrectionForm({
  data,
  fileName,
  onSubmit,
  onCancel,
  isLoading = false,
}: DataCorrectionFormProps) {
  const [formData, setFormData] = useState<ExtractedData>(data);
  const [errors, setErrors] = useState<FormErrors>({});
  const [expandedSections, setExpandedSections] = useState<string[]>(['personal']);

  const handleChange = useCallback(
    (field: string, value: string | number | boolean) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
      // Clear error for this field
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors]
  );

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Simple validation - required fields should not be empty
    Object.entries(formData).forEach(([key, value]) => {
      if (typeof value === 'string' && !value.trim()) {
        newErrors[key] = 'Este campo no puede estar vacío';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const groupedData = groupDataBySections(formData);

  const renderField = (label: string, key: string, value: string | number | boolean) => {
    const displayLabel = formatLabel(label);
    const error = errors[key];

    return (
      <div key={key} className="space-y-1.5">
        <label
          htmlFor={key}
          className="block text-sm font-medium text-slate-700"
        >
          {displayLabel}
          {!value && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </label>
        {typeof value === 'boolean' ? (
          <div className="flex items-center h-10">
            <input
              id={key}
              type="checkbox"
              checked={value}
              onChange={(e) => handleChange(key, e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor={key} className="ml-3 text-sm text-slate-600">
              {displayLabel}
            </label>
          </div>
        ) : (
          <input
            id={key}
            type={getInputType(label)}
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
            className={`
              w-full px-3 py-2.5 rounded-lg border text-sm
              transition-colors focus:outline-none focus:ring-2
              ${
                error
                  ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500'
                  : 'border-slate-300 bg-white focus:ring-blue-500 focus:border-blue-500'
              }
            `}
            disabled={isLoading}
          />
        )}
        {error && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Verificar datos extraídos
        </h2>
        <p className="text-slate-600">
          Documento: <span className="font-medium">{fileName}</span>
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Por favor revise y corrija los datos extraídos del documento
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {Object.entries(groupedData).map(([section, fields]) => (
          <div
            key={section}
            className="rounded-xl border border-slate-200 bg-white overflow-hidden"
          >
            {/* Section header */}
            <button
              type="button"
              onClick={() => toggleSection(section)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors border-b border-slate-200"
            >
              <h3 className="text-sm font-semibold text-slate-900 capitalize">
                {section === 'personal' && '👤 Datos Personales'}
                {section === 'guarantee' && '🛡️ Información de Aval'}
                {section === 'financial' && '💰 Datos Financieros'}
                {section === 'other' && '📋 Otros'}
              </h3>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  expandedSections.includes(section) ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Section content */}
            {expandedSections.includes(section) && (
              <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                {Object.entries(fields).map(([key, value]) =>
                  renderField(key, key, value as string | number | boolean)
                )}
              </div>
            )}
          </div>
        ))}
      </form>

      {/* Actions */}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className={`
            flex-1 px-4 py-3 rounded-lg border transition-colors text-sm font-semibold
            ${
              isLoading
                ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }
          `}
        >
          Cancelar
        </button>
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={isLoading}
          className={`
            flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg
            transition-all text-sm font-semibold
            ${
              isLoading
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]'
            }
          `}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-400 rounded-full animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Confirmar datos
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ---- Helpers ----

function formatLabel(str: string): string {
  return str
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function getInputType(label: string): string {
  const lowerLabel = label.toLowerCase();
  if (lowerLabel.includes('date') || lowerLabel.includes('fecha')) return 'date';
  if (lowerLabel.includes('email')) return 'email';
  if (lowerLabel.includes('phone') || lowerLabel.includes('telefono')) return 'tel';
  if (lowerLabel.includes('amount') || lowerLabel.includes('monto')) return 'number';
  return 'text';
}

function groupDataBySections(data: ExtractedData) {
  const sections: Record<string, Record<string, string | number | boolean>> = {
    personal: {},
    guarantee: {},
    financial: {},
    other: {},
  };

  const personalKeywords = ['name', 'nombre', 'apellido', 'email', 'phone', 'telefono', 'dni', 'cedula', 'address', 'direccion'];
  const guaranteeKeywords = ['guarantee', 'aval', 'instrument', 'instrumento', 'type', 'tipo', 'document', 'documento'];
  const financialKeywords = ['amount', 'monto', 'currency', 'moneda', 'interest', 'interes', 'term', 'plazo', 'payment', 'pago'];

  Object.entries(data).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();

    if (personalKeywords.some((kw) => lowerKey.includes(kw))) {
      sections.personal[key] = value;
    } else if (guaranteeKeywords.some((kw) => lowerKey.includes(kw))) {
      sections.guarantee[key] = value;
    } else if (financialKeywords.some((kw) => lowerKey.includes(kw))) {
      sections.financial[key] = value;
    } else {
      sections.other[key] = value;
    }
  });

  // Remove empty sections
  return Object.fromEntries(
    Object.entries(sections).filter(([_, fields]) => Object.keys(fields).length > 0)
  );
}
