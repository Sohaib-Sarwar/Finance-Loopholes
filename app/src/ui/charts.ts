import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  type Plugin,
} from "chart.js";
import type { CalculatorResult } from "../lib/calculator";
import type { CumulativePoint, Period } from "../lib/analytics";
import { formatMoneyCompact, formatMoney, formatMoneyPlain } from "../lib/format";

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Filler,
  Tooltip,
);

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

interface Palette {
  mf: string;
  bank: string;
  combined: string;
  grid: string;
  axis: string;
  ink: string;
  ink2: string;
  ink3: string;
  surface: string;
}

function palette(): Palette {
  return {
    mf: cssVar("--series-mf"),
    bank: cssVar("--series-bank"),
    combined: cssVar("--series-combined"),
    grid: cssVar("--grid-line"),
    axis: cssVar("--axis-line"),
    ink: cssVar("--ink"),
    ink2: cssVar("--ink-2"),
    ink3: cssVar("--ink-3"),
    surface: cssVar("--surface"),
  };
}

export const SERIES_KEYS = ["mf", "bank", "combined"] as const;
export type SeriesKey = (typeof SERIES_KEYS)[number];

export const SERIES_LABELS: Record<SeriesKey, string> = {
  mf: "Mutual Fund",
  bank: "Bank",
  combined: "Combined",
};

export function seriesColor(key: SeriesKey): string {
  return palette()[key];
}

function baseScales(p: Palette) {
  return {
    x: {
      grid: { display: false },
      border: { color: p.axis },
      ticks: {
        color: p.ink3,
        font: { size: 11, weight: 500 as const },
        padding: 6,
      },
    },
    y: {
      beginAtZero: true,
      grid: { color: p.grid, drawTicks: false },
      border: { display: false, dash: [0, 0] },
      ticks: {
        color: p.ink3,
        font: { size: 11 },
        padding: 8,
        maxTicksLimit: 6,
        callback: (value: string | number) => formatMoneyCompact(Number(value)),
      },
    },
  };
}

function tooltipConfig(p: Palette) {
  return {
    enabled: true,
    backgroundColor: p.ink,
    titleColor: p.surface,
    bodyColor: p.surface,
    borderWidth: 0,
    padding: 10,
    cornerRadius: 8,
    displayColors: true,
    boxWidth: 8,
    boxHeight: 8,
    boxPadding: 4,
    usePointStyle: true,
    titleFont: { size: 12, weight: 600 as const },
    bodyFont: { size: 12 },
    callbacks: {
      label: (ctx: { dataset: { label?: string }; raw: unknown }) =>
        ` ${ctx.dataset.label}: ${formatMoney(Number(ctx.raw))}`,
    },
  };
}

/**
 * Draws the series name beside the final point of each line — the direct
 * labelling that keeps identity readable without relying on color alone.
 */
const endLabels: Plugin<"line"> = {
  id: "endLabels",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const p = palette();
    ctx.save();
    ctx.font =
      '600 11px "Inter Variable", Inter, system-ui, -apple-system, sans-serif';
    ctx.textBaseline = "middle";

    const placed: number[] = [];
    chart.data.datasets.forEach((dataset, index) => {
      const meta = chart.getDatasetMeta(index);
      if (meta.hidden) return;
      const last = meta.data[meta.data.length - 1];
      if (!last) return;

      let y = last.y;
      // Nudge apart when two lines land on nearly the same pixel row.
      while (placed.some((taken) => Math.abs(taken - y) < 13)) y -= 13;
      placed.push(y);

      const text = String(dataset.label ?? "").replace(/ \(.*\)$/, "");
      // Labels live in the right-hand padding the layout reserves for them,
      // so clamp against the canvas edge rather than the plot area.
      const x = Math.min(
        last.x + 8,
        chart.width - ctx.measureText(text).width - 6,
      );
      ctx.fillStyle = (dataset.borderColor as string) || p.ink2;
      ctx.fillText(text, x, y);
    });
    ctx.restore();
  },
};

/**
 * Prints each bar's exact value just past its end. Daily and annual figures
 * differ by a factor of 365, so one linear axis can only ever render one
 * period legibly — the value labels carry the precision the axis cannot.
 */
const barValueLabels: Plugin<"bar"> = {
  id: "barValueLabels",
  afterDatasetsDraw(chart) {
    const { ctx, chartArea } = chart;
    const p = palette();
    ctx.save();
    ctx.font =
      '600 12px "Inter Variable", Inter, system-ui, -apple-system, sans-serif';
    ctx.textBaseline = "middle";

    const meta = chart.getDatasetMeta(0);
    meta.data.forEach((bar, index) => {
      const value = Number(chart.data.datasets[0].data[index] ?? 0);
      const text = formatMoneyPlain(value);
      const width = ctx.measureText(text).width;
      const outside = bar.x + 10 + width <= chartArea.right;
      // Long bars leave no room outside, so the label moves inside and
      // switches to the surface color to stay legible on the fill.
      ctx.fillStyle = outside ? p.ink2 : p.surface;
      ctx.fillText(text, outside ? bar.x + 10 : bar.x - width - 10, bar.y);
    });
    ctx.restore();
  },
};

