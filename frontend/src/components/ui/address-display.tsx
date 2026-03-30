"use client";

import { useState } from "react";

interface AddressDisplayProps {
  address: string;
  label?: string;
  className?: string;
}

export function AddressDisplay({ address, label, className }: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);

  const short = address.length >= 10
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : address;

  async function copy() {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={className}>
      {label && (
        <p className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-1">{label}</p>
      )}
      <div className="inline-flex items-center gap-2">
        <span style={{ fontFamily: "var(--font-mono, monospace)" }} className="text-sm text-slate-300">
          {short}
        </span>
        <button
          onClick={copy}
          className="relative text-slate-600 hover:text-cyan-400 transition-colors"
          title="Copy address"
          type="button"
        >
          {copied ? (
            <span className="text-xs text-cyan-400">Copied!</span>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
