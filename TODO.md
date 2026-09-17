# TODO — Combined MF + Bank ROI Calculator (Web/PWA)

Source of truth: `logic.cpp`. This checklist is maintained manually (no subagents used for this build), per project instructions.

## 1. Analysis
- [x] Read and fully understand `logic.cpp` (inputs, validation, bank model, formulas, output sections, disclaimers).
- [x] Inspect project directory (found `logic.cpp`, `logo.png`).
- [x] Inspect `logo.png` (350x350 PNG, calculator glyph on rounded white/orange/black square).
- [x] Check git remote/branch state (remote `origin` = `Sohaib-Sarwar/Finance-Loopholes`, remote `main` has only `LICENSE` (MIT); local `master` has no commits yet).

## 2. Project scaffold
- [x] `package.json`, `tsconfig.json`, `vite.config.ts` (relative base for GH Pages subpath safety).
- [x] `.gitignore`.
- [x] Install dependencies (vite, typescript, vite-plugin-pwa, chart.js, vitest, sharp for icon generation).
- [x] Directory layout: `src/`, `public/`, `tests/`, `scripts/`, `.github/workflows/`.

## 3. Core calculation logic (must match `logic.cpp` exactly)
- [x] `src/lib/calculator.ts`: constants (weekday/Sat/Sun balances, days/week/month/year).
- [x] Validation: capital finite & > 0; percentages finite & in [0,100] inclusive — same error semantics as `getPositiveAmount`/`getPercentage`.
- [x] Bank average balance: (5*600000 + 840000 + 936000) / 7.
- [x] MF gross/tax/net formulas exact.
- [x] Bank gross/tax/net formulas exact.
- [x] Combined gross/tax/net, ROI formulas exact (ROI = net/capital*100, per-instrument and combined gross/net ROI).
- [x] Effective tax rate on combined gross (guarded when gross <= 0, same as C++ `if (combinedGrossAnnual > 0.0)`).
- [x] Periodic breakdown: /12, /52, /365 (no compounding) for MF, Bank, Combined gross & net.
- [x] Unit tests (Vitest) mirroring C++ logic, incl. edge cases.

## 4. UI / Analytics dashboard
- [x] Input form with real-time validation + recalculation, matching validation rules/messages.
- [x] KPI cards: MF, Bank, Combined Gross, Combined Net, Tax, ROI.
- [x] Daily/Weekly/Monthly/Annual breakdown tables.
- [x] Accountant-style detailed statement (mirrors C++ output sections).
- [x] MF vs Bank vs Combined comparison (PKR + % difference, daily/weekly/monthly/annual).
- [x] Cumulative-return visualization over selectable periods (chart).
- [x] Bar/trend charts (Chart.js), accessible labels.
- [x] Clear "calculated" vs "projection" labeling.
- [x] Calculation-basis explanation + non-portfolio-weighted ROI warning (verbatim intent from C++ comments).
- [x] No compounding introduced anywhere periodic values are derived.

## 5. UI/UX polish
- [x] Minimalist white/neutral theme, clean typography, no emoji.
- [x] Responsive cards, subtle borders/shadows, restrained animation.
- [x] Professional icon set (inline SVG) for section headers/KPIs.
- [x] Accessible contrast, focus states, semantic markup.
- [x] Zero horizontal overflow on mobile; verified breakpoints.

## 6. Branding / PWA assets
- [x] Generate icons from `logo.png` (`scripts/generate-icons.mjs` via sharp): 192, 512, maskable 192/512, apple-touch-icon 180, favicon 32/16.
- [x] `manifest.webmanifest` (name, short_name, start_url, scope, display standalone, icons, theme/background color).
- [x] Service worker via `vite-plugin-pwa` (offline app shell, precache).
- [x] Install CTA using real `beforeinstallprompt` event (no fake modal); hidden when unavailable/already installed.

## 7. GitHub Pages readiness
- [x] Relative/base-safe asset paths (`base: './'`), manifest `start_url`/`scope` relative-safe.
- [x] `.github/workflows/deploy.yml` (build + deploy to Pages on push to `main`).
- [x] Verify built output works when served from a subpath (simulated `/Finance-Loopholes/`).
- [x] No hardcoded absolute `/` paths anywhere.

