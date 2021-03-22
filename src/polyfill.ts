import { AppHistory } from "./appHistory";

type UseBrowserPolyfillOptions = {
  configurable?: boolean;
};
export function useBrowserPolyfill(options?: UseBrowserPolyfillOptions) {
  if ("appHistory" in window) {
    return;
  }

  Object.defineProperty(window, "appHistory", {
    value: new AppHistory(),
    enumerable: true,
    configurable: options?.configurable ?? false,
  });

  window.addEventListener("click", windowClickHandler);
}

function windowClickHandler(evt: Event): void {
  if (evt.target && evt.target instanceof HTMLElement) {
    // on anchor/area clicks, fire 'appHistory.push()'
    const linkTag =
      evt.target.nodeName === "A" || evt.target.nodeName === "AREA"
        ? (evt.target as HTMLAreaElement | HTMLAnchorElement)
        : evt.target.closest("a") ?? evt.target.closest("area");
    if (linkTag) {
      evt.preventDefault();
      window.appHistory
        .push({
          url: linkTag.href,
          navigateInfo: { type: `${linkTag.nodeName.toLowerCase()}-click` },
        })
        .catch((err) => {
          setTimeout(() => {
            throw err;
          });
        });
    }
  }
}

declare global {
  interface Window {
    appHistory: AppHistory;
  }
}
