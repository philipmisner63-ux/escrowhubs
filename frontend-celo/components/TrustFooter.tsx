"use client";

export function TrustFooter() {
  return (
    <footer className="text-center text-xs text-white/40 mt-auto pt-6 pb-16 space-y-1">
      <p>Powered by Celo · Secured by smart contract</p>
      <p>
        EscrowHubs LLC ·{" "}
        <a
          href="https://celoscan.io/address/0x2fcec726073a47b71242f24fa3821d299b5119e1"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/60 hover:text-white/80 transition-colors"
        >
          View contract ↗
        </a>
        {" · "}
        <a
          href="https://x.com/escrowhubs94501"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/60 hover:text-white/80 transition-colors"
        >
          @escrowhubs94501 ↗
        </a>
        {" · "}
        <a
          href="/terms"
          className="text-white/60 hover:text-white/80 transition-colors"
        >
          Terms
        </a>
        {" · "}
        <a
          href="/privacy"
          className="text-white/60 hover:text-white/80 transition-colors"
        >
          Privacy
        </a>
      </p>
    </footer>
  );
}
