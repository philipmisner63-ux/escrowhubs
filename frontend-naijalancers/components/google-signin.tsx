"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSession } from "@/components/session-provider";

const GOOGLE_CLIENT_ID = "463356892336-mp5efmsbd323p84bqe25uojqmsocmjef.apps.googleusercontent.com";

export function GoogleSignInButton() {
  const { signIn, loading } = useSession();
  const [error, setError] = useState("");
  const [scriptReady, setScriptReady] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);

  const handleCredentialResponse = useCallback(
    async (response: any) => {
      if (!response?.credential) return;
      setError("");
      const ok = await signIn(response.credential);
      if (!ok) setError("Sign in failed. Please try again.");
    },
    [signIn]
  );

  // Load Google GSI script
  useEffect(() => {
    if ((window as any).google?.accounts?.id) {
      setScriptReady(true);
      return;
    }

    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener("load", () => setScriptReady(true));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptReady(true);
    script.onerror = () => setError("Failed to load Google sign-in. Please refresh.");
    document.head.appendChild(script);
  }, []);

  // Initialize + render button once script is ready
  useEffect(() => {
    if (!scriptReady || !buttonRef.current || renderedRef.current) return;

    const google = (window as any).google;
    if (!google?.accounts?.id) return;

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: false,
    });

    google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "rectangular",
      logo_alignment: "left",
    });

    renderedRef.current = true;
  }, [scriptReady, handleCredentialResponse]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-white/60">
        <div className="w-4 h-4 border-2 border-[#35D07F] border-t-transparent rounded-full animate-spin" />
        Signing in...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={buttonRef} />
      {!scriptReady && (
        <div className="text-xs text-white/40">Loading sign-in...</div>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
