import { describe, expect, it } from "vitest";
import {
  CAPITAL_ERROR,
  PERCENTAGE_ERROR,
  validatePercentage,
  validatePositiveAmount,
} from "../app/src/lib/validation";

describe("validatePositiveAmount (mirrors getPositiveAmount)", () => {
  it("rejects empty input", () => {
    const r = validatePositiveAmount("");
    expect(r.ok).toBe(false);
    expect(r.error).toBe(CAPITAL_ERROR);
  });

  it("rejects whitespace-only input", () => {
    expect(validatePositiveAmount("   ").ok).toBe(false);
  });

  it("rejects invalid text", () => {
    expect(validatePositiveAmount("abc").ok).toBe(false);
  });

  it("rejects trailing-junk text (e.g. '12abc')", () => {
    expect(validatePositiveAmount("12abc").ok).toBe(false);
  });

  it("rejects zero", () => {
    const r = validatePositiveAmount("0");
    expect(r.ok).toBe(false);
    expect(r.error).toBe(CAPITAL_ERROR);
  });

  it("rejects negative values", () => {
    expect(validatePositiveAmount("-100").ok).toBe(false);
  });

  it("rejects NaN literal", () => {
    expect(validatePositiveAmount("NaN").ok).toBe(false);
  });

  it("rejects Infinity literal", () => {
    expect(validatePositiveAmount("Infinity").ok).toBe(false);
    expect(validatePositiveAmount("-Infinity").ok).toBe(false);
  });

  it("accepts a plain positive integer", () => {
    const r = validatePositiveAmount("1000000");
    expect(r.ok).toBe(true);
    expect(r.value).toBe(1000000);
  });

  it("accepts decimal values", () => {
    const r = validatePositiveAmount("1234.56");
    expect(r.ok).toBe(true);
    expect(r.value).toBeCloseTo(1234.56, 10);
  });

  it("accepts large values incl. scientific notation", () => {
    expect(validatePositiveAmount("1000000000000").ok).toBe(true);
    const r = validatePositiveAmount("1e9");
    expect(r.ok).toBe(true);
    expect(r.value).toBe(1e9);
  });

  it("accepts the smallest positive value", () => {
    expect(validatePositiveAmount("0.01").ok).toBe(true);
  });
});

describe("validatePercentage (mirrors getPercentage)", () => {
  it("rejects empty input", () => {
    const r = validatePercentage("");
    expect(r.ok).toBe(false);
    expect(r.error).toBe(PERCENTAGE_ERROR);
  });

  it("rejects invalid text", () => {
    expect(validatePercentage("fifteen").ok).toBe(false);
  });

  it("rejects negative values", () => {
    expect(validatePercentage("-0.01").ok).toBe(false);
  });

  it("rejects values above 100", () => {
    expect(validatePercentage("100.0001").ok).toBe(false);
    expect(validatePercentage("101").ok).toBe(false);
  });

  it("accepts the 0 boundary", () => {
    const r = validatePercentage("0");
    expect(r.ok).toBe(true);
    expect(r.value).toBe(0);
  });

  it("accepts the 100 boundary", () => {
    const r = validatePercentage("100");
    expect(r.ok).toBe(true);
    expect(r.value).toBe(100);
  });

  it("accepts decimal percentages", () => {
    const r = validatePercentage("15.75");
    expect(r.ok).toBe(true);
    expect(r.value).toBeCloseTo(15.75, 10);
  });

  it("rejects NaN/Infinity literals", () => {
    expect(validatePercentage("NaN").ok).toBe(false);
    expect(validatePercentage("Infinity").ok).toBe(false);
  });
});
