import { cn } from "@/lib/utils";

interface GlowButtonProps {
  variant?: "primary" | "secondary" | "danger";
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
}

const variants = {
  primary:   "bg-cyan-400 text-black border-transparent hover:bg-cyan-300 shadow-[0_0_20px_rgba(0,245,255,0.3)] hover:shadow-[0_0_35px_rgba(0,245,255,0.55)]",
  secondary: "bg-transparent text-cyan-400 border border-cyan-400/30 hover:border-cyan-400/60 hover:bg-cyan-400/8 hover:shadow-[0_0_20px_rgba(0,245,255,0.15)]",
  danger:    "bg-transparent text-red-400  border border-red-400/30  hover:border-red-400/60  hover:bg-red-400/8  hover:shadow-[0_0_20px_rgba(248,113,113,0.2)]",
};

export function GlowButton({
  variant = "primary",
  children,
  onClick,
  disabled,
  loading,
  className,
  type = "button",
}: GlowButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold",
        "transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
        variants[variant],
        className
      )}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {children}
    </button>
  );
}
