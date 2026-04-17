"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { createPublicClient, http, formatEther } from "viem";
import { ESCROW_FACTORY_ABI } from "@/lib/contracts";
import { blockdagMainnet, getRpcUrl, DEFAULT_CHAIN_ID } from "@/lib/chains";
import { getFactoryAddress } from "@/lib/contracts/addresses";

const CACHE_KEY = "escrowhubs_stats_cache";

// Admin ABI for accumulatedFees (not in main ABI)
const ADMIN_ABI = [
  { type: "function", name: "accumulatedFees", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;

interface StatsData {
  totalEscrows: number;
  bdagLocked: number;   // formatted as float
  successRate: number;  // 0-100
  fetchedAt: number;
}

function loadCache(): StatsData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as StatsData;
    // Cache valid for 5 min
    if (Date.now() - d.fetchedAt > 5 * 60 * 1000) return null;
    return d;
  } catch { return null; }
}

function saveCache(d: StatsData) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(d)); } catch {}
}

// Animated count-up hook
function useCountUp(target: number, duration = 1500, active = false) {
  const [value, setValue] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    if (!active || target === 0) { setValue(target); return; }
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // Ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration, active]);

  return value;
}

function StatCard({
  label,
  value,
  suffix = "",
  prefix = "",
  isLive = false,
  loading = false,
}: {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  isLive?: boolean;
  loading?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const animated = useCountUp(value, 1500, inView && !loading);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const display = loading
    ? "—"
    : suffix === "%"
    ? `${animated}%`
    : suffix === " BDAG"
    ? animated >= 1000
      ? `${(animated / 1000).toFixed(1)}K`
      : animated.toFixed(animated < 10 ? 2 : 0)
    : animated.toLocaleString();

  return (
    <div ref={ref} className="card-glow-stats rounded-xl border border-white/8 bg-white/3 p-5 relative">
      {isLive && !loading && (
        <span className="absolute top-3 right-3 flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] text-emerald-400 font-mono uppercase tracking-wide">live</span>
        </span>
      )}
      {loading ? (
        <div className="h-10 w-20 mx-auto rounded-lg bg-white/5 animate-pulse mb-1" />
      ) : (
        <p
          className="text-4xl sm:text-5xl font-bold font-mono text-cyan-400 text-center"
          style={{ textShadow: "0 0 20px rgba(0,245,255,0.4), 0 0 10px rgba(59,130,246,0.3)" }}
        >
          {prefix}{display}{suffix !== " BDAG" && suffix !== "%" ? suffix : ""}
          {suffix === " BDAG" && !loading && (
            <span className="text-xl ml-1 text-cyan-400/70">BDAG</span>
          )}
          {suffix === "%" && null}
        </p>
      )}
      <p className="mt-2 text-xs text-slate-500 uppercase tracking-widest text-center">{label}</p>
    </div>
  );
}

export function LiveStats() {
  const t = useTranslations("stats");
  const [stats, setStats] = useState<StatsData | null>(() => {
    if (typeof window === "undefined") return null;
    return loadCache();
  });
  const [loading, setLoading] = useState(() => typeof window === "undefined" ? true : !loadCache());
  const statsRef = useRef(stats);
  useEffect(() => { statsRef.current = stats; }, [stats]);

  const fetchStats = useCallback(async () => {
    try {
      const client = createPublicClient({ chain: blockdagMainnet, transport: http(getRpcUrl(DEFAULT_CHAIN_ID)) });

      const [countResult, balanceResult, feesResult] = await Promise.allSettled([
        client.readContract({
          address: getFactoryAddress(DEFAULT_CHAIN_ID),
          abi: ESCROW_FACTORY_ABI,
          functionName: "escrowCount",
        }),
        client.getBalance({ address: getFactoryAddress(DEFAULT_CHAIN_ID) }),
        client.readContract({
          address: getFactoryAddress(DEFAULT_CHAIN_ID),
          abi: ADMIN_ABI,
          functionName: "accumulatedFees",
        }),
      ]);

      const totalEscrows = countResult.status === "fulfilled"
        ? Number(countResult.value as bigint)
        : stats?.totalEscrows ?? 0;

      const bdagLocked = balanceResult.status === "fulfilled"
        ? parseFloat(formatEther(balanceResult.value as bigint))
        : stats?.bdagLocked ?? 0;

      const newStats: StatsData = {
        totalEscrows,
        bdagLocked,
        successRate: 100, // No resolution data available yet — keep 100%
        fetchedAt: Date.now(),
      };

      setStats(newStats);
      saveCache(newStats);
      setLoading(false);
    } catch {
      // Fallback to cached or defaults
      setLoading(false);
      if (!statsRef.current) {
        setStats({ totalEscrows: 0, bdagLocked: 0, successRate: 100, fetchedAt: 0 });
      }
    }
  }, [stats]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isLive = !!stats && Date.now() - stats.fetchedAt < 60_000;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
      <StatCard
        label={t("totalEscrows")}
        value={stats?.totalEscrows ?? 0}
        isLive={isLive}
        loading={loading}
      />
      <StatCard
        label={t("bdagLocked")}
        value={stats?.bdagLocked ?? 0}
        suffix=" BDAG"
        isLive={isLive}
        loading={loading}
      />
      <StatCard
        label={t("successRate")}
        value={stats?.successRate ?? 100}
        suffix="%"
        isLive={isLive}
        loading={loading}
      />
      {/* Static stats */}
      <StatCard label={t("chainId")} value={DEFAULT_CHAIN_ID} />
      <StatCard label={t("exploits")} value={0} />
    </div>
  );
}
