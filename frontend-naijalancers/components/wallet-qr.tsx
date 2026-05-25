"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, ExternalLink, ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { useToast } from "@/components/toast";

interface WalletQRProps {
  address: string;
  balanceUsdt: string;
  balanceCelo: string;
  onRefresh?: () => void;
  isExternal?: boolean;
}

export function WalletQR({ address, balanceUsdt, balanceCelo, onRefresh, isExternal = false }: WalletQRProps) {
  const [activeTab, setActiveTab] = useState<"receive" | "fund" | "withdraw">("receive");
  const [copied, setCopied] = useState(false);
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const { showToast } = useToast();

  async function copyAddress() {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    if (!withdrawAddress || !withdrawAmount) {
      showToast("Enter destination address and amount", "error");
      return;
    }

    setWithdrawing(true);
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAddress: address,
          destination: withdrawAddress,
          amount: withdrawAmount,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Withdrawal failed");
      }

      showToast(`Sent ${withdrawAmount} USDT to ${withdrawAddress.slice(0, 10)}...`, "success");
      setWithdrawAddress("");
      setWithdrawAmount("");
      onRefresh?.();
    } catch (err: any) {
      showToast(err.message || "Withdrawal failed", "error");
    } finally {
      setWithdrawing(false);
    }
  }

  return (
    <GlassCard className="p-5" accentColor="green">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-[#35D07F]" />
          <span className="text-sm font-semibold text-white/80">{isExternal ? "External Wallet" : "EscrowHubs Wallet"}</span>
        </div>
        <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
          {(["receive", "fund", "withdraw"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                activeTab === tab
                  ? "bg-[#35D07F] text-black"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {tab === "receive" && "Receive"}
              {tab === "fund" && "Fund"}
              {tab === "withdraw" && "Withdraw"}
            </button>
          ))}
        </div>
      </div>

      {/* Balance */}
      <div className="mb-4">
        <div className="text-[10px] text-white/40 mb-1">Available Balance</div>
        <div className="text-2xl font-bold text-white">${balanceUsdt}</div>
        <div className="text-[10px] text-white/30 mt-0.5">{balanceCelo} CELO for fees</div>
      </div>

      {activeTab === "receive" && (
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="bg-white p-3 rounded-xl">
              <QRCodeSVG value={address} size={160} level="M" includeMargin={false} />
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-white/40 mb-0.5">Celo Address</div>
              <div className="text-xs text-white font-mono truncate">{address}</div>
            </div>
            <button
              onClick={copyAddress}
              className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-white/60" />
            </button>
          </div>
          <p className="text-[10px] text-white/30 text-center">
            Send USDT on Celo to this address
          </p>
        </div>
      )}

      {activeTab === "fund" && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-[#35D07F]/10 flex items-center justify-center mx-auto mb-2">
              <ArrowDownLeft className="w-6 h-6 text-[#35D07F]" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Fund via NaijaLancers</h3>
            <p className="text-[10px] text-white/40">Add Naira to your NaijaLancers wallet, then send to this address</p>
          </div>

          <div className="space-y-2">
            {[
              "Visit naijalancers.name.ng",
              "Go to Wallet → Add Funds",
              "Add Naira via bank transfer",
              "Go to Withdraw → Send Crypto",
              "Paste your EscrowHubs address below",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-[#35D07F]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-[#35D07F]">{i + 1}</span>
                </div>
                <span className="text-xs text-white/70">{step}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-white/40 mb-0.5">Your EscrowHubs Address</div>
              <div className="text-xs text-white font-mono truncate">{address}</div>
            </div>
            <button
              onClick={copyAddress}
              className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-white/60" />
            </button>
          </div>

          <a
            href="https://naijalancers.name.ng"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#35D07F]/10 border border-[#35D07F]/20 text-[#35D07F] text-xs font-semibold hover:bg-[#35D07F]/20 transition-colors"
          >
            Open NaijaLancers
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {activeTab === "withdraw" && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-2">
              <ArrowUpRight className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Withdraw to NaijaLancers</h3>
            <p className="text-[10px] text-white/40">Send USDT back to your NaijaLancers wallet</p>
          </div>

          <form onSubmit={handleWithdraw} className="space-y-3">
            <div>
              <label className="text-[10px] text-white/40 mb-1 block">Destination Address</label>
              <input
                type="text"
                placeholder="Paste NaijaLancers address"
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/30 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400"
                disabled={withdrawing}
              />
            </div>
            <div>
              <label className="text-[10px] text-white/40 mb-1 block">Amount (USDT)</label>
              <input
                type="number"
                placeholder="0.00"
                step="0.01"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/30 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400"
                disabled={withdrawing}
              />
            </div>
            <GlowButton
              variant="danger"
              onClick={handleWithdraw}
              disabled={withdrawing || !withdrawAddress || !withdrawAmount}
              className="w-full"
            >
              {withdrawing ? "Sending..." : `Withdraw ${withdrawAmount || "0"} USDT`}
            </GlowButton>
          </form>
        </div>
      )}
    </GlassCard>
  );
}
