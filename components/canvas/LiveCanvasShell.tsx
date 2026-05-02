'use client';

import { useState } from 'react';
import { Ic } from '@/components/atoms/icons';
import { cn, formatCOP } from '@/lib/utils';

export type SentenciaSeed = {
  id: string;
  citation_ref: string;
  rubro: string;
  corte: 'CORTE_CONSTITUCIONAL' | 'CORTE_SUPREMA' | 'CONSEJO_ESTADO';
  sala?: string;
  tipo_sentencia: 'T' | 'C' | 'SU' | 'CASACION';
  relevancia: 'Muy alta' | 'Alta' | 'Media';
  vigencia: 'vigente' | 'superada' | 'modulada';
  fragmento: string;
  url_oficial?: string;
};

export type ToolSnapshot = {
  id: string;
  name: string;
  label: string;
  status: 'queued' | 'running' | 'done';
  time: string;
  result?: string;
};

export function LiveCanvasShell({
  sentencias,
  tools,
}: {
  sentencias: SentenciaSeed[];
  tools: ToolSnapshot[];
}) {
  const [phase] = useState<'tools' | 'streaming' | 'done'>('streaming');

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[320px_1fr_300px] border-t border-line">
      {/* TRANSCRIPT RAIL */}
      <aside className="flex min-h-0 flex-col border-r border-line bg-bg">
        <div className="border-b border-line px-4 py-3">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider muted">
            Transcripción
          </div>
          <div className="mt-[2px] text-[11px] text-ink-3">OpenAI Realtime · gpt-realtime</div>
        </div>
        <div className="flex-1 overflow-auto p-3 text-[13px] leading-relaxed">
          <TranscriptBlock when="09:11:03 · dictado">
            <span className="text-ink-2">
              &ldquo;Redáctame demanda laboral por despido sin justa causa, mi cliente{' '}
              <b className="text-ink">María Rodríguez</b> trabajaba en{' '}
              <b className="text-ink">Comcel</b> 7 años 2 meses, le inventaron 3 faltas, salario
              4 millones 500 mil. Incluye cesantías y prima.&rdquo;
            </span>
          </TranscriptBlock>
          <TranscriptBlock when="09:11:09 · LexAI" tone="ok">
            <span className="serif">
              Claro, déjame revisar el expediente. Voy a buscar jurisprudencia reciente sobre
              despidos sin justa causa, validar las citas y calcular las prestaciones según CST.
            </span>
          </TranscriptBlock>
          <TranscriptBlock when="09:11:14 · LexAI" tone="ok">
            <span className="serif">
              Listo. He preparado la demanda con 3 sentencias verificadas y el cálculo de
              prestaciones por <b>{formatCOP(42_318_000)}</b>. ¿Quieres que revisemos las
              pretensiones juntos?
            </span>
          </TranscriptBlock>
        </div>
      </aside>

      {/* DOCUMENT SURFACE */}
      <section className="overflow-auto bg-bg-sunken p-8 pb-32">
        <div className="mx-auto max-w-[760px] rounded-[4px] border border-line bg-bg-elev p-[56px_64px] shadow-2 font-serif text-[13.5px] leading-[1.65]">
          <header className="mb-[22px] border-b border-line pb-[18px] text-center">
            <div className="text-[11px] uppercase tracking-widest muted">
              JUZGADO 12 LABORAL DEL CIRCUITO DE BOGOTÁ · EXP. 11001-31-05-012-2026-00473-00
            </div>
            <h1 className="serif m-[8px_0_0] text-[22px] font-semibold leading-[1.2] -tracking-[0.01em]">
              DEMANDA ORDINARIA LABORAL POR DESPIDO SIN JUSTA CAUSA
            </h1>
            <div className="mt-2 text-[12px] muted">
              MARÍA RODRÍGUEZ VELÁZQUEZ <b>vs.</b> COMUNICACIÓN CELULAR S.A. (COMCEL)
            </div>
          </header>

          <p className="mb-3 text-justify">
            <b>HONORABLE JUEZ:</b>
          </p>
          <p className="mb-3 text-justify">
            <b>MARÍA RODRÍGUEZ VELÁZQUEZ</b>, mayor de edad, identificada con C.C. 41.123.456,
            obrando en nombre propio, con dirección de notificación judicial Av. El Dorado #68B-31
            de Bogotá D.C., autorizando para tales efectos a la Lic. Ana Álvarez Martínez (T.P.
            123.456 del C.S. de la J.), respetuosamente formulo demanda ordinaria laboral en
            contra de <b>COMUNICACIÓN CELULAR S.A. (COMCEL)</b>, con NIT 800.153.993-7 y domicilio
            en Bogotá, para que se declaren las pretensiones que adelante se precisan.
          </p>

          <h2 className="serif m-[22px_0_8px] text-[14px] font-bold uppercase tracking-wider">
            I. PRETENSIONES
          </h2>
          <ol className="ml-6 list-decimal">
            <li className="mb-2 text-justify">
              El pago de <b>cesantías</b> y sus intereses al 12% anual conforme a la Ley 50/1990
              y el Art. 249 del CST.
            </li>
            <li className="mb-2 text-justify">
              El pago de la <b>prima de servicios</b> conforme al Art. 306 CST modificado por la
              Ley 1788/2016.
            </li>
            <li className="mb-2 text-justify">
              El pago de la <b>indemnización por despido sin justa causa</b> calculada conforme al
              Art. 64 CST modificado por el Art. 28 de la Ley 789/2002.
            </li>
            <li className="mb-2 text-justify">
              El pago de las <b>vacaciones</b> proporcionales y compensadas (Arts. 186 y 189 CST).
            </li>
            <li className="mb-2 text-justify">Indexación e intereses de mora.</li>
          </ol>

          <h2 className="serif m-[22px_0_8px] text-[14px] font-bold uppercase tracking-wider">
            II. HECHOS
          </h2>
          <p className="mb-3 text-justify">
            <b>1.</b> La demandante ingresó a prestar sus servicios personales subordinados a favor
            de la demandada el día <b>15 de enero de 2019</b>, desempeñándose como Ejecutiva
            Comercial Senior con último salario mensual de <b>COP $4.500.000</b>.
          </p>
          <p className="mb-3 text-justify">
            <b>2.</b> El día <b>14 de marzo de 2026</b> la demandada notificó verbalmente la
            terminación del contrato de trabajo, imputándole a mi representada tres faltas
            injustificadas en los días 8, 9 y 10 de marzo, las cuales <b>niega categóricamente</b>.
          </p>
          <p className="mb-3 text-justify">
            <b>3.</b> Sirve de fundamento la sentencia{' '}
            <a className="cite-verified" title="Verificada vs Corte Constitucional">
              T-388/2019
            </a>
            , que protege la estabilidad laboral cuando el empleador invoca causal aparente sin
            acreditarla. Sobre la carga de la prueba aplica la sentencia{' '}
            <a className="cite-verified" title="Verificada">
              C-200/1995
            </a>{' '}
            y el Art. 177 del CGP.
          </p>

          {phase === 'streaming' && (
            <>
              <p className="mb-3 text-justify">
                <b>4.</b> Por cuanto hace al cálculo de la indemnización, conforme al Art. 64 CST
                modificado por la Ley 789/2002 y la sentencia{' '}
                <a className="cite-verified">SU-449/2020</a> arroja un total de{' '}
                <b>{formatCOP(13_500_000)}</b>.
              </p>
              <h2 className="serif m-[22px_0_8px] text-[14px] font-bold uppercase tracking-wider">
                III. DERECHO
              </h2>
              <div className="mb-2 h-[14px] w-[92%] shimmer" />
              <div className="mb-2 h-[14px] w-[88%] shimmer" />
              <div className="h-[14px] w-[60%] shimmer" />
            </>
          )}

          <footer className="mt-7 border-t border-dashed border-line pt-[14px]">
            <div className="text-[10.5px] leading-relaxed muted">
              Documento generado con asistencia de IA (LexAI v0.9). Validado por Lic. Ana Álvarez
              Martínez — T.P. 123.456 del C.S. de la Judicatura. No constituye representación
              legal. SHA-256: a3f2…9e1d.
            </div>
          </footer>
        </div>
      </section>

      {/* TOOLS RAIL */}
      <aside className="flex min-h-0 flex-col border-l border-line bg-bg">
        <div className="border-b border-line px-4 py-3">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider muted">
            Herramientas
          </div>
          <div className="mt-[2px] text-[11px] text-ink-3">
            {tools.length} tools · OpenAI Realtime
          </div>
        </div>
        <div className="flex-1 overflow-auto p-[10px_12px]">
          {tools.map((t) => (
            <ToolRow key={t.id} t={t} />
          ))}
          <div className="mt-3 border-t border-line pt-3">
            <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider muted">
              Citas verificadas
            </div>
            {sentencias.map((s) => (
              <div key={s.id} className="border-b border-dashed border-line py-2 last:border-0">
                <div className="flex items-center gap-1.5">
                  <span className="dot bg-ok" />
                  <span className="mono text-[10.5px] muted">{s.citation_ref}</span>
                  <span
                    className={cn(
                      'chip ml-auto text-[10px]',
                      s.relevancia === 'Muy alta' ? 'chip-green' : 'chip-blue',
                    )}
                  >
                    {s.relevancia}
                  </span>
                </div>
                <div className="mt-1 text-[11.5px] font-medium leading-snug">
                  {s.rubro.slice(0, 90)}…
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 border-t border-line pt-3">
            <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider muted">
              Prestaciones (CST)
            </div>
            <CalcRow l="Cesantías + intereses 12%" v={formatCOP(11_350_000)} />
            <CalcRow l="Prima de servicios" v={formatCOP(8_400_000)} />
            <CalcRow l="Vacaciones + compensación" v={formatCOP(2_100_000)} />
            <CalcRow l="Indemnización Art. 64 CST" v={formatCOP(13_500_000)} />
            <CalcRow l="Auxilio transporte retroactivo" v={formatCOP(0)} />
            <div className="mt-2 flex justify-between border-t border-line pt-2">
              <span className="text-[12px] font-semibold">Total reclamable</span>
              <span className="serif tabular text-[15px] font-semibold text-ok">
                {formatCOP(42_318_000)}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function TranscriptBlock({
  when,
  tone,
  children,
}: {
  when: string;
  tone?: 'ok';
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2 rounded-md border border-line bg-bg-elev p-[10px_12px]">
      <div className={cn('mb-1 text-[10.5px]', tone === 'ok' ? 'text-ok' : 'muted')}>{when}</div>
      <div className="text-ink-2">{children}</div>
    </div>
  );
}

function ToolRow({ t }: { t: ToolSnapshot }) {
  return (
    <div
      className={cn(
        'mb-[2px] flex items-start gap-[10px] rounded-md p-2',
        t.status === 'running' && 'bg-purple-soft',
      )}
    >
      <span className="mt-[2px] grid h-[18px] w-[18px] flex-none place-items-center text-ok">
        {t.status === 'done' ? (
          Ic.check
        ) : t.status === 'running' ? (
          <span
            className="block h-[11px] w-[11px] rounded-full border border-black/15 border-t-purple"
            style={{ animation: 'lex-rot 0.8s linear infinite' }}
          >
            <style>{`@keyframes lex-rot { to { transform: rotate(360deg); } }`}</style>
          </span>
        ) : (
          <span className="dot bg-ink-4" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="mono text-[11px] muted">{t.name}</div>
        <div className="mt-[1px] text-[12.5px] font-medium">{t.label}</div>
        {t.result && <div className="mt-[2px] text-[11px] muted">{t.result}</div>}
      </div>
      <div className="mono text-[10.5px] muted">{t.time}</div>
    </div>
  );
}

function CalcRow({ l, v }: { l: string; v: string }) {
  return (
    <div className="flex justify-between py-[3px] text-[11.5px]">
      <span className="muted">{l}</span>
      <span className="mono tabular font-medium">{v}</span>
    </div>
  );
}
