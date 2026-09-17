# Combined Mutual Fund + Bank ROI Calculator

A production-grade, installable web/PWA analytics dashboard for the
**Combined Mutual Fund + Bank ROI Calculator**. The financial logic is an
exact TypeScript port of the original C++ reference implementation
(`logic.cpp`), which remains the single source of truth for every formula,
validation rule and error message in this project.

Live methodology, KPI cards, breakdowns, comparisons and a cumulative
visualization are layered on top of that unchanged calculation core — the
web layer never alters, simplifies, or "improves" the underlying math.

---

## 1. Overview

This app lets you enter:

- Capital (PKR)
- Mutual Fund annual return (%) and Mutual Fund tax (%)
- Bank Savings annual rate (%) and Bank tax (%)

and instantly see:

- Mutual Fund, Bank and Combined gross/net returns
- Daily, weekly, monthly and annual breakdowns (plain division, no
  compounding)
- Tax figures and effective tax rate
- ROI figures (per-instrument and combined, gross and net)
- An accountant-style statement mirroring the original console report
- MF vs Bank vs Combined comparisons (PKR and % differences)
- A linear cumulative-return projection chart over a selectable period

It runs entirely client-side, is installable as a PWA on desktop and
mobile, works offline after first load, and is designed from the ground up
for static hosting on GitHub Pages under a repository subpath.

## 2. Features

