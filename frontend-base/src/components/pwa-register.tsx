"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("[PWA] Service worker registered"))
        .catch((e) => console.warn("[PWA] SW registration failed:", e));
    }
  }, []);

  return null;
}
