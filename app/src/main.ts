import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./styles.css";

import { calculate, type CalculatorInputs, type CalculatorResult } from "./lib/calculator";
import { validatePercentage, validatePositiveAmount } from "./lib/validation";
import { buildCumulativeSeries, PERIODS, type Period } from "./lib/analytics";
import {
  PERIOD_LABELS,
  renderBankBalance,
  renderBreakdown,
  renderComparison,
  renderKpis,
  renderLegend,
  renderStatement,
} from "./ui/render";
import {
  refreshChartTheme,
  renderComparisonChart,
  renderCumulativeChart,
} from "./ui/charts";
import { hydrateIcons, icon } from "./ui/icons";
import { setupTheme } from "./ui/theme";
import { toast } from "./ui/toast";
import { setupInstall } from "./pwa/install";

type FieldName = "capital" | "mfRate" | "mfTax" | "bankRate" | "bankTax";

const $ = <T extends HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

const els = {
  form: $<HTMLFormElement>("calc-form"),
  results: $("results"),
  emptyState: $("empty-state"),
  kpiGrid: $("kpi-grid"),
  balanceTable: $("balance-table"),
  breakdownTable: $("breakdown-table"),
  breakdownPeriods: $("breakdown-periods"),
  comparisonPeriods: $("comparison-periods"),
  comparisonCanvas: $<HTMLCanvasElement>("comparison-chart"),
  comparisonLegend: $("comparison-legend"),
  comparisonList: $("comparison-list"),
  comparisonNote: $("comparison-note"),
  projectionPeriods: $("projection-periods"),
  projectionCanvas: $<HTMLCanvasElement>("projection-chart"),
  projectionLegend: $("projection-legend"),
  projectionCount: $<HTMLInputElement>("projection-count"),
  projectionCountValue: $<HTMLOutputElement>("projection-count-value"),
  statement: $("statement-output"),
  copyStatement: $<HTMLButtonElement>("copy-statement"),
  themeToggle: $<HTMLButtonElement>("theme-toggle"),
  installButton: $<HTMLButtonElement>("install-button"),
  brandMark: document.querySelector<HTMLImageElement>(".brand__mark")!,
};

hydrateIcons();

// ------------------------------------------------------------
// Form state
// ------------------------------------------------------------

interface Field {
  name: FieldName;
  input: HTMLInputElement;
  wrap: HTMLElement;
  error: HTMLElement;
  validate: (raw: string) => { ok: boolean; value: number | null; error: string | null };
  touched: boolean;
}

function field(name: FieldName, validate: Field["validate"]): Field {
  return {
    name,
    input: $<HTMLInputElement>(name),
    wrap: document.querySelector<HTMLElement>(`[data-input="${name}"]`)!,
    error: $(`${name}-error`),
    validate,
    touched: false,
  };
}

const fields: Field[] = [
  field("capital", validatePositiveAmount),
  field("mfRate", validatePercentage),
  field("mfTax", validatePercentage),
  field("bankRate", validatePercentage),
  field("bankTax", validatePercentage),
];

let result: CalculatorResult | null = null;
let breakdownPeriod: Period = "monthly";
let comparisonPeriod: Period = "annual";
let projectionPeriod: Period = "monthly";

const UNIT_LABEL: Record<Period, string> = {
  daily: "Day",
  weekly: "Week",
  monthly: "Month",
  annual: "Year",
};

// ------------------------------------------------------------
// Segmented controls
// ------------------------------------------------------------

function buildSegmented(
  host: HTMLElement,
  selected: Period,
  onSelect: (period: Period) => void,
): void {
  host.replaceChildren(
    ...PERIODS.map((period) => {
      const button = document.createElement("button");
      button.type = "button";
      button.role = "tab";
      button.textContent = PERIOD_LABELS[period];
      button.setAttribute("aria-selected", String(period === selected));
      button.addEventListener("click", () => {
        host.querySelectorAll("button").forEach((other) =>
          other.setAttribute("aria-selected", String(other === button)),
        );
        onSelect(period);
      });
      return button;
    }),
  );
}

// ------------------------------------------------------------
// Rendering
// ------------------------------------------------------------

function renderAll(current: CalculatorResult): void {
  renderKpis(els.kpiGrid, current);
  renderBankBalance(els.balanceTable, current);
  renderBreakdown(els.breakdownTable, current, breakdownPeriod);
  renderComparison(els.comparisonList, els.comparisonNote, current, comparisonPeriod);
  renderComparisonChart(els.comparisonCanvas, current, comparisonPeriod);
  renderLegend(els.comparisonLegend, " (net)");
  renderLegend(els.projectionLegend, " (cumulative net)");
  els.statement.textContent = renderStatement(current);
  renderProjection();
}

