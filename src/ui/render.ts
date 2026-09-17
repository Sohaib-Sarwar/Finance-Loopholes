import type { CalculatorResult, PeriodicAmounts } from "../lib/calculator";
import { comparePeriodic, PERIODS, type Period } from "../lib/analytics";
import {
  formatMoney,
  formatMoneyPlain,
  formatPercent,
  formatSignedMoney,
  formatSignedPercent,
} from "../lib/format";
import { icons, type IconName } from "./icons";

const PERIOD_LABELS: Record<Period, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  annual: "Annual",
};

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function moneyClass(value: number): string {
  if (value > 0) return "value-positive";
  if (value < 0) return "value-negative";
  return "";
}

// ============================================================
// KPI cards
// ============================================================

interface KpiSpec {
  icon: IconName;
  label: string;
  value: string;
  meta?: string;
  accent?: boolean;
}

export function renderKpis(container: HTMLElement, result: CalculatorResult): void {
  const cards: KpiSpec[] = [
    {
      icon: "fund",
      label: "Mutual Fund — Net Annual",
      value: formatMoney(result.mutualFund.net.annual),
      meta: `ROI ${formatPercent(result.mutualFund.netROI)} · Tax ${formatMoney(
        result.mutualFund.taxAnnual,
      )}`,
    },
    {
      icon: "bank",
      label: "Bank — Net Annual",
      value: formatMoney(result.bankResult.net.annual),
      meta: `ROI ${formatPercent(result.bankResult.netROI)} · Tax ${formatMoney(
        result.bankResult.taxAnnual,
      )}`,
    },
    {
      icon: "grossReturn",
      label: "Combined Gross Annual",
      value: formatMoney(result.combined.gross.annual),
      meta: `ROI ${formatPercent(result.combined.grossROI)}`,
    },
    {
      icon: "netReturn",
      label: "Combined Net Annual",
      value: formatMoney(result.combined.net.annual),
      meta: `ROI ${formatPercent(result.combined.netROI)}`,
      accent: true,
    },
    {
      icon: "tax",
      label: "Total Tax (Annual)",
      value: formatMoney(result.combined.taxAnnual),
      meta: `Effective rate on gross ${formatPercent(
        result.combined.effectiveTaxRateOnGross,
      )}`,
    },
    {
      icon: "roi",
      label: "Combined Net ROI",
      value: formatPercent(result.combined.netROI),
      meta: `Relative to entered capital of ${formatMoney(result.inputs.capital)}`,
    },
  ];

  container.replaceChildren(
    ...cards.map((card) => {
      const wrap = el("div", `kpi-card${card.accent ? " kpi-card--accent" : ""}`);
      const label = el("div", "kpi-card__label");
      label.innerHTML = `${icons[card.icon]} <span>${card.label}</span>`;
      label.style.display = "flex";
      label.style.alignItems = "center";
      label.style.gap = "6px";
      const value = el("div", "kpi-card__value", card.value);
      wrap.append(label, value);
      if (card.meta) {
        wrap.append(el("div", "kpi-card__meta", card.meta));
      }
      return wrap;
    }),
  );
}

// ============================================================
// Bank average balance table
// ============================================================

export function renderBankBalanceTable(
  container: HTMLElement,
  result: CalculatorResult,
): void {
  const rows: [string, number][] = [
    ["Monday–Friday (per day)", result.bank.weekdayBalance],
    ["Saturday", result.bank.saturdayBalance],
    ["Sunday", result.bank.sundayBalance],
  ];

  container.innerHTML = `
    <table class="data-table">
      <caption>Fixed weekly closing-balance inputs and the resulting average.</caption>
      <thead>
        <tr><th>Day</th><th>Closing balance</th></tr>
      </thead>
      <tbody>
        ${rows
          .map(
            ([label, value]) =>
              `<tr><td>${label}</td><td>${formatMoney(value)}</td></tr>`,
          )
          .join("")}
      </tbody>
      <tfoot>
        <tr><td>7-day total</td><td>${formatMoney(result.bank.weeklyTotal)}</td></tr>
        <tr><td>Average daily bank balance</td><td>${formatMoney(
          result.bank.averageBankBalance,
        )}</td></tr>
      </tfoot>
    </table>
  `;
}

// ============================================================
// Daily/Weekly/Monthly/Annual breakdown
// ============================================================

function periodicRow(label: string, p: PeriodicAmounts): string {
  return `<tr><td>${label}</td>${PERIODS.map(
    (period) => `<td>${formatMoney(p[period])}</td>`,
  ).join("")}</tr>`;
}

export function renderBreakdownTable(
  container: HTMLElement,
  result: CalculatorResult,
): void {
  container.innerHTML = `
    <table class="data-table">
      <caption>Calculated values — plain annual/12, /52, /365 division, no compounding.</caption>
      <thead>
        <tr><th>Return</th>${PERIODS.map(
          (p) => `<th>${PERIOD_LABELS[p]}</th>`,
        ).join("")}</tr>
      </thead>
      <tbody>
        ${periodicRow("Mutual Fund — Gross", result.mutualFund.gross)}
        ${periodicRow("Mutual Fund — Net", result.mutualFund.net)}
        ${periodicRow("Bank — Gross", result.bankResult.gross)}
        ${periodicRow("Bank — Net", result.bankResult.net)}
        ${periodicRow("Combined — Gross", result.combined.gross)}
        ${periodicRow("Combined — Net", result.combined.net)}
      </tbody>
    </table>
  `;
}

// ============================================================
// Comparison table (MF vs Bank vs Combined, PKR + % difference)
// ============================================================

export function renderComparisonTable(
  container: HTMLElement,
  result: CalculatorResult,
): void {
  const diffRows = comparePeriodic(result.mutualFund.net, result.bankResult.net);

  const seriesRows = PERIODS.map((period) => {
    const mf = result.mutualFund.net[period];
    const bank = result.bankResult.net[period];
    const combined = result.combined.net[period];
    return `<tr>
      <td>${PERIOD_LABELS[period]}</td>
      <td>${formatMoney(mf)}</td>
      <td>${formatMoney(bank)}</td>
      <td>${formatMoney(combined)}</td>
    </tr>`;
  }).join("");

  const diffRowsHtml = diffRows
    .map((row) => {
      const diffClass = moneyClass(row.pkrDifference);
      return `<tr>
        <td>${PERIOD_LABELS[row.period]}</td>
        <td class="${diffClass}">${formatSignedMoney(row.pkrDifference)}</td>
        <td class="${diffClass}">${formatSignedPercent(row.percentDifference)}</td>
      </tr>`;
    })
    .join("");

  container.innerHTML = `
    <table class="data-table">
      <caption>Net return by period — Mutual Fund, Bank and Combined side by side.</caption>
      <thead>
        <tr><th>Period</th><th>MF Net</th><th>Bank Net</th><th>Combined Net</th></tr>
      </thead>
      <tbody>${seriesRows}</tbody>
    </table>
    <table class="data-table">
      <caption>Difference: Mutual Fund net return minus Bank net return.</caption>
      <thead>
        <tr><th>Period</th><th>PKR difference</th><th>% difference</th></tr>
      </thead>
      <tbody>${diffRowsHtml}</tbody>
    </table>
  `;
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
  lines.push(
    "The combined ROI follows the exact structure of the source model.",
  );
  lines.push(
    "It is NOT a conventional portfolio-weighted ROI unless the capital",
  );
  lines.push("allocation between MF and bank is explicitly defined.");

  lines.push("", RULE, "CALCULATION COMPLETE", RULE);

  return lines.join("\n").trimStart();
}
