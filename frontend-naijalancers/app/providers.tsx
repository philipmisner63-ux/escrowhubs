"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { config } from "@/lib/wagmi";
import { useState } from "react";
import { SessionProvider, useSession } from "@/components/session-provider";
import { PhoneOnboarding } from "@/components/phone-onboarding";

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { needsOnboarding, setPhone } = useSession();
  return (
    <>
      {children}
      <PhoneOnboarding
        open={needsOnboarding}
        onSkip={() => setPhone("")}
        onComplete={(phone) => {
          if (phone) setPhone(phone);
          else setPhone("");
        }}
      />
    </>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <OnboardingGate>
            {children}
          </OnboardingGate>
        </SessionProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
