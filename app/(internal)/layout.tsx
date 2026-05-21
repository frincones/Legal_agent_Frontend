/**
 * Layout mínimo para el grupo (internal).
 * Páginas bajo este grupo son solo para validación interna (staging/local).
 * No requieren autenticación ni el shell de la app.
 */
export default function InternalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
