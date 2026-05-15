import Link from 'next/link';
import { Check, Lock, ShieldCheck, FileCheck, Database, Eye, AlertTriangle } from 'lucide-react';
import { PublicNav } from '@/components/public/PublicNav';
import { PublicFooter } from '@/components/public/PublicFooter';

export const metadata = {
  title: 'Seguridad y cumplimiento · LexAI',
  description: 'Habeas Data Ley 1581/2012 · cifrado AES-256 · TLS 1.3 · audit logs · cero entrenamiento con datos de cliente.',
};

export default function SeguridadPage() {
  return (
    <main className="min-h-screen bg-bg">
      <PublicNav />

      <section className="mx-auto max-w-3xl px-6 pt-12 pb-12 text-center">
        <span className="chip chip-purple">
          <ShieldCheck size={11} className="inline mr-1" />Cumplimiento legal
        </span>
        <h1 className="serif mt-6 text-4xl font-semibold tracking-tight md:text-5xl leading-tight">
          Tu información, blindada por diseño
        </h1>
        <p className="mt-4 text-[14px] text-ink-2 leading-relaxed">
          LexAI maneja información sensible de casos legales. Diseñamos la arquitectura
          desde cero pensando en compliance multi-país y seguridad de grado bancario.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-12">
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            icon={<Lock size={20} />}
            title="Cifrado AES-256 en reposo"
            body="Toda tu data en Supabase Postgres + Storage está cifrada con AES-256. Las claves se rotan automáticamente."
          />
          <Card
            icon={<Database size={20} />}
            title="TLS 1.3 en tránsito"
            body="Comunicación cliente-servidor y servidor-IA siempre cifrada. Certificados Let's Encrypt con renovación automática."
          />
          <Card
            icon={<Eye size={20} />}
            title="Cero entrenamiento con tu data"
            body='Por contrato con OpenAI, tus datos NUNCA se usan para entrenar modelos. ZDR (Zero Data Retention) disponible para Enterprise.'
          />
          <Card
            icon={<FileCheck size={20} />}
            title="Audit log inmutable"
            body="Cada acción queda registrada (quién, qué, cuándo, IP). Retención 12 meses · compliance DIAN y Habeas Data."
          />
          <Card
            icon={<AlertTriangle size={20} />}
            title="Validación profesional obligatoria"
            body="MFA obligatorio + verificación de tarjeta profesional. Solo abogados acreditados acceden a la plataforma."
          />
          <Card
            icon={<ShieldCheck size={20} />}
            title="RLS · Aislamiento multi-tenant"
            body="Cada firma vive en su propio espacio aislado a nivel de PostgreSQL Row-Level Security. Imposible cross-tenant data leak."
          />
        </div>
      </section>

      {/* Compliance legal */}
      <section className="mx-auto max-w-3xl px-6 pb-20">
        <h2 className="serif mb-6 text-center text-[24px] font-semibold">Cumplimiento legal por país</h2>
        <div className="grid gap-3">
          <ComplianceItem
            country="🇨🇴 Colombia"
            laws="Ley 1581/2012 · Decreto 1377/2013 · Habeas Data"
            details="Política de tratamiento de datos · derechos ARCO · consentimiento explícito · finalidades transparentes · canal para PQR."
          />
          <ComplianceItem
            country="🇲🇽 México"
            laws="LFPDPPP · Lineamientos del Aviso de Privacidad"
            details="Aviso de privacidad integral · transferencias notificadas · DPO designado."
          />
          <ComplianceItem
            country="🇭🇳 Honduras"
            laws="Ley de Protección de Datos Personales"
            details="Reportes a IAIP · seguridad técnica auditable."
          />
          <ComplianceItem
            country="🇬🇹 Guatemala"
            laws="Ley de Acceso a la Información Pública"
            details="Inicio del compliance vía DPO multi-país."
          />
        </div>
      </section>

      {/* Habeas Data ARCO */}
      <section className="mx-auto max-w-3xl px-6 pb-20">
        <div className="surface p-6">
          <h3 className="serif mb-3 text-[18px] font-semibold">Tus derechos ARCO</h3>
          <p className="mb-4 text-[12.5px] text-ink-2">
            En cumplimiento con Ley 1581/2012 (CO), LFPDPPP (MX) y normativas similares,
            puedes ejercer en cualquier momento tus derechos de:
          </p>
          <ul className="grid gap-2 text-[12.5px]">
            <li className="flex items-start gap-2"><Check size={13} className="text-ok mt-0.5 shrink-0" /><span><strong>Acceso:</strong> consultar qué datos personales tenemos sobre ti</span></li>
            <li className="flex items-start gap-2"><Check size={13} className="text-ok mt-0.5 shrink-0" /><span><strong>Rectificación:</strong> corregir información inexacta</span></li>
            <li className="flex items-start gap-2"><Check size={13} className="text-ok mt-0.5 shrink-0" /><span><strong>Cancelación:</strong> solicitar borrado de tus datos (excepto los requeridos por ley)</span></li>
            <li className="flex items-start gap-2"><Check size={13} className="text-ok mt-0.5 shrink-0" /><span><strong>Oposición:</strong> objetar tratamientos específicos</span></li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href="mailto:privacy@lexai.co" className="btn btn-primary btn-sm">Ejercer derecho ARCO</a>
            <Link href="/aviso-privacidad" className="btn btn-sm">Ver aviso de privacidad</Link>
          </div>
        </div>
      </section>

      {/* Infraestructura */}
      <section className="border-t border-line bg-bg-elev/30">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="serif mb-6 text-center text-[20px] font-semibold">Infraestructura</h2>
          <ul className="grid gap-1.5 text-[12.5px]">
            <Tech k="Hosting" v="Vercel (frontend · CDN edge global) + Railway (backend · Brasil/US)" />
            <Tech k="Base de datos" v="Supabase Postgres 15 · cifrado AES-256 · backups continuos" />
            <Tech k="Storage" v="Supabase Storage (S3 compatible) · cifrado por bucket" />
            <Tech k="LLM" v="OpenAI · contrato empresarial con ZDR opcional" />
            <Tech k="Vector DB" v="pgvector + HNSW indexes (mismo cluster Supabase)" />
            <Tech k="Monitoring" v="Sentry · health checks · uptime monitoring" />
            <Tech k="Backups" v="PITR Supabase (7 días) · snapshots diarios (30 días)" />
            <Tech k="Auth" v="Supabase Auth · JWT + RLS · MFA TOTP obligatorio" />
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h2 className="serif mb-3 text-[20px] font-semibold">¿Tienes preguntas de seguridad?</h2>
        <p className="mb-4 text-[12.5px] muted">
          Para auditorías, SOC 2, DPA o certificaciones específicas, contáctanos.
        </p>
        <a href="mailto:security@lexai.co" className="btn btn-primary btn-md">
          security@lexai.co
        </a>
      </section>

      <PublicFooter />
    </main>
  );
}

function Card({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="surface p-5">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-accent-soft text-accent">
        {icon}
      </span>
      <h3 className="serif mt-3 text-[15px] font-semibold">{title}</h3>
      <p className="mt-2 text-[12.5px] text-ink-2 leading-relaxed">{body}</p>
    </div>
  );
}

function ComplianceItem({ country, laws, details }: { country: string; laws: string; details: string }) {
  return (
    <div className="surface p-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold text-[14px]">{country}</h3>
        <span className="chip chip-neutral text-[10px]">{laws}</span>
      </div>
      <p className="mt-1 text-[12px] muted leading-relaxed">{details}</p>
    </div>
  );
}

function Tech({ k, v }: { k: string; v: string }) {
  return (
    <li className="flex flex-wrap items-baseline gap-2 border-b border-line/30 py-1.5 last:border-0">
      <strong className="text-[11px] uppercase tracking-wider text-ink-3 min-w-[100px]">{k}</strong>
      <span className="text-ink-2">{v}</span>
    </li>
  );
}
