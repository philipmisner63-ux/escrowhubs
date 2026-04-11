/**
 * Contract ABIs — imported from JSON files for tree-shaking and bundle clarity.
 * Each ABI is exported under both its canonical camelCase name and the legacy
 * SCREAMING_SNAKE_CASE alias so existing imports need no changes.
 *
 * JSON ABIs are cast to viem's Abi type so all wagmi/viem call sites get
 * proper type inference without needing `as const` on every JSON import.
 */

import type { Abi } from "viem";

import SimpleEscrowJson     from "./abis/SimpleEscrow.json";
import MilestoneEscrowJson  from "./abis/MilestoneEscrow.json";
import EscrowFactoryJson    from "./abis/EscrowFactory.json";
import AIArbiterJson        from "./abis/AIArbiter.json";
import TrustScoreOracleJson from "./abis/TrustScoreOracle.json";
import ERC20Json            from "./abis/ERC20.json";

// ─── Canonical camelCase exports ─────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const extractAbi = (json: any): Abi => ((json.abi ?? json) as unknown) as Abi;
export const SimpleEscrowABI     = extractAbi(SimpleEscrowJson);
export const MilestoneEscrowABI  = extractAbi(MilestoneEscrowJson);
export const EscrowFactoryABI    = extractAbi(EscrowFactoryJson);
export const AIArbiterABI        = extractAbi(AIArbiterJson);
export const TrustScoreOracleABI = extractAbi(TrustScoreOracleJson);

// ─── Legacy SCREAMING_SNAKE_CASE aliases (backward compat) ───────────────────
export const SIMPLE_ESCROW_ABI    = SimpleEscrowABI;
export const MILESTONE_ESCROW_ABI = MilestoneEscrowABI;
export const ESCROW_FACTORY_ABI   = EscrowFactoryABI;
export const AI_ARBITER_ABI       = AIArbiterABI;
export const TRUST_ORACLE_ABI     = TrustScoreOracleABI;
export const ERC20ABI             = ERC20Json as Abi;

// ─── Address helpers ─────────────────────────────────────────────────────────
export * from "./addresses";
