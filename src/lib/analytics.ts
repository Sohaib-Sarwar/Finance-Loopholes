// Additive analytics layer built ONLY from the exact figures produced by
// calculator.ts. Nothing in this file changes or re-derives the underlying
// financial formulas -- it only compares and projects already-computed
// values, and every projection stays linear (periodic value x period count)
// to avoid silently introducing compounding that logic.cpp never used.

import type { CalculatorResult, PeriodicAmounts } from "./calculator";

export type Period = "daily" | "weekly" | "monthly" | "annual";
export const PERIODS: Period[] = ["daily", "weekly", "monthly", "annual"];

export interface PeriodComparison {
  period: Period;
  a: number;
  b: number;
  pkrDifference: number; // a - b
  percentDifference: number | null; // (a - b) / |b| * 100, null if b === 0
}

/**
 * Compares two periodic-amount series (e.g. MF net vs Bank net) across all
 * four periods, reporting both the PKR difference and the percentage
 * difference of `a` relative to `b`.
 */
export function comparePeriodic(
  a: PeriodicAmounts,
  b: PeriodicAmounts,
): PeriodComparison[] {
  return PERIODS.map((period) => {
    const va = a[period];
    const vb = b[period];
    return {
      period,
      a: va,
      b: vb,
      pkrDifference: va - vb,
      percentDifference: vb !== 0 ? ((va - vb) / Math.abs(vb)) * 100 : null,
    };
  });
}

export interface CumulativePoint {
  unit: number; // 1-based period index (e.g. month 1, month 2, ...)
  mfNet: number;
  bankNet: number;
  combinedNet: number;
}

/**
 * Builds a simple linear cumulative-return projection: periodic net value x
 * number of elapsed periods. This is explicitly a projection (clearly
 * labeled as such in the UI), not a recalculation, and never compounds --
 * consistent with logic.cpp's annual/12, annual/52, annual/365 model.
 */
export function buildCumulativeSeries(
  result: CalculatorResult,
  period: Period,
  periodCount: number,
): CumulativePoint[] {
  const points: CumulativePoint[] = [];
  for (let i = 1; i <= periodCount; i++) {
    points.push({
      unit: i,
      mfNet: result.mutualFund.net[period] * i,
      bankNet: result.bankResult.net[period] * i,
      combinedNet: result.combined.net[period] * i,
    });
  }
  return points;
}
