"use client";

export function TrustFooter() {
  return (
    <footer className="text-center text-xs text-white/40 mt-auto pt-6 pb-4 space-y-1">
      <p>Powered by Celo · Secured by smart contract</p>
      <p>
        EscrowHubs LLC ·{" "}
        <a
          href="https://celoscan.io/address/0x43572a85597e82a7153dbcae8f2fe93d1602a836"
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
      </p>
    </footer>
  );
}
