import { PublicNav } from '@/components/public/PublicNav';
import { PublicFooter } from '@/components/public/PublicFooter';

export const metadata = {
  title: 'DPA · Data Processing Agreement · LexAI',
  description: 'Acuerdo de procesamiento de datos · Habeas Data · GDPR-aligned · DPA template para enterprise.',
};

export default function DpaPage() {
  return (
    <main className="min-h-screen bg-bg">
      <PublicNav />

      <article className="mx-auto max-w-3xl px-6 py-12">
        <header className="mb-8">
          <h1 className="serif text-4xl font-semibold">DPA · Data Processing Agreement</h1>
          <p className="mt-2 text-[12px] muted">Última actualización: 14 de mayo de 2026</p>
        </header>

        <p className="mb-6 text-[13px] text-ink-2 leading-relaxed">
          Este Acuerdo de Procesamiento de Datos ("DPA") regula el tratamiento de datos personales
          entre LexAI (procesador) y el cliente del plan Pro, Firm o Enterprise (responsable).
          Cumplimiento con Habeas Data Ley 1581/2012 (CO), LFPDPPP (MX), GDPR (UE · si aplica).
        </p>

        <div className="grid gap-6 text-[13px] leading-relaxed text-ink-2">
          <Sec title="1. Definiciones">
            <ul className="list-disc ml-5 grid gap-1">
              <li><strong>Responsable:</strong> el cliente que decide el tratamiento de los datos personales</li>
              <li><strong>Encargado:</strong> LexAI, que procesa los datos por cuenta del responsable</li>
              <li><strong>Datos personales:</strong> cualquier información identificable de personas naturales</li>
              <li><strong>Titular:</strong> persona natural a quien se refieren los datos</li>
              <li><strong>Subencargados:</strong> terceros que procesan datos por cuenta de LexAI (Supabase, OpenAI, Vercel, Railway)</li>
            </ul>
          </Sec>

          <Sec title="2. Objeto y duración">
            LexAI procesa datos personales de los titulares (clientes, casos, documentos) que el
            responsable carga, exclusivamente para prestar el Servicio mientras la suscripción
            esté activa. Al cancelar, retención de 30 días para descarga · luego eliminación
            definitiva en 60 días.
          </Sec>

          <Sec title="3. Naturaleza y finalidades del tratamiento">
            <ul className="list-disc ml-5 grid gap-1">
              <li>Almacenamiento y gestión de información legal de casos</li>
              <li>Búsqueda semántica en jurisprudencia y normativa</li>
              <li>Generación asistida por IA de documentos legales</li>
              <li>Análisis de documentos y predicciones (con consentimiento)</li>
              <li>Notificaciones por email/WhatsApp/push (con consentimiento)</li>
            </ul>
          </Sec>

          <Sec title="4. Categorías de datos">
            <ul className="list-disc ml-5 grid gap-1">
              <li>Identificación: nombre, cédula, NIT, email, teléfono</li>
              <li>Profesionales: tarjeta profesional, áreas de práctica</li>
              <li>Casos y litigios: información sensible jurídica protegida por secreto profesional</li>
              <li>Documentos cargados: PDFs, Word, escritos, sentencias</li>
              <li>Metadatos de uso: timestamps, IPs, dispositivo</li>
            </ul>
          </Sec>

          <Sec title="5. Obligaciones del Encargado (LexAI)">
            <ul className="list-disc ml-5 grid gap-1">
              <li>Procesar datos únicamente según instrucciones del responsable</li>
              <li>Confidencialidad absoluta del personal autorizado</li>
              <li>Medidas técnicas y organizativas de seguridad (cifrado AES-256, TLS 1.3, MFA)</li>
              <li>Notificar brechas de seguridad en máx 72h</li>
              <li>Asistir al responsable en derechos ARCO (15 días según Ley 1581/2012)</li>
              <li>Permitir auditorías razonables (Enterprise)</li>
              <li>Eliminar/devolver datos al final del contrato</li>
            </ul>
          </Sec>

          <Sec title="6. Subencargados autorizados">
            <p className="mb-2">El responsable autoriza a los siguientes subencargados:</p>
            <ul className="text-[12px] grid gap-1 mono">
              <li>• Supabase (base de datos, storage, auth) · São Paulo, Brasil</li>
              <li>• OpenAI (modelos de IA con ZDR) · US</li>
              <li>• Vercel (frontend hosting + CDN) · global</li>
              <li>• Railway (backend hosting) · US/Brasil</li>
              <li>• Resend/Postmark (email transactional) · US</li>
              <li>• Paddle (procesador de pagos) · UK/US (cuando aplique)</li>
            </ul>
            <p className="mt-2">Cambios de subencargados se notifican con 30 días de anticipación.</p>
          </Sec>

          <Sec title="7. Transferencias internacionales">
            Las transferencias se realizan con cláusulas contractuales estándar (CCT) aceptadas
            por la Superintendencia de Industria y Comercio de Colombia y equivalentes en MX/HN/GT.
            Para clientes UE/UK: Standard Contractual Clauses 2021/914/UE vigentes.
          </Sec>

          <Sec title="8. Derechos ARCO de los titulares">
            <p>
              LexAI facilita el ejercicio de derechos de Acceso, Rectificación, Cancelación,
              Oposición, Portabilidad y Revocación del consentimiento mediante:
            </p>
            <ul className="list-disc ml-5 grid gap-1 mt-2">
              <li>Portal autoservicio en <a href="/settings/privacidad" className="text-accent">/settings/privacidad</a></li>
              <li>Formulario público en <a href="/seguridad" className="text-accent">/seguridad</a></li>
              <li>Email: <a href="mailto:privacy@lexai.co" className="text-accent">privacy@lexai.co</a></li>
            </ul>
            <p className="mt-2">Plazo de respuesta: máx 15 días hábiles desde recepción.</p>
          </Sec>

          <Sec title="9. Brechas de seguridad">
            En caso de incidente de seguridad que afecte datos personales:
            <ul className="list-disc ml-5 grid gap-1 mt-2">
              <li>Notificación al responsable dentro de 72 horas</li>
              <li>Reporte a la SIC (Colombia) cuando aplique según gravedad</li>
              <li>Reporte detallado: naturaleza, datos afectados, medidas tomadas</li>
            </ul>
          </Sec>

          <Sec title="10. Cumplimiento y auditorías">
            El responsable puede solicitar (a su costo, máx 1 vez al año, con 15 días de aviso):
            <ul className="list-disc ml-5 grid gap-1 mt-2">
              <li>Reporte de cumplimiento técnico</li>
              <li>Penetration test (Enterprise · con NDA)</li>
              <li>SOC 2 cuando esté disponible (roadmap 2026)</li>
            </ul>
          </Sec>

          <Sec title="11. Vigencia y terminación">
            Este DPA está vigente mientras dure la suscripción. Al terminar:
            <ul className="list-disc ml-5 grid gap-1 mt-2">
              <li>30 días para descargar tus datos (exportación completa)</li>
              <li>60 días para eliminación definitiva en sistemas + backups</li>
              <li>Datos requeridos por ley (facturación, audit logs) retenidos 5 años</li>
            </ul>
          </Sec>

          <Sec title="12. Contacto del DPO">
            <p>
              Data Protection Officer · <a href="mailto:dpo@lexai.co" className="text-accent">dpo@lexai.co</a><br />
              Para solicitudes formales de auditoría o contratos custom: <a href="mailto:legal@lexai.co" className="text-accent">legal@lexai.co</a>
            </p>
          </Sec>
        </div>

        <div className="surface mt-12 p-5">
          <h3 className="font-semibold text-[14px] mb-2">DPA firmado para Enterprise</h3>
          <p className="text-[12px] muted">
            Los clientes Enterprise reciben un DPA firmable con sus términos comerciales
            específicos. Solicítalo a <a href="mailto:legal@lexai.co" className="text-accent">legal@lexai.co</a>.
          </p>
        </div>
      </article>

      <PublicFooter />
    </main>
  );
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="serif text-[17px] font-semibold mb-2">{title}</h2>
      <div>{children}</div>
    </section>
  );
}
