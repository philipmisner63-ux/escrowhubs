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
  symbol = "ETH",
  size = "md",
  className,
}: AmountDisplayProps) {
  const formatted =
    typeof amount === "bigint"
      ? parseFloat(formatEther(amount)).toLocaleString(undefined, { maximumFractionDigits: 4 })
      : amount;

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
