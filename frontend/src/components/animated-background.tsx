export function AnimatedBackground() {
  return (
    <>
      <style>{`
        @keyframes drift1 {
          0%   { transform: translateZ(0) translate(0px, 0px) scale(1); }
          33%  { transform: translateZ(0) translate(80px, -60px) scale(1.1); }
          66%  { transform: translateZ(0) translate(-40px, 80px) scale(0.95); }
          100% { transform: translateZ(0) translate(0px, 0px) scale(1); }
        }
        @keyframes drift2 {
          0%   { transform: translateZ(0) translate(0px, 0px) scale(1); }
          33%  { transform: translateZ(0) translate(-100px, 60px) scale(1.05); }
          66%  { transform: translateZ(0) translate(60px, -80px) scale(0.9); }
          100% { transform: translateZ(0) translate(0px, 0px) scale(1); }
        }
        @keyframes drift3 {
          0%   { transform: translateZ(0) translate(0px, 0px) scale(1); }
          50%  { transform: translateZ(0) translate(50px, 50px) scale(1.15); }
          100% { transform: translateZ(0) translate(0px, 0px) scale(1); }
        }
        .orb1 { animation: drift1 40s ease-in-out infinite; will-change: transform; }
        .orb2 { animation: drift2 35s ease-in-out infinite; will-change: transform; }
        .orb3 { animation: drift3 30s ease-in-out infinite; will-change: transform; }
      `}</style>
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: -1,
        }}
      >
        <div
          className="orb1"
          style={{
            position: "absolute",
            top: "-10%",
            left: "-10%",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(26,5,51,0.7) 0%, transparent 70%)",
          }}
        />
        <div
          className="orb2"
          style={{
            position: "absolute",
            bottom: "-15%",
            right: "-10%",
            width: 800,
            height: 800,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(10,22,40,0.7) 0%, transparent 70%)",
          }}
        />
        <div
          className="orb3"
          style={{
            position: "absolute",
            top: "30%",
            left: "35%",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(10,42,42,0.6) 0%, transparent 70%)",
          }}
        />
      </div>
    </>
  );
}
