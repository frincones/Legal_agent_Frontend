'use client';

import { useState } from 'react';
import { CalendarDays, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const TIPO_PLAZO_LABELS: Record<string, string> = {
  contestacion_demanda: 'Contestación de demanda · 20 días hábiles · Art. 369 CGP',
  traslado: 'Traslado general · 10 días hábiles · Art. 110 CGP',
  apelacion: 'Apelación · 3 días hábiles · Art. 322 CGP',
  casacion: 'Casación · 30 días hábiles · Art. 339 CGP',
  reposicion: 'Reposición · 3 días hábiles · Art. 318 CGP',
  contestacion_tutela: 'Contestación de tutela · 2 días · Decreto 2591/91 Art. 19',
  derecho_peticion_general: 'Derecho de petición · 15 días · Ley 1755/2015',
  derecho_peticion_consulta: 'Derecho de petición consulta · 30 días',
  derecho_peticion_documentos: 'Derecho de petición documentos · 10 días',
  prescripcion_laboral: 'Prescripción laboral · 3 años calendario · Art. 488 CST',
  personalizado: 'Personalizado',
};

type PlazoResponse = {
  fecha_inicio: string;
  fecha_vence: string;
  dias_total: number;
  tipo_dia: string;
  tipo_plazo: string;
  fundamento: string;
  detalle_dias: Array<{ fecha: string; label: string; cuenta: boolean }>;
  festivos_excluidos: string[];
  vacancias_excluidas: Array<{ label: string; from: string; to: string }>;
  desglose_legible: string;
};

export function PlazosForm() {
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().slice(0, 10));
  const [tipoPlazo, setTipoPlazo] = useState('contestacion_demanda');
  const [diasCustom, setDiasCustom] = useState(10);
  const [tipoDiaCustom, setTipoDiaCustom] = useState<'habil' | 'calendario'>('habil');
  const [incluirInicio, setIncluirInicio] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PlazoResponse | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        fecha_inicio: fechaInicio,
        tipo_plazo: tipoPlazo,
        incluir_dia_inicio: incluirInicio,
      };
      if (tipoPlazo === 'personalizado') {
        body.dias_personalizados = diasCustom;
        body.tipo_dia_personalizado = tipoDiaCustom;
      }
      const res = await fetch('/api/calc/plazos', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text.slice(0, 200) || `Error ${res.status}`);
      }
      const data = (await res.json()) as PlazoResponse;
      setResult(data);
      toast.success(`Vence ${data.fecha_vence}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error calculando');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-[400px_1fr]">
      <form onSubmit={submit} className="surface flex flex-col gap-4 p-[var(--pad-card)]">
        <h3 className="serif text-[15px] font-semibold">Calcular plazo</h3>

        <Field label="Fecha de inicio (notificación)">
          <input
            type="date"
            required
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="w-full bg-transparent outline-none"
          />
        </Field>

        <Field label="Tipo de plazo">
          <select
            value={tipoPlazo}
            onChange={(e) => setTipoPlazo(e.target.value)}
            className="w-full bg-transparent outline-none"
          >
            {Object.entries(TIPO_PLAZO_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>

        {tipoPlazo === 'personalizado' && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Días">
              <input
                type="number"
                min={1}
                max={3650}
                value={diasCustom}
                onChange={(e) => setDiasCustom(parseInt(e.target.value || '0', 10))}
                className="w-full bg-transparent outline-none"
              />
            </Field>
            <Field label="Tipo">
              <select
                value={tipoDiaCustom}
                onChange={(e) => setTipoDiaCustom(e.target.value as 'habil' | 'calendario')}
                className="w-full bg-transparent outline-none"
              >
                <option value="habil">Hábiles</option>
                <option value="calendario">Calendario</option>
              </select>
            </Field>
          </div>
        )}

        <label className="flex items-center gap-2 text-[12.5px]">
          <input
            type="checkbox"
            checked={incluirInicio}
            onChange={(e) => setIncluirInicio(e.target.checked)}
          />
          Incluir día de inicio en el conteo
        </label>

        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? (
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          ) : (
            <CalendarDays size={14} aria-hidden="true" />
          )}
          {busy ? 'Calculando…' : 'Calcular'}
        </button>
      </form>

      {result ? (
        <ResultPanel r={result} />
      ) : (
        <div className="surface flex items-center justify-center p-6 muted">
          Ingresa los datos y obtendrás la fecha de vencimiento con detalle día a día.
        </div>
      )}
    </div>
  );
}

function ResultPanel({ r }: { r: PlazoResponse }) {
  return (
    <div className="surface p-[var(--pad-card)]">
      <div className="flex items-baseline gap-3">
        <div className="serif text-[36px] font-semibold text-accent">{r.fecha_vence}</div>
        <div className="text-[12px] muted">Vence el</div>
      </div>
      <div className="mt-1 text-[13px]">
        <strong>{r.dias_total}</strong> días {r.tipo_dia} · desde {r.fecha_inicio}
      </div>
      <div className="mt-2 text-[11.5px] muted">{r.fundamento}</div>

      {(r.festivos_excluidos.length > 0 || r.vacancias_excluidas.length > 0) && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {r.festivos_excluidos.length > 0 && (
            <div className="rounded-md border border-line bg-bg-sunken p-3 text-[11.5px]">
              <div className="font-semibold">Festivos excluidos</div>
              <ul className="mt-1 space-y-0.5">
                {r.festivos_excluidos.map((f) => <li key={f} className="muted">{f}</li>)}
              </ul>
            </div>
          )}
          {r.vacancias_excluidas.length > 0 && (
            <div className="rounded-md border border-line bg-bg-sunken p-3 text-[11.5px]">
              <div className="font-semibold">Vacancia judicial</div>
              <ul className="mt-1 space-y-0.5">
                {r.vacancias_excluidas.map((v, i) => (
                  <li key={i} className="muted">
                    {v.label}: {v.from} → {v.to}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <details className="mt-4">
        <summary className="cursor-pointer text-[11.5px] font-medium text-accent">
          Detalle día por día ({r.detalle_dias.length})
        </summary>
        <div className="mt-2 max-h-[380px] overflow-auto rounded-md border border-line">
          <table className="w-full text-[12px]">
            <thead className="bg-bg-sunken text-[10.5px] uppercase tracking-wider text-ink-3">
              <tr>
                <th className="px-2 py-1.5 text-left">Fecha</th>
                <th className="px-2 py-1.5 text-left">Estado</th>
                <th className="px-2 py-1.5 text-left">Cuenta</th>
              </tr>
            </thead>
            <tbody>
              {r.detalle_dias.map((d) => (
                <tr key={d.fecha} className="border-t border-line">
                  <td className="px-2 py-1 mono">{d.fecha}</td>
                  <td className="px-2 py-1">{d.label || '—'}</td>
                  <td className="px-2 py-1">{d.cuenta ? '✓' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-wider muted">
        {label}
      </label>
      <div className="rounded-md border border-line bg-bg-elev p-[10px_12px] text-[14px] focus-within:border-accent">
        {children}
      </div>
    </div>
  );
}
