import Link from 'next/link';
import { Logo } from '@/components/atoms/Logo';

export function PublicFooter() {
  return (
    <footer className="border-t border-line bg-bg-elev/30">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-4">
        <div>
          <Logo size={20} />
          <p className="mt-3 text-[11.5px] muted leading-relaxed">
            Plataforma legal con IA verificada para abogados de habla hispana.
            Trazabilidad obligatoria de citas · multi-país.
          </p>
        </div>
        <div>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-3">Producto</h3>
          <ul className="grid gap-1.5 text-[12px]">
            <li><Link href="/pricing" className="text-ink-2 hover:text-ink">Precios</Link></li>
            <li><Link href="/customers" className="text-ink-2 hover:text-ink">Casos de uso</Link></li>
            <li><Link href="/changelog" className="text-ink-2 hover:text-ink">Cambios</Link></li>
            <li><Link href="/tramites" className="text-ink-2 hover:text-ink">Trámites ciudadanos</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-3">Compañía</h3>
          <ul className="grid gap-1.5 text-[12px]">
            <li><Link href="/seguridad" className="text-ink-2 hover:text-ink">Seguridad</Link></li>
            <li><Link href="/aviso-privacidad" className="text-ink-2 hover:text-ink">Aviso de privacidad</Link></li>
            <li><a href="mailto:hello@lexai.co" className="text-ink-2 hover:text-ink">Contacto</a></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-3">Cumplimiento</h3>
          <ul className="grid gap-1.5 text-[11.5px] muted">
            <li>Habeas Data Ley 1581/2012 (CO)</li>
            <li>LFPDPPP (MX) · LPDP (HN)</li>
            <li>Cifrado AES-256 en reposo</li>
            <li>TLS 1.3 en tránsito</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line px-6 py-4 text-center text-[10.5px] muted">
        © 2026 LexAI · Asistencia documental con IA · No constituye representación legal.
      </div>
    </footer>
  );
}
