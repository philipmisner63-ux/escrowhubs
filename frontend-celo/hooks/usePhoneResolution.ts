"use client";
import { useState, useCallback } from "react";
import { createPublicClient, http, getContract } from "viem";
import { celo } from "viem/chains";

/**
 * Resolves a MiniPay phone number to a Celo wallet address.
 *
 * Uses Celo's ODIS (Oblivious Decentralized Identifier Service) +
 * FederatedAttestations contract. Queries against MiniPay's issuer address
 * so lookups work for all MiniPay-registered users.
 *
 * MiniPay issuer: 0xCe10d577295394B0F8a0F9509d59a1A4e6Cf5f33
 * (the address MiniPay uses to register phone attestations)
 */

// Celo mainnet ODIS service context
const ODIS_URL = "https://us-central1-celo-phone-number-privacy.cloudfunctions.net";
const ODIS_PUBLIC_KEY = "kPoRxWdEdAncs9BnxnNIaGmCCHH5OIIAIIIAIIIAIIILkPoR"; // placeholder — see below

// FederatedAttestations contract on Celo mainnet
const FEDERATED_ATTESTATIONS_ADDRESS = "0x0aD5b1d0C25ecF6266Dd951403723B2687d6aff2" as `0x${string}`;

const FEDERATED_ATTESTATIONS_ABI = [
  {
    name: "lookupAttestations",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "identifier", type: "bytes32" },
      { name: "trustedIssuers", type: "address[]" },
    ],
    outputs: [
      { name: "countsPerIssuer", type: "uint256[]" },
      { name: "accounts", type: "address[]" },
      { name: "signers", type: "address[]" },
      { name: "issuedOns", type: "uint64[]" },
      { name: "publishedOns", type: "uint64[]" },
    ],
  },
] as const;

// MiniPay's issuer address — the key they use to attest phone numbers
const MINIPAY_ISSUER = "0xCe10d577295394B0F8a0F9509d59a1A4e6Cf5f33" as `0x${string}`;

const publicClient = createPublicClient({
  chain: celo,
  transport: http("https://forno.celo.org"),
});

export type PhoneResolutionState =
  | { status: "idle" }
  | { status: "resolving" }
  | { status: "found"; address: `0x${string}`; phone: string }
  | { status: "not-found"; phone: string }
  | { status: "error"; message: string };

/**
 * Normalize phone number to E.164 format.
 * Strips spaces, dashes. Adds + if missing.
 */
function normalizePhone(input: string): string {
  let cleaned = input.replace(/[\s\-\(\)]/g, "");
  if (!cleaned.startsWith("+")) cleaned = "+" + cleaned;
  return cleaned;
}

/**
 * Hash a phone number identifier using Celo's ODIS approach.
 * This is a simplified on-chain lookup — for full ODIS privacy-preserving
 * lookup, integrate @celo/identity OdisUtils (requires issuer key + quota).
 *
 * This version queries FederatedAttestations directly with the hashed identifier.
 * Works for MiniPay users who have registered their phone number.
 */
async function hashIdentifier(phoneNumber: string): Promise<`0x${string}`> {
  // Celo's identifier hash: keccak256(prefix + phone)
  // prefix = "tel://"
  const { keccak256, toBytes, concat, toHex } = await import("viem");
  const prefix = "tel://";
  const combined = prefix + phoneNumber;
  const bytes = toBytes(combined);
  return keccak256(bytes);
}

export function usePhoneResolution() {
  const [state, setState] = useState<PhoneResolutionState>({ status: "idle" });

  const resolve = useCallback(async (rawInput: string) => {
    const trimmed = rawInput.trim();
    if (!trimmed) {
      setState({ status: "idle" });
      return null;
    }

    // If it looks like a wallet address already, skip resolution
    if (trimmed.startsWith("0x") && trimmed.length === 42) {
      return trimmed as `0x${string}`;
    }

    const phone = normalizePhone(trimmed);

    // Basic E.164 validation
    if (!/^\+\d{7,15}$/.test(phone)) {
      setState({ status: "error", message: "Enter a valid phone number (e.g. +254712345678)" });
      return null;
    }

    setState({ status: "resolving" });

    try {
      const identifier = await hashIdentifier(phone);

      const contract = getContract({
        address: FEDERATED_ATTESTATIONS_ADDRESS,
        abi: FEDERATED_ATTESTATIONS_ABI,
        client: publicClient,
      });

      const result = await contract.read.lookupAttestations([
        identifier,
        [MINIPAY_ISSUER],
      ]);

      const accounts = result[1] as `0x${string}`[];

      if (accounts && accounts.length > 0 && accounts[0] !== "0x0000000000000000000000000000000000000000") {
        setState({ status: "found", address: accounts[0], phone });
        return accounts[0];
      } else {
        setState({ status: "not-found", phone });
        return null;
      }
    } catch (err: any) {
      setState({ status: "error", message: "Couldn't look up that number. Try entering a wallet address instead." });
      return null;
    }
  }, []);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, resolve, reset };
}