## 8. README.md
- [x] Overview, features, exact methodology, inputs/validation, bank methodology, formulas, periodic calcs, ROI/tax, analytics, PWA/mobile, GH Pages deployment, local dev, project structure, verification checklist, assumptions/limitations, financial disclaimer, Strategy Context section.

## 9. Manual verification (no agents — done by hand)

The Claude-in-Chrome extension was not connected in this session, so browser
testing was done by driving a real, locally installed Chrome (both headless
and a normal window) directly over the Chrome DevTools Protocol (CDP) — the
same protocol DevTools itself uses — via small throwaway Node scripts in the
scratchpad. The app was served exactly as GitHub Pages would serve it: built
with `npm run build`, copied into `<root>/Finance-Loopholes/`, and served
with `python -m http.server`, then loaded as `http://localhost:8080/Finance-Loopholes/`.

- [x] Empty inputs — blurring an empty `capital` field shows
      `ERROR: Enter a finite number greater than 0.` verbatim; results hidden.
- [x] Invalid text input — `"abc"` in `capital` produces the same error.
- [x] Negative / zero values — `-500` and `0` in `capital` both rejected with
      the exact capital error; `-1` in a percentage field rejected with the
      exact percentage error.
- [x] NaN / Infinity — literal `"NaN"` and `"Infinity"` typed into a
      percentage field are rejected with the exact percentage error (regex
      doesn't match the token at all, so it never reaches the finite check —
      same observable result as C++'s `isfinite` rejection).
- [x] Percentage boundaries 0 and 100 — both accepted; all-0% run produces
      PKR 0.00 everywhere and a 0.0000% effective tax rate (confirms the
      `combinedGrossAnnual > 0.0` guard, logic.cpp line 412); all-100% run
      (with 0% bank tax) produces MF net = 0, Bank net = full average
      balance, exactly as hand-derived.
- [x] Decimal values — capital `1234567.895` with fractional rates
      (`12.3456`, `7.891`, `4.2`, `3.3`) computes and renders correctly.
- [x] Large values — capital `999999999999` renders a correctly scaled
      combined gross figure (PKR 123,456,028,655.88, matches hand math).
- [x] Comparison vs `logic.cpp` — **not run as a compiled binary**: no C++
      toolchain with usable headers was available in this environment (MSVC
      compiler present under Visual Studio, but the Windows SDK/CRT headers
      such as `float.h` are not installed; no g++/clang). Instead, verified
      numerically: every formula in `src/lib/calculator.ts` was re-diffed
      line-by-line against `logic.cpp`, and `tests/calculator.test.ts`
      duplicates each C++ expression independently (same operation order)
      and asserts **exact** (`toBe`) equality — since both C++ `double` and
      JS `number` are IEEE-754 binary64, identical expressions in the same
      order are guaranteed bit-identical, which is a stronger guarantee than
      most manual console diffing would give. A full worked example (capital
      1,000,000 / MF 15% / MF tax 10% / bank 8% / bank tax 15%) was also
      hand-traced and matches the rendered KPI values exactly (MF net
      135,000.00; Bank net 46,395.43; combined gross 204,582.86; combined
      net 181,395.43; total tax 23,187.43; effective tax 11.3340%; combined
      net ROI 18.1395%). If an exact compiled-binary diff is still wanted,
      installing the Windows 10/11 SDK (for MSVC) or MSYS2/g++ would enable
      it — not done here since it's a nontrivial system install.
- [x] Daily/weekly/monthly/annual outputs — breakdown table and statement
      verified against `annual/12`, `annual/52`, `annual/365` by hand.
- [x] Tax calculations — verified (gross × taxRate/100; combined = MF tax +
      bank tax).
- [x] ROI calculations — verified (net/gross ÷ capital × 100 for each row).
- [x] Comparison calculations (PKR + % diff) — verified MF-vs-Bank diff rows
      against `(a-b)` and `(a-b)/|b|×100`.
- [x] Cumulative analytics — verified linear scaling (12× monthly cumulative
      == annual net figure) both in `tests/analytics.test.ts` and visually.
- [x] Charts render correctly — comparison bar chart and cumulative line
      chart both confirmed via screenshot at desktop, tablet (768px) and
      mobile (390px, 320px) widths, with legends and axis labels readable.
- [x] Mobile breakpoints — checked 320px, 390px, 768px, 1280/1440px via CDP
      `Emulation.setDeviceMetricsOverride` + screenshots. No page-level
      horizontal overflow at any width (`document.documentElement.scrollWidth
      === window.innerWidth` confirmed programmatically at 320/390/768px);
      only intentional, contained horizontal scroll inside data tables, the
      statement panel, and the quick-nav strip (all have a CSS scroll-shadow
      affordance). Header wraps cleanly (brand + install button on row 1,
      nav strip on row 2) down to 320px with no overlap.
- [x] Chrome mobile behavior — exercised via direct CDP automation against a
      real Chrome binary (extension unavailable this session; see note
      above). Real form input/blur events were dispatched through the DOM's
      native setters (not just direct state mutation) to exercise the exact
      listeners `src/main.ts` attaches.
- [x] PWA manifest — fetched `manifest.webmanifest` from the served subpath;
      valid JSON, `start_url: "."`, `scope: "./"`, 4 icons (192/512, incl.
      maskable) all resolve with HTTP 200.
- [~] Service worker — registers and reaches the `install` step (confirmed
      via `navigator.serviceWorker.register()` and state-change events;
      every one of the ~20 precached URLs returns HTTP 200 from the page).
      Full activation could **not** be confirmed end-to-end in this specific
      automated Chrome profile: `caches.open()` itself throws
      `UnknownError: Unexpected internal error` in every profile tried here
      (fresh headless profile, fresh non-headless/visible-window profile,
      with and without `--no-sandbox`) — a local CacheStorage backend fault
      in this machine's Chrome/Windows combination, unrelated to this app's
      code (workbox's precache install step depends on `caches.open()`
      succeeding, so it can't complete while that's broken here). Recommend
      re-checking DevTools → Application → Service Workers/Cache Storage in
      a normal daily-driver Chrome window (or via the Claude-in-Chrome
      extension once connected) to confirm on a machine without this quirk.
- [x] Installability — a real `beforeinstallprompt` event fired during CDP
      testing and `src/pwa/install.ts` correctly un-hid the Install button in
      response (`installBtnHidden: false` observed); clicking it calls the
      native `prompt()` API. No custom/fake install UI exists anywhere.
- [x] Refresh/navigation — single-page app with no client-side router, so a
      hard reload (`location.reload()`) simply re-requests `index.html`,
      which is confirmed to work from the `/Finance-Loopholes/` subpath.
- [x] GitHub Pages production URL path simulation — entire session tested
      against `http://localhost:8080/Finance-Loopholes/` (dist/ copied into
      a subdirectory, not project root), matching the real
      `https://<user>.github.io/<repo>/` shape; every asset (JS, CSS, icons,
      manifest, SW, logo) resolved correctly from that subpath.
- [~] Offline behavior — not confirmed end-to-end for the same CacheStorage
      reason noted above; the navigation fallback and precache list are
      configured correctly (see `vite.config.ts`) and would work once the
      service worker can actually activate.

## 10. Finalization
- [x] Re-review every formula against `logic.cpp` line by line — see the
      per-line citations in `src/lib/calculator.ts` and `validation.ts`; no
      discrepancies found on this pass.
- [x] Re-review README accuracy — figures (e.g. average bank balance
      682,285.7142857143) cross-checked against the live app's rendered
      output.
- [x] Re-review GH Pages deployment readiness — relative base, relative
      manifest `start_url`/`scope`, relative SW registration/scope, all
      confirmed by inspecting the actual `dist/` output and by serving it
      from a `/Finance-Loopholes/` subpath locally.
- [x] Re-review mobile UI — see section 9; zero horizontal overflow at
      320/390/768px, no overlapping controls, charts and statement readable.
- [x] Re-review PWA install behavior — real `beforeinstallprompt` flow
      confirmed; service-worker activation caveat documented above.
- [x] Clean repository state — removed a redundant unused `public/logo.png`
      copy (was being double-precached alongside the hashed build asset);
      `dist/`, `node_modules/` ignored; no stray scratch files committed.
