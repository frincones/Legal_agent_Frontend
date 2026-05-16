'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Play, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type SkillForm = {
  command: string;
  name: string;
  description: string;
  category: string;
  system_prompt: string;
  output_schema_json: string;
  references_md: string;
  jurisdiction: string;
  user_invocable: boolean;
  status: 'draft' | 'published';
};

const DEFAULT: SkillForm = {
  command: '/redactar/nuevo',
  name: 'Nueva skill',
  description: '',
  category: 'drafting',
  system_prompt: 'Eres un asistente legal experto en Colombia. …',
  output_schema_json: '',
  references_md: '',
  jurisdiction: 'co',
  user_invocable: true,
  status: 'draft',
};

export function SkillEditor({ skillId }: { skillId: string }) {
  const router = useRouter();
  const isNew = skillId === 'new' || !skillId;

  const [form, setForm] = useState<SkillForm>(DEFAULT);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [testInput, setTestInput] = useState('{"prompt": "ejemplo"}');
  const [testOutput, setTestOutput] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const load = useCallback(async () => {
    if (isNew) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/saas/skills`, { cache: 'no-store' });
      if (r.ok) {
        const arr = await r.json();
        const s = arr.find((x: any) => x.id === skillId);
        if (s) {
          setForm({
            command: s.command,
            name: s.name,
            description: s.description || '',
            category: s.category || 'other',
            system_prompt: s.system_prompt || '',
            output_schema_json: s.output_schema ? JSON.stringify(s.output_schema, null, 2) : '',
            references_md: s.references_md || '',
            jurisdiction: s.jurisdiction || 'co',
            user_invocable: s.user_invocable,
            status: s.status,
          });
        }
      }
    } finally { setLoading(false); }
  }, [skillId, isNew]);

  useEffect(() => { void load(); }, [load]);

  async function save() {
    let output_schema = null;
    if (form.output_schema_json.trim()) {
      try { output_schema = JSON.parse(form.output_schema_json); }
      catch { toast.error('Output schema JSON inválido'); return; }
    }
    const payload = {
      command: form.command, name: form.name,
      description: form.description, category: form.category,
      system_prompt: form.system_prompt,
      output_schema, references_md: form.references_md,
      frontmatter: { 'argument-hint': '', model: 'gpt-4o-mini' },
      jurisdiction: form.jurisdiction,
      user_invocable: form.user_invocable, status: form.status,
    };
    setSaving(true);
    try {
      const r = isNew
        ? await fetch('/api/saas/skills', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/saas/skills/${skillId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
      if (r.ok) {
        toast.success(isNew ? 'Skill creada' : 'Skill actualizada');
        if (isNew) router.push('/saas/skills');
      } else {
        const b = await r.json().catch(() => ({}));
        toast.error(b?.detail || `Error ${r.status}`);
      }
    } finally { setSaving(false); }
  }

  async function testSkill() {
    let input;
    try { input = JSON.parse(testInput); }
    catch { toast.error('Test input JSON inválido'); return; }
    setTesting(true);
    setTestOutput(null);
    try {
      const r = await fetch('/api/saas/skills/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: form.command, test_input: input }),
      });
      const data = await r.json();
      setTestOutput(data);
      if (data.ok) toast.success(`Test OK · ${data.duration_ms}ms`);
      else toast.error(data.error || 'Test falló');
    } finally { setTesting(false); }
  }

  if (loading) return <div className="surface p-4 flex items-center gap-2"><Loader2 className="animate-spin" /> Cargando…</div>;

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="serif text-[16px] font-semibold">{isNew ? 'Crear skill builtin' : form.name}</h2>
        <button onClick={save} disabled={saving} className="btn btn-primary">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Guardar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="surface p-4 grid gap-3">
          <h3 className="serif text-[14px] font-semibold">Metadata</h3>
          <div>
            <label className="text-[12px] font-medium">Command</label>
            <input value={form.command} onChange={e => setForm({...form, command: e.target.value})} className="input mt-1 w-full mono" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[12px] font-medium">Nombre</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input mt-1 w-full" />
            </div>
            <div>
              <label className="text-[12px] font-medium">Categoría</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input mt-1 w-full">
                <option value="drafting">Drafting</option>
                <option value="review">Review</option>
                <option value="analysis">Analysis</option>
                <option value="other">Otra</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[12px] font-medium">Descripción</label>
            <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input mt-1 w-full" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[12px] font-medium">Jurisdicción</label>
              <select value={form.jurisdiction} onChange={e => setForm({...form, jurisdiction: e.target.value})} className="input mt-1 w-full">
                <option value="co">Colombia</option>
                <option value="mx">México</option>
                <option value="other">Otra</option>
              </select>
            </div>
            <div>
              <label className="text-[12px] font-medium">Estado</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value as any})} className="input mt-1 w-full">
                <option value="draft">Draft</option>
                <option value="published">Publicar</option>
              </select>
            </div>
          </div>
        </div>

        <div className="surface p-4 grid gap-3">
          <h3 className="serif text-[14px] font-semibold">System prompt</h3>
          <textarea
            value={form.system_prompt}
            onChange={e => setForm({...form, system_prompt: e.target.value})}
            rows={16}
            className="input w-full mono text-[12px]"
          />
        </div>

        <div className="surface p-4 grid gap-3 lg:col-span-2">
          <h3 className="serif text-[14px] font-semibold">Output schema (JSON · opcional)</h3>
          <textarea
            value={form.output_schema_json}
            onChange={e => setForm({...form, output_schema_json: e.target.value})}
            rows={8}
            className="input w-full mono text-[12px]"
            placeholder='{"type":"object","properties":{...}}'
          />
        </div>

        <div className="surface p-4 grid gap-3 lg:col-span-2">
          <h3 className="serif text-[14px] font-semibold flex items-center gap-2"><Play size={13} /> Test runner</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium">Input JSON</label>
              <textarea value={testInput} onChange={e => setTestInput(e.target.value)} rows={6} className="input w-full mono text-[11px]" />
            </div>
            <div>
              <label className="text-[12px] font-medium">Output</label>
              <pre className="input w-full overflow-auto mono text-[10.5px] h-[150px]">
                {testOutput ? JSON.stringify(testOutput, null, 2) : '(test no ejecutado)'}
              </pre>
            </div>
          </div>
          <button onClick={testSkill} disabled={testing} className="btn btn-primary self-start">
            {testing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            Test
          </button>
        </div>
      </div>
    </div>
  );
}
