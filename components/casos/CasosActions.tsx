'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { Ic } from '@/components/atoms/icons';
import { useVoice } from '@/components/voice/VoiceProvider';

/** Top-bar actions for the Casos list page · client island. */
export function CasosTopActions() {
  const { toggle } = useVoice();

  const onFiltros = () => {
    toast.info('Usa las pestañas (Todos, Laborales, Civiles…) para filtrar.');
    document.getElementById('casos-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const onVoiceSearch = async () => {
    try {
      await toggle();
      toast.success('Pídeme: "Casos laborales con audiencia esta semana"');
    } catch {
      toast.error('No se pudo activar la voz');
    }
  };

  return (
    <>
      <button type="button" onClick={onFiltros} className="btn">
        <span className="inline-flex">{Ic.filter}</span> Filtros
      </button>
      <button type="button" onClick={() => void onVoiceSearch()} className="btn">
        <span className="inline-flex">{Ic.mic}</span> &ldquo;Casos laborales con audiencia&rdquo;
      </button>
      <Link href="/casos/nuevo" className="btn btn-primary">
        <span className="inline-flex">{Ic.plus}</span> Nuevo caso
      </Link>
    </>
  );
}
