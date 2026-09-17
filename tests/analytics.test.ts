import { describe, expect, it } from "vitest";
import { calculate } from "../src/lib/calculator";
import { buildCumulativeSeries, comparePeriodic } from "../src/lib/analytics";

describe("comparePeriodic", () => {
  const r = calculate({
    capital: 1_000_000,
    mutualFundRate: 15,
    mutualFundTax: 10,
    bankRate: 8,
    bankTax: 15,
  });

  it("reports PKR and percentage differences for all four periods", () => {
    const rows = comparePeriodic(r.mutualFund.net, r.bankResult.net);
    expect(rows).toHaveLength(4);
    expect(rows.map((row) => row.period)).toEqual([
      "daily",
      "weekly",
      "monthly",
      "annual",
    ]);
    for (const row of rows) {
      expect(row.pkrDifference).toBeCloseTo(row.a - row.b, 10);
      if (row.b !== 0) {
        expect(row.percentDifference).toBeCloseTo(
          ((row.a - row.b) / Math.abs(row.b)) * 100,
          8,
        );
      }
    }
  });

  it("returns null percent difference when the baseline is zero", () => {
    const zeroResult = calculate({
      capital: 100,
      mutualFundRate: 0,
      mutualFundTax: 0,
      bankRate: 5,
      bankTax: 0,
    });
    const rows = comparePeriodic(zeroResult.mutualFund.net, zeroResult.bankResult.net);
    for (const row of rows) {
      expect(row.b === 0 ? row.percentDifference : "n/a").toBe(
        row.b === 0 ? null : "n/a",
      );
    }
  });
});

describe("buildCumulativeSeries", () => {
  const r = calculate({
    capital: 1_000_000,
    mutualFundRate: 15,
    mutualFundTax: 10,
    bankRate: 8,
    bankTax: 15,
  });

  it("scales linearly (no compounding)", () => {
    const series = buildCumulativeSeries(r, "monthly", 12);
    expect(series).toHaveLength(12);
    expect(series[0].mfNet).toBe(r.mutualFund.net.monthly * 1);
    expect(series[11].mfNet).toBe(r.mutualFund.net.monthly * 12);
    // Linear projection: point[i] - point[i-1] must be a constant step.
    const step = series[1].combinedNet - series[0].combinedNet;
    for (let i = 1; i < series.length; i++) {
      expect(series[i].combinedNet - series[i - 1].combinedNet).toBeCloseTo(
        step,
        8,
      );
    }
  });

  it("12 x monthly cumulative matches the annual net figure", () => {
    const series = buildCumulativeSeries(r, "monthly", 12);
    const last = series[series.length - 1];
    expect(last.mfNet).toBeCloseTo(r.mutualFund.net.annual, 6);
    expect(last.bankNet).toBeCloseTo(r.bankResult.net.annual, 6);
    expect(last.combinedNet).toBeCloseTo(r.combined.net.annual, 6);
  });
});
