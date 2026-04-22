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
  };

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div className="relative flex items-center justify-center">
        {animated && <div style={haloStyle} />}
        {/* Inline SVG logo — cyan shield with EH monogram */}
        <svg
          data-testid="brand-logo"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 100"
          style={logoStyle}
          aria-label="EscrowHubs"
        >
          <defs>
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f5ff" stopOpacity="1" />
              <stop offset="100%" stopColor="#0066ff" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="shieldGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#003366" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#000820" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          {/* Shield background */}
          <path
            d="M50 5 L90 20 L90 55 Q90 80 50 97 Q10 80 10 55 L10 20 Z"
            fill="url(#shieldGrad2)"
            stroke="url(#shieldGrad)"
            strokeWidth="2.5"
          />
          {/* E */}
          <text
            x="28"
            y="62"
            fontSize="38"
            fontFamily="monospace"
            fontWeight="bold"
            fill="url(#shieldGrad)"
            opacity="0.95"
          >E</text>
          {/* H */}
          <text
            x="52"
            y="62"
            fontSize="38"
            fontFamily="monospace"
            fontWeight="bold"
            fill="#ffffff"
            opacity="0.9"
          >H</text>
          {/* Bottom accent line */}
          <line x1="25" y1="70" x2="75" y2="70" stroke="url(#shieldGrad)" strokeWidth="1.5" opacity="0.5" />
        </svg>
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

      <style>{}</style>
    </div>
  );
}
