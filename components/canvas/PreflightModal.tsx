'use client';

import { useCallback, useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Ic } from '@/components/atoms/icons';
import { cn } from '@/lib/utils';
import {
  preflightSummary,
  runPreflight,
  type PreflightIssue,
  type PreflightReport,
} from '@/lib/canvas/preflight';

/**
 * Pre-flight modal · "Listo para presentar?"
 *
 * Trigger: top-bar action "Revisar y radicar". Loads the latest saved
 * canvas HTML, runs the preflight composer, shows score + issues +
 * mandatory disclaimer + onward action.
 */
export function PreflightModal({
  matterId,
  trigger,
}: {
  matterId: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<PreflightReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const res = await fetch(
        `/api/matter-documents/canvas?matter_id=${encodeURIComponent(matterId)}`,
        { cache: 'no-store' },
      );
      if (!res.ok) throw new Error(`No se pudo cargar el documento (${res.status})`);
      const data = (await res.json()) as { html?: string };
      const r = await runPreflight(data.html ?? '');
      setReport(r);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error en pre-flight';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [matterId]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-ink/40 backdrop-blur-[2px]" />
        <Dialog.Content className="surface fixed left-1/2 top-1/2 z-[91] w-[min(640px,92vw)] max-h-[88vh] -translate-x-1/2 -translate-y-1/2 overflow-auto p-6 shadow-3 outline-none">
          <Dialog.Title className="serif text-[20px] font-semibold">
            Pre-flight: ¿listo para presentar?
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-[12.5px] muted">
            Verificamos cada cita contra fuentes oficiales (Corte Constitucional, Consejo de Estado, SUIN-Juriscol).
          </Dialog.Description>

          <div className="mt-4">
            {loading && <LoadingState />}
            {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}
            {!loading && !error && report && (
              <ReportView report={report} matterId={matterId} onClose={() => setOpen(false)} />
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center gap-3 rounded-md border border-line bg-bg-elev p-4">
      <Loader2 size={18} className="animate-spin text-accent" aria-hidden="true" />
      <span className="text-[13px]">Validando contra fuentes oficiales…</span>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-md border border-danger/40 bg-danger-soft p-4">
      <div className="flex items-center gap-2 text-[13px] font-medium text-danger">
        <AlertTriangle size={16} aria-hidden="true" />
        Pre-flight falló
      </div>
      <p className="mt-2 text-[12.5px] text-danger">{message}</p>
      <button type="button" className="btn btn-sm mt-3" onClick={onRetry}>
        Reintentar
      </button>
    </div>
  );
}

function ReportView({
  report,
  matterId,
  onClose,
}: {
  report: PreflightReport;
  matterId: string;
  onClose: () => void;
}) {
  const tone =
    report.score >= 95 ? 'ok' : report.score >= 70 ? 'warn' : 'danger';

  return (
    <div className="space-y-4">
      <div
        className={cn(
          'rounded-lg border p-4',
          tone === 'ok' && 'border-emerald-500/40 bg-emerald-500/5',
          tone === 'warn' && 'border-amber-500/40 bg-amber-500/5',
          tone === 'danger' && 'border-red-500/40 bg-red-500/5',
        )}
      >
        <div className="flex items-end gap-3">
          <div
            className={cn(
              'serif text-[44px] font-semibold leading-none',
              tone === 'ok' && 'text-emerald-700 dark:text-emerald-300',
              tone === 'warn' && 'text-amber-700 dark:text-amber-300',
              tone === 'danger' && 'text-red-700 dark:text-red-300',
            )}
          >
            {report.score}
          </div>
          <div className="pb-1">
            <div className="text-[11px] uppercase tracking-wider muted">Score</div>
            <div className="text-[12.5px] font-medium">{preflightSummary(report)}</div>
          </div>
          <div
            className={cn(
              'chip ml-auto',
              report.ready ? 'chip-green' : tone === 'warn' ? 'chip-amber' : 'chip-red',
            )}
          >
            {report.ready ? 'Listo para presentar' : 'Requiere atención'}
          </div>
        </div>
      </div>

      <DisclaimerBanner />

      <IssuesList issues={report.issues} />

      <div className="flex items-center gap-2 border-t border-line pt-3">
        <button type="button" className="btn" onClick={onClose}>
          Volver al canvas
        </button>
        <button
          type="button"
          className="btn btn-primary ml-auto"
          disabled={!report.ready}
          onClick={() => {
            if (!report.ready) return;
            toast.message(
              'Marcado como listo. Usa "Export .docx" para descargar el archivo final.',
            );
            onClose();
          }}
          aria-label="Marcar documento como listo"
          title={
            report.ready
              ? 'Confirmar que el documento está listo para presentar'
              : 'Resuelve los issues de severidad alta para habilitar este paso'
          }
        >
          {Ic.check} Marcar como listo
        </button>
        <span className="hidden text-[10.5px] muted sm:inline">· matter {matterId.slice(0, 8)}</span>
      </div>
    </div>
  );
}

function DisclaimerBanner() {
  return (
    <div className="rounded-md border border-line bg-bg-sunken p-3 text-[11.5px] leading-snug">
      <div className="font-medium text-ink">
        Este documento fue generado con asistencia IA.
      </div>
      <div className="muted">
        La verificación automática no reemplaza el juicio profesional. La revisión final y la
        responsabilidad de presentación corresponden al abogado.
      </div>
    </div>
  );
}

function IssuesList({ issues }: { issues: PreflightIssue[] }) {
  if (issues.length === 0) {
    return (
      <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-[12.5px]">
        <span className="inline-flex items-center gap-2 font-medium text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 size={14} aria-hidden="true" /> Sin issues detectados.
        </span>
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {issues.map((i, idx) => (
        <IssueRow key={`${i.type}-${i.ref ?? idx}`} issue={i} />
      ))}
    </ul>
  );
}

function IssueRow({ issue }: { issue: PreflightIssue }) {
  const Icon =
    issue.severity === 'high' ? AlertTriangle : issue.severity === 'medium' ? AlertTriangle : Info;
  return (
    <li
      className={cn(
        'flex items-start gap-3 rounded-md border p-3',
        issue.severity === 'high' && 'border-red-500/40 bg-red-500/5',
        issue.severity === 'medium' && 'border-amber-500/40 bg-amber-500/5',
        issue.severity === 'info' && 'border-line bg-bg-elev',
      )}
    >
      <Icon
        size={14}
        className={cn(
          'mt-0.5 flex-none',
          issue.severity === 'high' && 'text-red-500',
          issue.severity === 'medium' && 'text-amber-500',
          issue.severity === 'info' && 'text-ink-3',
        )}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] font-medium text-ink">{issue.message}</div>
        {issue.suggestion && (
          <div className="mt-1 text-[11.5px] muted">→ {issue.suggestion}</div>
        )}
      </div>
    </li>
  );
}
