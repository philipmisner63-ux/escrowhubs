"use client";

import { use, useEffect, useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { createPublicClient, http, formatUnits } from "viem";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { AddressDisplay } from "@/components/ui/address-display";
import { useToast } from "@/components/toast";
import { baseMainnet, getRpcUrl, DEFAULT_CHAIN_ID } from "@/lib/chains";
import { SIMPLE_ESCROW_ABI } from "@/lib/contracts";
import { useSimpleEscrowWrite } from "@/lib/hooks/useSimpleEscrow";
import { Link } from "@/i18n/navigation";

type Address = `0x${string}`;

function isAddress(s: string): s is Address {
  return /^0x[0-9a-fA-F]{40}$/.test(s);
}

const rpcClient = createPublicClient({
  chain: baseMainnet,
  transport: http(getRpcUrl(DEFAULT_CHAIN_ID)),
});

const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS ?? "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913") as Address;
const USDC_DECIMALS = 6;

// State labels
const STATE_LABELS: Record<number, string> = {
  0: "Awaiting Deposit",
  1: "Funded",
  2: "Complete",
  3: "Disputed",
  4: "Refunded",
};

interface EscrowData {
  state: number;
  amount: bigint;
  depositor: Address;
  beneficiary: Address;
  arbiter: Address;
  tokenAddress: Address;
}

async function fetchEscrowData(address: Address): Promise<EscrowData> {
  const results = await rpcClient.multicall({
    contracts: [
      { address, abi: SIMPLE_ESCROW_ABI, functionName: "state" },
      { address, abi: SIMPLE_ESCROW_ABI, functionName: "amount" },
      { address, abi: SIMPLE_ESCROW_ABI, functionName: "depositor" },
      { address, abi: SIMPLE_ESCROW_ABI, functionName: "beneficiary" },
      { address, abi: SIMPLE_ESCROW_ABI, functionName: "arbiter" },
      { address, abi: SIMPLE_ESCROW_ABI, functionName: "token" },
    ],
    allowFailure: true,
  });

  return {
    state:       (results[0].result as number)  ?? 0,
    amount:      (results[1].result as bigint)  ?? 0n,
    depositor:   (results[2].result as Address) ?? "0x0",
    beneficiary: (results[3].result as Address) ?? "0x0",
    arbiter:     (results[4].result as Address) ?? "0x0",
    tokenAddress:(results[5].result as Address) ?? "0x0",
  };
}

