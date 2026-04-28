"use client";

export function TrustFooter() {
  return (
    <footer className="text-center text-xs text-gray-400 mt-auto pt-6 pb-2">
      <p>Powered by Celo · Secured by smart contract</p>
      <p className="mt-1">
        EscrowHubs LLC ·{" "}
        <a
          href="https://celoscan.io/address/0x43572a85597e82a7153dbcae8f2fe93d1602a836"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          View contract ↗
        </a>
        {" · "}
        <a
          href="https://x.com/escrowhubs94501"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          @escrowhubs94501 ↗
        </a>
      </p>
    </footer>
  );
}
