"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface PhoneOnboardingProps {
  open: boolean;
  onComplete: (phone?: string) => void;
  onSkip: () => void;
}

export function PhoneOnboarding({ open, onComplete, onSkip }: PhoneOnboardingProps) {
  const [rawPhone, setRawPhone] = useState("");

  const formatDisplay = useCallback((value: string) => {
    const digits = value.replace(/\D/g, "").replace(/^234/, "").replace(/^0/, "");
    if (digits.length === 0) return "";
    return "+234 " + digits;
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const digits = val.replace(/\D/g, "").replace(/^234/, "").replace(/^0/, "");
    setRawPhone(digits);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = rawPhone.trim();
    if (trimmed.length >= 10) {
      const full = "+234" + trimmed;
      onComplete(full);
    } else {
      onComplete(undefined);
    }
  };

  if (!open) return null;

  const isValid = rawPhone.length >= 10;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onSkip}
        aria-hidden="true"
      />

      {/* Card */}
      <div
        className={cn(
          "relative w-full max-w-md rounded-2xl border border-white/10",
          "bg-[#12121f]/95 shadow-2xl",
          "animate-in fade-in zoom-in-95 duration-200"
        )}
      >
        {/* Close button */}
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors"
          aria-label="Skip"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#35D07F] animate-pulse" />
              <span className="text-[#35D07F] text-xs font-medium tracking-wide uppercase">
                New Account
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">
              Add your phone number
            </h2>
            <p className="text-white/50 text-sm">
              So we can text you when escrow payments arrive.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="phone"
                className="block text-xs font-medium text-white/60 mb-1.5"
              >
                Phone Number (optional)
              </label>
              <div className="relative">
                <input
                  id="phone"
                  type="tel"
                  value={rawPhone ? "+234 " + rawPhone : ""}
                  onChange={handleChange}
                  placeholder="e.g. +234 801 234 5678"
                  inputMode="tel"
                  autoComplete="tel"
                  className={cn(
                    "w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white",
                    "placeholder:text-white/20",
                    "focus:outline-none focus:ring-2 focus:ring-[#35D07F]/50 focus:border-[#35D07F]/40",
                    "transition-all duration-150",
                    isValid
                      ? "border-[#35D07F]/30"
                      : rawPhone.length > 0
                      ? "border-white/10"
                      : "border-white/10"
                  )}
                />
                {isValid && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#35D07F]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-xs text-white/30">
                Format: +234 801 234 5678. You can skip this and add it later in Account Settings.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onSkip}
                className={cn(
                  "flex-1 rounded-xl border border-white/10",
                  "bg-white/5 px-4 py-2.5 text-sm font-medium text-white/60",
                  "hover:bg-white/10 hover:text-white/80",
                  "transition-all duration-150"
                )}
              >
                Skip for now
              </button>
              <button
                type="submit"
                disabled={!isValid}
                className={cn(
                  "flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold",
                  "transition-all duration-150",
                  isValid
                    ? "bg-[#35D07F] text-black hover:bg-[#2db76c]"
                    : "bg-[#35D07F]/20 text-[#35D07F]/40 cursor-not-allowed"
                )}
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