export default function ClaimPage({ params }: { params: Promise<{ address: string }> }) {
  const { address: contractAddress } = use(params);
  const { address: wallet, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { addToast } = useToast();
  const writes = useSimpleEscrowWrite();

  const [escrow, setEscrow] = useState<EscrowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const validAddress = isAddress(contractAddress);

  useEffect(() => {
    if (!validAddress) {
      setError("Invalid escrow address.");
      setLoading(false);
      return;
    }

    fetchEscrowData(contractAddress as Address)
      .then(setEscrow)
      .catch(() => setError("Could not load escrow. Check the link and try again."))
      .finally(() => setLoading(false));
  }, [contractAddress, validAddress]);

  // Is this wallet the beneficiary?
  const isBeneficiary = wallet && escrow &&
    escrow.beneficiary.toLowerCase() === wallet.toLowerCase();

  // Is beneficiary unset (open claim)?
  const isOpenClaim = escrow &&
    escrow.beneficiary === "0x0000000000000000000000000000000000000000";

  const isUSDC = escrow?.tokenAddress.toLowerCase() === USDC_ADDRESS.toLowerCase();
  const formattedAmount = escrow
    ? isUSDC
      ? `${formatUnits(escrow.amount, USDC_DECIMALS)} USDC`
      : `${formatUnits(escrow.amount, 18)} ETH`
    : null;

  const stateLabel = escrow ? (STATE_LABELS[escrow.state] ?? "Unknown") : null;
  const isFunded = escrow?.state === 1;

  async function handleClaim() {
    if (!escrow || !validAddress) return;
    setClaiming(true);
    try {
      // Beneficiary confirms delivery → releases funds to themselves
      await writes.release(contractAddress as Address);
      setClaimed(true);
      addToast({ type: "success", message: "Funds released! Check your wallet." });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Transaction failed";
      addToast({ type: "error", message: msg });
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080b14] text-white flex flex-col">
      <Nav />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-12">

        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-block px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium mb-4">
            Escrow Claim
          </span>
          <h1 className="text-3xl font-bold mb-3">You've Been Sent Funds</h1>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            A buyer has secured payment in escrow for you. Connect your wallet to claim it once you've delivered the item.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <GlassCard className="p-8 text-center">
            <div className="text-slate-400 text-sm animate-pulse">Loading escrow details...</div>
          </GlassCard>
        )}

        {/* Error */}
        {error && (
          <GlassCard className="p-8 text-center space-y-4">
            <div className="text-4xl">⚠️</div>
            <p className="text-red-400 text-sm">{error}</p>
            <Link href="/marketplace" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              ← Back to Marketplace
            </Link>
          </GlassCard>
        )}

        {/* Escrow details */}
        {escrow && !loading && !error && (
          <div className="space-y-4">
            <GlassCard className="p-6 space-y-5">

              {/* Amount */}
              <div className="text-center py-4">
                <p className="text-xs text-slate-400 mb-1">Amount in Escrow</p>
                <p className="text-4xl font-bold text-cyan-400">{formattedAmount}</p>
              </div>

              <div className="border-t border-white/10" />

              {/* Status */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Status</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  isFunded ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                  escrow.state === 2 ? "bg-slate-500/10 text-slate-400 border border-slate-500/20" :
                  "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                }`}>
                  {stateLabel}
                </span>
              </div>

              {/* Buyer */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Buyer</span>
                <AddressDisplay address={escrow.depositor} />
              </div>

              {/* Escrow contract */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Escrow contract</span>
                <AddressDisplay address={contractAddress as Address} />
              </div>

              {/* Beneficiary */}
              {!isOpenClaim && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Designated seller</span>
                  <AddressDisplay address={escrow.beneficiary} />
                </div>
              )}

              <div className="border-t border-white/10" />

              {/* Claimed state */}
              {claimed || escrow.state === 2 ? (
                <div className="text-center space-y-2 py-2">
                  <div className="text-3xl">✅</div>
                  <p className="text-green-400 text-sm font-medium">Funds have been released</p>
                  <p className="text-slate-500 text-xs">Check your wallet for the USDC.</p>
                </div>
              ) : !isFunded ? (
                <div className="text-center py-2">
                  <p className="text-slate-400 text-sm">
                    {escrow.state === 0
                      ? "This escrow hasn't been funded yet. The buyer still needs to complete payment."
                      : "This escrow is no longer claimable."}
                  </p>
                </div>
              ) : !isConnected ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400 text-center">Connect your wallet to claim</p>
                  <div className="grid gap-2">
                    {connectors.slice(0, 3).map((connector) => (
                      <button
                        key={connector.id}
                        onClick={() => connect({ connector })}
                        className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-sm text-white hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all"
                      >
                        Connect {connector.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : isOpenClaim ? (
                <div className="space-y-3">
                  <div className="px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs">
                    ⚠️ This escrow has no designated seller. Contact the buyer to add your wallet address before claiming.
                  </div>
                  <p className="text-xs text-slate-500 text-center">
                    Connected as <span className="font-mono text-slate-400">{wallet?.slice(0,6)}...{wallet?.slice(-4)}</span>
                  </p>
                </div>
              ) : !isBeneficiary ? (
                <div className="space-y-3">
                  <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    ⚠️ Your connected wallet is not the designated seller for this escrow.
                  </div>
                  <p className="text-xs text-slate-500 text-center">
                    Connected: <span className="font-mono">{wallet?.slice(0,6)}...{wallet?.slice(-4)}</span>
                    <br />Expected: <span className="font-mono">{escrow.beneficiary.slice(0,6)}...{escrow.beneficiary.slice(-4)}</span>
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs">
                    ✅ Wallet verified — you are the designated seller
                  </div>
                  <GlowButton
                    onClick={handleClaim}
                    disabled={claiming}
                    className="w-full"
                  >
                    {claiming ? "Releasing funds..." : `Claim ${formattedAmount} →`}
                  </GlowButton>
                  <p className="text-xs text-slate-600 text-center">
                    Only click when you have delivered the item. This action cannot be undone.
                  </p>
                </div>
              )}
            </GlassCard>

            {/* Help block */}
            <GlassCard className="p-5 space-y-3">
              <p className="text-xs font-medium text-white">How this works</p>
              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex gap-2"><span>1.</span><span>Buyer paid — funds are locked in the escrow contract above</span></div>
                <div className="flex gap-2"><span>2.</span><span>Deliver the item to the buyer</span></div>
                <div className="flex gap-2"><span>3.</span><span>Once buyer confirms receipt, or you release from your end, funds hit your wallet</span></div>
                <div className="flex gap-2"><span>4.</span><span>No crypto? You can convert USDC to cash via Coinbase or a local exchange</span></div>
              </div>
            </GlassCard>

            {/* View full escrow */}
            <div className="text-center">
              <Link
                href={`/escrow/${contractAddress}`}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                View full escrow details →
              </Link>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