function renderProjection(): void {
  if (!result) return;
  const count = Number(els.projectionCount.value);
  els.projectionCountValue.textContent = `${count} ${UNIT_LABEL[projectionPeriod].toLowerCase()}${count === 1 ? "" : "s"}`;
  renderCumulativeChart(
    els.projectionCanvas,
    buildCumulativeSeries(result, projectionPeriod, count),
    UNIT_LABEL[projectionPeriod],
  );
}

function recalculate(): void {
  const values: Partial<Record<FieldName, number>> = {};
  let allValid = true;

  for (const item of fields) {
    const { ok, value, error } = item.validate(item.input.value);
    const showError = item.touched && !ok;

    item.wrap.dataset.invalid = String(showError);
    item.input.setAttribute("aria-invalid", String(showError));
    item.error.dataset.show = String(showError);
    item.error.innerHTML = showError
      ? `${icon("circleAlert")}<span>${error}</span>`
      : "";

    if (ok && value !== null) {
      values[item.name] = value;
    } else {
      allValid = false;
    }
  }

  if (!allValid) {
    result = null;
    els.results.hidden = true;
    els.emptyState.hidden = false;
    return;
  }

  const inputs: CalculatorInputs = {
    capital: values.capital!,
    mutualFundRate: values.mfRate!,
    mutualFundTax: values.mfTax!,
    bankRate: values.bankRate!,
    bankTax: values.bankTax!,
  };

  result = calculate(inputs);
  els.emptyState.hidden = true;
  els.results.hidden = false;
  renderAll(result);
}

// ------------------------------------------------------------
// Wiring
// ------------------------------------------------------------

for (const item of fields) {
  item.input.addEventListener("input", () => {
    item.touched = true;
    recalculate();
  });
  item.input.addEventListener("blur", () => {
    item.touched = true;
    recalculate();
  });
}

els.form.addEventListener("submit", (event) => event.preventDefault());

buildSegmented(els.breakdownPeriods, breakdownPeriod, (period) => {
  breakdownPeriod = period;
  if (result) renderBreakdown(els.breakdownTable, result, breakdownPeriod);
});

buildSegmented(els.comparisonPeriods, comparisonPeriod, (period) => {
  comparisonPeriod = period;
  if (!result) return;
  renderComparisonChart(els.comparisonCanvas, result, comparisonPeriod);
  renderComparison(els.comparisonList, els.comparisonNote, result, comparisonPeriod);
});

buildSegmented(els.projectionPeriods, projectionPeriod, (period) => {
  projectionPeriod = period;
  renderProjection();
});

els.projectionCount.addEventListener("input", renderProjection);

els.copyStatement.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(els.statement.textContent ?? "");
    toast("Statement copied");
  } catch {
    toast("Copy blocked by browser", "circleAlert");
  }
});

const theme = setupTheme(els.themeToggle);
theme.onChange(() => {
  refreshChartTheme();
  if (result) {
    // Series dots and inline row marks read their colors from CSS variables.
    renderBreakdown(els.breakdownTable, result, breakdownPeriod);
    renderLegend(els.comparisonLegend, " (net)");
    renderLegend(els.projectionLegend, " (cumulative net)");
  }
});

setupInstall(els.installButton, els.brandMark.src);

// ------------------------------------------------------------
// Scroll spy for the top nav and the mobile tab bar
// ------------------------------------------------------------

function setupScrollSpy(): void {
  const links = Array.from(
    document.querySelectorAll<HTMLAnchorElement>("[data-nav], [data-tab]"),
  );
  const sections = Array.from(
    new Set(links.map((link) => link.getAttribute("href")!.slice(1))),
  )
    .map((id) => document.getElementById(id))
    .filter((section): section is HTMLElement => section !== null);

  if (!sections.length) return;

  const visible = new Map<string, number>();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        visible.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
      }
      let bestId = "";
      let bestRatio = 0;
      for (const [id, ratio] of visible) {
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestId = id;
        }
      }
      for (const link of links) {
        const matches = bestId !== "" && link.getAttribute("href") === `#${bestId}`;
        if (matches) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      }
    },
    { rootMargin: "-88px 0px -55% 0px", threshold: [0, 0.2, 0.5, 1] },
  );

  sections.forEach((section) => observer.observe(section));
}

setupScrollSpy();

// ------------------------------------------------------------
// Seed with a worked example so the dashboard is populated on arrival
// ------------------------------------------------------------

const SEED: Record<FieldName, string> = {
  capital: "1000000",
  mfRate: "15",
  mfTax: "10",
  bankRate: "8",
  bankTax: "15",
};

for (const item of fields) {
  item.input.value = SEED[item.name];
}

recalculate();
