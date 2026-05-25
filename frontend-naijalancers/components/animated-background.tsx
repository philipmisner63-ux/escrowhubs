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
        <div
          className="orb1"
          style={{
            position: "absolute",
            top: "-20%",
            left: "-20%",
            width: 900,
            height: 900,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(26,5,51,0.4) 0%, rgba(26,5,51,0.1) 40%, transparent 70%)",
          }}
        />
        <div
          className="orb2"
          style={{
            position: "absolute",
            bottom: "-25%",
            right: "-20%",
            width: 1100,
            height: 1100,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(10,22,40,0.35) 0%, rgba(10,22,40,0.08) 40%, transparent 70%)",
          }}
        />
        <div
          className="orb3"
          style={{
            position: "absolute",
            top: "20%",
            left: "25%",
            width: 700,
            height: 700,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(10,42,42,0.3) 0%, rgba(10,42,42,0.05) 40%, transparent 70%)",
          }}
        />
      </div>
    </>
  );
}
