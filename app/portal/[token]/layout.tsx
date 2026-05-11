/**
 * Layout para el portal público de clientes. NO usa AppShell (sin auth Supabase).
 * Minimal, mobile-first, branding sutil.
 */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="border-b border-line bg-bg-elev/60 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <div className="serif text-[18px] font-semibold">Portal del cliente</div>
          <div className="text-[11.5px] muted">Powered by LexAI</div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
