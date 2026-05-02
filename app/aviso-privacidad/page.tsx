import { Logo } from '@/components/atoms/Logo';

export const metadata = {
  title: 'Aviso de Privacidad · LexAI',
  description: 'Aviso de Privacidad y tratamiento de datos personales · Ley 1581/2012',
};

export default function AvisoPage() {
  return (
    <main className="min-h-screen bg-bg p-6">
      <header className="mx-auto flex max-w-3xl items-center gap-4 py-8">
        <Logo size={20} />
      </header>
      <article className="mx-auto max-w-3xl space-y-4 text-[14px] leading-relaxed">
        <h1 className="serif text-3xl font-semibold">Aviso de Privacidad LexAI</h1>
        <p className="muted text-[12px]">Versión 1.0 · vigente desde mayo 2026 · Habeas Data — Ley 1581/2012</p>

        <h2 className="serif mt-6 text-xl font-semibold">1. Identificación del responsable</h2>
        <p>
          LexAI S.A.S., NIT 901.555.444-1, domiciliada en Bogotá D.C., Colombia, es responsable del
          tratamiento de los datos personales recolectados a través de la plataforma{' '}
          <a className="text-accent" href="https://app.lexai.co">app.lexai.co</a>. Contacto del
          oficial de protección de datos: dpo@lexai.co.
        </p>

        <h2 className="serif mt-6 text-xl font-semibold">2. Finalidades del tratamiento</h2>
        <ul className="ml-6 list-disc">
          <li>Prestación del servicio de asistencia legal documental con IA.</li>
          <li>Verificación de tarjeta profesional contra el Consejo Superior de la Judicatura.</li>
          <li>Operación del agente de voz con consentimiento informado del cliente del despacho.</li>
          <li>Cumplimiento de obligaciones legales tributarias y contractuales.</li>
          <li>Mejora del servicio a través de métricas agregadas no identificables.</li>
        </ul>

        <h2 className="serif mt-6 text-xl font-semibold">3. Datos sensibles</h2>
        <p>
          LexAI puede tratar datos sensibles (origen étnico, salud, biométricos de voz) únicamente
          cuando el titular ha dado consentimiento previo, expreso e informado. Estos datos se
          almacenan cifrados con AES-256 y solo son accesibles por el despacho responsable.
        </p>

        <h2 className="serif mt-6 text-xl font-semibold">4. Derechos del titular (ARCO)</h2>
        <p>
          Como titular tienes derecho a Acceder, Rectificar, Cancelar y Oponerte al tratamiento de
          tus datos personales conforme a los Arts. 8 y 14 de la Ley 1581/2012. Puedes ejercerlos
          en{' '}
          <a className="text-accent" href="/settings/privacidad">
            Configuración → Privacidad
          </a>{' '}
          o escribiendo a dpo@lexai.co. Respondemos en máximo 10 días hábiles.
        </p>

        <h2 className="serif mt-6 text-xl font-semibold">5. Transferencia internacional</h2>
        <p>
          Los datos se almacenan en infraestructura Supabase (us-east-1, Estados Unidos) y se
          procesan con OpenAI bajo modalidad <strong>Zero Data Retention</strong>. La transferencia
          internacional cumple los requisitos del Decreto 1377/2013 y del Estándar Contractual
          autorizado por la SIC. Plan de migración a Querétaro (CO-North1) cuando la base de
          clientes supere 100 despachos.
        </p>

        <h2 className="serif mt-6 text-xl font-semibold">6. Retención</h2>
        <p>
          Los datos se conservan mientras dure la relación contractual con el despacho. Los logs de
          auditoría se conservan 12 meses (append-only). Tras la terminación, los datos pasan a un
          período de archivo de 5 años requerido por normativa contable y luego son eliminados.
        </p>

        <h2 className="serif mt-6 text-xl font-semibold">7. Seguridad</h2>
        <ul className="ml-6 list-disc">
          <li>Cifrado at-rest AES-256 y in-transit TLS 1.3.</li>
          <li>MFA TOTP obligatorio para todos los usuarios.</li>
          <li>RLS multi-tenant estricto (0 cross-tenant leaks).</li>
          <li>Audit log inmutable con triggers Postgres.</li>
          <li>Pen test externo trimestral.</li>
        </ul>

        <h2 className="serif mt-6 text-xl font-semibold">8. Disclaimer UPL</h2>
        <p className="rounded-md bg-bg-sunken p-4 muted">
          LexAI es asistencia documental con inteligencia artificial. <strong>No constituye
          representación legal</strong> ni sustituye el criterio del abogado titulado. Todos los
          documentos generados deben ser revisados y firmados por un profesional con tarjeta
          profesional vigente antes de ser presentados ante autoridad judicial o administrativa.
        </p>

        <p className="muted text-[12px] mt-10">
          Última actualización: 1 de mayo de 2026 · v1.0
        </p>
      </article>
    </main>
  );
}
