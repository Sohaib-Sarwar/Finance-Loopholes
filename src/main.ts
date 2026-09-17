import "./styles.css";
import { calculate, type CalculatorInputs, type CalculatorResult } from "./lib/calculator";
import { validatePercentage, validatePositiveAmount } from "./lib/validation";
import { buildCumulativeSeries } from "./lib/analytics";
import type { Period } from "./lib/analytics";
import {
  renderBankBalanceTable,
  renderBreakdownTable,
  renderComparisonTable,
  renderKpis,
  renderStatement,
} from "./ui/render";
import { renderComparisonChart, renderCumulativeChart } from "./ui/charts";
import { setupInstallPrompt } from "./pwa/install";

type FieldName = "capital" | "mfRate" | "mfTax" | "bankRate" | "bankTax";

interface FieldConfig {
  name: FieldName;
  input: HTMLInputElement;
  error: HTMLElement;
  validate: (raw: string) => { ok: boolean; value: number | null; error: string | null };
  touched: boolean;
}

const form = document.getElementById("calculator-form") as HTMLFormElement;
const resultsSection = document.getElementById("results") as HTMLElement;
const kpiGrid = document.getElementById("kpi-grid") as HTMLElement;
const bankBalanceTable = document.getElementById("bank-balance-table") as HTMLElement;
const breakdownTable = document.getElementById("breakdown-table") as HTMLElement;
const comparisonTable = document.getElementById("comparison-table") as HTMLElement;
const comparisonCanvas = document.getElementById("comparison-chart") as HTMLCanvasElement;
const cumulativeCanvas = document.getElementById("cumulative-chart") as HTMLCanvasElement;
const statementOutput = document.getElementById("statement-output") as HTMLElement;
const cumulativePeriodSelect = document.getElementById(
  "cumulative-period",
) as HTMLSelectElement;
const cumulativeCountInput = document.getElementById(
  "cumulative-count",
) as HTMLInputElement;
const cumulativeCountOutput = document.getElementById(
  "cumulative-count-output",
) as HTMLOutputElement;
const installButton = document.getElementById("install-button") as HTMLButtonElement;

const fields: FieldConfig[] = [
  {
    name: "capital",
    input: document.getElementById("capital") as HTMLInputElement,
    error: document.getElementById("capital-error") as HTMLElement,
    validate: validatePositiveAmount,
    touched: false,
  },
  {
    name: "mfRate",
    input: document.getElementById("mfRate") as HTMLInputElement,
    error: document.getElementById("mfRate-error") as HTMLElement,
    validate: validatePercentage,
    touched: false,
  },
  {
    name: "mfTax",
    input: document.getElementById("mfTax") as HTMLInputElement,
    error: document.getElementById("mfTax-error") as HTMLElement,
    validate: validatePercentage,
    touched: false,
  },
  {
    name: "bankRate",
    input: document.getElementById("bankRate") as HTMLInputElement,
    error: document.getElementById("bankRate-error") as HTMLElement,
    validate: validatePercentage,
    touched: false,
  },
  {
    name: "bankTax",
    input: document.getElementById("bankTax") as HTMLInputElement,
    error: document.getElementById("bankTax-error") as HTMLElement,
    validate: validatePercentage,
    touched: false,
  },
];

let lastResult: CalculatorResult | null = null;

function updateFieldUi(field: FieldConfig, showError: boolean): { ok: boolean; value: number | null } {
  const { ok, value, error } = field.validate(field.input.value);
  if (showError) {
    field.input.setAttribute("aria-invalid", ok ? "false" : "true");
    field.error.textContent = ok ? "" : (error ?? "");
  } else {
    field.input.removeAttribute("aria-invalid");
    field.error.textContent = "";
  }
  return { ok, value };
}

function recalculate(): void {
  const values: Partial<Record<FieldName, number>> = {};
  let allOk = true;

  for (const field of fields) {
    const showError = field.touched;
    const { ok, value } = updateFieldUi(field, showError);
    if (ok && value !== null) {
      values[field.name] = value;
    } else {
      allOk = false;
    }
  }

  if (!allOk) {
    resultsSection.hidden = true;
    lastResult = null;
    return;
  }

  const inputs: CalculatorInputs = {
    capital: values.capital!,
    mutualFundRate: values.mfRate!,
    mutualFundTax: values.mfTax!,
    bankRate: values.bankRate!,
    bankTax: values.bankTax!,
  };

  const result = calculate(inputs);
  lastResult = result;

  resultsSection.hidden = false;
  renderKpis(kpiGrid, result);
  renderBankBalanceTable(bankBalanceTable, result);
  renderBreakdownTable(breakdownTable, result);
  renderComparisonTable(comparisonTable, result);
  renderComparisonChart(comparisonCanvas, result);
  statementOutput.textContent = renderStatement(result);
  updateCumulativeChart();
}

function updateCumulativeChart(): void {
  if (!lastResult) return;
  const period = cumulativePeriodSelect.value as Period;
  const count = Number(cumulativeCountInput.value);
  const series = buildCumulativeSeries(lastResult, period, count);
  const unitLabel = {
    daily: "Day",
    weekly: "Week",
    monthly: "Month",
    annual: "Year",
  }[period];
  renderCumulativeChart(cumulativeCanvas, series, unitLabel);
}

for (const field of fields) {
  field.input.addEventListener("input", () => {
    field.touched = true;
    recalculate();
  });
  field.input.addEventListener("blur", () => {
    field.touched = true;
    recalculate();
  });
}

form.addEventListener("submit", (event) => event.preventDefault());

cumulativePeriodSelect.addEventListener("change", updateCumulativeChart);
cumulativeCountInput.addEventListener("input", () => {
  cumulativeCountOutput.textContent = cumulativeCountInput.value;
  updateCumulativeChart();
});

setupInstallPrompt(installButton);

// Seed with a realistic example so the analytics/charts are visible without
// requiring the user to type first.
fields.find((f) => f.name === "capital")!.input.value = "1000000";
fields.find((f) => f.name === "mfRate")!.input.value = "15";
fields.find((f) => f.name === "mfTax")!.input.value = "10";
fields.find((f) => f.name === "bankRate")!.input.value = "8";
fields.find((f) => f.name === "bankTax")!.input.value = "15";
recalculate();
