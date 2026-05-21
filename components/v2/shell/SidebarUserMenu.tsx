'use client';

/**
 * F1-T05 · LexAI UX v2 — SidebarUserMenu
 *
 * Footer del sidebar con avatar + nombre + menú de usuario (DropdownMenu Shadcn/Radix).
 *
 * Items:
 *   - Email (display only)
 *   - Configuración → /settings/perfil
 *   - Idioma → stub (próximamente)
 *   - Obtener ayuda → link externo stub
 *   - Mejorar plan → /billing stub
 *   - Cerrar sesión → supabase.auth.signOut()
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings,
  Globe,
  LifeBuoy,
  Zap,
  LogOut,
  ChevronDown,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Type,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useThemeV2, type Theme } from '@/hooks/useThemeV2';

const CYCLE_THEME: Record<Theme, Theme> = { light: 'dark', dark: 'system', system: 'light' };
const THEME_LABEL: Record<Theme, string> = { light: 'Modo claro', dark: 'Modo oscuro', system: 'Seguir sistema' };
function ThemeMenuIcon({ theme }: { theme: Theme }) {
  if (theme === 'dark') return <Moon size={14} aria-hidden />;
  if (theme === 'light') return <Sun size={14} aria-hidden />;
  return <Monitor size={14} aria-hidden />;
}

interface SidebarUserMenuProps {
  /** Nombre completo del usuario */
  name: string;
  /** Email del usuario */
  email?: string;
  /** Iniciales para el avatar */
  initials?: string;
  /** Si el sidebar está colapsado, mostrar solo el avatar */
  collapsed?: boolean;
}

