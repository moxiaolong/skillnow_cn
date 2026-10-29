type PostHogLike = {
  capture: (event: string, properties?: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    __skillnow_posthog?: PostHogLike;
  }
}

export function track(
  event: string,
  properties?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  window.__skillnow_posthog?.capture(event, properties);
}
