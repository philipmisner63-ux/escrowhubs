"use client";

import { useSession } from "@/components/session-provider";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";

export function useActiveWallet() {
  const { session } = useSession();
  const { address: externalAddress, isConnected } = useAccount();
  const [isMiniPay, setIsMiniPay] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const provider = (window as any).ethereum;
      if (provider?.isMiniPay) setIsMiniPay(true);
    }
  }, []);

  const isExternal = isConnected && !!externalAddress;
  const activeAddress = isExternal ? externalAddress : session?.walletAddress || null;

  return {
    address: activeAddress,
    isExternal,
    isMiniPay,
    isReady: !!activeAddress,
  };
}
