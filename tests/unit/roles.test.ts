import { describe, expect, it } from 'vitest';
import {
  canManageFirm,
  getCapabilities,
  hasCapability,
  isPartnerRole,
  modeLabel,
  PRIORITY_SHORTCUTS_BY_AREA,
  SUGGESTED_ROLES_BY_MODE,
} from '@/lib/auth/roles';

describe('roles · capabilities & helpers', () => {
  it('returns full capabilities for admin', () => {
    const caps = getCapabilities('admin');
    expect(caps).toContain('cases');
    expect(caps).toContain('admin');
    expect(caps).toContain('firm_teams');
  });

  it('paralegal does NOT have voice or calculators', () => {
    expect(hasCapability('paralegal', 'voice')).toBe(false);
    expect(hasCapability('paralegal', 'calculators')).toBe(false);
    expect(hasCapability('paralegal', 'cases')).toBe(true);
  });

  it('every role with `cases` also has `clients` (a matter requires a client)', () => {
    const rolesWithCases = [
      'admin','socio_senior','socio_junior','lawyer','paralegal',
      'independiente','in_house','funcionario_publico','consultor','readonly',
    ];
    for (const r of rolesWithCases) {
      if (hasCapability(r, 'cases')) {
        expect(hasCapability(r, 'clients'), `${r} has cases but not clients`).toBe(true);
      }
    }
  });

  it('funcionario_publico has clients (cotizantes/ciudadanos) but no calculators', () => {
    expect(hasCapability('funcionario_publico', 'clients')).toBe(true);
    expect(hasCapability('funcionario_publico', 'calculators')).toBe(false);
  });

  it('readonly is the safest fallback', () => {
    expect(getCapabilities(null)).toEqual(getCapabilities('readonly'));
    expect(getCapabilities(undefined)).toEqual(getCapabilities('readonly'));
    expect(hasCapability('readonly', 'admin')).toBe(false);
  });

  it('falls back to lawyer for unknown roles', () => {
    expect(getCapabilities('foobar')).toEqual(getCapabilities('lawyer'));
  });

  it('isPartnerRole detects socios', () => {
    expect(isPartnerRole('socio_senior')).toBe(true);
    expect(isPartnerRole('socio_junior')).toBe(true);
    expect(isPartnerRole('admin')).toBe(true);
    expect(isPartnerRole('lawyer')).toBe(false);
    expect(isPartnerRole('paralegal')).toBe(false);
    expect(isPartnerRole(null)).toBe(false);
  });

  it('canManageFirm allows independiente (their own firm-of-one)', () => {
    expect(canManageFirm('independiente')).toBe(true);
    expect(canManageFirm('admin')).toBe(true);
    expect(canManageFirm('socio_senior')).toBe(true);
    expect(canManageFirm('lawyer')).toBe(false);
    expect(canManageFirm('socio_junior')).toBe(false); // junior partners cannot delete
  });

  it('every mode has at least one suggested role', () => {
    for (const [mode, roles] of Object.entries(SUGGESTED_ROLES_BY_MODE)) {
      expect(roles.length, `mode ${mode}`).toBeGreaterThan(0);
    }
  });

  it('priority shortcuts are configured for laboral and administrativo', () => {
    expect(PRIORITY_SHORTCUTS_BY_AREA.laboral.length).toBeGreaterThan(0);
    expect(PRIORITY_SHORTCUTS_BY_AREA.administrativo).toContain('/notificaciones');
  });

  it('modeLabel returns "Sin definir" for null', () => {
    expect(modeLabel(null)).toBe('Sin definir');
    expect(modeLabel(undefined)).toBe('Sin definir');
    expect(modeLabel('firma')).toBe('Firma de abogados');
  });
});
