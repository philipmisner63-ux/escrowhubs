"use client";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  isNaijaLancersMode,
  sendReady,
  charge,
  getBalance,
  payout,
  verifyPin,
  onIdentify,
  type NaijaLancersUser,
  type NaijaLancersChargeResult,
  type NaijaLancersBalanceResult,
  type NaijaLancersPayoutResult,
  type NaijaLancersPinResult,
} from "@/lib/naijalancers-sdk";

interface UseNaijaLancersReturn {
  isMode: boolean;
  isReady: boolean;
  user: NaijaLancersUser | null;
  ncBalance: string;
  loadingBalance: boolean;
  chargeUser: (opts: {
    amount: number;
    description: string;
    to?: string;
    currency?: "NC" | "USDT";
  }) => Promise<NaijaLancersChargeResult>;
  refreshBalance: () => Promise<void>;
  getSellerWallet: (opts: {
    amount: number;
    description: string;
  }) => Promise<NaijaLancersPayoutResult>;
  verifyUserPin: (reason: string) => Promise<NaijaLancersPinResult>;
  error: string;
  retry: () => void;
}

export function useNaijaLancers(): UseNaijaLancersReturn {
  const isMode = useMemo(() => isNaijaLancersMode(), []);

  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<NaijaLancersUser | null>(null);
  const [ncBalance, setNcBalance] = useState("0");
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [error, setError] = useState("");
  const [handshakeAttempt, setHandshakeAttempt] = useState(0);

  const balanceAbortRef = useRef<AbortController | null>(null);

  // Handshake: signal ready + listen for identity
  useEffect(() => {
    if (!isMode) return;

    setError("");
    sendReady();

    let gotIdentity = false;
    const unsub = onIdentify((u) => {
      gotIdentity = true;
      setUser(u);
      setIsReady(true);
    });

    // Soft timeout: assume ready after 3s so UI doesn't block forever
    const softTimeout = setTimeout(() => {
      if (!gotIdentity) setIsReady(true);
    }, 3000);

    // Hard timeout: if still no identity after 8s, something is wrong
    const hardTimeout = setTimeout(() => {
      if (!gotIdentity) {
        setError("Unable to connect to NaijaLancers. Please check your connection and retry.");
      }
    }, 8000);

    return () => {
      unsub();
      clearTimeout(softTimeout);
      clearTimeout(hardTimeout);
    };
  }, [isMode, handshakeAttempt]);

  // Auto-fetch NC balance once ready
  useEffect(() => {
    if (!isMode || !isReady) return;
    refreshBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMode, isReady]);

  const refreshBalance = useCallback(async () => {
    if (!isMode) return;
    setLoadingBalance(true);
    setError("");
    try {
      const result = await getBalance({ currency: "NC" });
      setNcBalance(result.balance ?? "0");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || "Failed to load NC balance.");
    } finally {
      setLoadingBalance(false);
    }
  }, [isMode]);

  const chargeUser = useCallback(
    async (opts: {
      amount: number;
      description: string;
      to?: string;
      currency?: "NC" | "USDT";
    }) => {
      if (!isMode) throw new Error("Not in NaijaLancers mode");
      setError("");
      const result = await charge({
        amount: opts.amount,
        description: opts.description,
        currency: opts.currency ?? "USDT",
        to: opts.to,
        chargeType: "purchase",
      });
      if (!result.success) {
        throw new Error(result.error ?? "Charge failed");
      }
      return result;
    },
    [isMode]
  );

  const getSellerWallet = useCallback(
    async (opts: { amount: number; description: string }) => {
      if (!isMode) throw new Error("Not in NaijaLancers mode");
      setError("");
      const result = await payout({
        amount: opts.amount,
        description: opts.description,
        currency: "USDT",
      });
      if (!result.success) {
        throw new Error(result.error ?? "Payout probe failed");
      }
      return result;
    },
    [isMode]
  );

  const verifyUserPin = useCallback(
    async (reason: string) => {
      if (!isMode) throw new Error("Not in NaijaLancers mode");
      setError("");
      return verifyPin({ reason });
    },
    [isMode]
  );

  const retry = useCallback(() => {
    setError("");
    setIsReady(false);
    setUser(null);
    setNcBalance("0");
    setHandshakeAttempt((n) => n + 1);
  }, []);

  return {
    isMode,
    isReady,
    user,
    ncBalance,
    loadingBalance,
    chargeUser,
    refreshBalance,
    getSellerWallet,
    verifyUserPin,
    error,
    retry,
  };
}
