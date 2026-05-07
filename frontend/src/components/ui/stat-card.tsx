"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  accent?: "cyan" | "blue" | "green" | "red";
  className?: string;
}

const accentText = {
  cyan:  "text-cyan-400",
  blue:  "text-blue-400",
  green: "text-green-400",
  red:   "text-red-400",
};

function useCountUp(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setCount(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return count;
}

function AnimatedValue({ raw }: { raw: string | number }) {
  // Always extract numeric so useCountUp is called unconditionally
  const numeric = typeof raw === "number"
    ? raw
    : (() => {
        const m = String(raw).match(/^(\d+)(.*)$/);
        return m ? parseInt(m[1], 10) : 0;
      })();
  const suffix = typeof raw === "number" ? "" : (String(raw).match(/^\d+(.*)$/)?.[1] ?? "");
  const count = useCountUp(numeric);

  if (typeof raw === "number") return <>{count}</>;
  if (!/^\d+/.test(String(raw))) return <>{raw}</>;
  return <>{count}{suffix}</>;
}

export function StatCard({ label, value, icon, accent = "cyan", className }: StatCardProps) {
  return (
    <GlassCard accentColor={accent} className={cn("p-5", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-slate-500">{label}</p>
          <p className={cn("mt-2 text-2xl font-bold", accentText[accent])} style={{ fontFamily: "var(--font-mono)" }}>
            <AnimatedValue raw={value} />
          </p>
        </div>
        {icon && (
          <div className={cn("text-2xl opacity-60", accentText[accent])}>{icon}</div>
        )}
      </div>
    </GlassCard>
  );
}
