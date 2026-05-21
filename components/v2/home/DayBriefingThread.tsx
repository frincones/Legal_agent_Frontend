'use client';

/**
 * F2-T02 · LexAI UX v2 — DayBriefingThread
 *
 * Renderiza el mensaje proactivo del agente al inicio del día.
 * Estilo: un único "turno de LexAI" con avatar circular + label,
 * texto en prosa (NO listas crudas), y chips de sugerencias debajo.
 *
 * Animación: fade-in secuencial con framer-motion (stagger por línea).
 * Composer: al hacer click en un chip, el prompt se escribe en el
 * InlineComposer que vive debajo de este componente en la página.
 */

import { useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  AlertTriangle,
  BookOpen,
  LayoutList,
  Scale,
} from 'lucide-react';
import { type DayBriefingData } from '@/lib/v2/dayBriefing';
import { SuggestionChip, type SuggestionChipProps } from './SuggestionChip';

// ─── Props ────────────────────────────────────────────────────────────────────

interface DayBriefingThreadProps {
  data: DayBriefingData;
  /** Callback para poblar el composer con un prompt prefilled. */
  onPrompt: (prompt: string) => void;
}

// ─── Helpers de prosa ────────────────────────────────────────────────────────

function buildProse(data: DayBriefingData): string[] {
  // Línea 0 — saludo
  const lines: string[] = [`${data.greeting}, ${data.userName}.`];

  // Línea 1 — audiencias
  if (data.hearings.length > 0) {
    const hoy = data.hearings.filter((h) => h.dayLabel === 'hoy');
    const manana = data.hearings.filter((h) => h.dayLabel === 'mañana');
    if (hoy.length === 1) {
      const h = hoy[0]!;
      lines.push(
        `Hoy tiene una audiencia: ${h.matterTitle}${h.time !== '00:00' ? ` a las ${h.time}` : ''} en ${h.venue}.`,
      );
    } else if (hoy.length > 1) {
      lines.push(`Hoy tiene ${hoy.length} audiencias programadas.`);
    }
    const manana0 = manana[0];
    if (manana.length === 1 && manana0) {
      lines.push(`Mañana: audiencia de ${manana0.matterTitle} en ${manana0.venue}.`);
    } else if (manana.length > 1) {
      lines.push(`Mañana hay ${manana.length} audiencias más.`);
    }
  }

  // Línea 2 — novedades (DO / jurisprudencia)
  if (data.novelties.length > 0) {
    for (const n of data.novelties.slice(0, 2)) {
      const affCount = n.affectedTitles.length;
      const afecta =
        affCount > 0
          ? ` — afecta ${affCount} caso${affCount > 1 ? 's' : ''} de su despacho`
          : '';
      lines.push(
        `${n.type === 'DO' ? 'El Diario Oficial publicó' : 'Nueva jurisprudencia:'} "${n.title}"${afecta}.`,
      );
    }
  }

  // Línea 3 — plazos urgentes
  if (data.urgentDeadlines.length > 0) {
    const criticos = data.urgentDeadlines.filter((d) => d.days_until <= 3);
    if (criticos.length > 0) {
      const primero = criticos[0]!;
      lines.push(
        `Tiene ${criticos.length === 1 ? 'un plazo crítico' : `${criticos.length} plazos críticos`} esta semana${criticos.length === 1 ? `: ${primero.matterTitle} en ${primero.days_until === 0 ? 'hoy' : `${primero.days_until} día${primero.days_until > 1 ? 's' : ''}`}` : ''}.`,
      );
    } else {
      lines.push(
        `Hay ${data.urgentDeadlines.length} plazo${data.urgentDeadlines.length > 1 ? 's' : ''} próximo${data.urgentDeadlines.length > 1 ? 's' : ''} en los próximos 7 días.`,
      );
    }
  }

  // Línea 4 — casos urgentes sin movimiento
  if (data.urgentMatters.length > 0) {
    lines.push(
      `${data.urgentMatters.length === 1 ? 'Un caso de alta prioridad lleva más de 3 días sin actividad' : `${data.urgentMatters.length} casos de alta prioridad llevan más de 3 días sin actividad`}.`,
    );
  }

  // Línea final — cierre invitando a la acción
  if (lines.length === 1) {
    lines.push('Todo está al día por ahora. ¿En qué quiere trabajar hoy?');
  } else {
    lines.push('¿Por dónde empezamos?');
  }

  return lines;
}

