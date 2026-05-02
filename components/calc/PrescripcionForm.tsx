'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Ic } from '@/components/atoms/icons';

type LineItem = {
  concepto: string;
  formula: string;
  monto_cop: number;
  fundamento?: string | null;
  nota?: string | null;
};

type Result = {
  id: string;
  tipo_accion: string;
  fundamento: string;
  fecha_exigibilidad: string;
  fecha_interrupcion: string | null;
  fecha_inicio_efectivo: string;
  fecha_prescripcion: string;
  fecha_calculo: string;
  dias_restantes: number;
  prescrita: boolean;
  line_items: LineItem[];
  desglose_legible: string;
};

const TIPO_LABEL: Record<string, string> = {
  civil_ordinaria: 'Civil ordinaria · 10 años',
  civil_ejecutiva: 'Civil ejecutiva · 5 años',
  comercial_ordinaria: 'Comercial ordinaria · 10 años',
  comercial_ejecutiva: 'Comercial ejecutiva · 3 años',
  laboral: 'Laboral · 3 años (CST 488)',
  familiar_alimentos: 'Familiar alimentos · 5 años',
  accion_revision: 'Acción de revisión · 2 años (CGP 354)',
  penal_querella: 'Penal querella · 6 meses (CPP 73)',
};

export function PrescripcionForm({ matterId }: { matterId?: string }) {
  const router = useRouter();
  const [caseLabel, setCaseLabel] = useState('');
  const [tipoAccion, setTipoAccion] = useState<string>('civil_ordinaria');
  const [fechaExigibilidad, setFechaExigibilidad] = useState('');
  const [fechaInterrupcion, setFechaInterrupcion] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!fechaExigibilidad) {
      toast.error('Captura la fecha de exigibilidad.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/calc/prescripcion', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          tipo_accion: tipoAccion,
          fecha_exigibilidad: fechaExigibilidad,
          fecha_interrupcion: fechaInterrupcion || null,
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
      toast.success(
        data.prescrita
          ? `PRESCRITA hace ${Math.abs(data.dias_restantes)} días`
          : `Vence el ${data.fecha_prescripcion} · ${data.dias_restantes} días`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1fr]">
      <form onSubmit={submit} className="surface flex flex-col gap-4 p-[var(--pad-card)]">
        <h3 className="serif m-0 text-[16px] font-semibold">Datos de la acción</h3>

        <Field label="Etiqueta del cálculo (opcional)">
          <input
            type="text"
            value={caseLabel}
            onChange={(e) => setCaseLabel(e.target.value)}
            placeholder="Rodríguez vs. Comcel · obligación 2020"
            className="w-full bg-transparent outline-none"
          />
        </Field>

        <Field label="Tipo de acción">
          <select
            value={tipoAccion}
            onChange={(e) => setTipoAccion(e.target.value)}
            className="w-full bg-transparent outline-none"
          >
            {Object.entries(TIPO_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Fecha de exigibilidad">
            <input
              type="date"
              required
              value={fechaExigibilidad}
              onChange={(e) => setFechaExigibilidad(e.target.value)}
              className="w-full bg-transparent outline-none"
            />
          </Field>
          <Field label="Fecha de interrupción (opcional)">
            <input
              type="date"
              value={fechaInterrupcion}
              onChange={(e) => setFechaInterrupcion(e.target.value)}
              className="w-full bg-transparent outline-none"
            />
          </Field>
        </div>

        <p className="text-[11.5px] muted">
          La interrupción re-inicia el plazo desde la fecha indicada (CGP Art. 94 / CC Art. 2539).
          Aplica a notificación de demanda, reconocimiento expreso o pago parcial.
        </p>

        <button type="submit" disabled={busy} className="btn btn-primary btn-lg w-full justify-center">
          {busy ? 'Calculando…' : <>Calcular prescripción {Ic.arrow}</>}
        </button>
      </form>

      <div className="surface p-[var(--pad-card)]">
        <h3 className="serif m-0 text-[16px] font-semibold">Resultado</h3>
        {!result ? (
          <div className="mt-3 muted text-[12.5px]">
            Cálculo determinista basado en CC, C.Co., CST, CGP, CPP. Sin alucinación.
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-2.5">
            <div
              className={`serif tabular text-[28px] font-semibold -tracking-[0.02em] ${
                result.prescrita ? 'text-danger' : 'text-ok'
              }`}
            >
              {result.fecha_prescripcion}
            </div>
            <div className="text-[12px] muted">
              {result.prescrita
                ? `PRESCRITA hace ${Math.abs(result.dias_restantes)} días`
                : `Vigente · ${result.dias_restantes} días restantes`}
            </div>
            <ul className="mt-3 flex flex-col gap-1.5">
              {result.line_items.map((i, idx) => (
                <li key={idx} className="rounded-md bg-bg-sunken p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12.5px] font-semibold">{i.concepto}</span>
                  </div>
                  <div className="mono mt-1 text-[10.5px] muted">{i.formula}</div>
                  {i.nota && (
                    <div className="mt-1 text-[11px]">{i.nota}</div>
                  )}
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
