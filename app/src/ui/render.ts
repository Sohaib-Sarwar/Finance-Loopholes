import type { CalculatorResult, PeriodicAmounts } from "../lib/calculator";
import { comparePeriodic, PERIODS, type Period } from "../lib/analytics";
import {
  formatMoney,
  formatMoneyPlain,
  formatPercent,
  formatSignedMoney,
  formatSignedPercent,
} from "../lib/format";
import { icon, type IconName } from "./icons";
import { SERIES_KEYS, SERIES_LABELS, seriesColor, type SeriesKey } from "./charts";

export const PERIOD_LABELS: Record<Period, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  annual: "Annual",
};

// ============================================================
// KPI cards
// ============================================================

interface KpiSpec {
  icon: IconName;
  tone: "mf" | "bank" | "combined" | "neutral";
  label: string;
  value: string;
  meta: { key: string; value: string }[];
  feature?: boolean;
}

export function renderKpis(container: HTMLElement, result: CalculatorResult): void {
  const cards: KpiSpec[] = [
    {
      icon: "trendingUp",
      tone: "mf",
      label: "Mutual Fund — net annual",
      value: formatMoney(result.mutualFund.net.annual),
      meta: [
        { key: "ROI", value: formatPercent(result.mutualFund.netROI) },
        { key: "Tax", value: formatMoney(result.mutualFund.taxAnnual) },
      ],
    },
    {
      icon: "landmark",
      tone: "bank",
      label: "Bank — net annual",
      value: formatMoney(result.bankResult.net.annual),
      meta: [
        { key: "ROI", value: formatPercent(result.bankResult.netROI) },
        { key: "Tax", value: formatMoney(result.bankResult.taxAnnual) },
      ],
    },
    {
      icon: "layers",
      tone: "neutral",
      label: "Combined gross annual",
      value: formatMoney(result.combined.gross.annual),
      meta: [{ key: "Gross ROI", value: formatPercent(result.combined.grossROI) }],
    },
    {
      icon: "wallet",
      tone: "combined",
      label: "Combined net annual",
      value: formatMoney(result.combined.net.annual),
      meta: [{ key: "Net ROI", value: formatPercent(result.combined.netROI) }],
      feature: true,
    },
    {
      icon: "receipt",
      tone: "neutral",
      label: "Total tax — annual",
      value: formatMoney(result.combined.taxAnnual),
      meta: [
        {
          key: "Effective on gross",
          value: formatPercent(result.combined.effectiveTaxRateOnGross),
        },
      ],
    },
    {
      icon: "percent",
      tone: "neutral",
      label: "Combined net ROI",
      value: formatPercent(result.combined.netROI),
      meta: [{ key: "On capital", value: formatMoney(result.inputs.capital) }],
    },
  ];

  container.innerHTML = cards
    .map(
      (card) => `
      <article class="kpi${card.feature ? " kpi--feature" : ""}">
        <div class="kpi__top">
          <span class="kpi__icon kpi__icon--${card.tone}">${icon(card.icon)}</span>
          <span class="kpi__label">${card.label}</span>
        </div>
        <div class="kpi__value">${card.value}</div>
        <div class="kpi__meta">
          ${card.meta
            .map((entry) => `<span>${entry.key} <b>${entry.value}</b></span>`)
            .join("")}
        </div>
      </article>`,
    )
    .join("");
}

// ============================================================
// Bank average balance
// ============================================================

