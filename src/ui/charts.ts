import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import type { CalculatorResult } from "../lib/calculator";
import { PERIODS, type CumulativePoint, type Period } from "../lib/analytics";
import { formatMoney } from "../lib/format";

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
);

const COLOR_MF = "#1f4b3f";
const COLOR_BANK = "#b3782c";
const COLOR_COMBINED = "#2a4652";

const PERIOD_LABELS: Record<Period, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  annual: "Annual",
};

Chart.defaults.font.family =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
Chart.defaults.color = "#5c6572";

let comparisonChart: Chart<"bar"> | null = null;
let cumulativeChart: Chart<"line"> | null = null;

export function renderComparisonChart(
  canvas: HTMLCanvasElement,
  result: CalculatorResult,
): void {
  const labels = PERIODS.map((p) => PERIOD_LABELS[p]);
  const data = {
    labels,
    datasets: [
      {
        label: "Mutual Fund (net)",
        data: PERIODS.map((p) => result.mutualFund.net[p]),
        backgroundColor: COLOR_MF,
        borderRadius: 4,
        maxBarThickness: 36,
      },
      {
        label: "Bank (net)",
        data: PERIODS.map((p) => result.bankResult.net[p]),
        backgroundColor: COLOR_BANK,
        borderRadius: 4,
        maxBarThickness: 36,
      },
      {
        label: "Combined (net)",
        data: PERIODS.map((p) => result.combined.net[p]),
        backgroundColor: COLOR_COMBINED,
        borderRadius: 4,
        maxBarThickness: 36,
      },
    ],
  };

  if (comparisonChart) {
    comparisonChart.data = data;
    comparisonChart.update();
    return;
  }

  comparisonChart = new Chart(canvas, {
    type: "bar",
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      scales: {
        x: { grid: { display: false } },
        y: {
          ticks: {
            callback: (value) => formatMoney(Number(value)),
          },
          grid: { color: "#eef0f2" },
        },
      },
      plugins: {
        legend: { position: "bottom", labels: { boxWidth: 12, usePointStyle: true } },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${formatMoney(Number(ctx.raw))}`,
          },
        },
      },
    },
  });
}

export function renderCumulativeChart(
  canvas: HTMLCanvasElement,
  series: CumulativePoint[],
  unitLabel: string,
): void {
  const data = {
    labels: series.map((p) => `${unitLabel} ${p.unit}`),
    datasets: [
      {
        label: "Mutual Fund (net, cumulative)",
        data: series.map((p) => p.mfNet),
        borderColor: COLOR_MF,
        backgroundColor: COLOR_MF,
        tension: 0.25,
        pointRadius: 2,
      },
      {
        label: "Bank (net, cumulative)",
        data: series.map((p) => p.bankNet),
        borderColor: COLOR_BANK,
        backgroundColor: COLOR_BANK,
        tension: 0.25,
        pointRadius: 2,
      },
      {
        label: "Combined (net, cumulative)",
        data: series.map((p) => p.combinedNet),
        borderColor: COLOR_COMBINED,
        backgroundColor: COLOR_COMBINED,
        tension: 0.25,
        pointRadius: 2,
        borderWidth: 2.5,
      },
    ],
  };

  if (cumulativeChart) {
    cumulativeChart.data = data;
    cumulativeChart.update();
    return;
  }

  cumulativeChart = new Chart(canvas, {
    type: "line",
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      scales: {
        x: { grid: { display: false } },
        y: {
          ticks: {
            callback: (value) => formatMoney(Number(value)),
          },
          grid: { color: "#eef0f2" },
        },
      },
      plugins: {
        legend: { position: "bottom", labels: { boxWidth: 12, usePointStyle: true } },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${formatMoney(Number(ctx.raw))}`,
          },
        },
      },
    },
  });
}
