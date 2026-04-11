import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  pulse?: boolean;
  className?: string;
}

type ColorKey = "cyan" | "green" | "red" | "yellow" | "slate";

const STATUS_COLORS: Record<string, ColorKey> = {
  active:             "cyan",
  awaiting_delivery:  "cyan",
  awaiting_payment:   "cyan",
  pending:            "cyan",
  complete:           "green",
  completed:          "green",
  released:           "green",
  disputed:           "red",
  refunded:           "yellow",
};

const PULSE_STATUSES = new Set(["active", "awaiting_delivery", "pending", "disputed"]);

const COLOR_CLASSES: Record<ColorKey, string> = {
  cyan:   "text-cyan-400   bg-cyan-400/10   border-cyan-400/20",
  green:  "text-green-400  bg-green-400/10  border-green-400/20",
  red:    "text-red-400    bg-red-400/10    border-red-400/20",
  yellow: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  slate:  "text-slate-400  bg-slate-400/10  border-slate-400/20",
};

const PULSE_DOT_COLORS: Record<ColorKey, string> = {
  cyan:   "bg-cyan-400",
  green:  "bg-green-400",
  red:    "bg-red-400",
  yellow: "bg-yellow-400",
  slate:  "bg-slate-400",
};

export function StatusBadge({ status, pulse, className }: StatusBadgeProps) {
  const key = status.toLowerCase().replace(/ /g, "_") as ColorKey;
  const colorKey: ColorKey = STATUS_COLORS[key] ?? "slate";
  const shouldPulse = pulse ?? PULSE_STATUSES.has(key);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium capitalize",
        COLOR_CLASSES[colorKey],
        className
      )}
    >
      {shouldPulse && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full shrink-0", PULSE_DOT_COLORS[colorKey])}
          style={{ animation: "pulse-dot 1.5s ease-in-out infinite" }}
        />
      )}
      {status.replace(/_/g, " ")}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.4); opacity: 0.6; }
        }
      `}</style>
    </span>
  );
}
