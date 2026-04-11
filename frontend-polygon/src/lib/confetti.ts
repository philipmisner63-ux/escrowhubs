import type confetti from "canvas-confetti";

export async function triggerDeployConfetti() {
  const { default: confettiLib } = await import("canvas-confetti") as { default: typeof confetti };

  const opts = {
    particleCount: 80,
    spread: 100,
    origin: { x: 0.5, y: 0.9 },
    colors: ["#00f5ff", "#a855f7", "#ffffff", "#0066ff"],
    startVelocity: 45,
    gravity: 0.8,
    scalar: 1.1,
  };

  confettiLib(opts);
  setTimeout(() => confettiLib(opts), 150);
}
