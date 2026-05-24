"use client";

import { useState, useRef, useCallback } from "react";
import { useSession } from "@/components/session-provider";

export function GoogleSignInButton() {
  const { signIn, loading } = useSession();
  const [error, setError] = useState("");
  const btnRef = useRef<HTMLDivElement>(null);

  const handleCredentialResponse = useCallback(
    async (response: any) => {
      setError("");
      const ok = await signIn(response.credential);
      if (!ok) {
        setError("Sign in failed. Please try again.");
      }
    },
    [signIn]
  );

  const initGoogle = useCallback(() => {
    if (typeof window === "undefined" || !(window as any).google) return;
    const google = (window as any).google;
    if (btnRef.current && google.accounts?.id) {
      google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
        callback: handleCredentialResponse,
      });
      google.accounts.id.renderButton(btnRef.current, {
        theme: "filled_black",
        size: "large",
        width: 280,
        text: "signin_with",
        shape: "pill",
      });
    }
  }, [handleCredentialResponse]);

  // Load Google script if not present, then init
  useState(() => {
    if (typeof window === "undefined") return;
    if ((window as any).google) {
      initGoogle();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.body.appendChild(script);
  });

  return (
    <div className="flex flex-col items-center gap-2">
      {loading && (
        <div className="flex items-center gap-2 text-sm text-white/60">
          <div className="w-4 h-4 border-2 border-[#35D07F] border-t-transparent rounded-full animate-spin" />
          Signing in...
        </div>
      )}
      {!loading && <div ref={btnRef} />}
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
