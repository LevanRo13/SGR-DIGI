// Estado styles siguiendo el patrón del dashboard demo
export const STATE_STYLES: Record<string, string> = {
  'Documento Cargado': 'bg-slate-100 text-slate-700',
  'Procesamiento IA': 'bg-blue-100 text-blue-700',
  'Validación Humana': 'bg-amber-100 text-amber-700',
  'Registrado On-Chain': 'bg-violet-100 text-violet-700',
  'Certificado Emitido': 'bg-emerald-100 text-emerald-700',
} as const;

export const WORKFLOW_STEPS = [
  'Cargar docs',
  'Extracción IA',
  'Revisión humana',
  'Hash on-chain',
  'Certificado',
] as const;

export const NAVIGATION_ITEMS = [
  'Panel Principal',
  'Nueva Garantía',
  'Procesos',
  'Certificados',
  'Explorador Blockchain',
  'Empresas',
  'Configuración',
] as const;
