



"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    kommunicate?: Record<string, unknown> & { _globals?: unknown };
  }
}

export default function KommunicateWidget() {
  useEffect(() => {
    const SCRIPT_ID = "kommunicate-widget-script";

    // Guard for safety (shouldn't run server-side anyway due to "use client")
    if (typeof window === "undefined" || typeof document === "undefined") return;

    // If already initialized and script exists, do nothing
    if (window.kommunicate && document.getElementById(SCRIPT_ID)) {
      return;
    }

    const kommunicateSettings = {
      appId: "36f36700de5e21413049a67c4d8e991c",
      popupWidget: true,
      automaticChatOpenOnNavigation: true,
    };

    // Ensure we append script only once
    let scriptEl = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement("script");
      scriptEl.id = SCRIPT_ID;
      scriptEl.type = "text/javascript";
      scriptEl.async = true;
      scriptEl.src = "https://widget.kommunicate.io/v2/kommunicate.app";
      document.head.appendChild(scriptEl);
    }

    // Initialize global object and settings
    window.kommunicate = window.kommunicate || {};
    window.kommunicate._globals = kommunicateSettings;

    // No hard cleanup so chat persists across admin pages.
    // In dev, React StrictMode mounts/unmounts twice; guards above prevent double-loads.
    return () => {
      // Optional: keep as no-op to avoid tearing down the active chat instance.
    };
  }, []);

  return null;
}
