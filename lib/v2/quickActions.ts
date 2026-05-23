/**
 * lib/v2/quickActions.ts
 *
 * Acciones rapidas estaticas que se muestran como chips alrededor del
 * composer en /v2/inicio (estado vacio). Cada chip al pulsarse pre-llena
 * el textarea del composer con `prompt`; NO ejecuta automaticamente, el
 * usuario edita y manda.
 *
 * Diseno minimalista tipo Apple/Claude/ChatGPT: 5 acciones criticas para
 * un abogado, etiqueta corta + icono lucide.
 */

import { Briefcase, CalendarDays, Scale, FileText, Mic, type LucideIcon } from 'lucide-react';

export interface QuickAction {
  /** Identificador estable (para keys/analytics). */
  id: string;
  /** Icono lucide-react. */
  icon: LucideIcon;
  /** Etiqueta visible — corta, max 3 palabras. */
  label: string;
  /**
   * Prompt que se inyecta al composer. Algunos terminan en "sobre" / "de"
   * intencionalmente para que el usuario complete el texto antes de enviar.
   */
  prompt: string;
}

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'casos-alta-prioridad',
    icon: Briefcase,
    label: 'Casos alta prioridad',
    prompt:
      'Lista mis casos de alta prioridad que llevan más de 3 días sin actividad y sugiere la acción inmediata para cada uno.',
  },
  {
    id: 'resumen-dia',
    icon: CalendarDays,
    label: 'Resumen de mi día',
    prompt:
      'Dame un resumen ejecutivo de mi día: audiencias, plazos próximos, novedades normativas y casos prioritarios.',
  },
  {
    id: 'jurisprudencia',
    icon: Scale,
    label: 'Buscar jurisprudencia',
    prompt: 'Busca jurisprudencia relevante sobre ',
  },
  {
    id: 'redactar-contrato',
    icon: FileText,
    label: 'Redactar contrato',
    prompt: 'Redacta un contrato de ',
  },
  {
    id: 'voice-agent',
    icon: Mic,
    label: 'Voice agent',
    prompt: '/voice Activa el agente de voz para tomar nota de instrucciones.',
  },
];
