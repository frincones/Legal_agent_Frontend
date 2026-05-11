'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, ScaleIcon, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatCOP } from '@/lib/utils';

type Tipo = 'vejez' | 'invalidez' | 'sobrevivencia' | 'orfandad';

const TIPO_LABEL: Record<Tipo, string> = {
  vejez: 'Pensión de vejez',
  invalidez: 'Pensión de invalidez',
  sobrevivencia: 'Pensión de sobrevivencia',
  orfandad: 'Pensión de orfandad',
};

type PensionResponse = {
  tipo: string;
  elegible: boolean;
  razon: string;
  ibl_cop: number | null;
  monto_mensual_cop: number | null;
  porcentaje_aplicado: number | null;
  requisitos: Array<{ label: string; exigido: number | string; real: number | string; cumple: boolean }>;
  fundamento: string;
  observaciones: string[];
  desglose_legible: string;
};

export function PensionForm() {
  const [tipo, setTipo] = useState<Tipo>('vejez');
  const [genero, setGenero] = useState<'mujer' | 'hombre'>('mujer');
  const [fechaNac, setFechaNac] = useState('');
  const [semanasTotal, setSemanasTotal] = useState<number | ''>('');
  const [semanas3a, setSemanas3a] = useState<number | ''>('');
  const [ibl, setIbl] = useState<number | ''>('');
  const [pcl, setPcl] = useState<number | ''>('');
  const [esEstudiante, setEsEstudiante] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PensionResponse | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const body: Record<string, unknown> = { tipo };
      if (tipo === 'vejez') {
        if (!fechaNac) throw new Error('Fecha de nacimiento requerida.');
        body.genero = genero;
        body.fecha_nacimiento = fechaNac;
        body.semanas_cotizadas_total = semanasTotal || 0;
        body.ibl_promedio_cop = ibl || null;
      } else if (tipo === 'invalidez') {
        body.porcentaje_perdida_capacidad = pcl || 0;
        body.semanas_ultimos_3_anios = semanas3a || 0;
        body.semanas_cotizadas_total = semanasTotal || 0;
        body.ibl_promedio_cop = ibl || null;
      } else if (tipo === 'sobrevivencia') {
        body.semanas_ultimos_3_anios = semanas3a || 0;
        body.ibl_promedio_cop = ibl || null;
      } else if (tipo === 'orfandad') {
        if (!fechaNac) throw new Error('Fecha de nacimiento del hijo requerida.');
        body.fecha_nacimiento = fechaNac;
        body.es_estudiante = esEstudiante;
      }
      const res = await fetch('/api/calc/pension', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text.slice(0, 200) || `Error ${res.status}`);
      }
      const data = (await res.json()) as PensionResponse;
      setResult(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error calculando');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-[420px_1fr]">
      <form onSubmit={submit} className="surface flex flex-col gap-4 p-[var(--pad-card)]">
        <h3 className="serif text-[15px] font-semibold">Calcular pensión</h3>

        <Field label="Tipo">
          <select
            value={tipo}
            onChange={(e) => { setTipo(e.target.value as Tipo); setResult(null); }}
            className="w-full bg-transparent outline-none"
          >
            {Object.entries(TIPO_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>

        {tipo === 'vejez' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Género (afecta edad mínima)">
                <select
                  value={genero}
                  onChange={(e) => setGenero(e.target.value as 'mujer' | 'hombre')}
                  className="w-full bg-transparent outline-none"
                >
                  <option value="mujer">Mujer (57 años)</option>
                  <option value="hombre">Hombre (62 años)</option>
                </select>
              </Field>
              <Field label="Fecha de nacimiento">
                <input
                  type="date"
                  required
                  value={fechaNac}
                  onChange={(e) => setFechaNac(e.target.value)}
                  className="w-full bg-transparent outline-none"
                />
              </Field>
            </div>
            <Field label="Semanas cotizadas (total)">
              <input
                type="number"
                min={0}
                max={3000}
                value={semanasTotal}
                onChange={(e) => setSemanasTotal(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                placeholder="Ej: 1300"
                className="w-full bg-transparent outline-none"
              />
            </Field>
            <Field label="IBL promedio mensual (COP, opcional)">
              <input
                type="number"
                min={0}
                step={10000}
                value={ibl}
                onChange={(e) => setIbl(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="Ej: 4500000"
                className="w-full bg-transparent outline-none"
              />
            </Field>
          </>
        )}

        {tipo === 'invalidez' && (
          <>
            <Field label="Pérdida de capacidad laboral (%)">
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={pcl}
                onChange={(e) => setPcl(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="Ej: 65"
                className="w-full bg-transparent outline-none"
              />
            </Field>
            <Field label="Semanas cotizadas en últimos 3 años">
              <input
                type="number"
                min={0}
                max={156}
                value={semanas3a}
                onChange={(e) => setSemanas3a(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                placeholder="Ej: 50"
                className="w-full bg-transparent outline-none"
              />
            </Field>
            <Field label="Semanas cotizadas (total · opcional)">
              <input
                type="number"
                min={0}
                max={3000}
                value={semanasTotal}
                onChange={(e) => setSemanasTotal(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                placeholder="Ej: 800"
                className="w-full bg-transparent outline-none"
              />
            </Field>
            <Field label="IBL promedio mensual (COP, opcional)">
              <input
                type="number"
                min={0}
                step={10000}
                value={ibl}
                onChange={(e) => setIbl(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full bg-transparent outline-none"
              />
            </Field>
          </>
        )}

        {tipo === 'sobrevivencia' && (
          <>
            <Field label="Semanas cotizadas del causante en últimos 3 años">
              <input
                type="number"
                min={0}
                max={156}
                value={semanas3a}
                onChange={(e) => setSemanas3a(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="w-full bg-transparent outline-none"
              />
            </Field>
            <Field label="IBL promedio del causante (COP, opcional)">
              <input
                type="number"
                min={0}
                step={10000}
                value={ibl}
                onChange={(e) => setIbl(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full bg-transparent outline-none"
              />
            </Field>
          </>
        )}

        {tipo === 'orfandad' && (
          <>
            <Field label="Fecha de nacimiento del hijo">
              <input
                type="date"
                required
                value={fechaNac}
                onChange={(e) => setFechaNac(e.target.value)}
                className="w-full bg-transparent outline-none"
              />
            </Field>
            <label className="flex items-center gap-2 text-[12.5px]">
              <input
                type="checkbox"
                checked={esEstudiante}
                onChange={(e) => setEsEstudiante(e.target.checked)}
              />
              Es estudiante (entre 18-25 años)
            </label>
          </>
        )}

        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? (
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          ) : (
            <ScaleIcon size={14} aria-hidden="true" />
          )}
          {busy ? 'Calculando…' : 'Verificar elegibilidad'}
        </button>
      </form>

      {result ? (
        <ResultPanel r={result} />
      ) : (
        <div className="surface flex items-center justify-center p-6 muted">
          Diligencia el formulario para verificar elegibilidad y monto estimado.
        </div>
      )}
    </div>
  );
}

function ResultPanel({ r }: { r: PensionResponse }) {
  return (
    <div className="surface p-[var(--pad-card)]">
      <div className={cn('flex items-center gap-3 rounded-md border p-4', r.elegible ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-amber-500/40 bg-amber-500/5')}>
        {r.elegible ? (
          <CheckCircle2 size={28} className="text-emerald-500" aria-hidden="true" />
        ) : (
          <XCircle size={28} className="text-amber-500" aria-hidden="true" />
        )}
        <div>
          <div className="serif text-[18px] font-semibold">
            {r.elegible ? 'Cumple requisitos' : 'No cumple requisitos'}
          </div>
          <div className="text-[12.5px] muted">{r.razon}</div>
        </div>
      </div>

      {r.monto_mensual_cop && (
        <div className="mt-4">
          <div className="text-[11px] uppercase tracking-wider muted">Mesada estimada</div>
          <div className="serif text-[36px] font-semibold text-accent">
            {formatCOP(r.monto_mensual_cop)}
          </div>
          {r.porcentaje_aplicado !== null && (
            <div className="text-[11.5px] muted">
              {r.porcentaje_aplicado.toFixed(1)}% del IBL ({r.ibl_cop ? formatCOP(r.ibl_cop) : '—'})
            </div>
          )}
        </div>
      )}

      <div className="mt-4">
        <div className="text-[11px] uppercase tracking-wider muted">Requisitos</div>
        <ul className="mt-2 space-y-1">
          {r.requisitos.map((q, i) => (
            <li key={i} className="flex items-center gap-2 text-[12.5px]">
              {q.cumple ? (
                <CheckCircle2 size={12} className="flex-none text-emerald-500" aria-hidden="true" />
              ) : (
                <XCircle size={12} className="flex-none text-red-500" aria-hidden="true" />
              )}
              <span className="flex-1">{q.label}</span>
              <span className="mono text-[11px] muted">
                {String(q.real)} / {String(q.exigido)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {r.observaciones.length > 0 && (
        <div className="mt-4 rounded-md border border-line bg-bg-sunken p-3 text-[11.5px] muted">
          {r.observaciones.map((o, i) => (<div key={i}>· {o}</div>))}
        </div>
      )}

      <div className="mt-4 text-[11px] muted">{r.fundamento}</div>
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
