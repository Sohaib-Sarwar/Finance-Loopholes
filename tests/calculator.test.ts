import { describe, expect, it } from "vitest";
import { calculate } from "../src/lib/calculator";

// Every "expected" value below is computed with the exact same operation
// order as logic.cpp (see comments citing line numbers there). Since both
// C++ `double` and JS `number` are IEEE-754 binary64, evaluating the same
// expression in the same order in this file and in src/lib/calculator.ts
// must produce bit-identical results -- so exact (`toBe`) equality is a
// meaningful regression check against accidental reordering/typos in the
// port, not just a tautology.

describe("calculate() — bank average balance (logic.cpp lines 136-142)", () => {
  it("is a fixed constant independent of rates/capital", () => {
    const weeklyTotal = 600_000 * 5 + 840_000 + 936_000;
    const expectedAverage = weeklyTotal / 7;

    const r = calculate({
      capital: 250_000,
      mutualFundRate: 5,
      mutualFundTax: 2,
      bankRate: 3,
      bankTax: 1,
    });

    expect(r.bank.weeklyTotal).toBe(weeklyTotal);
    expect(r.bank.weeklyTotal).toBe(4_776_000);
    expect(r.bank.averageBankBalance).toBe(expectedAverage);
    expect(r.bank.averageBankBalance).toBeCloseTo(682_285.7142857143, 6);
  });
});

describe("calculate() — worked scenario", () => {
  const inputs = {
    capital: 1_000_000,
    mutualFundRate: 15,
    mutualFundTax: 10,
    bankRate: 8,
    bankTax: 15,
  };

  const avgBank = (600_000 * 5 + 840_000 + 936_000) / 7;
  const mfGross = inputs.capital * (inputs.mutualFundRate / 100);
  const mfTax = mfGross * (inputs.mutualFundTax / 100);
  const mfNet = mfGross - mfTax;
  const bankGross = avgBank * (inputs.bankRate / 100);
  const bankTax = bankGross * (inputs.bankTax / 100);
  const bankNet = bankGross - bankTax;
  const combinedGross = mfGross + bankGross;
  const combinedTax = mfTax + bankTax;
  const combinedNet = mfNet + bankNet;
  const mfNetROI = (mfNet / inputs.capital) * 100;
  const bankNetROI = (bankNet / inputs.capital) * 100;
  const combinedGrossROI = (combinedGross / inputs.capital) * 100;
  const combinedNetROI = (combinedNet / inputs.capital) * 100;
  const effectiveTaxRate =
    combinedGross > 0 ? (combinedTax / combinedGross) * 100 : 0;

  const r = calculate(inputs);

  it("matches MF gross/tax/net exactly", () => {
    expect(r.mutualFund.gross.annual).toBe(mfGross);
    expect(r.mutualFund.taxAnnual).toBe(mfTax);
    expect(r.mutualFund.net.annual).toBe(mfNet);
  });

  it("matches Bank gross/tax/net exactly", () => {
    expect(r.bankResult.gross.annual).toBe(bankGross);
    expect(r.bankResult.taxAnnual).toBe(bankTax);
    expect(r.bankResult.net.annual).toBe(bankNet);
  });

  it("matches Combined gross/tax/net exactly", () => {
    expect(r.combined.gross.annual).toBe(combinedGross);
    expect(r.combined.taxAnnual).toBe(combinedTax);
    expect(r.combined.net.annual).toBe(combinedNet);
  });

  it("matches ROI figures exactly", () => {
    expect(r.mutualFund.netROI).toBe(mfNetROI);
    expect(r.bankResult.netROI).toBe(bankNetROI);
    expect(r.combined.grossROI).toBe(combinedGrossROI);
    expect(r.combined.netROI).toBe(combinedNetROI);
  });

  it("matches effective tax rate on combined gross", () => {
    expect(r.combined.effectiveTaxRateOnGross).toBe(effectiveTaxRate);
  });

  it("derives periodic breakdowns via plain division (no compounding)", () => {
    expect(r.mutualFund.gross.monthly).toBe(mfGross / 12);
    expect(r.mutualFund.gross.weekly).toBe(mfGross / 52);
    expect(r.mutualFund.gross.daily).toBe(mfGross / 365);
    expect(r.bankResult.net.monthly).toBe(bankNet / 12);
    expect(r.combined.net.weekly).toBe(combinedNet / 52);
    expect(r.combined.net.daily).toBe(combinedNet / 365);
  });
});

describe("calculate() — boundary: all rates at 0%", () => {
  const r = calculate({
    capital: 500_000,
    mutualFundRate: 0,
    mutualFundTax: 0,
    bankRate: 0,
    bankTax: 0,
  });

  it("produces zero gross/tax/net everywhere", () => {
    expect(r.mutualFund.gross.annual).toBe(0);
    expect(r.mutualFund.net.annual).toBe(0);
    expect(r.bankResult.gross.annual).toBe(0);
    expect(r.bankResult.net.annual).toBe(0);
    expect(r.combined.gross.annual).toBe(0);
    expect(r.combined.net.annual).toBe(0);
  });

  it("guards the effective tax rate when combined gross is not > 0 (logic.cpp line 412)", () => {
    expect(r.combined.effectiveTaxRateOnGross).toBe(0);
  });
});

describe("calculate() — boundary: all rates at 100%", () => {
  const r = calculate({
    capital: 100_000,
    mutualFundRate: 100,
    mutualFundTax: 100,
    bankRate: 100,
    bankTax: 0,
  });

  it("MF gross equals capital, tax consumes all of it", () => {
    expect(r.mutualFund.gross.annual).toBe(100_000);
    expect(r.mutualFund.taxAnnual).toBe(100_000);
    expect(r.mutualFund.net.annual).toBe(0);
  });

  it("Bank gross equals average balance, zero tax leaves it untouched", () => {
    const avgBank = (600_000 * 5 + 840_000 + 936_000) / 7;
    expect(r.bankResult.gross.annual).toBe(avgBank);
    expect(r.bankResult.taxAnnual).toBe(0);
    expect(r.bankResult.net.annual).toBe(avgBank);
  });
});

describe("calculate() — decimal and large-value inputs", () => {
  it("handles decimal capital and rates without special-casing", () => {
    const r = calculate({
      capital: 123_456.78,
      mutualFundRate: 12.3456,
      mutualFundTax: 7.891,
      bankRate: 4.2,
      bankTax: 3.3,
    });
    expect(Number.isFinite(r.mutualFund.net.annual)).toBe(true);
    expect(Number.isFinite(r.combined.netROI)).toBe(true);
  });

  it("handles very large capital", () => {
    const r = calculate({
      capital: 1e12,
      mutualFundRate: 10,
      mutualFundTax: 5,
      bankRate: 6,
      bankTax: 5,
    });
    expect(r.mutualFund.gross.annual).toBe(1e12 * 0.1);
    expect(Number.isFinite(r.combined.net.annual)).toBe(true);
  });
});
