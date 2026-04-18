// 🚫 DO NOT MODIFY THIS FILE without Philip approval
// Web3Auth must remain isolated to marketplace-only routes.
"use client";

import { useState, useEffect, createContext, useContext, useCallback, useRef } from "react";
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import type { IProvider } from "@web3auth/base";

interface Web3AuthUser {
  email?: string;
  phone?: string;
  name?: string;
  profileImage?: string;
}

interface Web3AuthContextType {
  ready: boolean;
  authenticated: boolean;
  user: Web3AuthUser | null;
  walletAddress: string | null;
  /** Raw EIP-1193 provider — use for direct viem calls instead of wagmi */
  walletProvider: IProvider | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const Web3AuthContext = createContext<Web3AuthContextType>({
  ready: false,
  authenticated: false,
  user: null,
  walletAddress: null,
  walletProvider: null,
  login: async () => {},
  logout: async () => {},
});

export function usePrivy() {
  return useContext(Web3AuthContext);
}

export function PrivyWalletProvider({ children }: { children: React.ReactNode }) {
  const w3aRef = useRef<Web3Auth | null>(null);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<Web3AuthUser | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletProvider, setWalletProvider] = useState<IProvider | null>(null);

  const refreshState = useCallback(async (w3a: Web3Auth) => {
    try {
      if (w3a.connected || w3a.status === "connected" || w3a.status === "ready") {
        let info: Record<string, unknown> = {};
        try { 
          info = await w3a.getUserInfo() as Record<string, unknown>;
        } catch (e) { 
          console.warn("getUserInfo failed:", e);
          // Session restored from cache but getUserInfo unavailable — still mark authenticated
          setAuthenticated(true);
          if (w3a.provider) setWalletProvider(w3a.provider);
          return;
        }
        console.log("Web3Auth user info:", info);
        setAuthenticated(true);
        setUser({
          email: info.email as string | undefined,
          phone: info.typeOfLogin === "sms" ? info.verifierId as string : undefined,
          name: info.name as string | undefined,
          profileImage: info.profileImage as string | undefined,
        });
        try {
          const provider = w3a.provider;
          if (provider) {
            setWalletProvider(provider);
            const accounts = await provider.request({ method: "eth_accounts" }) as string[];
            console.log("Web3Auth wallet:", accounts?.[0]);
            setWalletAddress(accounts?.[0] ?? null);
          }
        } catch (e) { console.warn("eth_accounts failed:", e); }
      } else {
        setAuthenticated(false);
        setUser(null);
        setWalletAddress(null);
        setWalletProvider(null);
      }
    } catch (e) {
      console.error("Web3Auth refreshState error:", e);
      // Fail open — still mark as authenticated if connected
      if (w3a.connected) {
        setAuthenticated(true);
        if (w3a.provider) setWalletProvider(w3a.provider);
      }
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const init = async () => {
      await new Promise(r => setTimeout(r, 100));
      try {
        const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID;
        if (!clientId) {
          console.error("Web3Auth: missing NEXT_PUBLIC_WEB3AUTH_CLIENT_ID");
          setReady(true);
          return;
        }

        const w3a = new Web3Auth({
          clientId,
          web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
          chainConfig: {
            chainNamespace: CHAIN_NAMESPACES.EIP155,
            chainId: "0x2105",
            rpcTarget: "https://mainnet.base.org",
            displayName: "Base Mainnet",
            ticker: "ETH",
            tickerName: "Ethereum",
          },

          // Explicitly restrict to Base mainnet only — prevents BlockDAG chain ID conflict
          chains: [
            {
              chainNamespace: CHAIN_NAMESPACES.EIP155,
              chainId: "0x2105",
              rpcTarget: "https://mainnet.base.org",
              displayName: "Base Mainnet",
              ticker: "ETH",
              tickerName: "Ethereum",
            }
          ],
          defaultChain: {
            chainNamespace: CHAIN_NAMESPACES.EIP155,
            chainId: "0x2105",
            rpcTarget: "https://mainnet.base.org",
            displayName: "Base Mainnet",
            ticker: "ETH",
            tickerName: "Ethereum",
          },
        });

        await w3a.init();
        w3aRef.current = w3a;
        await refreshState(w3a);
      } catch (e) {
        console.error("Web3Auth init error:", e);
      } finally {
        setReady(true);
      }
    };

    init();
  }, [mounted, refreshState]);

  const login = useCallback(async () => {
    const w3a = w3aRef.current;
    if (!w3a) {
      console.error("Web3Auth not initialized");
      return;
    }
    try {
      await w3a.connect();
      // Small delay to let Web3Auth finalize connection state
      await new Promise(r => setTimeout(r, 500));
      console.log("Web3Auth status after connect:", w3a.status, "connected:", w3a.connected);
      await refreshState(w3a);
      // Remove any lingering Web3Auth modal overlays that block page interaction
      document.querySelectorAll("w3a-modal, #w3a-modal, [id^=w3a], [class^=w3a]").forEach(el => {
        (el as HTMLElement).style.display = "none";
        (el as HTMLElement).style.pointerEvents = "none";
      });
    } catch (e) {
      console.error("Web3Auth connect error:", e);
    }
  }, [refreshState]);

  const logout = useCallback(async () => {
    const w3a = w3aRef.current;
    if (!w3a) return;
    try {
      await w3a.logout();
    } catch (e) {
      console.error("Web3Auth logout error:", e);
    }
    setAuthenticated(false);
    setUser(null);
    setWalletAddress(null);
    setWalletProvider(null);
  }, []);

  if (!mounted) return <>{children}</>;

  return (
    <Web3AuthContext.Provider value={{ ready, authenticated, user, walletAddress, walletProvider, login, logout }}>
      {children}
    </Web3AuthContext.Provider>
  );
}