/** Genera los chips de sugerencia a partir de los datos del briefing. */
function buildChips(data: DayBriefingData): SuggestionChipProps[] {
  const chips: SuggestionChipProps[] = [];

  // Chip 1 — audiencia hoy (si la hay)
  const audienciaHoy = data.hearings.find((h) => h.dayLabel === 'hoy');
  if (audienciaHoy) {
    chips.push({
      label: `Preparar audiencia: ${audienciaHoy.matterTitle.split(' ').slice(0, 4).join(' ')}`,
      prompt: `Ayúdame a preparar la audiencia del caso ${audienciaHoy.matterTitle}. Necesito los puntos clave, la jurisprudencia relevante y las posibles preguntas del juez.`,
      icon: CalendarDays,
      onClick: () => {}, // se sobreescribe al pasar el callback real
    });
  }

  // Chip 2 — novedad del DO (si la hay)
  const doItem = data.novelties.find((n) => n.type === 'DO');
  if (doItem) {
    chips.push({
      label: `Ver afectación: ${doItem.title.split(' ').slice(0, 4).join(' ')}`,
      prompt: `Explícame cómo afecta "${doItem.title}" a mis casos activos y qué acciones debo tomar.`,
      icon: BookOpen,
      onClick: () => {},
    });
  }

  // Chip 3 — plazos urgentes (si los hay)
  if (data.urgentDeadlines.length > 0) {
    chips.push({
      label: 'Ver mis plazos urgentes',
      prompt: `Muéstrame todos mis plazos urgentes de los próximos 7 días con el caso, la fecha y la acción recomendada.`,
      icon: AlertTriangle,
      onClick: () => {},
    });
  }

  // Chip 4 — casos de alta prioridad sin movimiento (si los hay)
  if (data.urgentMatters.length > 0) {
    chips.push({
      label: 'Casos de alta prioridad',
      prompt: `Lista mis casos de alta prioridad que llevan más de 3 días sin actividad y sugiere qué hacer en cada uno.`,
      icon: Scale,
      onClick: () => {},
    });
  }

  // Chip siempre presente — resumen del día
  chips.push({
    label: 'Resumen completo de mi día',
    prompt: `Dame un resumen ejecutivo de mi día: audiencias, plazos, novedades normativas y casos prioritarios.`,
    icon: LayoutList,
    onClick: () => {},
  });

  // Máximo 4 chips
  return chips.slice(0, 4);
}

// ─── Avatar del agente ────────────────────────────────────────────────────────

function AgentAvatar() {
  return (
    <div
      aria-hidden
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
      style={{ backgroundColor: 'var(--v2-brand-navy, #0E2A5E)' }}
    >
      L
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function DayBriefingThread({ data, onPrompt }: DayBriefingThreadProps) {
  const lines = buildProse(data);
  const baseChips = buildChips(data);

  // Inyecta el callback real en cada chip
  const chips = baseChips.map((c) => ({ ...c, onClick: onPrompt }));

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 } },
  };

  const lineVariants = {
    hidden: { opacity: 0, y: 6 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  };

  const chipContainerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08, delayChildren: lines.length * 0.12 + 0.1 } },
  };

  const chipVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <article
      className="flex flex-col gap-4"
      role="article"
      aria-label="Mensaje de bienvenida de LexAI"
    >
      {/* Cabecera del turno del agente */}
      <div className="flex items-center gap-2">
        <AgentAvatar />
        <div className="flex flex-col">
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--v2-text-tertiary, #807E76)', fontSize: '11px' }}
          >
            LexAI
          </span>
          <span
            className="text-xs"
            style={{ color: 'var(--v2-text-tertiary, #807E76)', fontSize: '11px' }}
          >
            {new Date().toLocaleDateString('es-CO', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </span>
        </div>
      </div>

      {/* Burbuja del mensaje */}
      <div
        className="rounded-xl p-5"
        style={{
          backgroundColor: 'var(--v2-bg-surface, #FFFFFF)',
          border: '1px solid var(--v2-border-subtle, #E8E7E1)',
          boxShadow: 'var(--v2-shadow-sm, 0 1px 2px rgba(26,25,22,0.04))',
        }}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-1.5"
        >
          {lines.map((line, i) => (
            <motion.p
              key={i}
              variants={lineVariants}
              className={[
                'leading-relaxed',
                i === 0
                  ? // Línea del saludo — serif, un poco más grande
                    'font-medium'
                  : '',
              ].join(' ')}
              style={{
                fontFamily:
                  i === 0
                    ? 'var(--v2-font-serif, var(--font-new-spirit), Georgia, serif)'
                    : 'var(--v2-font-sans, system-ui, sans-serif)',
                fontSize:
                  i === 0
                    ? '1.125rem'
                    : 'var(--v2-text-body, 16px)',
                lineHeight:
                  i === 0
                    ? '1.5'
                    : 'var(--v2-text-body-lh, 26px)',
                color: 'var(--v2-text-primary, #1A1916)',
              }}
            >
              {line}
            </motion.p>
          ))}
        </motion.div>

        {/* Chips de sugerencias */}
        {chips.length > 0 && (
          <motion.div
            variants={chipContainerVariants}
            initial="hidden"
            animate="visible"
            className="mt-4 flex flex-wrap gap-2"
            role="group"
            aria-label="Sugerencias rápidas"
          >
            {chips.map((chip) => (
              <motion.div key={chip.label} variants={chipVariants}>
                <SuggestionChip
                  label={chip.label}
                  prompt={chip.prompt}
                  icon={chip.icon}
                  onClick={chip.onClick}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </article>
  );
}
