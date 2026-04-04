import { type Address } from "viem";

export interface ChainContracts {
  factory:    Address;
  arbiter:    Address;
  trustOracle: Address;
}

const CONTRACT_ADDRESSES: Record<number, ChainContracts> = {
  1404: {
    factory:     (process.env.NEXT_PUBLIC_FACTORY_ADDRESS     ?? "0x14e03bbd4a3123e4bdb5b6704c0ccc208bbfaa7a") as Address,
    arbiter:     (process.env.NEXT_PUBLIC_AI_ARBITER_ADDRESS  ?? "0xf8c771891dc8158d46c4608cf0008ceb7a9c898b") as Address,
    trustOracle: (process.env.NEXT_PUBLIC_ORACLE_ADDRESS      ?? "0x9177998c58138ff4ec9ca2a623ed594a4c7db623") as Address,
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
