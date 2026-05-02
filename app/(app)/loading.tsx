/**
 * Skeleton mostrado instantáneamente al navegar entre rutas (app)/*.
 * Next.js lo usa como fallback durante el RSC streaming.
 *
 * Nota: usamos un layout de sidebar idéntico para que la transición sea
 * imperceptible (la sidebar pesada se queda renderizada del shell anterior).
 */
export default function AppLoading() {
  return (
    <div className="grid h-screen w-screen grid-cols-[248px_1fr] overflow-hidden bg-bg text-ink">
      {/* Sidebar skeleton */}
      <aside className="flex h-full min-h-0 flex-col gap-2 border-r border-line bg-bg p-3.5">
        <div className="h-7 w-32 rounded bg-bg-sunken" />
        <div className="mt-2 h-7 w-full rounded bg-bg-sunken" />
        <div className="mt-3 flex flex-col gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-8 w-full rounded-md bg-bg-sunken" />
          ))}
        </div>
        <div className="flex-1" />
        <div className="surface h-[100px] p-3">
          <div className="h-3 w-32 rounded bg-bg-sunken" />
          <div className="mt-2 h-7 w-16 rounded bg-bg-sunken" />
          <div className="mt-2 h-1 w-full rounded bg-bg-sunken" />
        </div>
      </aside>

      {/* Main column skeleton */}
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <header className="flex items-end gap-4 border-b border-line bg-bg px-7 pb-4 pt-[22px]">
          <div className="min-w-0 flex-1">
            <div className="h-3 w-40 rounded bg-bg-sunken" />
            <div className="mt-2 h-7 w-72 rounded bg-bg-sunken" />
            <div className="mt-2 h-3 w-96 rounded bg-bg-sunken" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-32 rounded-md bg-bg-sunken" />
            <div className="h-8 w-36 rounded-md bg-bg-sunken" />
          </div>
        </header>
        <div className="flex-1 overflow-auto p-7">
          <div className="surface mb-6 h-32 p-6">
            <div className="h-3 w-44 rounded bg-bg-sunken" />
            <div className="mt-3 h-5 w-3/4 rounded bg-bg-sunken" />
            <div className="mt-2 h-5 w-1/2 rounded bg-bg-sunken" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="surface h-40 p-5">
                <div className="h-3 w-24 rounded bg-bg-sunken" />
                <div className="mt-2 h-5 w-3/4 rounded bg-bg-sunken" />
                <div className="mt-2 h-3 w-full rounded bg-bg-sunken" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
