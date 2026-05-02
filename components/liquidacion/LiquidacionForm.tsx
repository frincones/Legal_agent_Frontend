'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Ic } from '@/components/atoms/icons';
import { formatCOP } from '@/lib/utils';

type Causa = 'injustificado' | 'justa_causa' | 'renuncia' | 'mutuo_acuerdo' | 'terminacion_contrato' | 'fin_obra';
type TipoContrato = 'indefinido' | 'fijo' | 'obra_labor' | 'aprendizaje';

type LineItem = {
  concepto: string;
  formula: string;
  monto_cop: number;
  fundamento?: string | null;
  nota?: string | null;
};

type Result = {
  id: string;
  total_cop: number;
  causa: string;
  aplica_indemnizacion: boolean;
  line_items: LineItem[];
  desglose_legible: string;
};

export function LiquidacionForm({ matterId }: { matterId?: string }) {
  const [trabajadorNombre, setTrabajadorNombre] = useState('');
  const [fechaIngreso, setFechaIngreso] = useState('');
  const [fechaTerminacion, setFechaTerminacion] = useState('');
  const [salarioMensual, setSalarioMensual] = useState<number>(0);
  const [causa, setCausa] = useState<Causa>('injustificado');
  const [tipoContrato, setTipoContrato] = useState<TipoContrato>('indefinido');
  const [salarioIntegral, setSalarioIntegral] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!fechaIngreso || !fechaTerminacion || !salarioMensual) {
      toast.error('Completa todos los campos');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/calc/liquidacion', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          fecha_ingreso: fechaIngreso,
          fecha_terminacion: fechaTerminacion,
          salario_mensual_cop: salarioMensual,
          causa,
          tipo_contrato: tipoContrato,
          salario_integral: salarioIntegral,
          trabajador_nombre: trabajadorNombre || null,
          matter_id: matterId,
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Cálculo falló: ${txt.slice(0, 200)}`);
      }
      const data = (await res.json()) as Result;
      setResult(data);
      toast.success(`Liquidación calculada: ${formatCOP(data.total_cop)}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1fr]">
      <form onSubmit={submit} className="surface flex flex-col gap-4 p-[var(--pad-card)]">
        <h3 className="serif m-0 text-[16px] font-semibold">Datos del trabajador</h3>

        <Field label="Nombre del trabajador (opcional)">
          <input
            type="text"
            value={trabajadorNombre}
            onChange={(e) => setTrabajadorNombre(e.target.value)}
            placeholder="María Rodríguez Velázquez"
            className="w-full bg-transparent outline-none"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha de ingreso">
            <input
              type="date"
              required
              value={fechaIngreso}
              onChange={(e) => setFechaIngreso(e.target.value)}
              className="w-full bg-transparent outline-none"
            />
          </Field>
          <Field label="Fecha de terminación">
            <input
              type="date"
              required
              value={fechaTerminacion}
              onChange={(e) => setFechaTerminacion(e.target.value)}
              className="w-full bg-transparent outline-none"
            />
          </Field>
        </div>

        <Field label="Salario mensual (COP)">
          <input
            type="number"
            required
            min={0}
            step={1000}
            value={salarioMensual || ''}
            onChange={(e) => setSalarioMensual(Number(e.target.value))}
            placeholder="4500000"
            className="w-full bg-transparent outline-none"
          />
        </Field>

        <Field label="Causa de terminación">
          <select
            value={causa}
            onChange={(e) => setCausa(e.target.value as Causa)}
            className="w-full bg-transparent outline-none"
          >
            <option value="injustificado">Despido sin justa causa</option>
            <option value="justa_causa">Despido con justa causa</option>
            <option value="renuncia">Renuncia voluntaria</option>
            <option value="mutuo_acuerdo">Mutuo acuerdo</option>
            <option value="terminacion_contrato">Terminación del contrato</option>
            <option value="fin_obra">Fin de obra/labor</option>
          </select>
        </Field>

        <Field label="Tipo de contrato">
          <select
            value={tipoContrato}
            onChange={(e) => setTipoContrato(e.target.value as TipoContrato)}
            className="w-full bg-transparent outline-none"
          >
            <option value="indefinido">Indefinido</option>
            <option value="fijo">Término fijo</option>
            <option value="obra_labor">Obra o labor</option>
            <option value="aprendizaje">Aprendizaje</option>
          </select>
        </Field>

        <label className="flex items-center gap-2 text-[12.5px]">
          <input
            type="checkbox"
            checked={salarioIntegral}
            onChange={(e) => setSalarioIntegral(e.target.checked)}
          />
          Salario integral (≥10 SMMLV) · Ley 50/1990 Art. 18
        </label>

        <button type="submit" disabled={busy} className="btn btn-primary btn-lg w-full justify-center">
          {busy ? 'Calculando…' : <>Calcular liquidación {Ic.arrow}</>}
        </button>
      </form>

      <div className="surface p-[var(--pad-card)]">
        <h3 className="serif m-0 text-[16px] font-semibold">Resultado</h3>
        {!result ? (
          <div className="mt-3 muted text-[12.5px]">
            Completa el formulario · cero alucinación numérica · cálculo determinista CST + Ley 50/1990 + Ley 789/2002.
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-2.5">
            <div className="serif tabular text-[34px] font-semibold text-ok -tracking-[0.02em]">
              {formatCOP(result.total_cop)}
            </div>
            <div className="text-[12px] muted">
              Total reclamable · {result.aplica_indemnizacion ? 'incluye indemnización' : 'sin indemnización'}
            </div>
            <ul className="mt-3 flex flex-col gap-1.5">
              {result.line_items.map((i, idx) => (
                <li key={idx} className="rounded-md bg-bg-sunken p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] font-semibold">{i.concepto}</span>
                    <span className="serif tabular text-[13px] text-ink">{formatCOP(i.monto_cop)}</span>
                  </div>
                  <div className="mono mt-1 text-[10.5px] muted">{i.formula}</div>
                  {i.fundamento && (
                    <div className="mt-1 text-[10.5px] muted">📌 {i.fundamento}</div>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-2 flex gap-2">
              <button className="btn btn-sm">{Ic.download} Exportar a Word</button>
              <button className="btn btn-sm btn-primary">Adjuntar a demanda</button>
            </div>
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
