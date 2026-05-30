'use client';

/**
 * Sprint M20.11 · ColdStartWizard
 *
 * Formulario multi-step para generar playbook inicial vía IA.
 * Reemplaza el prompt nativo del browser por un wizard UX-friendly.
 *
 * Pasos:
 *   1. Áreas de práctica (multi-select chips)
 *   2. Tono + umbral de escalación
 *   3. Términos prohibidos opcionales
 *   4. Sample doc opcional (textarea)
 *   5. Preview + confirmar (LLM call ~10s)
 */
import { useState } from 'react';
import { Sparkles, Loader2, X, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const AREAS = [
  'civil', 'comercial', 'laboral', 'penal', 'tributario',
  'administrativo', 'constitucional', 'familia', 'inmobiliario',
  'societario', 'propiedad intelectual', 'energía', 'seguros',
] as const;

const TONES = [
  { value: 'formal', label: 'Formal · clásico forense' },
  { value: 'neutral', label: 'Neutral · profesional moderno' },
  { value: 'aggressive', label: 'Asertivo · litigation focused' },
] as const;

interface Props {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function ColdStartWizard({ onComplete, onCancel }: Props) {
  const [step, setStep] = useState(1);
  const [areas, setAreas] = useState<string[]>([]);
  const [tone, setTone] = useState<string>('formal');
  const [threshold, setThreshold] = useState<number>(50000000);
  const [forbiddenInput, setForbiddenInput] = useState('');
  const [forbidden, setForbidden] = useState<string[]>([]);
  const [sampleDoc, setSampleDoc] = useState('');
  const [generating, setGenerating] = useState(false);

  function toggleArea(a: string) {
    setAreas((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  function addForbidden() {
    const t = forbiddenInput.trim();
    if (!t || forbidden.includes(t)) return;
    setForbidden([...forbidden, t]);
    setForbiddenInput('');
  }

  async function generate() {
    setGenerating(true);
    try {
      const r = await fetch('/api/firm/playbook/cold-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          practice_areas: areas,
          tone,
          escalation_threshold_cop: threshold,
          forbidden_terms_input: forbidden,
          sample_doc_text: sampleDoc.trim() || null,
        }),
      });
      if (r.ok) {
        toast.success('Playbook generado por IA · revisa y ajusta');
        onComplete?.();
      } else {
        const txt = await r.text();
        toast.error(`Cold-start falló: ${txt.slice(0, 120)}`);
      }
    } catch (e: any) {
      toast.error(e?.message || 'Error generando playbook');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="surface p-5 max-w-2xl mx-auto">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-amber-500" />
          <h3 className="serif text-[16px] font-semibold">Generador de playbook con IA</h3>
        </div>
        <span className="text-[12px] muted">Paso {step}/5</span>
      </header>

      <div className="flex gap-1 mb-5">
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className={`h-1 flex-1 rounded ${
              n <= step ? 'bg-accent' : 'bg-line'
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <div>
          <h4 className="text-[14px] font-medium mb-2">Áreas de práctica</h4>
          <p className="text-[12.5px] muted mb-3">
            Selecciona las áreas en las que trabaja tu despacho. Esto guiará el tipo
            de cláusulas preferidas y precedentes que el agente sugerirá.
          </p>
          <div className="flex flex-wrap gap-2">
            {AREAS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => toggleArea(a)}
                className={`px-3 py-1.5 rounded-full text-[12.5px] border transition ${
                  areas.includes(a)
                    ? 'bg-accent text-accent-ink border-accent'
                    : 'bg-bg border-line hover:bg-bg-2'
                }`}
              >
                {areas.includes(a) && <Check size={12} className="inline mr-1" />}
                {a}
              </button>
            ))}
          </div>
          {areas.length === 0 && (
            <p className="text-[11.5px] muted mt-3">Selecciona al menos 1 área.</p>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-4">
          <div>
            <h4 className="text-[14px] font-medium mb-2">Tono de redacción</h4>
            <div className="grid gap-2">
              {TONES.map((t) => (
                <label
                  key={t.value}
                  className={`flex items-start gap-3 p-3 rounded border cursor-pointer ${
                    tone === t.value ? 'border-accent bg-accent-soft' : 'border-line hover:bg-bg-2'
                  }`}
                >
                  <input
                    type="radio"
                    name="tone"
                    value={t.value}
                    checked={tone === t.value}
                    onChange={(e) => setTone(e.target.value)}
                  />
                  <span className="text-[13px]">{t.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-[14px] font-medium mb-2">
              Umbral de escalación (COP)
            </h4>
            <p className="text-[12px] muted mb-2">
              Operaciones con monto superior a este valor requerirán aprobación de socio.
            </p>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value, 10) || 0)}
              className="input w-full"
              placeholder="50000000"
              step="1000000"
            />
            <p className="text-[11.5px] muted mt-1">
              {(threshold / 1000000).toLocaleString('es-CO')}M COP
            </p>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h4 className="text-[14px] font-medium mb-2">Términos prohibidos (opcional)</h4>
          <p className="text-[12.5px] muted mb-3">
            Palabras o frases que el agente NUNCA debe usar al redactar.
          </p>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={forbiddenInput}
              onChange={(e) => setForbiddenInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addForbidden())}
              placeholder="ej. 'aproximadamente', 'más o menos'"
              className="input flex-1"
            />
            <button type="button" onClick={addForbidden} className="btn">
              Agregar
            </button>
          </div>
          {forbidden.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {forbidden.map((t) => (
                <li
                  key={t}
                  className="px-3 py-1 rounded-full bg-bg-2 text-[12px] flex items-center gap-1"
                >
                  {t}
                  <button
                    onClick={() => setForbidden(forbidden.filter((x) => x !== t))}
                    className="hover:bg-line rounded"
                  >
                    <X size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {step === 4 && (
        <div>
          <h4 className="text-[14px] font-medium mb-2">Documento muestra (opcional)</h4>
          <p className="text-[12.5px] muted mb-3">
            Pega el texto de un MSA, poder o contrato modelo de tu despacho. El agente
            inferirá tu estilo de cláusulas preferidas. Si no tienes uno, salta este paso.
          </p>
          <textarea
            value={sampleDoc}
            onChange={(e) => setSampleDoc(e.target.value)}
            rows={10}
            className="input w-full mono text-[12px]"
            placeholder="(Opcional) pega aquí el contenido del documento modelo..."
            maxLength={20000}
          />
          <p className="text-[11px] muted mt-1">{sampleDoc.length}/20000 chars</p>
        </div>
      )}

      {step === 5 && (
        <div>
          <h4 className="text-[14px] font-medium mb-3">Confirmar generación</h4>
          <div className="surface p-3 space-y-2 text-[12.5px]">
            <div>
              <strong>Áreas:</strong> {areas.join(', ') || '(ninguna)'}
            </div>
            <div>
              <strong>Tono:</strong> {tone}
            </div>
            <div>
              <strong>Umbral escalación:</strong> ${threshold.toLocaleString('es-CO')} COP
            </div>
            <div>
              <strong>Términos prohibidos:</strong> {forbidden.length || 'ninguno'}
            </div>
            <div>
              <strong>Documento muestra:</strong>{' '}
              {sampleDoc ? `${sampleDoc.length} chars` : '(no provisto)'}
            </div>
          </div>
          <p className="text-[12px] muted mt-3">
            ⚠ Esto sobreescribirá tu playbook actual. La versión anterior quedará
            archivada en el historial.
          </p>
        </div>
      )}

      <footer className="mt-5 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="text-[12.5px] muted hover:underline"
        >
          Cancelar
        </button>
        <div className="flex gap-2">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="btn"
            >
              <ArrowLeft size={12} /> Atrás
            </button>
          )}
          {step < 5 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && areas.length === 0}
              className="btn btn-primary"
            >
              Siguiente <ArrowRight size={12} />
            </button>
          ) : (
            <button
              type="button"
              onClick={generate}
              disabled={generating}
              className="btn btn-primary"
            >
              {generating ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Generando…
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Generar playbook
                </>
              )}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
