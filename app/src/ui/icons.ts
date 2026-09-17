// Icon layer built on Lucide (the same icon set `react-icons/lu` wraps),
// imported by name so only the icons actually used end up in the bundle.
// Everything is inlined as SVG — no icon font, no CDN — which keeps the app
// fully self-contained for offline/PWA use.

import {
  ArrowDown,
  ArrowUp,
  Banknote,
  BookOpen,
  Calculator,
  ChartColumn,
  Check,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Coins,
  Copy,
  Download,
  Info,
  Landmark,
  Layers,
  type IconNode,
  Minus,
  Monitor,
  Moon,
  Percent,
  Receipt,
  Scale,
  Share,
  SlidersHorizontal,
  Sparkles,
  SquarePlus,
  Sun,
  TrendingUp,
  TriangleAlert,
  Wallet,
  X,
  createElement,
} from "lucide";

const NODES = {
  arrowDown: ArrowDown,
  arrowUp: ArrowUp,
  banknote: Banknote,
  book: BookOpen,
  calculator: Calculator,
  chart: ChartColumn,
  check: Check,
  chevron: ChevronRight,
  circleAlert: CircleAlert,
  circleCheck: CircleCheck,
  coins: Coins,
  copy: Copy,
  download: Download,
  info: Info,
  landmark: Landmark,
  layers: Layers,
  minus: Minus,
  monitor: Monitor,
  moon: Moon,
  percent: Percent,
  receipt: Receipt,
  scale: Scale,
  share: Share,
  sliders: SlidersHorizontal,
  sparkles: Sparkles,
  squarePlus: SquarePlus,
  sun: Sun,
  trendingUp: TrendingUp,
  triangleAlert: TriangleAlert,
  wallet: Wallet,
  x: X,
} satisfies Record<string, IconNode>;

export type IconName = keyof typeof NODES;

const cache = new Map<string, string>();

/** Returns the icon as an SVG markup string, for use inside templates. */
export function icon(name: IconName): string {
  const cached = cache.get(name);
  if (cached) return cached;

  const svg = createElement(NODES[name], {
    width: "24",
    height: "24",
    "stroke-width": "1.75",
    "aria-hidden": "true",
    focusable: "false",
  });
  const markup = svg.outerHTML;
  cache.set(name, markup);
  return markup;
}

/** Returns the icon as a live SVG element, for direct DOM insertion. */
export function iconEl(name: IconName): SVGElement {
  return createElement(NODES[name], {
    width: "24",
    height: "24",
    "stroke-width": "1.75",
    "aria-hidden": "true",
    focusable: "false",
  });
}

/** Replaces the contents of every `[data-icon]` element with its named icon. */
export function hydrateIcons(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-icon]").forEach((host) => {
    const name = host.dataset.icon as IconName | undefined;
    if (!name || !(name in NODES)) return;
    host.replaceChildren(iconEl(name));
    delete host.dataset.icon;
  });
}
