import { type Address } from "viem";

export interface ChainContracts {
  factory:    Address;
  arbiter:    Address;
  trustOracle: Address;
}

const CONTRACT_ADDRESSES: Record<number, ChainContracts> = {
  // Base mainnet
  8453: {
    factory:     (process.env.NEXT_PUBLIC_FACTORY_ADDRESS     ?? "0x93e86fac9a15add437363f7bbec776bdbc932411") as Address,
    arbiter:     (process.env.NEXT_PUBLIC_AI_ARBITER_ADDRESS  ?? "0x79e78c1ed9a8e239a8334294bf4f0d356f858416") as Address,
    trustOracle: (process.env.NEXT_PUBLIC_ORACLE_ADDRESS      ?? "0xf2612fddf7505f6d168c1cbe8b725f3449ea535e") as Address,
  },
  // Celo mainnet
  42220: {
    factory:     "0x43572a85597e82a7153dbcae8f2fe93d1602a836" as Address,
    arbiter:     "0x73198f6bdf2537bcd6138e35175498c631c5b42b" as Address,
    trustOracle: "0xf2612fddf7505f6d168c1cbe8b725f3449ea535e" as Address,
  },
};

export function getContractAddresses(chainId: number): ChainContracts {
  const addresses = CONTRACT_ADDRESSES[chainId];
  if (!addresses) {
    throw new Error(`No contract addresses configured for chain ${chainId}`);
  }
  return addresses;
}

export function getFactoryAddress(chainId: number): Address {
  return getContractAddresses(chainId).factory;
}

export function getArbiterAddress(chainId: number): Address {
  return getContractAddresses(chainId).arbiter;
}

export function getTrustOracleAddress(chainId: number): Address {
  return getContractAddresses(chainId).trustOracle;
}
