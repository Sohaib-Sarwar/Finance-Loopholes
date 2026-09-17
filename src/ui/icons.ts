// Minimal inline SVG line icons (no external icon font/CDN — keeps the app
// fully self-contained for offline/GitHub Pages use). 20x20 viewBox,
// stroke-based, inherit currentColor.

const wrap = (paths: string) =>
  `<svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

export const icons = {
  fund: wrap(
    '<path d="M3 15.5 8 9l3.5 3.5L17 5"/><path d="M12.5 5H17v4.5"/>',
  ),
  bank: wrap(
    '<path d="M3 8.5 10 4l7 4.5"/><path d="M4 8.5h12v7H4z"/><path d="M4 15.5h12M7 9.5v6M10 9.5v6M13 9.5v6"/>',
  ),
  grossReturn: wrap('<path d="M3 17 17 3M9 3h8v8"/>'),
  netReturn: wrap('<circle cx="10" cy="10" r="7"/><path d="M7 10.5l2 2 4-4.5"/>'),
  tax: wrap(
    '<circle cx="6.5" cy="6.5" r="2.5"/><circle cx="13.5" cy="13.5" r="2.5"/><path d="M4 16 16 4"/>',
  ),
  roi: wrap('<path d="M3 15.5h14M6 15.5V9M10 15.5V4.5M14 15.5v-7"/>'),
};

export type IconName = keyof typeof icons;
