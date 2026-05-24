"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  walletAddress: string;
}

interface SessionCtx {
  session: UserSession | null;
  loading: boolean;
  signIn: (idToken: string) => Promise<boolean>;
  signOut: () => void;
}

const SessionContext = createContext<SessionCtx>({
  session: null,
  loading: false,
  signIn: async () => false,
  signOut: () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("njl_session");
      if (raw) setSession(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

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
      };
      setSession(user);
      localStorage.setItem("njl_session", JSON.stringify(user));
      return true;
    } catch { return false; }
    finally { setLoading(false); }
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
    localStorage.removeItem("njl_session");
  }, []);

  const ctx: SessionCtx = { session, loading, signIn, signOut };

  return (
    <SessionContext.Provider value={ctx}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
