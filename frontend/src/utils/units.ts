export const MEASUREMENT_TYPES = [
  'weight',
  'body_fat',
  'waist',
  'chest',
  'arm',
  'thigh',
] as const;

export const MEASUREMENT_UNITS = ['kg', 'lb', 'cm', 'in', '%'] as const;

export type MeasurementType = (typeof MEASUREMENT_TYPES)[number];
export type MeasurementUnit = (typeof MEASUREMENT_UNITS)[number];
export type UnitSystem = 'metric' | 'imperial';

const KG_PER_LB = 0.45359237;
const CM_PER_IN = 2.54;

export function isMeasurementType(value: string): value is MeasurementType {
  return (MEASUREMENT_TYPES as readonly string[]).includes(value);
}

export function isMeasurementUnit(value: string): value is MeasurementUnit {
  return (MEASUREMENT_UNITS as readonly string[]).includes(value);
}

export function canonicalUnit(type: MeasurementType): MeasurementUnit {
  if (type === 'weight') {
    return 'kg';
  }
  if (type === 'body_fat') {
    return '%';
  }
  return 'cm';
}

export function unitsForType(
  type: MeasurementType,
): readonly MeasurementUnit[] {
  if (type === 'weight') {
    return ['kg', 'lb'];
  }
  if (type === 'body_fat') {
    return ['%'];
  }
  return ['cm', 'in'];
}

export function unitForType(
  type: MeasurementType,
  system: UnitSystem,
): MeasurementUnit {
  if (type === 'body_fat') {
    return '%';
  }
  if (type === 'weight') {
    return system === 'imperial' ? 'lb' : 'kg';
  }
  return system === 'imperial' ? 'in' : 'cm';
}

export function systemFromUnit(unit: MeasurementUnit): UnitSystem | null {
  if (unit === 'kg' || unit === 'cm') {
    return 'metric';
  }
  if (unit === 'lb' || unit === 'in') {
    return 'imperial';
  }
  return null;
}

export function unitFluentId(unit: MeasurementUnit): string {
  if (unit === '%') {
    return 'unit-percent';
  }
  return `unit-${unit}`;
}

export function convertMeasurement(
  value: number,
  from: MeasurementUnit,
  to: MeasurementUnit,
): number {
  if (from === to || !Number.isFinite(value)) {
    return value;
  }
  const canonical = toCanonicalValue(value, from);
  const converted = fromCanonicalValue(canonical.value, canonical.unit, to);
  return roundTo(converted, 2);
}

export function measurementInUnit(
  value: number,
  storedUnit: string,
  target: MeasurementUnit,
): number {
  if (!isMeasurementUnit(storedUnit)) {
    return value;
  }
  return convertMeasurement(value, storedUnit, target);
}

export function toCanonicalMeasurement(
  type: MeasurementType,
  value: number,
  unit: MeasurementUnit,
): { value: number; unit: MeasurementUnit } {
  const canonical = canonicalUnit(type);
  return {
    value: convertMeasurement(value, unit, canonical),
    unit: canonical,
  };
}

export function formatMeasurementNumber(value: number): string {
  const rounded = roundTo(value, 1);
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function unitKind(unit: MeasurementUnit): 'mass' | 'length' | 'percent' {
  if (unit === 'kg' || unit === 'lb') {
    return 'mass';
  }
  if (unit === 'cm' || unit === 'in') {
    return 'length';
  }
  return 'percent';
}

function toCanonicalValue(
  value: number,
  unit: MeasurementUnit,
): { value: number; unit: MeasurementUnit } {
  if (unit === 'lb') {
    return { value: value * KG_PER_LB, unit: 'kg' };
  }
  if (unit === 'in') {
    return { value: value * CM_PER_IN, unit: 'cm' };
  }
  return { value, unit };
}

function fromCanonicalValue(
  value: number,
  canonical: MeasurementUnit,
  to: MeasurementUnit,
): number {
  if (canonical === to || unitKind(canonical) !== unitKind(to)) {
    return value;
  }
  if (canonical === 'kg' && to === 'lb') {
    return value / KG_PER_LB;
  }
  if (canonical === 'cm' && to === 'in') {
    return value / CM_PER_IN;
  }
  return value;
}

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
