export const reliabilityFactors = {
  90: 1, 95: 0.64, 96: 0.55, 97: 0.47, 98: 0.37, 99: 0.25,
} as const;

export interface LifeInput {
  C: number;
  P: number;
  type: 'ball' | 'roller';
  rpm?: number;
  a1?: number;
}

export interface LifeResult {
  L10: number;
  hours?: number;
}

export function calculateLife(input: LifeInput): LifeResult {
  const { C, P, type, rpm, a1 = 1 } = input;
  for (const [name, value] of Object.entries({ C, P, a1 })) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error(`${name} must be a finite number greater than zero`);
    }
  }
  if (type !== 'ball' && type !== 'roller') {
    throw new Error('type must be ball or roller');
  }
  if (rpm !== undefined && (!Number.isFinite(rpm) || rpm <= 0)) {
    throw new Error('rpm must be a finite number greater than zero');
  }
  const L10 = a1 * Math.pow(C / P, type === 'ball' ? 3 : 10 / 3);
  const hours = rpm === undefined ? undefined : (L10 / rpm) * (1e6 / 60);
  if (!Number.isFinite(L10) || L10 <= 0 ||
      (hours !== undefined && (!Number.isFinite(hours) || hours <= 0))) {
    throw new Error('inputs produce a result outside the supported numeric range');
  }
  return hours === undefined ? { L10 } : { L10, hours };
}
