import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  accent?: "cyan" | "blue" | "green" | "red";
  className?: string;
}

const accentStyles = {
  cyan: "border-cyan-400/20 shadow-[0_0_30px_rgba(0,245,255,0.08)]",
  blue: "border-blue-500/20 shadow-[0_0_30px_rgba(0,102,255,0.08)]",
  green: "border-green-400/20 shadow-[0_0_30px_rgba(0,255,136,0.08)]",
  red:  "border-red-400/20 shadow-[0_0_30px_rgba(255,60,60,0.08)]",
};

const accentText = {
  cyan: "text-cyan-400",
  blue: "text-blue-400",
  green: "text-green-400",
  red:  "text-red-400",
};

export function StatCard({ label, value, icon, accent = "cyan", className }: StatCardProps) {
  return (
    <div className={cn(
      "glass rounded-xl p-5 border",
      accentStyles[accent],
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-slate-500">{label}</p>
          <p className={cn("mt-2 text-2xl font-bold", accentText[accent])}>{value}</p>
        </div>
        {icon && (
          <div className={cn("text-2xl opacity-60", accentText[accent])}>{icon}</div>
        )}
      </div>
    </div>
  );
}
