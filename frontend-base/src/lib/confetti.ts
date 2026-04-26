import confetti from "canvas-confetti";

const opts = {
  particleCount: 80,
  spread: 100,
  origin: { x: 0.5, y: 0.9 },
  colors: ["#00f5ff", "#a855f7", "#ffffff", "#0066ff"],
  startVelocity: 45,
  gravity: 0.8,
  scalar: 1.1,
};

export function triggerDeployConfetti() {
  confetti(opts);
  setTimeout(() => confetti(opts), 150);
}
