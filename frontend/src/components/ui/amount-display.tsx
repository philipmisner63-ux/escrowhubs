import { formatEther } from "viem";
import { cn } from "@/lib/utils";

interface AmountDisplayProps {
  amount: bigint | string;
  symbol?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeStyles = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-2xl font-bold",
};

const symbolSizes = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export function AmountDisplay({
  amount,
  symbol = "BDAG",
  size = "md",
  className,
}: AmountDisplayProps) {
  let formatted: string;
  if (typeof amount === "bigint") {
    const etherStr = formatEther(amount);
    // Preserve precision: split integer/fractional, format integer with locale, keep fractional
    const [intPartRaw, fracPartRaw] = etherStr.split(".");
    const intPart = BigInt(intPartRaw).toLocaleString();
    const fracPart = fracPartRaw?.slice(0, 4) ?? "";
    const trimmed = fracPart.replace(/0+$/, "");
    const displayVal = trimmed ? `${intPart}.${trimmed}` : intPart;
    // Show nonzero tiny values as "<0.0001" instead of "0"
    formatted = amount > 0n && displayVal === "0" ? "<0.0001" : displayVal;
  } else {
    formatted = amount;
  }

  return (
    <span
      className={cn("text-cyan-400 inline-flex items-baseline gap-1", sizeStyles[size], className)}
      style={{ fontFamily: "var(--font-mono, monospace)" }}
    >
      <span>{formatted}</span>
      <span className={cn("text-slate-500", symbolSizes[size])}>{symbol}</span>
    </span>
  );
}
