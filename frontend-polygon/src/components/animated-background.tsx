export function AnimatedBackground() {
  return (
    <>
      <style>{`
        @keyframes drift1 {
          0%   { transform: translate(0px, 0px) scale(1); }
          33%  { transform: translate(80px, -60px) scale(1.1); }
          66%  { transform: translate(-40px, 80px) scale(0.95); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes drift2 {
          0%   { transform: translate(0px, 0px) scale(1); }
          33%  { transform: translate(-100px, 60px) scale(1.05); }
          66%  { transform: translate(60px, -80px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes drift3 {
          0%   { transform: translate(0px, 0px) scale(1); }
          50%  { transform: translate(50px, 50px) scale(1.15); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .orb1 { animation: drift1 40s ease-in-out infinite; }
        .orb2 { animation: drift2 35s ease-in-out infinite; }
        .orb3 { animation: drift3 30s ease-in-out infinite; }
      `}</style>
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: -1,
          overflow: "hidden",
        }}
      >
        {/* Orb 1 — deep purple, top-left */}
        <div
          className="orb1"
          style={{
            position: "absolute",
            top: "-10%",
            left: "-10%",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, #1a0533 0%, transparent 70%)",
            filter: "blur(80px)",
            opacity: 0.7,
          }}
        />
        {/* Orb 2 — midnight blue, bottom-right */}
        <div
          className="orb2"
          style={{
            position: "absolute",
            bottom: "-15%",
            right: "-10%",
            width: 800,
            height: 800,
            borderRadius: "50%",
            background: "radial-gradient(circle, #0a1628 0%, transparent 70%)",
            filter: "blur(80px)",
            opacity: 0.7,
          }}
        />
        {/* Orb 3 — dark cyan, center */}
        <div
          className="orb3"
          style={{
            position: "absolute",
            top: "30%",
            left: "35%",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, #0a2a2a 0%, transparent 70%)",
            filter: "blur(80px)",
            opacity: 0.6,
          }}
        />
      </div>
    </>
  );
}
