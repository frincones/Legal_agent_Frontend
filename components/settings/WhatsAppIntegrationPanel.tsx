'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Loader2, MessageCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type WAState = {
  configured: boolean;
  id?: string;
  phone_number_id?: string;
  display_phone?: string | null;
  waba_id?: string | null;
  active?: boolean;
  status?: string;
  last_status?: string | null;
  last_error?: string | null;
};

export function WhatsAppIntegrationPanel() {
  const [data, setData] = useState<WAState | null>(null);
  const [loading, setLoading] = useState(true);
  const [phoneId, setPhoneId] = useState('');
  const [displayPhone, setDisplayPhone] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [token, setToken] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/whatsapp/integration', { cache: 'no-store' });
      if (r.ok) setData(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch('/api/whatsapp/integration', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          phone_number_id: phoneId,
          display_phone: displayPhone || null,
          waba_id: wabaId || null,
          access_token: token,
          webhook_verify_token: verifyToken,
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      toast.success('WhatsApp conectado');
      setToken('');
      setVerifyToken('');
      void refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message.slice(0, 200) : 'Error');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!confirm('¿Desconectar WhatsApp Business?')) return;
    const r = await fetch('/api/whatsapp/integration', { method: 'DELETE' });
    if (r.ok) {
      toast.success('WhatsApp desconectado');
      void refresh();
    }
  }

  return (
    <div className="grid gap-3">
      <header>
        <h3 className="serif text-[15px] font-semibold">WhatsApp Business</h3>
        <p className="text-[12px] muted">
          Conecta tu número de WhatsApp Business Cloud (Meta) para recibir y enviar mensajes desde LexAI.
        </p>
      </header>

      {loading ? (
        <div className="surface flex items-center gap-2 p-4 text-[12.5px] muted">
          <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Cargando…
        </div>
      ) : data?.configured ? (
        <div className="surface flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <MessageCircle size={18} className="text-emerald-500" aria-hidden="true" />
            <div>
              <div className="text-[13px] font-semibold">{data.display_phone || data.phone_number_id}</div>
              <div className="text-[11.5px] muted">
                WABA {data.waba_id || '—'} ·{' '}
                <span className="text-emerald-500 inline-flex items-center gap-1">
                  <CheckCircle2 size={11} aria-hidden="true" /> {data.status}
                </span>
              </div>
            </div>
          </div>
          <button className="btn" onClick={onDelete}>
            <Trash2 size={12} className="text-red-500" aria-hidden="true" /> Desconectar
          </button>
        </div>
      ) : (
        <form onSubmit={onSave} className="surface grid gap-3 p-4">
          <p className="text-[12px] muted">
            Necesitas <strong>phone_number_id</strong> y <strong>access_token</strong> de tu Meta Business.
            El <strong>webhook_verify_token</strong> es un secreto que tú eliges y configuras en Meta.
          </p>
          <Field label="phone_number_id">
            <input required value={phoneId} onChange={(e) => setPhoneId(e.target.value)} className="w-full bg-transparent outline-none" />
          </Field>
          <Field label="Display phone (opcional)">
            <input value={displayPhone} onChange={(e) => setDisplayPhone(e.target.value)} placeholder="+57 300 123 4567" className="w-full bg-transparent outline-none" />
          </Field>
          <Field label="WABA id (opcional)">
            <input value={wabaId} onChange={(e) => setWabaId(e.target.value)} className="w-full bg-transparent outline-none" />
          </Field>
          <Field label="Access token (System User token)">
            <input type="password" required value={token} onChange={(e) => setToken(e.target.value)} className="w-full bg-transparent outline-none" />
          </Field>
          <Field label="Webhook verify token (el que registrarás en Meta)">
            <input required minLength={6} value={verifyToken} onChange={(e) => setVerifyToken(e.target.value)} placeholder="genera uno aleatorio" className="w-full bg-transparent outline-none" />
          </Field>
          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : <MessageCircle size={12} aria-hidden="true" />}
              Conectar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] uppercase tracking-wider muted">{label}</label>
      <div className="rounded-md border border-line bg-bg-elev p-[10px] text-[13px] focus-within:border-accent">
        {children}
      </div>
    </div>
  );
}
