"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  walletAddress: string;
  phone?: string;
  isNewUser?: boolean;
}

interface SessionCtx {
  session: UserSession | null;
  loading: boolean;
  needsOnboarding: boolean;
  setPhone: (phone: string) => void;
  signIn: (idToken: string) => Promise<boolean>;
  signOut: () => void;
}

const SessionContext = createContext<SessionCtx>({
  session: null,
  loading: false,
  needsOnboarding: false,
  setPhone: () => {},
  signIn: async () => false,
  signOut: () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("njl_session");
      if (raw) {
        const parsed: UserSession = JSON.parse(raw);
        setSession(parsed);
        // Only prompt new users (isNewUser was set during signIn)
        if (parsed.isNewUser && !parsed.phone) setNeedsOnboarding(true);
      }
    } catch { /* ignore */ }
  }, []);

  const setPhone = useCallback(async (phone: string) => {
    if (!session) return;

    // Empty string = user skipped, just clear the flag so they are not re-prompted
    if (!phone) {
      const updated = { ...session, isNewUser: false };
      setSession(updated);
      localStorage.setItem("njl_session", JSON.stringify(updated));
      setNeedsOnboarding(false);
      return;
    }

    // Non-empty phone = save to backend
    try {
      const res = await fetch("/api/wallet/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.email, user_id: session.userId, phone }),
      });
      if (res.ok) {
        const updated = { ...session, phone, isNewUser: false };
        setSession(updated);
        localStorage.setItem("njl_session", JSON.stringify(updated));
        setNeedsOnboarding(false);
      }
    } catch (err) {
      console.error("[SessionProvider] Failed to save phone:", err);
    }
  }, [session]);

  const signIn = useCallback(async (idToken: string) => {
    setLoading(true);
    try {
      const authRes = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!authRes.ok) return false;
      const auth = await authRes.json();
      if (!auth.userId) return false;

      const walletRes = await fetch("/api/wallet/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: auth.email, user_id: auth.userId }),
      });
      if (!walletRes.ok) return false;
      const wallet = await walletRes.json();
      if (!wallet.address) return false;

      const user: UserSession = {
        userId: auth.userId,
        email: auth.email,
        name: auth.name || "",
        walletAddress: wallet.address,
        isNewUser: auth.isNewUser,
      };
      setSession(user);
      localStorage.setItem("njl_session", JSON.stringify(user));
      if (auth.isNewUser) setNeedsOnboarding(true);
      return true;
    } catch { return false; }
    finally { setLoading(false); }
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
    localStorage.removeItem("njl_session");
  }, []);

  const ctx: SessionCtx = { session, loading, needsOnboarding, setPhone, signIn, signOut };

  return (
    <SessionContext.Provider value={ctx}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
