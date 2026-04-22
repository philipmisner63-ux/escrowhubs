"use client";

interface BrandLogoProps {
  size?: number;
  animated?: boolean;
  showTagline?: boolean;
}

export default function BrandLogo({
  size = 180,
  animated = true,
  showTagline = true,
}: BrandLogoProps) {
  const haloStyle: React.CSSProperties = {
    width: size * 1.4,
    height: size * 1.4,
    background: "radial-gradient(circle, rgba(0,180,255,0.3) 0%, rgba(0,180,255,0.05) 60%, transparent 100%)",
    animation: "haloPulse 3.2s ease-in-out infinite",
    position: "absolute",
    borderRadius: "9999px",
  };

  const logoStyle: React.CSSProperties = {
    filter: animated
      ? "drop-shadow(0 0 12px rgba(0,180,255,0.6)) drop-shadow(0 0 28px rgba(0,180,255,0.3))"
      : "drop-shadow(0 0 6px rgba(0,180,255,0.3))",
    position: "relative",
    zIndex: 1,
    width: size,
    height: size,
    display: "block",
  };

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div className="relative flex items-center justify-center">
        {animated && <div style={haloStyle} />}
        <img
          data-testid="brand-logo"
          src="/assets/branding/escrowhubs-logo.svg"
          alt="EscrowHubs"
          style={logoStyle}
        />
      </div>

      {showTagline && animated && (
        <div className="mt-4 px-6 py-2 rounded-full" style={{
          background: "rgba(0,180,255,0.1)",
          border: "1px solid rgba(0,180,255,0.3)",
          boxShadow: "0 0 12px rgba(0,180,255,0.2)",
        }}>
          <span style={{
            background: "linear-gradient(90deg, #7dd3fc, #38bdf8, #0ea5e9, #38bdf8, #7dd3fc)",
            backgroundSize: "300% 100%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            animation: "gradientFlow 6s ease-in-out infinite",
            fontSize: "0.85rem",
            letterSpacing: "0.5px",
          }}>
            AI&#8209;Guided Trust Layer for Digital Fairness
          </span>
        </div>
      )}

      <style>{`
        @keyframes haloPulse {
          0%   { transform: scale(0.92); opacity: 0.5; }
          50%  { transform: scale(1.08); opacity: 0.9; }
          100% { transform: scale(0.92); opacity: 0.5; }
        }
        @keyframes gradientFlow {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
