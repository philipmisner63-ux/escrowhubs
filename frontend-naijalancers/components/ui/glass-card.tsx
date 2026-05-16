import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glowOnHover?: boolean;
  accentColor?: "cyan" | "purple" | "blue" | "green" | "red";
}

const glowStyles: Record<string, string> = {
  cyan:   "hover:border-cyan-400/30   hover:shadow-[0_0_40px_rgba(0,245,255,0.08)]",
  purple: "hover:border-purple-400/30 hover:shadow-[0_0_40px_rgba(168,85,247,0.08)]",
  blue:   "hover:border-blue-400/30   hover:shadow-[0_0_40px_rgba(0,102,255,0.08)]",
  green:  "hover:border-green-400/30  hover:shadow-[0_0_40px_rgba(74,222,128,0.08)]",
  red:    "hover:border-red-400/30    hover:shadow-[0_0_40px_rgba(248,113,113,0.08)]",
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
        "rounded-2xl border border-white/10 backdrop-blur-xl",
        "bg-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
        "transition-all duration-300",
        glowOnHover && glowStyles[accentColor],
        className
      )}
    >
      {children}
    </div>
  );
}
