// Real browser install prompt only -- no fake "install" modal. The button
// stays hidden until the browser actually fires `beforeinstallprompt`
// (Chromium-based browsers) or the app is not already running standalone.

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function setupInstallPrompt(button: HTMLButtonElement): void {
  let deferredPrompt: BeforeInstallPromptEvent | null = null;

  const isStandalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  if (isStandalone) {
    button.hidden = true;
    return;
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    button.hidden = false;
  });

  button.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    button.disabled = true;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    button.hidden = true;
    button.disabled = false;
  });

  window.addEventListener("appinstalled", () => {
    button.hidden = true;
    deferredPrompt = null;
  });
}