let comparisonChart: Chart<"bar"> | null = null;
let cumulativeChart: Chart<"line"> | null = null;

export function renderComparisonChart(
  canvas: HTMLCanvasElement,
  result: CalculatorResult,
  period: Period,
): void {
  const p = palette();
  const data = {
    labels: [SERIES_LABELS.mf, SERIES_LABELS.bank, SERIES_LABELS.combined],
    datasets: [
      {
        label: "Net return",
        data: [
          result.mutualFund.net[period],
          result.bankResult.net[period],
          result.combined.net[period],
        ],
        backgroundColor: [p.mf, p.bank, p.combined],
        borderRadius: 4,
        borderSkipped: false as const,
        maxBarThickness: 34,
        categoryPercentage: 0.74,
        barPercentage: 0.9,
      },
    ],
  };

  const scales = {
    x: {
      beginAtZero: true,
      grid: { color: p.grid, drawTicks: false },
      border: { display: false },
      ticks: {
        color: p.ink3,
        font: { size: 11 },
        padding: 6,
        maxTicksLimit: 5,
        callback: (value: string | number) => formatMoneyCompact(Number(value)),
      },
    },
    y: {
      grid: { display: false },
      border: { color: p.axis },
      ticks: {
        color: p.ink2,
        font: { size: 12, weight: 500 as const },
        padding: 6,
      },
    },
  };

  if (comparisonChart) {
    comparisonChart.data = data;
    comparisonChart.options.scales = scales;
    comparisonChart.update("none");
    return;
  }

  comparisonChart = new Chart(canvas, {
    type: "bar",
    data,
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 4, right: 96, left: 4 } },
      interaction: { mode: "index", intersect: false },
      scales,
      plugins: {
        legend: { display: false },
        tooltip: tooltipConfig(p),
      },
    },
    plugins: [barValueLabels],
  });
}

export function renderCumulativeChart(
  canvas: HTMLCanvasElement,
  series: CumulativePoint[],
  unitLabel: string,
): void {
  const p = palette();
  const labels = series.map((point) => `${unitLabel} ${point.unit}`);
  const shared = {
    tension: 0.28,
    pointRadius: 0,
    pointHoverRadius: 5,
    pointHitRadius: 18,
    borderWidth: 2,
  };

  const data = {
    labels,
    datasets: [
      {
        ...shared,
        label: "Mutual Fund",
        data: series.map((point) => point.mfNet),
        borderColor: p.mf,
        backgroundColor: p.mf,
      },
      {
        ...shared,
        label: "Bank",
        data: series.map((point) => point.bankNet),
        borderColor: p.bank,
        backgroundColor: p.bank,
      },
      {
        ...shared,
        label: "Combined",
        data: series.map((point) => point.combinedNet),
        borderColor: p.combined,
        backgroundColor: p.combined,
        borderWidth: 2.75,
      },
    ],
  };

  if (cumulativeChart) {
    cumulativeChart.data = data;
    cumulativeChart.options.scales = baseScales(p);
    cumulativeChart.update("none");
    return;
  }

  cumulativeChart = new Chart(canvas, {
    type: "line",
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 8, right: 96 } },
      interaction: { mode: "index", intersect: false },
      scales: {
        ...baseScales(p),
        x: {
          ...baseScales(p).x,
          ticks: {
            ...baseScales(p).x.ticks,
            maxRotation: 0,
            autoSkipPadding: 18,
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: tooltipConfig(p),
      },
    },
    plugins: [endLabels],
  });
}

/** Re-reads the palette from CSS after a theme switch and repaints. */
export function refreshChartTheme(): void {
  const p = palette();
  if (comparisonChart) {
    comparisonChart.data.datasets[0].backgroundColor = [p.mf, p.bank, p.combined];
    const scales = comparisonChart.options.scales!;
    scales.x!.grid!.color = p.grid;
    scales.x!.ticks!.color = p.ink3;
    scales.y!.border!.color = p.axis;
    scales.y!.ticks!.color = p.ink2;
    comparisonChart.options.plugins!.tooltip = tooltipConfig(p);
    comparisonChart.update("none");
  }
  if (cumulativeChart) {
    const colors = [p.mf, p.bank, p.combined];
    cumulativeChart.data.datasets.forEach((dataset, index) => {
      dataset.borderColor = colors[index];
      dataset.backgroundColor = colors[index];
    });
    cumulativeChart.options.scales = baseScales(p);
    cumulativeChart.options.plugins!.tooltip = tooltipConfig(p);
    cumulativeChart.update("none");
  }
}
