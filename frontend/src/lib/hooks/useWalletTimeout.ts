"use client";

import { useEffect, useRef, useCallback } from "react";

const TIMEOUT_MS = 5 * 60 * 1_000; // 5 minutes

interface UseWalletTimeoutOptions {
  isConnected: boolean;
  disconnect: () => void;
  addToast?: (opts: { type: string; message: string }) => void;
}

/**
 * Auto-disconnects the wallet after TIMEOUT_MS of inactivity.
 * Resets on: clicks, keydown, scroll, pathname changes, and contract writes.
 * Also disconnects on tab close (beforeunload).
 */
export function useWalletTimeout({ isConnected, disconnect, addToast }: UseWalletTimeoutOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isConnectedRef = useRef(isConnected);

  // Keep ref in sync so event listeners always see current value
  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    clearTimer();
    disconnect();
    addToast?.({ type: "error", message: "Wallet disconnected due to inactivity." });
  }, [disconnect, addToast, clearTimer]);

  const resetTimer = useCallback(() => {
    if (!isConnectedRef.current) return;
    clearTimer();
    timerRef.current = setTimeout(handleDisconnect, TIMEOUT_MS);
  }, [clearTimer, handleDisconnect]);

  useEffect(() => {
    if (!isConnected) {
      // Wallet disconnected externally — just clean up
      clearTimer();
      return;
    }

    // Start timer on connect
    resetTimer();

    // Reset on user activity
    const activityEvents = ["click", "keydown", "scroll", "touchstart"] as const;
    activityEvents.forEach(ev => window.addEventListener(ev, resetTimer, { passive: true }));

    // Disconnect on tab close
    function onBeforeUnload() {
      if (isConnectedRef.current) {
        disconnect();
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      clearTimer();
      activityEvents.forEach(ev => window.removeEventListener(ev, resetTimer));
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [isConnected, resetTimer, clearTimer, disconnect]);
}