export function renderBankBalance(
  container: HTMLElement,
  result: CalculatorResult,
): void {
  const rows: [string, number][] = [
    ["Monday – Friday (each day)", result.bank.weekdayBalance],
    ["Saturday", result.bank.saturdayBalance],
    ["Sunday", result.bank.sundayBalance],
  ];

  const body = rows
    .map(
      ([label, value]) =>
        `<tr><td>${label}</td><td>${formatMoney(value)}</td></tr>`,
    )
    .join("");

  const totals: [string, number][] = [
    ["7-day total", result.bank.weeklyTotal],
    ["Average daily balance", result.bank.averageBankBalance],
  ];

  container.innerHTML = `
    <div class="only-desktop table-scroll">
      <table class="table">
        <thead><tr><th scope="col">Day</th><th scope="col">Closing balance</th></tr></thead>
        <tbody>
          ${body}
          ${totals
            .map(
              ([label, value]) =>
                `<tr data-emphasis="true"><td>${label}</td><td>${formatMoney(value)}</td></tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </div>
    <div class="only-mobile stack">
      <div class="stack__group">
        ${rows
          .map(
            ([label, value]) =>
              `<div class="stack__row"><span class="stack__key">${label}</span><span class="stack__val">${formatMoney(value)}</span></div>`,
          )
          .join("")}
      </div>
      <div class="stack__group">
        ${totals
          .map(
            ([label, value]) =>
              `<div class="stack__row"><span class="stack__key">${label}</span><span class="stack__val">${formatMoney(value)}</span></div>`,
          )
          .join("")}
      </div>
    </div>
  `;
}

// ============================================================
// Periodic breakdown
// ============================================================

interface BreakdownRow {
  label: string;
  key: SeriesKey;
  gross: PeriodicAmounts;
  net: PeriodicAmounts;
}

function breakdownRows(result: CalculatorResult): BreakdownRow[] {
  return [
    {
      label: SERIES_LABELS.mf,
      key: "mf",
      gross: result.mutualFund.gross,
      net: result.mutualFund.net,
    },
    {
      label: SERIES_LABELS.bank,
      key: "bank",
      gross: result.bankResult.gross,
      net: result.bankResult.net,
    },
    {
      label: SERIES_LABELS.combined,
      key: "combined",
      gross: result.combined.gross,
      net: result.combined.net,
    },
  ];
}

export function renderBreakdown(
  container: HTMLElement,
  result: CalculatorResult,
  active: Period,
): void {
  const rows = breakdownRows(result);

  const tableRows = rows
    .flatMap((row) => [
      { row, kind: "Gross" as const, values: row.gross },
      { row, kind: "Net" as const, values: row.net },
    ])
    .map(
      ({ row, kind, values }) => `
      <tr${kind === "Net" && row.key === "combined" ? ' data-emphasis="true"' : ""}>
        <td>
          <span class="row-mark">
            <span class="dot" style="background:${seriesColor(row.key)}"></span>
            ${row.label} — ${kind}
          </span>
        </td>
        ${PERIODS.map(
          (period) =>
            `<td${period === active ? ' style="color:var(--ink);font-weight:620"' : ""}>${formatMoney(values[period])}</td>`,
        ).join("")}
      </tr>`,
    )
    .join("");

  const stackGroups = rows
    .map(
      (row) => `
      <div class="stack__group">
        <div class="stack__group-head">
          <span class="dot" style="background:${seriesColor(row.key)}"></span>
          ${row.label}
        </div>
        <div class="stack__row">
          <span class="stack__key">Gross · ${PERIOD_LABELS[active].toLowerCase()}</span>
          <span class="stack__val">${formatMoney(row.gross[active])}</span>
        </div>
        <div class="stack__row">
          <span class="stack__key">Net · ${PERIOD_LABELS[active].toLowerCase()}</span>
          <span class="stack__val">${formatMoney(row.net[active])}</span>
        </div>
      </div>`,
    )
    .join("");

  container.innerHTML = `
    <div class="only-desktop table-scroll">
      <table class="table">
        <thead>
          <tr>
            <th scope="col">Return</th>
            ${PERIODS.map(
              (period) =>
                `<th scope="col"${period === active ? ' style="color:var(--ink)"' : ""}>${PERIOD_LABELS[period]}</th>`,
            ).join("")}
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>
    <div class="only-mobile stack">${stackGroups}</div>
  `;
}

// ============================================================
// Comparison
// ============================================================

export function renderComparison(
  container: HTMLElement,
  note: HTMLElement,
  result: CalculatorResult,
  active: Period,
): void {
  const diffs = comparePeriodic(result.mutualFund.net, result.bankResult.net);

  container.innerHTML = diffs
    .map((row) => {
      const positive = row.pkrDifference > 0;
      const flat = row.pkrDifference === 0;
      const toneClass = flat ? "delta-flat" : positive ? "delta-pos" : "delta-neg";
      const arrow = flat ? icon("minus") : positive ? icon("arrowUp") : icon("arrowDown");
      const period = row.period;
      return `
        <div class="compare-row"${period === active ? ' data-active="true"' : ""}>
          <div>
            <div class="compare-row__label">${PERIOD_LABELS[period]}</div>
            <div class="compare-row__sub">
              MF ${formatMoneyPlain(result.mutualFund.net[period])}
              · Bank ${formatMoneyPlain(result.bankResult.net[period])}
              · Combined ${formatMoneyPlain(result.combined.net[period])}
            </div>
          </div>
          <div class="compare-row__delta ${toneClass}">
            ${arrow}${formatSignedMoney(row.pkrDifference)}
          </div>
        </div>`;
    })
    .join("");

  // Every period is the same annual figure divided by a constant, so the
  // MF-vs-Bank percentage gap is identical in all four rows. Stating it once
  // is more informative than repeating the same number four times.
  const pct = diffs[0]?.percentDifference ?? null;
  note.textContent =
    pct === null
      ? "The Bank leg returns nothing at this rate, so no percentage comparison is defined."
      : `Mutual Fund net return sits ${formatSignedPercent(pct)} against the Bank leg — identical in every period, because each period is a plain division of the same annual figure.`;
}

// ============================================================
// Chart legend
// ============================================================

export function renderLegend(container: HTMLElement, suffix = ""): void {
  container.innerHTML = SERIES_KEYS.map(
    (key) => `
      <span class="legend__item">
        <span class="dot" style="background:${seriesColor(key)}"></span>
        ${SERIES_LABELS[key]}${suffix}
      </span>`,
  ).join("");
}

// ============================================================
// Accountant-style statement (mirrors logic.cpp console output)
// ============================================================

function statementLine(label: string, value: string): string {
  return `${label.padEnd(32, " ")}${value}`;
}

function moneyLine(label: string, amount: number): string {
  return statementLine(label, `PKR ${formatMoneyPlain(amount)}`);
}

function percentLine(label: string, value: number): string {
  return statementLine(label, `${value.toFixed(4)}%`);
}

const RULE = "=".repeat(60);

export function renderStatement(result: CalculatorResult): string {
  const lines: string[] = [];
  const section = (title: string) => {
    lines.push("", RULE, title, RULE);
  };

  section("INPUT SUMMARY");
  lines.push(moneyLine("Capital", result.inputs.capital));
  lines.push(percentLine("Mutual Fund Return", result.inputs.mutualFundRate));
  lines.push(percentLine("Mutual Fund Tax", result.inputs.mutualFundTax));
  lines.push(percentLine("Bank Savings Rate", result.inputs.bankRate));
  lines.push(percentLine("Bank Tax", result.inputs.bankTax));

  section("BANK AVERAGE BALANCE");
  lines.push(moneyLine("Monday-Friday", result.bank.weekdayBalance));
  lines.push(moneyLine("Saturday", result.bank.saturdayBalance));
  lines.push(moneyLine("Sunday", result.bank.sundayBalance));
  lines.push(moneyLine("7-day total", result.bank.weeklyTotal));
  lines.push(moneyLine("Average daily bank balance", result.bank.averageBankBalance));

  section("MUTUAL FUND RETURNS");
  lines.push(moneyLine("Gross daily return", result.mutualFund.gross.daily));
  lines.push(moneyLine("Net daily return", result.mutualFund.net.daily));
  lines.push(moneyLine("Gross weekly return", result.mutualFund.gross.weekly));
  lines.push(moneyLine("Net weekly return", result.mutualFund.net.weekly));
  lines.push(moneyLine("Gross monthly return", result.mutualFund.gross.monthly));
  lines.push(moneyLine("Net monthly return", result.mutualFund.net.monthly));
  lines.push(moneyLine("Gross annual return", result.mutualFund.gross.annual));
  lines.push(moneyLine("Tax", result.mutualFund.taxAnnual));
  lines.push(moneyLine("Net annual return", result.mutualFund.net.annual));
  lines.push(percentLine("Net ROI", result.mutualFund.netROI));

  section("BANK RETURNS");
  lines.push(moneyLine("Gross daily return", result.bankResult.gross.daily));
  lines.push(moneyLine("Net daily return", result.bankResult.net.daily));
  lines.push(moneyLine("Gross weekly return", result.bankResult.gross.weekly));
  lines.push(moneyLine("Net weekly return", result.bankResult.net.weekly));
  lines.push(moneyLine("Gross monthly return", result.bankResult.gross.monthly));
  lines.push(moneyLine("Net monthly return", result.bankResult.net.monthly));
  lines.push(moneyLine("Gross annual return", result.bankResult.gross.annual));
  lines.push(moneyLine("Tax", result.bankResult.taxAnnual));
  lines.push(moneyLine("Net annual return", result.bankResult.net.annual));
  lines.push(percentLine("Net ROI vs capital", result.bankResult.netROI));

  section("COMBINED RETURNS");
  lines.push("", "DAILY");
  lines.push(moneyLine("Gross", result.combined.gross.daily));
  lines.push(moneyLine("Net", result.combined.net.daily));
  lines.push("", "WEEKLY");
  lines.push(moneyLine("Gross", result.combined.gross.weekly));
  lines.push(moneyLine("Net", result.combined.net.weekly));
  lines.push("", "MONTHLY");
  lines.push(moneyLine("Gross", result.combined.gross.monthly));
  lines.push(moneyLine("Net", result.combined.net.monthly));
  lines.push("", "ANNUAL");
  lines.push(moneyLine("Gross", result.combined.gross.annual));
  lines.push(moneyLine("Total tax", result.combined.taxAnnual));
  lines.push(moneyLine("Net", result.combined.net.annual));

  section("ROI SUMMARY");
  lines.push(percentLine("MF net ROI", result.mutualFund.netROI));
  lines.push(percentLine("Bank contribution to ROI", result.bankResult.netROI));
  lines.push(percentLine("Combined gross ROI", result.combined.grossROI));
  lines.push(percentLine("COMBINED NET ROI", result.combined.netROI));
  lines.push(
    percentLine("Effective tax on gross return", result.combined.effectiveTaxRateOnGross),
  );

  section("CALCULATION BASIS");
  lines.push("1. Bank average = 7-day closing balance average.");
  lines.push("2. MF return is applied to the full entered capital.");
  lines.push("3. Bank return is applied to the calculated average");
  lines.push("   bank balance.");
  lines.push("4. Gross return is calculated before tax.");
  lines.push("5. Tax is calculated on gross profit.");
  lines.push("6. Net return = gross profit - tax.");
  lines.push("7. Monthly = annual / 12.");
  lines.push("8. Weekly  = annual / 52.");
  lines.push("9. Daily   = annual / 365.");
  lines.push("");
  lines.push("IMPORTANT:");
  lines.push("The combined ROI follows the exact structure of the source model.");
  lines.push("It is NOT a conventional portfolio-weighted ROI unless the capital");
  lines.push("allocation between MF and bank is explicitly defined.");

  lines.push("", RULE, "CALCULATION COMPLETE", RULE);

  return lines.join("\n").trimStart();
}
