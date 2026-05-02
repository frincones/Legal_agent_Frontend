'use client';

import { toast } from 'sonner';
import { Ic } from '@/components/atoms/icons';
import { useVoice } from '@/components/voice/VoiceProvider';

export function LiquidacionDictarButton() {
  const { toggle } = useVoice();
  const onDictar = async () => {
    try {
      await toggle();
      toast.success('Habla normal · ej.: "Liquidación de María, 7 años, salario 4.5 millones"');
    } catch {
      toast.error('No se pudo activar la voz');
    }
  };
  return (
    <button type="button" onClick={() => void onDictar()} className="btn">
      {Ic.mic} Dictar &ldquo;Liquidación de María, 7 años, salario 4.5 millones, despido injustificado&rdquo;
    </button>
  );
}
