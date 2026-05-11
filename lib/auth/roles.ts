/**
 * Roles, modos de ejercicio y áreas de práctica · single source of truth.
 *
 * Mantiene en sync el enum `user_role` de Postgres y las decisiones de
 * UI (sidebar adaptativo, atajos contextuales, capabilities por modo).
 *
 * Importante: si agregas/quitas valores aquí, también ajusta:
 *   - backend/storage/schemas/2026_05_10_sprint1_a_role_enum.sql
 *   - backend/utils/auth.py (Principal.role typing)
 */

// ────────────────────────────────────────────────────────────────────
// Modos de ejercicio profesional (M1–M5)
// ────────────────────────────────────────────────────────────────────

export const MODES = {
  independiente: {
    id: 'independiente',
    label: 'Abogado independiente',
    short: 'Independiente',
    description: 'Ejerces solo, atiendes empresas y personas naturales.',
    multiClient: true,
    icon: 'user',
  },
  firma: {
    id: 'firma',
    label: 'Firma de abogados',
    short: 'Firma',
    description: 'Sociedad de abogados con socios, asociados y paralegales.',
    multiClient: true,
    icon: 'users',
  },
  in_house: {
    id: 'in_house',
    label: 'Abogado in-house corporativo',
    short: 'In-house',
    description: 'Empleado interno de una empresa. Cliente único.',
    multiClient: false,
    icon: 'badge',
  },
  sector_publico: {
    id: 'sector_publico',
    label: 'Sector público',
    short: 'Funcionario',
    description: 'Funcionario en entidad estatal: dictámenes y contestaciones.',
    multiClient: false,
    icon: 'shield',
  },
  consultoria: {
    id: 'consultoria',
    label: 'Consultoría especializada',
    short: 'Consultor',
    description: 'Boutique consultiva: due diligence, M&A, compliance.',
    multiClient: true,
    icon: 'scales',
  },
} as const;

export type ModoEjercicio = keyof typeof MODES;

export const MODE_IDS: ModoEjercicio[] = [
  'independiente',
  'firma',
  'in_house',
  'sector_publico',
  'consultoria',
];

// ────────────────────────────────────────────────────────────────────
// Roles · alineado con enum `user_role` de Postgres
// ────────────────────────────────────────────────────────────────────

export const ROLES = {
  admin: { label: 'Admin', isPartner: true, canManageFirm: true },
  socio_senior: { label: 'Socio senior', isPartner: true, canManageFirm: true },
  socio_junior: { label: 'Socio junior', isPartner: true, canManageFirm: false },
  lawyer: { label: 'Abogado', isPartner: false, canManageFirm: false },
  paralegal: { label: 'Paralegal', isPartner: false, canManageFirm: false },
  independiente: { label: 'Independiente', isPartner: false, canManageFirm: true },
  in_house: { label: 'In-house', isPartner: false, canManageFirm: false },
  funcionario_publico: { label: 'Funcionario público', isPartner: false, canManageFirm: false },
  consultor: { label: 'Consultor', isPartner: false, canManageFirm: false },
  readonly: { label: 'Solo lectura', isPartner: false, canManageFirm: false },
} as const;

export type UserRole = keyof typeof ROLES;

/** Roles típicos por modo de ejercicio. Usado por el wizard de onboarding
 *  para sugerir un rol acorde al modo seleccionado. NO es restrictivo:
 *  un usuario puede elegir cualquier rol del enum. */
export const SUGGESTED_ROLES_BY_MODE: Record<ModoEjercicio, UserRole[]> = {
  independiente: ['independiente'],
  firma: ['socio_senior', 'socio_junior', 'lawyer', 'paralegal'],
  in_house: ['in_house'],
  sector_publico: ['funcionario_publico'],
  consultoria: ['consultor'],
};

// ────────────────────────────────────────────────────────────────────
// Áreas de práctica · alineado con enum `materia_legal` de Postgres
// ────────────────────────────────────────────────────────────────────

export const PRACTICE_AREAS = {
  laboral:           { label: 'Laboral',           hint: 'Despidos, prestaciones, pensiones.' },
  civil:             { label: 'Civil',             hint: 'Responsabilidad civil, contratos.' },
  mercantil:         { label: 'Mercantil',         hint: 'Empresas, sociedades, M&A.' },
  comercial:         { label: 'Comercial',         hint: 'Contratos comerciales, títulos valores.' },
  penal:             { label: 'Penal',             hint: 'Defensa penal y querellas.' },
  familiar:          { label: 'Familia',           hint: 'Divorcios, sucesiones, custodia.' },
  administrativo:    { label: 'Administrativo',    hint: 'Contratación estatal, contencioso administrativo.' },
  constitucional:    { label: 'Constitucional',    hint: 'Tutelas, acciones de inconstitucionalidad.' },
  fiscal:            { label: 'Fiscal / Tributario', hint: 'DIAN, impuestos, planeación tributaria.' },
  seguridad_social:  { label: 'Seguridad Social',  hint: 'Pensiones, salud, riesgos laborales.' },
  otro:              { label: 'Otro',              hint: 'Áreas no listadas.' },
} as const;

