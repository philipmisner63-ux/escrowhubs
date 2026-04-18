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

function buildUserInfo(info: Record<string, unknown>): Web3AuthUser {
  const verifierId = info.verifierId as string | undefined;
  const isPhone = !!(
    info.typeOfLogin === "sms" ||
    info.typeOfLogin === "sms_passwordless" ||
    (verifierId && /^[+\d]/.test(verifierId) && !verifierId.includes("@"))
  );
  return {
    email: info.email as string | undefined,
    phone: isPhone ? verifierId : undefined,
    name: info.name as string | undefined,
    profileImage: info.profileImage as string | undefined,
  };
}

export function PrivyWalletProvider({ children }: { children: React.ReactNode }) {
  const w3aRef = useRef<Web3Auth | null>(null);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<Web3AuthUser | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletProvider, setWalletProvider] = useState<IProvider | null>(null);

  // Single source of truth: getUserInfo() success = authenticated.
  // Never trust w3a.connected or w3a.status — they are unreliable on mobile.
  const applySession = useCallback(async (w3a: Web3Auth): Promise<boolean> => {
    try {
      const info = await w3a.getUserInfo() as Record<string, unknown>;
      if (!info || (!info.email && !info.verifierId)) return false;

      const userInfo = buildUserInfo(info);
      setAuthenticated(true);
      setUser(userInfo);
      try { localStorage.setItem("w3a_user_cache", JSON.stringify(userInfo)); } catch (_) {}

      if (w3a.provider) {
        setWalletProvider(w3a.provider);
        try {
          const accounts = await w3a.provider.request({ method: "eth_accounts" }) as string[];
          setWalletAddress(accounts?.[0] ?? null);
        } catch (_) {}
      }
      return true;
    } catch (_) {
      return false;
    }
  }, []);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;

    const init = async () => {
      await new Promise(r => setTimeout(r, 100));
      try {
        const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID;
        if (!clientId) { setReady(true); return; }

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
          chains: [{
            chainNamespace: CHAIN_NAMESPACES.EIP155,
            chainId: "0x2105",
            rpcTarget: "https://mainnet.base.org",
            displayName: "Base Mainnet",
            ticker: "ETH",
            tickerName: "Ethereum",
          }],
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

        // Try to restore existing session via getUserInfo
        const restored = await applySession(w3a);

        // If getUserInfo failed but we have a cache, use it
        if (!restored) {
          try {
            const cached = localStorage.getItem("w3a_user_cache");
            if (cached && w3a.provider) {
              setUser(JSON.parse(cached));
              setAuthenticated(true);
              setWalletProvider(w3a.provider);
              try {
                const accounts = await w3a.provider.request({ method: "eth_accounts" }) as string[];
                setWalletAddress(accounts?.[0] ?? null);
              } catch (_) {}
            }
          } catch (_) {}
        }
      } catch (e) {
        console.error("Web3Auth init error:", e);
      } finally {
        setReady(true);
      }
    };

    init();
  }, [mounted, applySession]);

  const login = useCallback(async () => {
    const w3a = w3aRef.current;
    if (!w3a) return;

    try {
      await w3a.connect();

      // getUserInfo() is the only reliable signal on mobile.
      // Retry for up to 10 seconds after connect() resolves.
      let success = false;
      for (let i = 0; i < 25 && !success; i++) {
        await new Promise(r => setTimeout(r, 400));
        success = await applySession(w3a);
      }

      if (!success) {
        // Last resort: use cache if available
        try {
          const cached = localStorage.getItem("w3a_user_cache");
          if (cached) {
            setAuthenticated(true);
            setUser(JSON.parse(cached));
            if (w3a.provider) setWalletProvider(w3a.provider);
          }
        } catch (_) {}
      }

      setReady(true);

      // Clean up any lingering modal overlays
      document.querySelectorAll("w3a-modal, #w3a-modal, [id^=w3a], [class^=w3a]").forEach(el => {
        (el as HTMLElement).style.display = "none";
        (el as HTMLElement).style.pointerEvents = "none";
      });
    } catch (e) {
      console.error("Web3Auth connect error:", e);
    }
  }, [applySession]);

  const logout = useCallback(async () => {
    const w3a = w3aRef.current;
    if (w3a) {
      try { await w3a.logout(); } catch (_) {}
    }
    setAuthenticated(false);
    setUser(null);
    setWalletAddress(null);
    setWalletProvider(null);
    try { localStorage.removeItem("w3a_user_cache"); } catch (_) {}
  }, []);

  if (!mounted) return <>{children}</>;

  return (
    <Web3AuthContext.Provider value={{ ready, authenticated, user, walletAddress, walletProvider, login, logout }}>
      {children}
    </Web3AuthContext.Provider>
  );
}
