import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glowOnHover?: boolean;
  accentColor?: "cyan" | "purple" | "blue" | "green" | "red";
}

const glowStyles: Record<string, string> = {
  cyan:   "hover:border-cyan-400/50 hover:shadow-[0_0_25px_rgba(0,245,255,0.15)]",
  purple: "hover:border-purple-400/50 hover:shadow-[0_0_25px_rgba(168,85,247,0.15)]",
  blue:   "hover:border-blue-400/50   hover:shadow-[0_0_25px_rgba(0,102,255,0.15)]",
  green:  "hover:border-[#35D07F]/50  hover:shadow-[0_0_25px_rgba(53,208,127,0.15)]",
  red:    "hover:border-red-400/50    hover:shadow-[0_0_25px_rgba(248,113,113,0.15)]",
};

export function GlassCard({
  children,
  className,
  glowOnHover = true,
  accentColor = "cyan",
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/20",
        "bg-[#12121f] shadow-[0_4px_24px_rgba(0,0,0,0.4)]",
        "transition-all duration-300",
        glowOnHover && glowStyles[accentColor],
        className
      )}
    >
      {children}
    </div>
  );
}