export type PracticeArea = keyof typeof PRACTICE_AREAS;

export const PRACTICE_AREA_IDS: PracticeArea[] = [
  'laboral',
  'civil',
  'mercantil',
  'comercial',
  'administrativo',
  'constitucional',
  'familiar',
  'penal',
  'fiscal',
  'seguridad_social',
  'otro',
];

// ────────────────────────────────────────────────────────────────────
// Capabilities · qué módulos del workspace ve cada rol/modo
// ────────────────────────────────────────────────────────────────────

export type Capability =
  | 'cases'
  | 'clients'
  | 'documents'
  | 'calendar'
  | 'calculators'
  | 'canvas'
  | 'voice'
  | 'inbox'
  | 'settings'
  | 'admin'
  | 'firm_teams'
  | 'compliance';

// Rule of thumb: any role with `cases` MUST also have `clients` because a
// matter cannot exist without a client (the form `Nuevo caso` requires
// selecting one). For modes with a single implicit client (in_house →
// the company itself, funcionario_publico → the institution + ciudadanos),
// the Clients module is still needed to register/edit those entities.
const ROLE_CAPABILITIES: Record<UserRole, Capability[]> = {
  admin: [
    'cases','clients','documents','calendar','calculators','canvas',
    'voice','inbox','settings','admin','firm_teams','compliance',
  ],
  socio_senior: [
    'cases','clients','documents','calendar','calculators','canvas',
    'voice','inbox','settings','firm_teams','compliance','admin',
  ],
  socio_junior: [
    'cases','clients','documents','calendar','calculators','canvas',
    'voice','inbox','settings','firm_teams',
  ],
  lawyer: [
    'cases','clients','documents','calendar','calculators','canvas',
    'voice','inbox','settings',
  ],
  paralegal: [
    'cases','clients','documents','calendar','canvas','inbox','settings',
  ],
  independiente: [
    'cases','clients','documents','calendar','calculators','canvas',
    'voice','inbox','settings','compliance',
  ],
  in_house: [
    'cases','clients','documents','calendar','calculators','canvas',
    'voice','inbox','settings','compliance',
  ],
  funcionario_publico: [
    'cases','clients','documents','calendar','canvas','voice','inbox','settings',
  ],
  consultor: [
    'cases','clients','documents','calendar','calculators','canvas',
    'voice','inbox','settings',
  ],
  readonly: ['cases','clients','documents','calendar','inbox'],
};

export function getCapabilities(role: UserRole | string | null | undefined): Capability[] {
  if (!role) return ROLE_CAPABILITIES.readonly;
  return ROLE_CAPABILITIES[role as UserRole] ?? ROLE_CAPABILITIES.lawyer;
}

export function hasCapability(role: UserRole | string | null | undefined, cap: Capability): boolean {
  return getCapabilities(role).includes(cap);
}

// ────────────────────────────────────────────────────────────────────
// Atajos contextuales según área de práctica
// ────────────────────────────────────────────────────────────────────

/** Pestañas/secciones que el sidebar prioriza al frente cuando el
 *  usuario marca un área como activa. */
export const PRIORITY_SHORTCUTS_BY_AREA: Record<PracticeArea, string[]> = {
  laboral: ['/calc/liquidacion', '/calc/prescripcion'],
  civil: ['/casos?categoria=civil', '/calc/prescripcion'],
  mercantil: ['/casos?categoria=comercial', '/clientes'],
  comercial: ['/casos?categoria=comercial', '/calc/intereses'],
  penal: ['/casos?categoria=penal'],
  familiar: ['/casos?categoria=familiar'],
  administrativo: ['/casos?categoria=administrativo', '/notificaciones'],
  constitucional: ['/casos?categoria=tutela'],
  fiscal: ['/calc/intereses'],
  seguridad_social: ['/calc/liquidacion'],
  otro: [],
};

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

export function isPartnerRole(role: UserRole | string | null | undefined): boolean {
  if (!role || !(role in ROLES)) return false;
  return ROLES[role as UserRole].isPartner;
}

export function canManageFirm(role: UserRole | string | null | undefined): boolean {
  if (!role || !(role in ROLES)) return false;
  return ROLES[role as UserRole].canManageFirm;
}

export function modeLabel(mode: ModoEjercicio | string | null | undefined): string {
  if (!mode || !(mode in MODES)) return 'Sin definir';
  return MODES[mode as ModoEjercicio].label;
}
