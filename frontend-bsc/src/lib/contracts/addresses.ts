import { type Address } from "viem";

export interface ChainContracts {
  factory:    Address;
  arbiter:    Address;
  trustOracle: Address;
}

const CONTRACT_ADDRESSES: Record<number, ChainContracts> = {
  56: {
    factory:     (process.env.NEXT_PUBLIC_FACTORY_ADDRESS     ?? "0x0390028e61a7245737f3bf7576e17f39e16f2152") as Address,
    arbiter:     (process.env.NEXT_PUBLIC_AI_ARBITER_ADDRESS  ?? "0x6b8b146978177bd4bc324e0bba8a6eb92c271d4e") as Address,
    trustOracle: (process.env.NEXT_PUBLIC_ORACLE_ADDRESS      ?? "0xf2c13d34fd924f93e0f70967d11b7dc3612ad558") as Address,
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
