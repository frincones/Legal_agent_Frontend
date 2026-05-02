'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Ic } from '@/components/atoms/icons';
import { formatCOP } from '@/lib/utils';
import { uiCommandBus } from '@/lib/voice/ui-command-bus';

type LineItem = {
  concepto: string;
  formula: string;
  monto_cop: number;
  fundamento?: string | null;
  nota?: string | null;
};

type Result = {
  id: string;
  tipo_interes: string;
  fundamento: string;
  capital_cop: number;
  tasa_anual_aplicada: number;
  base_calculo: number;
  metodo: string;
  dias_mora: number;
  monto_intereses_cop: number;
  monto_total_cop: number;
  line_items: LineItem[];
  desglose_legible: string;
};

const TIPO_LABEL: Record<string, string> = {
  comercial_moratorio: 'Comercial moratorio · 1.5× corriente (Decreto 519/2007)',
  civil_legal: 'Civil legal · 6% supletivo (CC Art. 1617)',
  convencional: 'Convencional · tasa pactada en contrato',
};

export function InteresesForm({ matterId }: { matterId?: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [caseLabel, setCaseLabel] = useState('');
  const [tipoInteres, setTipoInteres] = useState<string>('comercial_moratorio');
  const [capital, setCapital] = useState<number>(0);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().slice(0, 10));
  const [tasaAnual, setTasaAnual] = useState<number | ''>('');
  const [base, setBase] = useState<360 | 365>(360);
  const [metodo, setMetodo] = useState<'simple' | 'compuesto'>('simple');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  // F1 · prefill API
  useEffect(() => {
    return uiCommandBus.registerForm('intereses', {
      setValues: (partial) => {
        if (typeof partial.caseLabel === 'string') setCaseLabel(partial.caseLabel);
        if (typeof partial.tipoInteres === 'string') setTipoInteres(partial.tipoInteres);
        if (typeof partial.capital === 'number') setCapital(partial.capital);
        else if (typeof partial.capital === 'string' && partial.capital) setCapital(Number(partial.capital));
        if (typeof partial.fechaInicio === 'string') setFechaInicio(partial.fechaInicio);
        if (typeof partial.fechaFin === 'string') setFechaFin(partial.fechaFin);
        if (typeof partial.tasaAnual === 'number') setTasaAnual(partial.tasaAnual);
        if (typeof partial.base === 'number' && (partial.base === 360 || partial.base === 365)) setBase(partial.base);
        if (typeof partial.metodo === 'string' && (partial.metodo === 'simple' || partial.metodo === 'compuesto'))
          setMetodo(partial.metodo);
      },
      submit: () => formRef.current?.requestSubmit(),
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!fechaInicio || !capital) {
      toast.error('Captura capital y fecha de inicio.');
      return;
    }
    if (tipoInteres === 'convencional' && !tasaAnual) {
      toast.error('Tipo convencional requiere tasa anual.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/calc/intereses', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          tipo_interes: tipoInteres,
          capital_cop: capital,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin || undefined,
          tasa_anual: tasaAnual === '' ? null : Number(tasaAnual),
          base_calculo: base,
          metodo,
          case_label: caseLabel || null,
          matter_id: matterId,
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Cálculo falló: ${txt.slice(0, 200)}`);
      }
      const data = (await res.json()) as Result;
      setResult(data);
      router.refresh();
      toast.success(`Total reclamable: ${formatCOP(data.monto_total_cop)}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1fr]">
      <form ref={formRef} onSubmit={submit} className="surface flex flex-col gap-4 p-[var(--pad-card)]">
        <h3 className="serif m-0 text-[16px] font-semibold">Datos del cálculo</h3>

        <Field label="Etiqueta (opcional)">
          <input
            type="text"
            value={caseLabel}
            onChange={(e) => setCaseLabel(e.target.value)}
            placeholder="Rodríguez · cobro factura 2024"
            className="w-full bg-transparent outline-none"
          />
        </Field>

        <Field label="Tipo de interés">
          <select
            value={tipoInteres}
            onChange={(e) => setTipoInteres(e.target.value)}
            className="w-full bg-transparent outline-none"
          >
            {Object.entries(TIPO_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>

        <Field label="Capital (COP)">
          <input
            type="number"
            required
            min={0}
            step={1000}
            value={capital || ''}
            onChange={(e) => setCapital(Number(e.target.value))}
            placeholder="10000000"
            className="w-full bg-transparent outline-none"
          />
        </Field>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Fecha de inicio (mora)">
            <input
              type="date"
              required
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full bg-transparent outline-none"
            />
          </Field>
          <Field label="Fecha de fin (default: hoy)">
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full bg-transparent outline-none"
            />
          </Field>
        </div>

        {tipoInteres === 'convencional' && (
          <Field label="Tasa anual pactada (decimal: 0.20 = 20%)">
            <input
              type="number"
              required
              step={0.001}
              min={0}
              max={0.30}
              value={tasaAnual === '' ? '' : tasaAnual}
              onChange={(e) => setTasaAnual(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0.20"
              className="w-full bg-transparent outline-none"
            />
          </Field>
        )}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Base de cálculo">
            <select
              value={base}
              onChange={(e) => setBase(Number(e.target.value) as 360 | 365)}
              className="w-full bg-transparent outline-none"
            >
              <option value={360}>360 días (comercial)</option>
              <option value={365}>365 días (civil)</option>
            </select>
          </Field>
          <Field label="Método">
            <select
              value={metodo}
              onChange={(e) => setMetodo(e.target.value as 'simple' | 'compuesto')}
              className="w-full bg-transparent outline-none"
            >
              <option value="simple">Simple (lineal)</option>
              <option value="compuesto">Compuesto (1+i)^t</option>
            </select>
          </Field>
        </div>

        <button type="submit" disabled={busy} className="btn btn-primary btn-lg w-full justify-center">
          {busy ? 'Calculando…' : <>Calcular intereses {Ic.arrow}</>}
        </button>
      </form>

      <div className="surface p-[var(--pad-card)]">
        <h3 className="serif m-0 text-[16px] font-semibold">Resultado</h3>
        {!result ? (
          <div className="mt-3 muted text-[12.5px]">
            Tasa moratoria 2026: 29.22% anual (1.5× corriente). Tasa civil legal: 6% supletivo.
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-2.5">
            <div className="serif tabular text-[28px] font-semibold text-ok -tracking-[0.02em]">
              {formatCOP(result.monto_total_cop)}
            </div>
            <div className="text-[12px] muted">
              Capital: {formatCOP(result.capital_cop)} · Intereses: {formatCOP(result.monto_intereses_cop)} ·{' '}
              {result.dias_mora} días · {(result.tasa_anual_aplicada * 100).toFixed(2)}% anual
            </div>
            <ul className="mt-3 flex flex-col gap-1.5">
              {result.line_items.map((i, idx) => (
                <li key={idx} className="rounded-md bg-bg-sunken p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12.5px] font-semibold">{i.concepto}</span>
                    <span className="serif tabular text-[13px] text-ink">
                      {formatCOP(i.monto_cop)}
                    </span>
                  </div>
                  <div className="mono mt-1 text-[10.5px] muted">{i.formula}</div>
                  {i.fundamento && (
                    <div className="mt-1 text-[10.5px] muted">📌 {i.fundamento}</div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-wider muted">
        {label}
      </label>
      <div className="rounded-md border border-line-strong bg-bg-elev p-[10px_12px] text-[14px] focus-within:border-accent">
        {children}
      </div>
    </div>
  );
}
