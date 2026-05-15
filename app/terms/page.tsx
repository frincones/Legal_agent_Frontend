import { PublicNav } from '@/components/public/PublicNav';
import { PublicFooter } from '@/components/public/PublicFooter';

export const metadata = {
  title: 'Términos de Servicio · LexAI',
  description: 'Términos de uso de la plataforma LexAI.',
};

export default function TermsPage() {
  const today = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <main className="min-h-screen bg-bg">
      <PublicNav />

      <article className="mx-auto max-w-3xl px-6 py-12 prose prose-sm">
        <header className="mb-8">
          <h1 className="serif text-4xl font-semibold">Términos de Servicio</h1>
          <p className="mt-2 text-[12px] muted">Última actualización: 14 de mayo de 2026</p>
        </header>

        <section className="grid gap-6 text-[13px] leading-relaxed text-ink-2">
          <Sec n="1" title="Aceptación de términos">
            Al registrarte o usar LexAI ("el Servicio"), aceptas estos Términos de Servicio en su
            totalidad. Si no estás de acuerdo con alguna parte, no debes usar el Servicio.
          </Sec>

          <Sec n="2" title="Descripción del Servicio">
            LexAI es una plataforma de asistencia legal con IA dirigida a profesionales del derecho.
            <strong>NO constituye representación legal</strong>, asesoría jurídica ni sustituye el
            juicio profesional de un abogado titulado. Todos los documentos generados deben ser
            revisados y firmados por un profesional acreditado.
          </Sec>

          <Sec n="3" title="Elegibilidad">
            Solo pueden usar el Servicio profesionales del derecho titulados, paralegales con
            supervisión profesional o estudiantes de derecho con propósito educativo. Nos reservamos
            el derecho a verificar credenciales (tarjeta profesional) y suspender cuentas sin
            verificación adecuada.
          </Sec>

          <Sec n="4" title="Planes y facturación">
            <p>El Servicio se ofrece bajo modelos:</p>
            <ul className="list-disc ml-5 grid gap-1 mt-2">
              <li><strong>Free Trial:</strong> 14 días gratis · sin tarjeta · luego paso a plan Free</li>
              <li><strong>Free:</strong> gratuito permanente con cuotas limitadas</li>
              <li><strong>Starter / Pro / Firm:</strong> suscripción mensual o anual prepagada</li>
              <li><strong>Enterprise:</strong> contrato personalizado</li>
            </ul>
            <p className="mt-2">La renovación es automática salvo cancelación. Conservas el plan hasta el final del periodo facturado.</p>
          </Sec>

          <Sec n="5" title="Uso aceptable">
            <p>Te prohibimos usar el Servicio para:</p>
            <ul className="list-disc ml-5 grid gap-1 mt-2">
              <li>Actividades ilegales o que violen leyes aplicables</li>
              <li>Generar contenido fraudulento, difamatorio o engañoso</li>
              <li>Hacer scraping masivo o ataques DDoS contra LexAI o terceros</li>
              <li>Compartir credenciales o transferir tu cuenta sin autorización</li>
              <li>Intentar reversar o atacar la integridad técnica del Servicio</li>
            </ul>
          </Sec>

          <Sec n="6" title="Propiedad intelectual">
            Los datos que subes (documentos, casos, clientes) son tuyos en todo momento.
            El código, modelos, prompts, interfaz y marcas registradas de LexAI son propiedad
            exclusiva de la empresa. Otorgamos una licencia limitada, no exclusiva y revocable
            para usar el Servicio mientras tu suscripción esté activa.
          </Sec>

          <Sec n="7" title="Confidencialidad y privacidad">
            <p>
              Cumplimos con Habeas Data (Ley 1581/2012 Colombia) y normativas equivalentes en
              México, Honduras y Guatemala. Detalles completos en{' '}
              <a href="/seguridad" className="text-accent">/seguridad</a> y{' '}
              <a href="/aviso-privacidad" className="text-accent">/aviso-privacidad</a>.
            </p>
            <p className="mt-2">
              <strong>No usamos tus datos para entrenar modelos de IA.</strong>{' '}
              Por contrato con OpenAI, tu información tiene zero data retention.
            </p>
          </Sec>

          <Sec n="8" title="Limitación de responsabilidad">
            <p>
              El Servicio se proporciona "tal cual". LexAI no garantiza precisión absoluta de las
              respuestas IA y NO se hace responsable de:
            </p>
            <ul className="list-disc ml-5 grid gap-1 mt-2">
              <li>Daños derivados del uso de documentos generados sin revisión profesional</li>
              <li>Decisiones procesales o estratégicas basadas en outputs de la IA</li>
              <li>Pérdida de ingresos, oportunidades o reputación</li>
              <li>Interrupciones de servicio puntuales (SLA en página /status)</li>
            </ul>
            <p className="mt-2">
              La responsabilidad total de LexAI nunca excederá el monto que hayas pagado en los
              últimos 12 meses.
            </p>
          </Sec>

          <Sec n="9" title="Suspensión y terminación">
            Podemos suspender o cerrar tu cuenta si violas estos términos, si tu pago falla por
            más de 14 días sin resolución, o si detectamos abuso. Te notificaremos por email
            antes de cualquier suspensión definitiva.
          </Sec>

          <Sec n="10" title="Modificaciones de los términos">
            Podemos actualizar estos términos. Cambios materiales se notifican con 30 días de
            anticipación al email registrado. El uso continuado tras la entrada en vigor implica
            aceptación.
          </Sec>

          <Sec n="11" title="Ley aplicable y jurisdicción">
            Estos términos se rigen por las leyes de Colombia. Cualquier disputa se resolverá
            en los tribunales competentes de Bogotá D.C., salvo arbitraje voluntario por mutuo
            acuerdo.
          </Sec>

          <Sec n="12" title="Contacto">
            <p>Para cualquier duda o reclamo: <a href="mailto:legal@lexai.co" className="text-accent">legal@lexai.co</a></p>
          </Sec>
        </section>
      </article>

      <PublicFooter />
    </main>
  );
}

function Sec({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="serif text-[18px] font-semibold mb-2">{n}. {title}</h2>
      <div>{children}</div>
    </section>
  );
}
