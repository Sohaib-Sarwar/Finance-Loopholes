// Install experience.
//
// Everything here is driven by the browser's own install machinery: the
// `beforeinstallprompt` event decides whether anything is shown at all, and
// the install action calls the native `prompt()`. Nothing fakes an install
// dialog. iOS Safari never fires that event and has no programmatic install,
// so there it shows the real Add-to-Home-Screen steps instead of a button
// that could not work.

import { icon, iconEl } from "../ui/icons";
import { toast } from "../ui/toast";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const SNOOZE_KEY = "mfbank.installSnoozedUntil";
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
const AUTO_OPEN_DELAY_MS = 2600;

function isStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIosSafari(): boolean {
  const ua = window.navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes("Macintosh") && "ontouchend" in document);
  const webkit = /WebKit/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return iOS && webkit;
}

function isSnoozed(): boolean {
  try {
    const until = Number(localStorage.getItem(SNOOZE_KEY) ?? 0);
    return Number.isFinite(until) && Date.now() < until;
  } catch {
    return false;
  }
}

function snooze(): void {
  try {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
  } catch {
    /* non-fatal: the sheet simply may reappear next visit */
  }
}

interface SheetRefs {
  backdrop: HTMLElement;
  sheet: HTMLElement;
  body: HTMLElement;
  actions: HTMLElement;
  open: (open: boolean) => void;
}

function buildSheet(logoSrc: string): SheetRefs {
  const backdrop = document.createElement("div");
  backdrop.className = "backdrop";

  const sheet = document.createElement("aside");
  sheet.className = "sheet";
  sheet.setAttribute("role", "dialog");
  sheet.setAttribute("aria-modal", "false");
  sheet.setAttribute("aria-labelledby", "install-sheet-title");
  sheet.hidden = true;
  sheet.innerHTML = `
    <div class="sheet__grip"></div>
    <div class="sheet__head">
      <img class="sheet__icon" src="${logoSrc}" alt="" width="42" height="42" />
      <div>
        <div class="sheet__title" id="install-sheet-title">Install this calculator</div>
        <div class="sheet__sub">Works offline · no app store</div>
      </div>
    </div>
    <div class="sheet__body"></div>
    <div class="sheet__actions"></div>
  `;

  const open = (shouldOpen: boolean) => {
    if (shouldOpen) {
      sheet.hidden = false;
      // Next frame, so the transform transition actually runs.
      requestAnimationFrame(() => {
        sheet.dataset.open = "true";
        backdrop.dataset.open = "true";
      });
    } else {
      delete sheet.dataset.open;
      delete backdrop.dataset.open;
      setTimeout(() => {
        sheet.hidden = true;
      }, 280);
    }
  };

  backdrop.addEventListener("click", () => {
    snooze();
    open(false);
  });

  document.body.append(backdrop, sheet);

  return {
    backdrop,
    sheet,
    body: sheet.querySelector(".sheet__body")!,
    actions: sheet.querySelector(".sheet__actions")!,
    open,
  };
}

export function setupInstall(headerButton: HTMLButtonElement, logoSrc: string): void {
  headerButton.hidden = true;

  if (isStandalone()) return;

  let deferred: BeforeInstallPromptEvent | null = null;
  let refs: SheetRefs | null = null;

  const ensureSheet = () => (refs ??= buildSheet(logoSrc));

  const closeAndSnooze = () => {
    snooze();
    refs?.open(false);
  };

  const runInstall = async () => {
    if (!deferred) return;
    refs?.open(false);
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    deferred = null;
    headerButton.hidden = true;
    if (outcome === "dismissed") snooze();
  };

  const renderPromptSheet = () => {
    const sheet = ensureSheet();
    sheet.body.textContent =
      "Add it to your home screen for full-screen access and offline use — your inputs stay on your device.";
    sheet.actions.replaceChildren();

    const later = document.createElement("button");
    later.type = "button";
    later.className = "btn btn--outline";
    later.textContent = "Not now";
    later.addEventListener("click", closeAndSnooze);

    const install = document.createElement("button");
    install.type = "button";
    install.className = "btn btn--solid";
    install.append(iconEl("download"), document.createTextNode("Install"));
    install.addEventListener("click", runInstall);

    sheet.actions.append(later, install);
    sheet.open(true);
  };

  const renderIosSheet = () => {
    const sheet = ensureSheet();
    sheet.body.innerHTML = `
      Add it to your home screen for full-screen access and offline use.
      <ol class="sheet__steps">
        <li>${icon("share")}<span>Tap the <strong>Share</strong> button in Safari</span></li>
        <li>${icon("squarePlus")}<span>Choose <strong>Add to Home Screen</strong></span></li>
        <li>${icon("check")}<span>Tap <strong>Add</strong> to finish</span></li>
      </ol>
    `;
    sheet.actions.replaceChildren();

    const got = document.createElement("button");
    got.type = "button";
    got.className = "btn btn--solid btn--block";
    got.textContent = "Got it";
    got.addEventListener("click", closeAndSnooze);

    sheet.actions.append(got);
    sheet.open(true);
  };

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    headerButton.hidden = false;

    const isSmallScreen = window.matchMedia("(max-width: 899px)").matches;
    if (isSmallScreen && !isSnoozed()) {
      setTimeout(() => {
        if (deferred) renderPromptSheet();
      }, AUTO_OPEN_DELAY_MS);
    }
  });

  headerButton.addEventListener("click", () => {
    if (deferred) void runInstall();
  });

  window.addEventListener("appinstalled", () => {
    deferred = null;
    headerButton.hidden = true;
    refs?.open(false);
    toast("App installed", "circleCheck");
  });

  // iOS Safari: no beforeinstallprompt and no programmatic install exists, so
  // surface the real Add-to-Home-Screen steps rather than a dead button.
  if (isIosSafari() && !isSnoozed()) {
    setTimeout(renderIosSheet, AUTO_OPEN_DELAY_MS);
  }
}
