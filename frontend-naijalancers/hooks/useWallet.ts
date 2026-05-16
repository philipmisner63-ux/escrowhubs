"use client";

import { useAccount, useConnect, useDisconnect, useChainId } from "wagmi";
import { injected } from "wagmi/connectors";
import { useCallback, useEffect, useState } from "react";

export function useWallet() {
  const { address, isConnected, isConnecting } = useAccount();
  const chainId = useChainId();
  const { connectAsync } = useConnect();
  const { disconnect } = useDisconnect();
  const [isMiniPay, setIsMiniPay] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const provider = (window as any).ethereum;
      if (provider?.isMiniPay) setIsMiniPay(true);
    }
  }, []);

  const connectWallet = useCallback(async () => {
    try {
      await connectAsync({ connector: injected() });
      return true;
    } catch {
      return false;
    }
  }, [connectAsync]);

  return {
    address,
    isConnected,
    isConnecting,
    chainId,
    isMiniPay,
    connectWallet,
    disconnect,
  };
}
