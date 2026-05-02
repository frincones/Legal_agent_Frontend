import { Logo } from '@/components/atoms/Logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-bg md:grid-cols-[1fr_1.1fr]">
      <aside className="hidden flex-col border-r border-line bg-bg-sunken p-10 md:flex">
        <Logo size={20} />
        <div className="flex-1" />
        <blockquote className="serif m-0 text-[24px] font-normal leading-[1.4] -tracking-[0.01em]">
          &ldquo;Nunca pensé que la tecnología pudiera entender un memorial colombiano. LexAI me
          ahorra 4 horas al día.&rdquo;
        </blockquote>
        <div className="mt-[18px] flex items-center gap-[10px]">
          <div
            className="grid h-[36px] w-[36px] place-items-center rounded-full text-[13px] font-semibold text-white"
            style={{
              background: 'linear-gradient(135deg, rgb(var(--accent-rgb)), rgb(var(--purple-rgb)))',
            }}
          >
            RM
          </div>
          <div>
            <div className="text-[13px] font-semibold">Lic. Roberto Madrigal</div>
            <div className="text-[11.5px] muted">Madrigal & Asoc. · Bogotá D.C. · design partner</div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-[10px] border-t border-line pt-[18px]">
          <Stat big="0%" sub="citas alucinadas" />
          <Stat big="840ms" sub="voice E2E p50" />
          <Stat big="14d" sub="prueba gratuita" />
        </div>
      </aside>
      <main className="grid place-items-center p-10">{children}</main>
    </div>
  );
}

function Stat({ big, sub }: { big: string; sub: string }) {
  return (
    <div>
      <div className="serif text-[18px] font-semibold">{big}</div>
      <div className="text-[10.5px] muted">{sub}</div>
    </div>
  );
}
