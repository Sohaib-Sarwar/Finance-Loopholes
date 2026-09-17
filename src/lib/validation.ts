// Web equivalent of the input-validation loops in logic.cpp
// (getPositiveAmount / getPercentage, lines 27-70).
//
// The C++ version re-prompts in a `while (true)` loop until `cin >> value`
// succeeds, the value is finite, and it satisfies the range check. A form
// field can't re-prompt a stream, so instead we parse the raw text strictly:
// the entire trimmed string must be one valid numeric literal (this is the
// browser-form equivalent of a successful `cin >> value` extraction with no
// leftover text), and reject anything that fails the same finiteness/range
// checks as the C++ source. Error messages are copied verbatim from
// logic.cpp so validation behavior stays observably identical.

export interface ValidationResult {
  ok: boolean;
  value: number | null;
  error: string | null;
}

// Strict numeric literal: optional sign, digits, optional decimal part,
// optional exponent (matches the range of finite literals C++'s
// `cin >> double` accepts, e.g. "1e6", "1.5E10"). Deliberately rejects
// "Infinity", "NaN", hex, empty strings, and trailing junk like "12abc" --
// C++ can lexically parse "inf"/"nan" tokens too, but its `isfinite` check
// (logic.cpp lines 36-37, 58) rejects them just the same, so the observable
// accept/reject outcome matches here even though the code path differs.
const NUMERIC_LITERAL = /^[+-]?(\d+(\.\d+)?|\.\d+)([eE][+-]?\d+)?$/;

function parseStrictNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "" || !NUMERIC_LITERAL.test(trimmed)) {
    return null;
  }
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export const CAPITAL_ERROR = "ERROR: Enter a finite number greater than 0.";
export const PERCENTAGE_ERROR = "ERROR: Percentage must be between 0 and 100.";

/** Mirrors getPositiveAmount(): finite number, > 0. */
export function validatePositiveAmount(raw: string): ValidationResult {
  const value = parseStrictNumber(raw);
  if (value === null || !(value > 0.0)) {
    return { ok: false, value: null, error: CAPITAL_ERROR };
  }
  return { ok: true, value, error: null };
}

/** Mirrors getPercentage(): finite number, 0 <= value <= 100. */
export function validatePercentage(raw: string): ValidationResult {
  const value = parseStrictNumber(raw);
  if (value === null || !(value >= 0.0 && value <= 100.0)) {
    return { ok: false, value: null, error: PERCENTAGE_ERROR };
  }
  return { ok: true, value, error: null };
}
