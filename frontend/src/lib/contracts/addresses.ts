import { type Address, isAddress } from "viem";

export interface ChainContracts {
  factory:    Address;
  arbiter:    Address;
  trustOracle: Address;
}

function assertAddress(value: string, name: string): Address {
  if (!isAddress(value)) throw new Error(`Invalid address for ${name}: ${value}`);
  return value as Address;
}

const CONTRACT_ADDRESSES: Record<number, ChainContracts> = {
  1404: {
    factory:     assertAddress(process.env.NEXT_PUBLIC_FACTORY_ADDRESS     ?? "0xec16f9b47405ec8da1e677e6adc2d52f87e1402e", "factory"),
    arbiter:     assertAddress(process.env.NEXT_PUBLIC_AI_ARBITER_ADDRESS  ?? "0x4703258e28a6731b5d890d33ed29b67906ad9f01", "arbiter"),
    trustOracle: assertAddress(process.env.NEXT_PUBLIC_ORACLE_ADDRESS      ?? "0x9177998c58138ff4ec9ca2a623ed594a4c7db623", "trustOracle"),
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
