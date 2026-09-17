import { iconEl } from "./icons";

export type ThemeChoice = "light" | "dark" | "system";

const STORAGE_KEY = "mfbank.theme";
const ORDER: ThemeChoice[] = ["system", "light", "dark"];

const LABEL: Record<ThemeChoice, string> = {
  system: "System theme",
  light: "Light theme",
  dark: "Dark theme",
};

const ICON = { system: "monitor", light: "sun", dark: "moon" } as const;

function read(): ThemeChoice {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    /* private mode / blocked storage — fall through to the default */
  }
  return "system";
}

function persist(choice: ThemeChoice): void {
  try {
    localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    /* non-fatal: the theme still applies for this session */
  }
}

function resolved(choice: ThemeChoice): "light" | "dark" {
  if (choice !== "system") return choice;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function apply(choice: ThemeChoice): void {
  const root = document.documentElement;
  if (choice === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", choice);
  }
  // Keep the browser UI (address bar / status bar) in step with the app.
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) {
    meta.content = resolved(choice) === "dark" ? "#0d0d0d" : "#ffffff";
  }
}

export interface ThemeController {
  current: () => ThemeChoice;
  resolved: () => "light" | "dark";
  onChange: (listener: (mode: "light" | "dark") => void) => void;
}

export function setupTheme(button: HTMLButtonElement): ThemeController {
  let choice = read();
  const listeners: ((mode: "light" | "dark") => void)[] = [];

  const render = () => {
    apply(choice);
    button.replaceChildren(iconEl(ICON[choice]));
    button.setAttribute("aria-label", `${LABEL[choice]} — click to change`);
    button.setAttribute("title", LABEL[choice]);
    const mode = resolved(choice);
    listeners.forEach((fn) => fn(mode));
  };

  button.addEventListener("click", () => {
    choice = ORDER[(ORDER.indexOf(choice) + 1) % ORDER.length];
    persist(choice);
    render();
  });

  window
    .matchMedia?.("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      if (choice === "system") render();
    });

  render();

  return {
    current: () => choice,
    resolved: () => resolved(choice),
    onChange: (listener) => listeners.push(listener),
  };
}
