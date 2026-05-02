import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { Ic } from '@/components/atoms/icons';
import { ARCORequestForm } from '@/components/compliance/ARCORequestForm';

export default function SettingsPrivacidad() {
  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb="Configuración / Privacidad"
          title="Habeas Data · Ley 1581/2012"
          subtitle="Aviso de Privacidad, derechos ARCO, DPA, retención de datos"
          actions={
            <a href="/aviso-privacidad" target="_blank" rel="noreferrer" className="btn">
              {Ic.link} Ver Aviso de Privacidad público
            </a>
          }
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="mx-auto flex max-w-3xl flex-col gap-5">
            <section className="surface p-[var(--pad-card)]">
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-flex text-ok">{Ic.shield}</span>
                <h3 className="serif m-0 text-[16px] font-semibold">Compromisos LexAI</h3>
              </div>
              <ul className="m-0 flex flex-col gap-2 pl-5 text-[12.5px] leading-relaxed">
                <li>· Encriptación at-rest (AES-256) e in-transit (TLS 1.3).</li>
                <li>· OpenAI Zero Data Retention activo · ningún prompt se usa para entrenar.</li>
                <li>· Logs de auditoría retenidos 12 meses · append-only Postgres triggers.</li>
                <li>· Verificación de tarjeta profesional en todos los signups.</li>
                <li>· DPA disponible bajo solicitud · firmado con cada despacho cliente.</li>
                <li>· Datos almacenados en Supabase us-east-1 · plan migración a CO-North1 con 100+ despachos.</li>
              </ul>
            </section>

            <section className="surface p-[var(--pad-card)]">
              <h3 className="serif m-0 text-[16px] font-semibold">Solicitud derechos ARCO</h3>
              <p className="mt-2 text-[12.5px] muted">
                Como titular o representante legal puedes solicitar Acceso, Rectificación, Cancelación
                u Oposición sobre los datos personales de tus clientes. Respondemos en máximo 10 días
                hábiles (Ley 1581/2012 Art. 14-16).
              </p>
              <ARCORequestForm />
            </section>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
