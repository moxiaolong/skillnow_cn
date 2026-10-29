"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function PostHogProvider() {
  const pathname = usePathname();

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    let cancelled = false;

    import("posthog-js")
      .then(({ default: posthog }) => {
        if (cancelled) return;
        if (!window.__skillnow_posthog) {
          posthog.init(key, {
            api_host:
              process.env.NEXT_PUBLIC_POSTHOG_HOST ||
              "https://us.i.posthog.com",
            persistence: "localStorage",
            disable_session_recording: true,
            autocapture: false,
            capture_pageview: false,
            person_profiles: "identified_only",
          });
          window.__skillnow_posthog = posthog;
        }
        window.__skillnow_posthog?.capture("$pageview", {
          $current_url: window.location.href,
        });
      })
      .catch(() => {
        // Analytics is optional; never block the page on it.
      });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