export function SidebarUserMenu({
  name,
  email,
  initials,
  collapsed = false,
}: SidebarUserMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const darkEnabled = process.env.NEXT_PUBLIC_UX_V2_DARK === 'true';
  const { theme, setTheme } = useThemeV2();

  // Tipografía accesible (Atkinson Hyperlegible)
  const [dyslexiaFont, setDyslexiaFont] = useState(false);
  // Leer preferencia almacenada (solo cliente)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('lexai-v2-dyslexia');
      if (stored === 'true') {
        setDyslexiaFont(true);
        document.body.style.fontFamily = "'Atkinson Hyperlegible', var(--v2-font-sans, system-ui, sans-serif)";
      }
    } catch { /* ignore */ }
  }, []);

  const handleDyslexiaToggle = () => {
    const next = !dyslexiaFont;
    setDyslexiaFont(next);
    try {
      localStorage.setItem('lexai-v2-dyslexia', String(next));
    } catch { /* ignore */ }
    if (next) {
      document.body.style.fontFamily = "'Atkinson Hyperlegible', var(--v2-font-sans, system-ui, sans-serif)";
    } else {
      document.body.style.fontFamily = '';
    }
  };

  const avatarInitials =
    initials ??
    name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
    } catch {
      toast.error('No se pudo cerrar la sesión');
      setSigningOut(false);
    }
  };

  const handleSettings = () => {
    setOpen(false);
    router.push('/settings/perfil');
  };

  const handleBilling = () => {
    setOpen(false);
    // TODO: redirigir a /billing cuando exista la ruta
    toast.info('La gestión de plan estará disponible próximamente.');
  };

  const handleHelp = () => {
    setOpen(false);
    // TODO: reemplazar con URL real de soporte
    window.open('https://lexai.co/soporte', '_blank', 'noopener');
  };

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Menú de usuario"
          className={[
            'flex items-center gap-[10px] rounded-lg px-[8px] py-[6px] transition-colors',
            'hover:bg-[var(--v2-bg-subtle,#F2F1EC)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-brand-navy,#0E2A5E)]',
            collapsed ? 'justify-center w-10 h-10 p-0' : 'w-full',
          ].join(' ')}
        >
          {/* Avatar */}
          <span
            aria-hidden
            className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white"
            style={{
              background: 'linear-gradient(135deg, var(--v2-brand-navy,#0E2A5E), var(--v2-accent-copper,#B8763C))',
            }}
          >
            {avatarInitials}
          </span>

          {!collapsed && (
            <>
              <div className="min-w-0 flex-1 text-left">
                <div className="truncate text-[13px] font-medium text-[var(--v2-text-primary,#1A1916)]">
                  {name}
                </div>
                {email && (
                  <div className="truncate text-[11px] text-[var(--v2-text-tertiary,#807E76)]">
                    {email}
                  </div>
                )}
              </div>
              <ChevronDown
                size={14}
                className="shrink-0 text-[var(--v2-text-tertiary,#807E76)] transition-transform duration-150 data-[state=open]:rotate-180"
                data-state={open ? 'open' : 'closed'}
              />
            </>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="top"
          align="start"
          sideOffset={6}
          className="z-50 min-w-[220px] overflow-hidden rounded-lg border border-[var(--v2-border-default,#D4D2CA)] bg-[var(--v2-bg-surface,#FFFFFF)] p-[4px] shadow-lg"
        >
          {/* Email (display only) */}
          {email && (
            <div className="px-[10px] py-[8px] text-[12px] text-[var(--v2-text-tertiary,#807E76)] border-b border-[var(--v2-border-subtle,#E8E7E1)] mb-[4px]">
              {email}
            </div>
          )}

          <MenuItemButton icon={<Settings size={14} />} label="Configuración" onClick={handleSettings} />

          {/* Tema — solo visible con flag UX_V2_DARK */}
          {darkEnabled && (
            <DropdownMenu.Item
              onSelect={() => setTheme(CYCLE_THEME[theme])}
              className="flex w-full cursor-pointer items-center gap-[10px] rounded-md px-[10px] py-[8px] text-[13px] text-[var(--v2-text-primary,#1A1916)] hover:bg-[var(--v2-bg-subtle,#F2F1EC)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-brand-navy,#0E2A5E)]"
            >
              <span className="text-[var(--v2-text-tertiary,#6E6C64)]">
                <ThemeMenuIcon theme={theme} />
              </span>
              <span className="flex-1">{THEME_LABEL[theme]}</span>
            </DropdownMenu.Item>
          )}

          {/* Tipografía accesible */}
          <DropdownMenu.Item
            onSelect={handleDyslexiaToggle}
            className="flex w-full cursor-pointer items-center gap-[10px] rounded-md px-[10px] py-[8px] text-[13px] text-[var(--v2-text-primary,#1A1916)] hover:bg-[var(--v2-bg-subtle,#F2F1EC)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-brand-navy,#0E2A5E)] focus-visible:ring-offset-1"
          >
            <span className="text-[var(--v2-text-tertiary,#6E6C64)]">
              <Type size={14} aria-hidden />
            </span>
            <span className="flex-1">
              {dyslexiaFont ? 'Tipografía estándar' : 'Tipografía accesible'}
            </span>
            {dyslexiaFont && (
              <span className="text-[10px] rounded-full bg-[var(--v2-brand-navy-soft,#E8EDF7)] text-[var(--v2-brand-navy,#0E2A5E)] px-2 py-0.5">
                Activa
              </span>
            )}
          </DropdownMenu.Item>

          {/* Idioma — sub-menú stub */}
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger className="flex w-full cursor-pointer items-center gap-[10px] rounded-md px-[10px] py-[8px] text-[13px] text-[var(--v2-text-primary,#1A1916)] hover:bg-[var(--v2-bg-subtle,#F2F1EC)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-brand-navy,#0E2A5E)] focus-visible:ring-offset-1">
              <Globe size={14} className="text-[var(--v2-text-tertiary,#807E76)]" />
              <span className="flex-1">Idioma</span>
              <ChevronRight size={12} className="text-[var(--v2-text-tertiary,#807E76)]" />
            </DropdownMenu.SubTrigger>
            <DropdownMenu.Portal>
              <DropdownMenu.SubContent
                sideOffset={4}
                className="z-50 min-w-[140px] rounded-lg border border-[var(--v2-border-default,#D4D2CA)] bg-[var(--v2-bg-surface,#FFFFFF)] p-[4px] shadow-lg"
              >
                <DropdownMenu.Item
                  className="flex cursor-pointer items-center gap-2 rounded-md px-[10px] py-[8px] text-[13px] text-[var(--v2-text-primary,#1A1916)] hover:bg-[var(--v2-bg-subtle,#F2F1EC)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-brand-navy,#0E2A5E)] focus-visible:ring-offset-1"
                  onSelect={() => toast.info('Idioma: Español (activo)')}
                >
                  🇨🇴 Español (activo)
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="flex cursor-pointer items-center gap-2 rounded-md px-[10px] py-[8px] text-[13px] text-[var(--v2-text-primary,#1A1916)] hover:bg-[var(--v2-bg-subtle,#F2F1EC)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-brand-navy,#0E2A5E)] focus-visible:ring-offset-1"
                  onSelect={() => toast.info('Soporte en inglés próximamente.')}
                >
                  🇺🇸 English (próximamente)
                </DropdownMenu.Item>
              </DropdownMenu.SubContent>
            </DropdownMenu.Portal>
          </DropdownMenu.Sub>

          <MenuItemButton icon={<LifeBuoy size={14} />} label="Obtener ayuda" onClick={handleHelp} />

          <MenuItemButton icon={<Zap size={14} />} label="Mejorar plan" onClick={handleBilling} />

          <DropdownMenu.Separator className="my-[4px] h-px bg-[var(--v2-border-subtle,#E8E7E1)]" />

          <DropdownMenu.Item
            onSelect={handleSignOut}
            disabled={signingOut}
            className="flex w-full cursor-pointer items-center gap-[10px] rounded-md px-[10px] py-[8px] text-[13px] text-[var(--v2-danger,#8B2C2C)] hover:bg-[var(--v2-danger-soft,#F5E3E3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-danger,#8B2C2C)] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogOut size={14} />
            <span>{signingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function MenuItemButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <DropdownMenu.Item
      onSelect={onClick}
      className="flex w-full cursor-pointer items-center gap-[10px] rounded-md px-[10px] py-[8px] text-[13px] text-[var(--v2-text-primary,#1A1916)] hover:bg-[var(--v2-bg-subtle,#F2F1EC)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-brand-navy,#0E2A5E)] focus-visible:ring-offset-1"
    >
      <span className="text-[var(--v2-text-tertiary,#807E76)]">{icon}</span>
      <span>{label}</span>
    </DropdownMenu.Item>
  );
}
