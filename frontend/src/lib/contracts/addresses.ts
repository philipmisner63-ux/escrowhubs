import { type Address } from "viem";

export interface ChainContracts {
  factory:    Address;
  arbiter:    Address;
  trustOracle: Address;
}

const CONTRACT_ADDRESSES: Record<number, ChainContracts> = {
  1404: {
    factory:     (process.env.NEXT_PUBLIC_FACTORY_ADDRESS     ?? "0x8a9001c28c4cc1e0952ae5ca2a8366f1c1ac6724") as Address,
    arbiter:     (process.env.NEXT_PUBLIC_AI_ARBITER_ADDRESS  ?? "0x8ee119999d87dcf9e9bf80a876c18f9c85d8b4c1") as Address,
    trustOracle: (process.env.NEXT_PUBLIC_ORACLE_ADDRESS      ?? "0x5ee4939ff22501ba53428e23004fa7b6f271a7d0") as Address,
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
