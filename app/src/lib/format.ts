// Display formatting only — never rounds or reshapes a value before it is
// used in a calculation. Mirrors printMoney (2 decimals) and printPercent
// (4 decimals) from logic.cpp lines 76-93.

const moneyFormatter = new Intl.NumberFormat("en-PK", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: true,
});

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatMoney(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  return `${sign}PKR ${moneyFormatter.format(Math.abs(amount))}`;
}

export function formatMoneyPlain(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  return `${sign}${moneyFormatter.format(Math.abs(amount))}`;
}

/** Axis-tick formatting only. Tooltips and tables always show full precision. */
export function formatMoneyCompact(amount: number): string {
  if (amount === 0) return "0";
  if (Math.abs(amount) < 1000) {
    return Math.abs(amount) < 10
      ? amount.toFixed(1)
      : Math.round(amount).toString();
  }
  return compactFormatter.format(amount);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(4)}%`;
}

export function formatSignedPercent(value: number | null): string {
  if (value === null) return "N/A";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(4)}%`;
}

export function formatSignedMoney(amount: number): string {
  const sign = amount > 0 ? "+" : amount < 0 ? "-" : "";
  return `${sign}PKR ${moneyFormatter.format(Math.abs(amount))}`;
}
