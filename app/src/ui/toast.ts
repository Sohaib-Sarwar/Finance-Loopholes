import { iconEl, type IconName } from "./icons";

let host: HTMLElement | null = null;

function getHost(): HTMLElement {
  if (host) return host;
  host = document.createElement("div");
  host.className = "toast-host";
  host.setAttribute("role", "status");
  host.setAttribute("aria-live", "polite");
  document.body.append(host);
  return host;
}

export function toast(message: string, iconName: IconName = "circleCheck"): void {
  const node = document.createElement("div");
  node.className = "toast";
  node.append(iconEl(iconName), document.createTextNode(message));
  getHost().append(node);

  setTimeout(() => {
    node.dataset.leaving = "true";
    node.addEventListener("animationend", () => node.remove(), { once: true });
    // Fallback for browsers that skip the animation (reduced motion).
    setTimeout(() => node.remove(), 400);
  }, 2200);
}
