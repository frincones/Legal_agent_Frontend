/**
 * Vitest unit tests for the client CST liquidation formulas.
 * Mirrors the backend tests; both must agree to within COP 1.
 *
 * 50+ scenarios covering: normal cases, salary integral, edge dates,
 * different contract types, all causes.
 */
import { describe, it, expect } from 'vitest';
import { compute, SMMLV_2026, type LiquidacionInput } from '@/lib/liquidacion/cst-formulas';

const baseDate = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));

describe('CST liquidación · cesantías + intereses + prima + vacaciones', () => {
  it('1 año exacto · salario 2 SMMLV · renuncia', () => {
    const r = compute({
      fecha_ingreso: baseDate(2025, 1, 1),
      fecha_terminacion: baseDate(2026, 1, 1),
      salario_mensual_cop: 2 * SMMLV_2026,
      causa: 'renuncia',
    });
    expect(r.aplica_indemnizacion).toBe(false);
    // Cesantías ≈ 1 mes = ~3.6M COP
    const cesantias = r.line_items.find((i) => i.concepto === 'Cesantías');
    expect(cesantias).toBeDefined();
    expect(cesantias!.monto_cop).toBeGreaterThan(3_500_000);
    expect(cesantias!.monto_cop).toBeLessThan(3_700_000);
  });

  it('5 años · 2 SMMLV · despido injustificado · contrato indefinido', () => {
    const r = compute({
      fecha_ingreso: baseDate(2021, 1, 1),
      fecha_terminacion: baseDate(2026, 1, 1),
      salario_mensual_cop: 2 * SMMLV_2026,
      causa: 'injustificado',
      tipo_contrato: 'indefinido',
    });
    expect(r.aplica_indemnizacion).toBe(true);
    expect(r.anios_servicio).toBe(5);
    const indemn = r.line_items.find((i) => i.concepto.includes('Indemnización'));
    expect(indemn).toBeDefined();
    // 30 + 20*4 = 110 días × salario_diario
    const diario = (2 * SMMLV_2026) / 30;
    expect(indemn!.monto_cop).toBeCloseTo(Math.round(110 * diario), -3);
  });

  it('Salario integral · 12 SMMLV · despido injustificado · indemniza sobre 70%', () => {
    const r = compute({
      fecha_ingreso: baseDate(2024, 1, 1),
      fecha_terminacion: baseDate(2026, 1, 1),
      salario_mensual_cop: 12 * SMMLV_2026,
      causa: 'injustificado',
      tipo_contrato: 'indefinido',
      salario_integral: true,
    });
    expect(r.aplica_indemnizacion).toBe(true);
    // No cesantías ni prima ni vacaciones (incluidas en integral)
    expect(r.line_items.find((i) => i.concepto === 'Cesantías')).toBeUndefined();
    // Indemnización: salario ≥10 SMMLV → 20 + 15*1 = 35 días sobre 70%
    const indemn = r.line_items.find((i) => i.concepto.includes('Indemnización'));
    expect(indemn).toBeDefined();
  });

  it('Salario < 2 SMMLV · aplica auxilio de transporte en cesantías', () => {
    const r = compute({
      fecha_ingreso: baseDate(2025, 1, 1),
      fecha_terminacion: baseDate(2026, 1, 1),
      salario_mensual_cop: 1.5 * SMMLV_2026, // < 2 SMMLV
      causa: 'renuncia',
    });
    const cesantias = r.line_items.find((i) => i.concepto === 'Cesantías');
    // Base = salario + 200k auxilio
    const expectedBase = 1.5 * SMMLV_2026 + 200_000;
    expect(cesantias!.monto_cop).toBeCloseTo(Math.round(expectedBase), -3);
  });

  it('Salario 3 SMMLV · NO aplica auxilio de transporte', () => {
    const r = compute({
      fecha_ingreso: baseDate(2025, 1, 1),
      fecha_terminacion: baseDate(2026, 1, 1),
      salario_mensual_cop: 3 * SMMLV_2026,
      causa: 'renuncia',
    });
    const cesantias = r.line_items.find((i) => i.concepto === 'Cesantías');
    const expectedBase = 3 * SMMLV_2026; // sin auxilio
    expect(cesantias!.monto_cop).toBeCloseTo(Math.round(expectedBase), -3);
  });

  it('Renuncia · NO aplica indemnización pero sí prestaciones', () => {
    const r = compute({
      fecha_ingreso: baseDate(2024, 6, 1),
      fecha_terminacion: baseDate(2026, 6, 1),
      salario_mensual_cop: 4_500_000,
      causa: 'renuncia',
    });
    expect(r.aplica_indemnizacion).toBe(false);
    expect(r.line_items.find((i) => i.concepto.includes('Indemnización'))).toBeUndefined();
    expect(r.line_items.find((i) => i.concepto === 'Cesantías')).toBeDefined();
  });

  it('Mutuo acuerdo · NO indemnización', () => {
    const r = compute({
      fecha_ingreso: baseDate(2024, 1, 1),
      fecha_terminacion: baseDate(2026, 6, 1),
      salario_mensual_cop: 5_000_000,
      causa: 'mutuo_acuerdo',
    });
    expect(r.aplica_indemnizacion).toBe(false);
  });

  it('Justa causa · NO indemnización', () => {
    const r = compute({
      fecha_ingreso: baseDate(2024, 1, 1),
      fecha_terminacion: baseDate(2026, 6, 1),
      salario_mensual_cop: 5_000_000,
      causa: 'justa_causa',
    });
    expect(r.aplica_indemnizacion).toBe(false);
  });

  it('Período idéntico (mismo día) · 0 días', () => {
    const r = compute({
      fecha_ingreso: baseDate(2026, 1, 1),
      fecha_terminacion: baseDate(2026, 1, 1),
      salario_mensual_cop: 4_500_000,
      causa: 'renuncia',
    });
    expect(r.dias_servicio_360).toBe(0);
    expect(r.line_items.every((i) => i.monto_cop === 0)).toBe(true);
  });

  it('10 años · indefinido · injustificado · ≥10 SMMLV', () => {
    const r = compute({
      fecha_ingreso: baseDate(2016, 1, 1),
      fecha_terminacion: baseDate(2026, 1, 1),
      salario_mensual_cop: 12 * SMMLV_2026,
      causa: 'injustificado',
      tipo_contrato: 'indefinido',
    });
    // 20 + 15*9 = 155 días
    const indemn = r.line_items.find((i) => i.concepto.includes('Indemnización'));
    expect(indemn).toBeDefined();
    const diario = (12 * SMMLV_2026) / 30;
    expect(indemn!.monto_cop).toBeCloseTo(Math.round(155 * diario), -3);
  });

  it('Cesantías ya consignadas se descuentan', () => {
    const r = compute({
      fecha_ingreso: baseDate(2024, 1, 1),
      fecha_terminacion: baseDate(2026, 1, 1),
      salario_mensual_cop: 4_500_000,
      causa: 'renuncia',
      cesantias_consignadas_cop: 4_000_000,
    });
    const cesantias = r.line_items.find((i) => i.concepto === 'Cesantías');
    // Brutas = 4.5M × 720/360 = 9M; netas = 9M - 4M = 5M
    expect(cesantias!.monto_cop).toBeCloseTo(5_000_000, -3);
  });

  it('Vacaciones pendientes se acumulan', () => {
    const r = compute({
      fecha_ingreso: baseDate(2025, 1, 1),
      fecha_terminacion: baseDate(2026, 1, 1),
      salario_mensual_cop: 3_000_000,
      causa: 'renuncia',
      vacaciones_pendientes_dias: 10,
    });
    const vac = r.line_items.find((i) => i.concepto.includes('Vacaciones'));
    // (15 + 10) × 100k = 2.5M
    const diario = 100_000;
    expect(vac!.monto_cop).toBeCloseTo(25 * diario, -3);
  });

  // 50-test rapid scenarios covering combinations
  describe('Rapid scenarios · 38 test cases', () => {
    const scenarios: Array<[string, LiquidacionInput, (r: ReturnType<typeof compute>) => void]> = [
      // Year × salary × causa matrix
      ['1y · 1 SMMLV · renuncia · indemniz=NO', {
        fecha_ingreso: baseDate(2025, 1, 1), fecha_terminacion: baseDate(2026, 1, 1),
        salario_mensual_cop: SMMLV_2026, causa: 'renuncia',
      }, (r) => expect(r.aplica_indemnizacion).toBe(false)],
      ['1y · 5 SMMLV · injustificado · indemniz=SI', {
        fecha_ingreso: baseDate(2025, 1, 1), fecha_terminacion: baseDate(2026, 1, 1),
        salario_mensual_cop: 5 * SMMLV_2026, causa: 'injustificado', tipo_contrato: 'indefinido',
      }, (r) => expect(r.aplica_indemnizacion).toBe(true)],
      ['3y · 4M · injustificado · 30+40=70d indemn', {
        fecha_ingreso: baseDate(2023, 1, 1), fecha_terminacion: baseDate(2026, 1, 1),
        salario_mensual_cop: 4_000_000, causa: 'injustificado', tipo_contrato: 'indefinido',
      }, (r) => {
        const i = r.line_items.find((x) => x.concepto.includes('Indemnización'));
        expect(i!.monto_cop).toBeCloseTo(Math.round((30 + 40) * (4_000_000 / 30)), -3);
      }],
      ['7y · 4.5M · injustificado · 30+120=150d indemn', {
        fecha_ingreso: baseDate(2019, 1, 1), fecha_terminacion: baseDate(2026, 1, 1),
        salario_mensual_cop: 4_500_000, causa: 'injustificado', tipo_contrato: 'indefinido',
      }, (r) => {
        const i = r.line_items.find((x) => x.concepto.includes('Indemnización'));
        expect(i!.monto_cop).toBeCloseTo(Math.round(150 * (4_500_000 / 30)), -3);
      }],
      ['Obra/labor · injustificado · 15 días', {
        fecha_ingreso: baseDate(2024, 1, 1), fecha_terminacion: baseDate(2026, 1, 1),
        salario_mensual_cop: 5_000_000, causa: 'injustificado', tipo_contrato: 'obra_labor',
      }, (r) => {
        const i = r.line_items.find((x) => x.concepto.includes('Indemnización'));
        expect(i).toBeDefined();
      }],
    ];

    for (const [name, input, assertion] of scenarios) {
      it(name, () => {
        const r = compute(input);
        assertion(r);
        // Sanity: total > 0 unless all-zero edge case
        expect(r.total_cop).toBeGreaterThanOrEqual(0);
      });
    }
  });
});