- **Exact-parity calculation engine** — a line-for-line TypeScript port of
  `logic.cpp` (see [Section 3](#3-exact-calculation-methodology)).
- **Real-time input validation and recalculation** — no submit button;
  results update as you type, with the same accept/reject rules and error
  text as the original program.
- **KPI dashboard** — Mutual Fund, Bank, Combined Gross, Combined Net, Total
  Tax and Combined Net ROI as clean summary cards.
- **Daily/Weekly/Monthly/Annual breakdown table** for MF, Bank and Combined,
  gross and net.
- **Accountant-style detailed statement** reproducing the structure and
  labels of the original console report, for direct comparison.
- **MF vs Bank vs Combined comparison** — side-by-side net figures plus PKR
  and percentage differences for every period.
- **Cumulative-return visualization** — a linear (non-compounding)
  projection chart over a selectable number of days/weeks/months/years.
- **Clear "Calculated" vs "Projection" labeling** throughout the UI.
- **Installable PWA** with an offline application shell, a mobile install
  sheet and an iOS Add-to-Home-Screen guide — all driven by the real browser
  install mechanism, never a fake dialog.
- **Light / dark / system theming** with a header toggle, persisted per
  device; charts repaint against the active surface.
- **Zero-server static site** — builds to plain HTML/CSS/JS, deployable to
  GitHub Pages with no backend.
- **Accessible, responsive, minimalist design** — Inter + JetBrains Mono
  (self-hosted, no CDN), Lucide icon set, no emoji, no gradients. Wide data
  tables become stacked cards on phones rather than scrolling sideways.
- **Design-system palette** — the categorical chart colors are validated for
  colour-vision deficiency separation and surface contrast in both themes.

## 3. Exact Calculation Methodology

The entire calculation core lives in [`src/lib/calculator.ts`](src/lib/calculator.ts),
[`src/lib/validation.ts`](src/lib/validation.ts) and
[`src/lib/constants.ts`](src/lib/constants.ts), each annotated with the exact
`logic.cpp` line numbers they correspond to. **`logic.cpp` is the single
source of truth.** If this README and the C++ source ever disagree, the C++
source wins and the web app has a bug.

Nothing in the web layer compounds, re-weights, or reinterprets a value —
it only formats, compares and charts the numbers the calculation core
produces.

## 4. Inputs and Validation Rules

| Field | Rule | Error message (verbatim) |
|---|---|---|
| Capital (PKR) | Finite number, strictly greater than 0 | `ERROR: Enter a finite number greater than 0.` |
| Mutual Fund annual return (%) | Finite number, `0 ≤ x ≤ 100` | `ERROR: Percentage must be between 0 and 100.` |
| Mutual Fund tax (%) | Finite number, `0 ≤ x ≤ 100` | `ERROR: Percentage must be between 0 and 100.` |
| Bank Savings annual rate (%) | Finite number, `0 ≤ x ≤ 100` | `ERROR: Percentage must be between 0 and 100.` |
| Bank tax (%) | Finite number, `0 ≤ x ≤ 100` | `ERROR: Percentage must be between 0 and 100.` |

This mirrors `getPositiveAmount()` and `getPercentage()` in `logic.cpp`
(lines 27–70): both reject non-finite values (`NaN`, `Infinity`), and the
percentage fields are inclusive at both `0` and `100`. Where the C++ version
re-prompts on a blocking console loop, the web version instead validates on
every keystroke and shows the same error text inline, and only computes and
displays results once **all five** fields are valid.

Money values are always displayed with exactly **2 decimals** (PKR).
Percentages are always displayed with exactly **4 decimals** — matching
`printMoney()` / `printPercent()` in `logic.cpp` (lines 76–93).

## 5. Bank Average-Balance Methodology

The bank side of the calculator does **not** use a capital-weighted or
portfolio-weighted balance. It uses a fixed weekly closing-balance pattern,
exactly as in `logic.cpp` (lines 18–21, 136–142):

| Day | Closing balance (PKR) |
|---|---:|
| Monday | 600,000.00 |
| Tuesday | 600,000.00 |
| Wednesday | 600,000.00 |
| Thursday | 600,000.00 |
| Friday | 600,000.00 |
| Saturday | 840,000.00 |
| Sunday | 936,000.00 |
| **7-day total** | **4,776,000.00** |
| **Average daily bank balance** (total ÷ 7) | **682,285.7142857143 (rounds to 682,285.71 PKR)** |

This average balance is a **fixed constant** — it does not depend on the
entered capital, and it is the figure the Bank Savings rate is applied to,
not the full capital amount.

## 6. MF, Bank and Combined Formulas

**Mutual Fund**

```
gross annual = capital × (MF rate / 100)
tax annual   = gross annual × (MF tax / 100)
net annual   = gross annual − tax annual
net ROI      = (net annual / capital) × 100
```

**Bank**

```
gross annual = average bank balance × (bank rate / 100)
tax annual   = gross annual × (bank tax / 100)
net annual   = gross annual − tax annual
net ROI      = (net annual / capital) × 100
```

**Combined**

```
combined gross annual = MF gross annual + bank gross annual
combined tax annual    = MF tax annual + bank tax annual
combined net annual    = MF net annual + bank net annual
combined gross ROI     = (combined gross annual / capital) × 100
combined net ROI       = (combined net annual / capital) × 100
```

**Effective tax rate on combined gross return**

```
if combined gross annual > 0:
    effective tax rate = (combined tax annual / combined gross annual) × 100
else:
    effective tax rate = 0
```

(This guard matches `logic.cpp` line 412 exactly — it is not a general
"avoid divide by zero" shortcut invented for the web version.)

## 7. Daily / Weekly / Monthly / Annual Calculations

Every periodic figure is a **plain division of the annual figure** — never
a compounding calculation:

```
monthly = annual / 12
weekly  = annual / 52
daily   = annual / 365
```

This applies identically to MF gross/net, Bank gross/net, and Combined
gross/net (`logic.cpp` lines 202–267).

## 8. ROI and Tax Calculations

- **ROI is always relative to the entered capital**, not to the average
  bank balance and not to a blended/weighted base — see
  [Section 9](#9-analyticscomparison-functionality) for why this matters
  for the combined figure.
- **Tax is calculated on gross profit**, and net = gross − tax, for each
  instrument independently; combined tax is simply MF tax + bank tax.

## 9. Analytics/Comparison Functionality

Built entirely from the calculated figures above (no independent
recalculation):

- **KPI cards**: MF net, Bank net, Combined gross, Combined net, Total tax,
  Combined net ROI.
- **Breakdown table**: MF/Bank/Combined gross and net, across
  daily/weekly/monthly/annual.
- **Comparison**: MF net vs Bank net vs Combined net side-by-side, plus a
  PKR-difference and percentage-difference table (MF net − Bank net) for
  every period.
- **Cumulative-return visualization**: a *linear projection* — the selected
  periodic net figure multiplied by the number of elapsed periods — charted
  for MF, Bank and Combined. This is explicitly labeled **Projection** in
  the UI (as opposed to the **Calculated** statement section) and never
  compounds.

### Important: the combined ROI is not portfolio-weighted

> The combined ROI follows the exact structure of the original calculation
> model. MF return is computed on the **full entered capital**; Bank return
> is computed on the **fixed average bank balance**; the two net returns
> are simply added. This is **not a conventional portfolio-weighted ROI**
> unless the capital allocation between the Mutual Fund and the Bank
> savings account is explicitly defined elsewhere. Treat the combined
> figures as "what both legs return in parallel," not as the yield of a
> single blended portfolio.

### Strategy Context / Conceptual Model

> A banking & mutual-fund yield optimization strategy that combines
> money-market fund returns with 24/7 redemption, strategically maintaining
> the required balance in a savings account around the bank's profit
> calculation/recording time. The same capital can potentially generate
> returns from both the money-market fund and the bank savings account,
> subject to each institution's rules, cut-off times, eligibility, and
> transaction settlement.

This is the **conceptual context behind the calculator**, not a guarantee.
It is included here so the numbers this tool produces are read in the
right frame: the calculator computes what the two legs *would* return
under the entered rates using the described bank-balance model. Whether
that outcome is actually achievable depends entirely on:

- the specific bank's and fund's terms, cut-off times and settlement rules,
- eligibility for the relevant account/fund products,
- redemption availability and timing (money-market funds are not always
  instantly redeemable in practice, despite nominal same-day/24-7
  redemption claims),
- actual tax treatment, which may differ by investor category,
- and any minimum-balance, transaction-limit or reporting rules that apply.

**This is not financial advice, and double returns are not guaranteed.**
Consult the relevant bank/fund documentation and, where appropriate, a
licensed financial advisor before acting on any figure this calculator
produces.

## 10. PWA / Mobile Functionality

The manifest config lives in [`vite.config.ts`](vite.config.ts) via
`vite-plugin-pwa`, generating:

- App name/short name, `start_url`, `scope`, `display: standalone`.
- 192×192 and 512×512 icons (regular and maskable), an apple-touch-icon and
  favicons — all produced from `logo.png` by
  [`scripts/generate-icons.mjs`](scripts/generate-icons.mjs).
- A Workbox (`generateSW`) service worker that precaches the app shell and
  serves it offline, with a navigation fallback to `index.html` so refreshes
  keep working offline. Non-Latin font subsets are deliberately excluded from
  the precache; browsers fetch those ranges only if a page ever needs them.

**Install experience** — everything is driven by the browser's own machinery:

- The header **Install** button appears only after a genuine
  `beforeinstallprompt` event fires, and calls the native `prompt()`.
- On phones an **install sheet** slides up shortly after arrival offering the
  same real prompt, with a "Not now" action that snoozes it for 7 days
  (stored in `localStorage`).
- On iOS Safari — which never fires `beforeinstallprompt` and offers no
  programmatic install — the sheet shows the actual **Share → Add to Home
  Screen** steps instead of a button that could not work.
- Nothing anywhere simulates an install dialog.

**Mobile layout** — mobile-first, and specifically built so nothing has to be
scrolled sideways to be read:

- A fixed bottom tab bar (Inputs / Overview / Compare / Report) with
  scroll-spy highlighting, honouring `env(safe-area-inset-bottom)`.
- Wide data tables are **replaced**, not squeezed: below 720px each table
  renders as stacked label/value rows grouped per instrument.
- The comparison chart plots one selected period as horizontal bars, so daily
  figures stay legible instead of being flattened by the annual bar.
- Only the monospace statement scrolls horizontally, inside its own bordered
  container. The page itself never scrolls horizontally at any width tested
  (320 / 390 / 768 / 1440 px).

## 11. GitHub Pages Deployment Instructions

### How this repository is laid out for Pages

GitHub Pages' default mode — **Deploy from a branch → `main` → `/ (root)`** —
copies the branch verbatim and runs no build step. Serving raw sources there
does not work: Pages sends `src/main.ts` as `video/mp2t`, and browsers refuse
to execute a module script with a non-JavaScript content type, so the page
renders but nothing runs.

This repository therefore keeps **source in `app/`** and commits the
**compiled site at the repository root**, so the files Pages finds at the
root are already the built app:

```
/index.html, /assets/, /icons/, /manifest.webmanifest, /sw.js …   ← built, committed
/app/…                                                            ← source
```

A `.nojekyll` marker is published alongside it so Pages serves the directory
verbatim instead of running it through Jekyll.

Path-independence is preserved throughout, so the same build works at a
domain root or any project subpath:

- `vite.config.ts` uses `base: "./"` — every emitted reference is relative to
  `index.html`, never rooted at `/`.
- The manifest uses `start_url: "."` and `scope: "./"` (resolved against the
  manifest's own URL), and the service worker registers with a relative scope
  and a relative `navigateFallback`.

### Publishing a change

```bash
npm run release     # build + copy the site to the repository root
git add -A && git commit -m "…" && git push
```

Pages picks it up automatically — **no repository settings change required**.

### Optional: GitHub Actions deployment instead

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) type-checks,
tests, builds and deploys `dist/` through `actions/deploy-pages`. It only
works if **Settings → Pages → Source** is switched to **GitHub Actions**; in
the default branch mode its deploy step fails by design, because Pages will
not accept an Actions deployment. Pick one mode or the other:

| Pages source setting | What serves the site | Committed root build needed? |
|---|---|---|
| Deploy from a branch → `main` → `/ (root)` *(current)* | the committed root build | yes |
| GitHub Actions | `deploy.yml` | no |

## 12. Local Development / Testing Instructions

Requirements: Node.js 20+.

```bash
npm install
npm run icons       # regenerate icons + brand mark from src-assets/logo.png (only when the logo changes)
npm run dev         # Vite dev server (service worker disabled in dev)
npm run test        # Vitest unit-test suite
npm run typecheck   # strict TypeScript check
npm run build       # production build to dist/
npm run release     # build, then publish the site to the repository root
```

To test the production build the way GitHub Pages actually serves it (from a
repository subpath, with the service worker active), serve the built root
from a directory named after the repository:

```bash
npm run release
mkdir -p /tmp/pages-root/Finance-Loopholes
cp -r dist/. /tmp/pages-root/Finance-Loopholes/
cd /tmp/pages-root && python3 -m http.server 8080
# open http://localhost:8080/Finance-Loopholes/
```

Note that a service worker caches the app shell, so after deploying a change
a previously-visited browser may serve the old build for one load before
`registerType: "autoUpdate"` swaps it in. A hard reload (or DevTools →
Application → Service Workers → Unregister) forces it immediately.

## 13. Project Structure

```
.
├── logic.cpp                      # Source of truth for all financial logic
├── logo.png                       # Original logo supplied with the project
├── src-assets/logo.png            # Input to the icon-generation script
│
├── app/                           # ─── SOURCE (Vite root) ───
│   ├── index.html                 # App shell (single page, no client router)
│   ├── public/icons/              # Generated PWA/browser icons (committed)
│   └── src/
│       ├── main.ts                # Entry: form wiring, recalculation, scroll-spy
│       ├── styles.css             # Design system (tokens, components, light+dark)
│       ├── assets/logo.png        # Optimised in-app brand mark
│       ├── lib/
│       │   ├── constants.ts       # Bank balance constants (mirrors logic.cpp)
│       │   ├── validation.ts      # Mirrors getPositiveAmount / getPercentage
│       │   ├── calculator.ts      # Exact port of the calculation core
│       │   ├── analytics.ts       # Comparison + linear projection helpers
│       │   └── format.ts          # PKR (2dp) / percent (4dp) formatting
│       ├── ui/
│       │   ├── render.ts          # KPI cards, tables/stacks, statement
│       │   ├── charts.ts          # Chart.js comparison + projection charts
│       │   ├── icons.ts           # Lucide icon layer (tree-shaken, inlined)
│       │   ├── theme.ts           # light / dark / system toggle
│       │   └── toast.ts           # Transient status messages
│       └── pwa/install.ts         # Real beforeinstallprompt flow + iOS guide
│
├── index.html, assets/, icons/,   # ─── BUILT SITE (committed; what Pages serves) ───
│   manifest.webmanifest, sw.js,
│   registerSW.js, workbox-*.js,
│   .nojekyll
│
├── scripts/
│   ├── generate-icons.mjs         # Icons + brand mark from src-assets/logo.png
│   └── publish-to-root.mjs        # Copies dist/ to the repository root
├── tests/                         # Vitest unit tests (validation, calculator, analytics)
├── .github/workflows/deploy.yml   # Optional Actions-based Pages deployment
├── vite.config.ts                 # Relative base, app/ root, vite-plugin-pwa
├── TODO.md                        # Manually maintained build/verification checklist
└── README.md
```

## 14. Verification / Testing Checklist

See [`TODO.md`](TODO.md) for the live, maintained checklist. Summary of what
is covered:

- Empty inputs, invalid text, negative/zero values, `NaN`/`Infinity` — all
  rejected with the exact `logic.cpp` error messages.
- Percentage boundaries at exactly `0` and `100` — accepted.
- Decimal values and large values (including scientific notation, which
  `cin >> double` also accepts) — accepted.
- Manual side-by-side comparison against a compiled run of `logic.cpp` for
  representative inputs.
- Daily/weekly/monthly/annual, tax, ROI, comparison and cumulative figures
  checked against hand-computed expected values in `tests/`.
- Chart rendering, mobile breakpoints, theme switching, PWA
  manifest/service worker, installability, refresh/navigation and the
  production GitHub Pages subpath were exercised manually against real
  Chrome — both via the browser extension and via the DevTools Protocol
  (see `TODO.md` for the full log).
- The service worker was confirmed registering, activating, precaching and
  serving the app shell in a normal Chrome profile.
- Chart colours are checked with a palette validator for colour-vision
  deficiency separation, lightness band and surface contrast in both themes;
  UI text and control borders are checked against WCAG AA (4.5:1) and
  non-text contrast (3:1).

Run the automated portion with:

```bash
npm run typecheck
npm run test
```

## 15. Important Assumptions and Limitations

- The bank balance model is a **fixed hypothetical weekly pattern**
  (600,000 / 840,000 / 936,000), not a live or capital-derived balance. It
  does not change based on the entered capital or any real account
  activity.
- The combined ROI is **not portfolio-weighted** — see
  [Section 9](#9-analyticscomparison-functionality).
- Periodic figures are **simple divisions of the annual figure**, not
  compounded projections of actual day-by-day or month-by-month growth.
- The cumulative-return chart is an explicit **linear projection**
  (periodic net × elapsed periods), assuming the entered rates hold
  constant for the whole horizon — it is not a forecast and does not
  account for rate changes, fund performance variability, or reinvestment
  effects.
- Tax, eligibility, redemption timing and settlement rules vary by
  institution and are **not modeled** beyond the flat tax-rate inputs
  provided.

## 16. Financial Disclaimer

This calculator is provided for **informational and educational purposes
only**. It does not constitute financial, tax, investment, or legal advice.
Actual mutual fund and bank returns depend on real market conditions,
institutional rules, cut-off times, eligibility criteria, settlement
timing, and applicable tax law, none of which are guaranteed to match the
inputs or assumptions used here. Nothing in this tool guarantees any
specific return, and the "double return" strategy described in
[Section 9](#9-analyticscomparison-functionality) is a conceptual model,
not a promised outcome. Always verify figures independently and consult a
qualified, licensed financial advisor before making financial decisions.

---

## License

MIT — see [`LICENSE`](LICENSE).
