'use client';

import { useEffect, useState } from 'react';
import {
  getUsage, listAudit, getRateLimits, listHabeasExports, requestHabeasExport, downloadHabeasUrl,
  type UsageSummary, type AuditEvent, type RateLimit, type HabeasExport,
} from '@/lib/api/v2/admin';

export default function AdminDashboard() {
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [limits, setLimits] = useState<RateLimit[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [exports, setExports] = useState<HabeasExport[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [subject, setSubject] = useState<{ kind: 'cedula' | 'email' | 'client_id'; id: string }>({ kind: 'cedula', id: '' });

  const reload = async () => {
    try {
      const [u, l, a, e] = await Promise.all([
        getUsage(),
        getRateLimits(),
        listAudit(50),
        listHabeasExports(20),
      ]);
      setUsage(u);
      setLimits(l.items);
      setAudit(a.items);
      setExports(e.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };
  useEffect(() => { void reload(); }, []);

  const requestExport = async () => {
    if (!subject.id) return;
    setBusy(true);
    try {
      await requestHabeasExport(subject.kind, subject.id);
      setSubject({ ...subject, id: '' });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Administracion · Hardening</h1>
      {error && <div className="text-sm bg-red-50 text-red-700 p-3 rounded">{error}</div>}

      {/* Usage summary */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide mb-3">
          Uso del mes {usage?.period_month ?? ''}
        </h2>
        {usage && usage.items.length > 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200">
                <tr>
                  <th className="text-left p-2 text-xs text-zinc-600">Recurso</th>
                  <th className="text-right p-2 text-xs text-zinc-600">Count</th>
                  <th className="text-right p-2 text-xs text-zinc-600">Costo USD</th>
                </tr>
              </thead>
              <tbody>
                {usage.items.map((i) => (
                  <tr key={i.resource_type} className="border-b border-zinc-100 last:border-0">
                    <td className="p-2 text-zinc-900">{i.resource_type}</td>
                    <td className="p-2 text-right tabular-nums">{i.count}</td>
                    <td className="p-2 text-right tabular-nums">${i.cost_usd.toFixed(4)}</td>
                  </tr>
                ))}
                <tr className="bg-zinc-50 font-medium">
                  <td className="p-2">Total</td>
                  <td className="p-2 text-right">—</td>
                  <td className="p-2 text-right tabular-nums">${usage.total_cost_usd.toFixed(4)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-sm text-zinc-500">Sin actividad registrada este mes.</div>
        )}
      </section>

      {/* Rate limits */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide mb-3">
          Rate limits actuales
        </h2>
        {limits.length > 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200">
                <tr>
                  <th className="text-left p-2 text-xs text-zinc-600">Recurso</th>
                  <th className="text-right p-2 text-xs text-zinc-600">Ultimo min</th>
                  <th className="text-right p-2 text-xs text-zinc-600">Ultima hora</th>
                  <th className="text-right p-2 text-xs text-zinc-600">Limite min/hr</th>
                </tr>
              </thead>
              <tbody>
                {limits.map((l) => (
                  <tr key={l.resource_type} className="border-b border-zinc-100 last:border-0">
                    <td className="p-2">{l.resource_type}</td>
                    <td className="p-2 text-right tabular-nums">{l.count_minute}</td>
                    <td className="p-2 text-right tabular-nums">{l.count_hour}</td>
                    <td className="p-2 text-right text-xs text-zinc-500">{l.limit_minute} / {l.limit_hour}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-sm text-zinc-500">Sin actividad reciente.</div>
        )}
      </section>

      {/* Habeas Data */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide mb-3">
          Habeas Data · Ley 1581/2012
        </h2>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 mb-3">
          <div className="flex gap-2 items-end">
            <div>
              <label className="text-xs text-zinc-600 mb-1 block">Tipo</label>
              <select
                value={subject.kind}
                onChange={(e) => setSubject({ ...subject, kind: e.target.value as typeof subject.kind })}
                className="rounded border border-zinc-300 px-2 py-1.5 text-sm"
              >
                <option value="cedula">cedula</option>
                <option value="email">email</option>
                <option value="client_id">client_id</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-zinc-600 mb-1 block">Valor</label>
              <input
                value={subject.id}
                onChange={(e) => setSubject({ ...subject, id: e.target.value })}
                placeholder="ej: 1234567890"
                className="w-full rounded border border-zinc-300 px-3 py-1.5 text-sm"
              />
            </div>
            <button
              onClick={() => void requestExport()}
              disabled={busy || !subject.id}
              className="rounded bg-zinc-900 text-white text-sm px-4 py-1.5 hover:bg-zinc-800 disabled:opacity-50"
            >
              {busy ? '…' : 'Generar export'}
            </button>
          </div>
        </div>
        {exports.length > 0 ? (
          <ul className="space-y-2">
            {exports.map((ex) => (
              <li key={ex.export_id} className="rounded border border-zinc-200 bg-white p-3 flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{ex.subject_kind}: {ex.subject_id}</div>
                  <div className="text-xs text-zinc-500">
                    {ex.status} · {ex.tables_included?.length || 0} tablas · {ex.file_size_bytes ? `${(ex.file_size_bytes/1024).toFixed(1)}KB` : '—'}
                  </div>
                </div>
                {ex.status === 'ready' && (
                  <a
                    href={downloadHabeasUrl(ex.export_id)}
                    target="_blank"
                    className="text-xs rounded border border-zinc-300 text-zinc-700 px-3 py-1 hover:bg-zinc-50"
                  >
                    Descargar JSON
                  </a>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-zinc-500">Sin exports.</div>
        )}
      </section>

      {/* Audit log */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide mb-3">
          Audit log · ultimos 50 eventos
        </h2>
        {audit.length > 0 ? (
          <ul className="rounded-lg border border-zinc-200 bg-white divide-y divide-zinc-100 max-h-96 overflow-auto">
            {audit.map((e) => (
              <li key={e.event_id} className="p-3 text-xs">
                <div className="flex items-baseline justify-between gap-3">
                  <code className="text-zinc-700">{e.event_kind}</code>
                  <span className="text-zinc-400">{e.created_at?.replace('T', ' ').slice(0, 16)}</span>
                </div>
                {e.summary && <div className="text-zinc-600 mt-1">{e.summary}</div>}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-zinc-500">Sin eventos de audit.</div>
        )}
      </section>
    </div>
  );
}
