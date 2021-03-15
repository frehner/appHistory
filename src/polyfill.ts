import { AppHistory } from "./appHistory";

type UseBrowserPolyfillOptions = {
  configurable?: boolean;
};
export function useBrowserPolyfill({
  configurable = false,
}: UseBrowserPolyfillOptions) {
  if ("appHistory" in window) {
    return;
  }

  Object.defineProperty(window, "appHistory", {
    value: new AppHistory(),
    enumerable: true,
    configurable,
  });

  window.addEventListener("click", (evt) => {
    if (evt.target && evt.target instanceof HTMLElement) {
      // on anchor/area clicks, fire 'appHistory.push()'
      const linkTag =
        evt.target.nodeName === "A" || evt.target.nodeName === "AREA"
          ? (evt.target as HTMLAreaElement | HTMLAnchorElement)
          : evt.target.closest("a") ?? evt.target.closest("area");
      if (linkTag) {
        window.appHistory.push(linkTag.href);
      }
    }
  });
}

declare global {
  interface Window {
    appHistory: AppHistory;
  }
}
