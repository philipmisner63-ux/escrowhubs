// 🚫 DO NOT import RainbowKit, Wagmi, WalletConnect, or SES here.
// This layout is Web3Auth-only — intentionally isolated from the main app wallet ecosystem.
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
import { buildPageMetadata } from "@/lib/metadata";
import { PrivyWalletProvider } from "@/components/privy-provider";
import { ToastProvider } from "@/components/toast";
import { AnimatedBackground } from "@/components/animated-background";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(
    "Marketplace — EscrowHubs",
    "Create or join trustless escrow transactions on EscrowHubs — no wallet required to get started.",
    "/marketplace",
    locale
  );
}

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <PrivyWalletProvider>
      <ToastProvider>
        <AnimatedBackground />
        <div className="relative min-h-screen">
          {children}
        </div>
      </ToastProvider>
    </PrivyWalletProvider>
  );
}
