/**
 * Client-side mirror of the backend CST + Ley 50/1990 + Ley 789/2002
 * liquidation calculator. Used for instant preview as the lawyer types,
 * for unit tests, and as fallback if the backend is offline.
 *
 * The backend (api/calc.py) is still the authoritative source — every
 * persisted calculation goes through it. This is for UX only.
 *
 * Constants 2026:
 *  · SMMLV = 1_823_500 COP
 *  · Aux. transporte = 200_000 COP/mes (si salario < 2 SMMLV)
 *  · Vacaciones = 15 días/año (CST Art. 186)
 *  · Intereses cesantías = 12% anual (Ley 52/1975)
 *  · Prima servicios = 30 días/año (CST Art. 306 modif. Ley 1788/2016)
 *  · Tope salario integral = ≥10 SMMLV (Ley 50 Art. 18)
 */

export const SMMLV_2026 = 1_823_500;
export const AUX_TRANSPORTE_2026 = 200_000;
export const DIAS_VACACIONES_ANUALES = 15;
export const TASA_INTERES_CESANTIAS = 0.12;
export const PRIMA_DIAS_ANUALES = 30;
export const CAP_INTEGRAL_SMMLV = 10;

export type Causa =
  | 'injustificado'
  | 'justa_causa'
  | 'renuncia'
  | 'mutuo_acuerdo'
  | 'terminacion_contrato'
  | 'fin_obra';

export type TipoContrato = 'indefinido' | 'fijo' | 'obra_labor' | 'aprendizaje';

export type LiquidacionInput = {
  fecha_ingreso: Date;
  fecha_terminacion: Date;
  salario_mensual_cop: number;
  causa: Causa;
  tipo_contrato?: TipoContrato;
  salario_integral?: boolean;
  auxilio_transporte_aplica?: boolean;
  vacaciones_pendientes_dias?: number;
  cesantias_consignadas_cop?: number;
  smmlv_cop?: number;
};

export type LineItem = {
  concepto: string;
  formula: string;
  monto_cop: number;
  fundamento: string;
};

export type LiquidacionResult = {
  total_cop: number;
  aplica_indemnizacion: boolean;
  causa: Causa;
  anios_servicio: number;
  dias_servicio_360: number;
  line_items: LineItem[];
};

function days360(d1: Date, d2: Date): number {
  if (d2 <= d1) return 0;
  const y = d2.getFullYear() - d1.getFullYear();
  const m = d2.getMonth() - d1.getMonth();
  const d = Math.min(d2.getDate(), 30) - Math.min(d1.getDate(), 30);
  return Math.max(0, y * 360 + m * 30 + d);
}

function r0(x: number): number {
  return Math.round(x);
}

export function compute(input: LiquidacionInput): LiquidacionResult {
  const smmlv = input.smmlv_cop ?? SMMLV_2026;
  const salario = input.salario_mensual_cop;
  const salarioDiario = salario / 30;
  const totalDias = days360(input.fecha_ingreso, input.fecha_terminacion);
  const anios = Math.floor(totalDias / 360);

  const aplicaAuxTransp =
    (input.auxilio_transporte_aplica ?? true) && salario < 2 * smmlv && !input.salario_integral;
  const basePrest = salario + (aplicaAuxTransp ? AUX_TRANSPORTE_2026 : 0);

  const aplicaIndemn = input.causa === 'injustificado';
  const items: LineItem[] = [];

  if (input.salario_integral) {
    items.push({
      concepto: 'Salario integral (Ley 50/1990 Art. 18)',
      formula: `Salario ${salario.toLocaleString('es-CO')} ≥ 10 SMMLV`,
      monto_cop: 0,
      fundamento: 'Las prestaciones están incluidas en el salario integral',
    });
  } else {
    // Cesantías
    const cesantiasBrutas = (basePrest * totalDias) / 360;
    const cesantiasNetas = Math.max(0, cesantiasBrutas - (input.cesantias_consignadas_cop ?? 0));
    items.push({
      concepto: 'Cesantías',
      formula: `(${basePrest.toLocaleString('es-CO')} × ${totalDias}) / 360`,
      monto_cop: r0(cesantiasNetas),
      fundamento: 'CST Art. 249 · Ley 50/1990 Art. 99',
    });

    // Intereses cesantías
    const intereses = cesantiasBrutas * TASA_INTERES_CESANTIAS * (totalDias / 360);
    items.push({
      concepto: 'Intereses sobre cesantías (12% anual)',
      formula: `${cesantiasBrutas.toFixed(0)} × 0.12 × ${(totalDias / 360).toFixed(2)}`,
      monto_cop: r0(intereses),
      fundamento: 'Ley 52/1975 Art. 1',
    });

    // Prima servicios
    const prima = (basePrest * totalDias) / 360;
    items.push({
      concepto: 'Prima de servicios',
      formula: `(${basePrest.toLocaleString('es-CO')} × ${totalDias}) / 360`,
      monto_cop: r0(prima),
      fundamento: 'CST Art. 306 modif. Ley 1788/2016',
    });

    // Vacaciones
    const vacDias = (DIAS_VACACIONES_ANUALES * totalDias) / 360 + (input.vacaciones_pendientes_dias ?? 0);
    items.push({
      concepto: 'Vacaciones (compensación)',
      formula: `(15 × ${totalDias}/360) × ${salarioDiario.toFixed(0)}`,
      monto_cop: r0(vacDias * salarioDiario),
      fundamento: 'CST Art. 186 y 189',
    });
  }

  // Indemnización Art. 64 CST
  if (aplicaIndemn) {
    const tipo = input.tipo_contrato ?? 'indefinido';
    const baseIndemn = input.salario_integral ? salario * 0.7 : salario;
    const salarioDiarioIndemn = baseIndemn / 30;
    const salarioSmmlv = baseIndemn / smmlv;

    if (tipo === 'indefinido') {
      let dias: number;
      let formula: string;
      if (salarioSmmlv < 10) {
        if (anios <= 1) {
          dias = 30;
          formula = '30 días (1er año contrato indefinido <10 SMMLV)';
        } else {
          dias = 30 + 20 * (anios - 1);
          formula = `30 + 20×(${anios}-1) = ${dias} días`;
        }
      } else {
        if (anios <= 1) {
          dias = 20;
          formula = '20 días (1er año contrato indefinido ≥10 SMMLV)';
        } else {
          dias = 20 + 15 * (anios - 1);
          formula = `20 + 15×(${anios}-1) = ${dias} días`;
        }
      }
      items.push({
        concepto: `Indemnización despido sin justa causa (${anios} años)`,
        formula: `${formula} × ${salarioDiarioIndemn.toFixed(0)}`,
        monto_cop: r0(dias * salarioDiarioIndemn),
        fundamento: 'CST Art. 64 modif. Ley 789/2002 Art. 28',
      });
    } else if (tipo === 'obra_labor') {
      items.push({
        concepto: 'Indemnización contrato obra/labor',
        formula: '15 días salarios mínimos',
        monto_cop: r0(salarioDiarioIndemn * 15),
        fundamento: 'CST Art. 64 (c)',
      });
    }
  }

  return {
    total_cop: r0(items.reduce((s, i) => s + i.monto_cop, 0)),
    aplica_indemnizacion: aplicaIndemn,
    causa: input.causa,
    anios_servicio: anios,
    dias_servicio_360: totalDias,
    line_items: items,
  };
}
