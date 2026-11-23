import * as React from "react";

function subscribe(callback: () => void): () => void {
  if (typeof document === "undefined") {
    return () => {};
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "attributes" && mutation.attributeName === "data-theme") {
        callback();
      }
    }
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  return () => {
    observer.disconnect();
  };
}

function getSnapshot(): boolean {
  if (typeof document === "undefined") {
    return false;
  }
  return document.documentElement.getAttribute("data-theme") === "high-contrast";
}

function getServerSnapshot(): boolean {
  return false;
}

export function useGlassFallback(explicitFallback?: boolean): boolean {
  const isHighContrast = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return Boolean(explicitFallback || isHighContrast);
}
