import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { Providers } from './providers';
import './globals.css';
// F0-T06: tokens v2 — solo define variables CSS bajo [data-v2-tokens], no activa nada por defecto
import '@/styles/tokens-v2.css';

export const metadata: Metadata = {
  title: 'LexAI · Asistente legal voice-first',
  description: 'El primer asistente legal voice-first para abogados hispanos.',
  // Favicon auto-generado por Next.js desde app/icon.svg
};

/**
 * Activa los tokens v2 server-side para evitar hydration mismatch.
 * NEXT_PUBLIC_UX_V2_TOKENS está disponible tanto en server como en client
 * (es inlined en el bundle), así que el atributo coincide entre ambos.
 */
const V2_TOKENS_ACTIVE = process.env.NEXT_PUBLIC_UX_V2_TOKENS === 'true';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es-CO"
      suppressHydrationWarning
      {...(V2_TOKENS_ACTIVE ? { 'data-v2-tokens': 'true' } : {})}
    >
      <head>
        {/* Blocking script: aplica data-theme antes de hidratar React para evitar FOUC + hydration mismatch */}
        {process.env.NEXT_PUBLIC_UX_V2_DARK === 'true' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem('lexai-v2-theme');var r;if(t==='dark'||t==='light')r=t;else if(t==='system'||!t)r=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';else r='light';document.documentElement.setAttribute('data-theme',r);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`,
            }}
          />
        )}
        {/* Google Fonts — Inter, Fraunces, JetBrains Mono */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=JetBrains+Mono:wght@400;500;600&family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-bg text-ink antialiased">
        <Providers>{children}</Providers>
        {/* bottom-right con offset para no solapar el composer ni el footer del sidebar */}
        <Toaster position="top-right" richColors closeButton toastOptions={{ duration: 4000 }} />
      </body>
    </html>
  );
}
