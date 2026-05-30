'use client';

/**
 * Sprint E · PlaybookEditor
 *
 * Editor para el CLAUDE.md de la firma. Mix de:
 *   - Markdown editor (raw_md)
 *   - Editores estructurados (forbidden_terms, required_clauses, etc)
 */

import { useCallback, useEffect, useState } from 'react';
import {
  Save, Loader2, BookOpen, Shield, ListChecks, Settings, FileText,
  Plus, X, Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

type Playbook = {
  jurisdiction_default: string;
  redline_style: 'tracked' | 'inline' | 'sidebar';
  tone: 'formal' | 'neutral' | 'aggressive';
  preferred_clauses: Record<string, string>;
  forbidden_terms: string[];
  required_clauses: string[];
  escalation_matrix: any[];
  raw_md: string | null;
  version?: number;
  updated_at?: string | null;
};

type Tab = 'general' | 'forbidden' | 'required' | 'preferred' | 'escalation' | 'raw';

export function PlaybookEditor() {
  const [pb, setPb] = useState<Playbook | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>('general');
  const [newForbidden, setNewForbidden] = useState('');
  const [newRequired, setNewRequired] = useState('');

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/firm/playbook', { cache: 'no-store' });
      if (r.ok) {
        const data = await r.json();
        setPb({
          jurisdiction_default: data.jurisdiction_default || 'co',
          redline_style: data.redline_style || 'tracked',
          tone: data.tone || 'formal',
          preferred_clauses: data.preferred_clauses || {},
          forbidden_terms: data.forbidden_terms || [],
          required_clauses: data.required_clauses || [],
          escalation_matrix: data.escalation_matrix || [],
          raw_md: data.raw_md || '',
          version: data.version,
          updated_at: data.updated_at,
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function save() {
    if (!pb) return;
    setSaving(true);
    try {
      const r = await fetch('/api/firm/playbook', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pb),
      });
      if (r.ok) {
        const data = await r.json();
        setPb(prev => ({ ...prev!, ...data }));
        toast.success('Playbook guardado');
      } else {
        toast.error('Error al guardar');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Error');
    } finally {
      setSaving(false);
    }
  }

  function addForbidden() {
    const t = newForbidden.trim();
    if (!t || !pb) return;
    if (pb.forbidden_terms.includes(t)) return;
    setPb({ ...pb, forbidden_terms: [...pb.forbidden_terms, t] });
    setNewForbidden('');
  }

  function removeForbidden(t: string) {
    if (!pb) return;
    setPb({ ...pb, forbidden_terms: pb.forbidden_terms.filter(x => x !== t) });
  }

  function addRequired() {
    const t = newRequired.trim();
    if (!t || !pb) return;
    if (pb.required_clauses.includes(t)) return;
    setPb({ ...pb, required_clauses: [...pb.required_clauses, t] });
    setNewRequired('');
  }

  function removeRequired(t: string) {
    if (!pb) return;
    setPb({ ...pb, required_clauses: pb.required_clauses.filter(x => x !== t) });
  }

  // M20.11 · cold-start interview vía LLM
  const [coldStarting, setColdStarting] = useState(false);
  async function runColdStart() {
    if (!confirm(
      'Vamos a generar un playbook inicial vía IA en ~10s. Sobreescribirá tu playbook actual. ¿Continuar?'
    )) return;
    setColdStarting(true);
    try {
      const areas = window.prompt(
        'Áreas de práctica (separadas por coma):',
        'civil, comercial, laboral'
      ) || 'general';
      const tone = pb?.tone || 'formal';
      const r = await fetch('/api/firm/playbook/cold-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          practice_areas: areas.split(',').map(s => s.trim()).filter(Boolean),
          tone,
        }),
      });
      if (r.ok) {
        toast.success('Playbook generado por IA');
        await refresh();
      } else {
        const txt = await r.text();
        toast.error(`Cold-start falló: ${txt.slice(0, 120)}`);
      }
    } catch (e: any) {
      toast.error(e?.message || 'Error en cold-start');
    } finally {
      setColdStarting(false);
    }
  }

  if (loading) {
    return (
      <div className="surface p-4 flex items-center gap-2">
        <Loader2 size={14} className="animate-spin" /> Cargando playbook…
      </div>
    );
  }
  if (!pb) return null;

  return (
    <div className="grid gap-4">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="serif text-[18px] font-semibold flex items-center gap-2">
            <BookOpen size={18} /> Playbook del despacho
          </h2>
          <p className="text-[12.5px] muted mt-0.5">
            Reglas que LexAI aplica al redactar y revisar documentos · todas las skills lo leen automáticamente.
            {pb.version && <span> · versión {pb.version}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={runColdStart}
            disabled={coldStarting || saving}
            className="btn"
            title="Genera un playbook inicial vía IA basado en tus áreas de práctica"
          >
            {coldStarting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Generar con IA
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Guardar
          </button>
        </div>
      </header>

      <nav className="flex gap-1 border-b text-[12.5px]">
        {([
          ['general', 'General', Settings],
          ['forbidden', 'Términos prohibidos', Shield],
          ['required', 'Cláusulas obligatorias', ListChecks],
          ['preferred', 'Cláusulas preferidas', BookOpen],
          ['raw', 'Markdown libre', FileText],
        ] as Array<[Tab, string, any]>).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-3 py-2 border-b-2 ${
              tab === key ? 'border-accent text-accent' : 'border-transparent text-ink-2 hover:bg-bg-2'
            }`}
          >
            <Icon size={12} className="inline mr-1" />
            {label}
          </button>
        ))}
      </nav>

      {tab === 'general' && (
        <div className="grid gap-3 max-w-md">
          <div>
            <label className="text-[12px] font-medium">Jurisdicción</label>
            <select
              value={pb.jurisdiction_default}
              onChange={e => setPb({ ...pb, jurisdiction_default: e.target.value })}
              className="input mt-1 w-full"
            >
              <option value="co">Colombia</option>
              <option value="mx">México</option>
              <option value="pe">Perú</option>
              <option value="other">Otra</option>
            </select>
          </div>
          <div>
            <label className="text-[12px] font-medium">Tono</label>
            <select
              value={pb.tone}
              onChange={e => setPb({ ...pb, tone: e.target.value as any })}
              className="input mt-1 w-full"
            >
              <option value="formal">Formal</option>
              <option value="neutral">Neutral</option>
              <option value="aggressive">Asertivo</option>
            </select>
          </div>
          <div>
            <label className="text-[12px] font-medium">Estilo de redline</label>
            <select
              value={pb.redline_style}
              onChange={e => setPb({ ...pb, redline_style: e.target.value as any })}
              className="input mt-1 w-full"
            >
              <option value="tracked">Tracked changes (sidebar)</option>
              <option value="inline">Inline (en canvas)</option>
              <option value="sidebar">Sólo sidebar</option>
            </select>
          </div>
        </div>
      )}

      {tab === 'forbidden' && (
        <div>
          <p className="text-[12.5px] muted mb-2">
            Términos que <strong>NUNCA</strong> deben aparecer en drafts. Si una skill los genera, hook
            <code className="mono"> forbidden_terms_blocker</code> bloquea el redline.
          </p>
          <div className="flex gap-1 mb-2">
            <input
              value={newForbidden}
              onChange={e => setNewForbidden(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addForbidden(); } }}
              placeholder="Ej: exclusividad perpetua"
              className="input flex-1"
            />
            <button type="button" onClick={addForbidden} className="btn">
              <Plus size={12} /> Añadir
            </button>
          </div>
          <ul className="grid gap-1">
            {pb.forbidden_terms.map(t => (
              <li key={t} className="flex items-center justify-between surface p-2 text-[12.5px]">
                <span><code className="mono">{t}</code></span>
                <button type="button" onClick={() => removeForbidden(t)} className="btn btn-sm">
                  <X size={11} />
                </button>
              </li>
            ))}
            {pb.forbidden_terms.length === 0 && (
              <li className="text-[12px] muted">Sin términos prohibidos configurados</li>
            )}
          </ul>
        </div>
      )}

      {tab === 'required' && (
        <div>
          <p className="text-[12.5px] muted mb-2">
            Cláusulas que <strong>DEBEN</strong> estar en cada contrato. Si faltan, hook
            <code className="mono"> required_clauses_checker</code> warning.
          </p>
          <div className="flex gap-1 mb-2">
            <input
              value={newRequired}
              onChange={e => setNewRequired(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addRequired(); } }}
              placeholder="Ej: habeas data"
              className="input flex-1"
            />
            <button type="button" onClick={addRequired} className="btn">
              <Plus size={12} /> Añadir
            </button>
          </div>
          <ul className="grid gap-1">
            {pb.required_clauses.map(t => (
              <li key={t} className="flex items-center justify-between surface p-2 text-[12.5px]">
                <span><code className="mono">{t}</code></span>
                <button type="button" onClick={() => removeRequired(t)} className="btn btn-sm">
                  <X size={11} />
                </button>
              </li>
            ))}
            {pb.required_clauses.length === 0 && (
              <li className="text-[12px] muted">Sin cláusulas obligatorias · sugerido: agregar "habeas data" y "objeto"</li>
            )}
          </ul>
        </div>
      )}

      {tab === 'preferred' && (
        <div>
          <p className="text-[12.5px] muted mb-2">
            Cláusulas pre-aprobadas del despacho · LexAI las usa literal cuando aplica.
          </p>
          <PreferredClausesEditor
            value={pb.preferred_clauses}
            onChange={pc => setPb({ ...pb, preferred_clauses: pc })}
          />
        </div>
      )}

      {tab === 'raw' && (
        <div>
          <p className="text-[12.5px] muted mb-2">
            Markdown libre · el contenido se inyecta en el system prompt de cada skill ejecutada.
          </p>
          <textarea
            value={pb.raw_md || ''}
            onChange={e => setPb({ ...pb, raw_md: e.target.value })}
            rows={18}
            className="input w-full mono text-[12px]"
            placeholder={`# Playbook · Nuestro despacho

## Reglas adicionales
- Siempre incluir cláusula de notificaciones electrónicas
- Para contratos > $50M COP, requerir aprobación de socio
- Jurisdicción default: Bogotá

## Templates comunes
- Modelo NDA simple: 30 días, jurisdicción Bogotá, ley colombiana
`}
          />
        </div>
      )}
    </div>
  );
}

function PreferredClausesEditor({
  value,
  onChange,
}: {
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
}) {
  const [newKey, setNewKey] = useState('');
  const [newText, setNewText] = useState('');

  function add() {
    if (!newKey.trim() || !newText.trim()) return;
    onChange({ ...value, [newKey.trim()]: newText.trim() });
    setNewKey('');
    setNewText('');
  }

  function remove(k: string) {
    const next = { ...value };
    delete next[k];
    onChange(next);
  }

  const entries = Object.entries(value);
  return (
    <div className="grid gap-2">
      <div className="surface p-3 grid gap-2">
        <input
          value={newKey}
          onChange={e => setNewKey(e.target.value)}
          placeholder="Tipo de cláusula (ej: indemnizacion)"
          className="input"
        />
        <textarea
          value={newText}
          onChange={e => setNewText(e.target.value)}
          rows={3}
          placeholder="Texto preferido de la cláusula…"
          className="input mono text-[12px]"
        />
        <button type="button" onClick={add} className="btn btn-primary btn-sm self-end">
          <Plus size={12} /> Añadir cláusula
        </button>
      </div>
      {entries.length === 0 && (
        <p className="text-[12px] muted">Sin cláusulas preferidas configuradas</p>
      )}
      {entries.map(([k, v]) => (
        <details key={k} className="surface p-2">
          <summary className="cursor-pointer flex items-center justify-between">
            <code className="mono text-[12px]">{k}</code>
            <button type="button" onClick={() => remove(k)} className="btn btn-sm">
              <X size={11} />
            </button>
          </summary>
          <p className="mt-2 text-[11.5px] whitespace-pre-wrap">{v}</p>
        </details>
      ))}
    </div>
  );
}
