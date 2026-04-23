"use client";

import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { SUPPORTED_CHAINS, isChainSupported } from "@/lib/chains";
import { STRINGS } from "@/lib/strings";

interface ChainGuardProps {
  children: React.ReactNode;
}

/**
 * ChainGuard — wraps page content and shows a manual chain-switch prompt
 * when the connected wallet is on an unsupported network.
 *
 * Does NOT auto-switch. Does NOT block the navbar.
 * Pass-through (renders children) when the user is on a supported chain
 * or when no wallet is connected.
 */
export function ChainGuard({ children }: ChainGuardProps) {
  const { isConnected, isReconnecting } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  // Pass-through: wagmi still hydrating, not connected, or already on a supported chain
  if (isReconnecting || !isConnected || isChainSupported(chainId)) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Unsupported-chain banner — sits above content, below nav */}
      <div className="w-full border-b border-red-500/30 bg-red-500/5 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Icon + message */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className="text-red-400 text-xl mt-0.5 shrink-0">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-red-300">
                Unsupported network
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {STRINGS.chainHelper.choose}
              </p>
            </div>
          </div>

          {/* Chain switch buttons */}
          <div className="flex flex-wrap gap-2 shrink-0">
            {SUPPORTED_CHAINS.map(chain => (
              <button
                key={chain.id}
                onClick={() => switchChain?.({ chainId: chain.id })}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                  bg-cyan-400/10 text-cyan-300 border border-cyan-400/30
                  hover:bg-cyan-400/20 hover:border-cyan-400/50 hover:text-cyan-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-150"
              >
                {isPending ? (
                  <span className="inline-block w-3 h-3 border border-cyan-400/50 border-t-cyan-400 rounded-full animate-spin" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                )}
                Switch to {chain.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content rendered underneath (dimmed) */}
      <div className="pointer-events-none opacity-40 select-none" aria-hidden="true">
        {children}
      </div>
    </>
  );
}
