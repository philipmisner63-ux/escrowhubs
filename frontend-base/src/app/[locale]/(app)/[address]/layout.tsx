import type { Metadata } from "next";

// Dynamic claim page — not for indexing
export const metadata: Metadata = {
  title: "Claim — EscrowHubs",
  robots: { index: false, follow: false },
};

export default function ClaimLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
