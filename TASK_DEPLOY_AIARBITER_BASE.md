# Task: Deploy AIArbiter on Base Mainnet + Verify All Contracts

## Context

We are deploying EscrowHubs contracts to Base L2 mainnet. Two of three contracts deployed successfully. AIArbiter fails with "TransactionExecutionError: An unknown RPC error occurred" on multiple RPCs (mainnet.base.org and base.llamarpc.com).

**Already deployed (do NOT redeploy):**
- TrustScoreOracle: `0xf2612fddf7505f6d168c1cbe8b725f3449ea535e`
- EscrowFactory: `0x93e86fac9a15add437363f7bbec776bdbc932411`

**Deployer:** `0x202eBD8c160BF77Eb026406c7C2BA2602E974EaA`
**Balance:** 0.002873 ETH on Base mainnet (sufficient for Base L2)
**AIArbiter compiled size:** 3.7 KB (well under 24KB limit)

**Project:** `~/projects/blockdag-escrow/contracts`
**Stack:** Hardhat v3, viem (not ethers), TypeScript
**Network config name:** `base` (Chain ID 8453)
**.env vars:** `BASE_RPC_URL`, `DEPLOYER_PRIVATE_KEY`, `BASESCAN_API_KEY`

## Requirements

### 1. Diagnose AIArbiter Deploy Failure

The error occurs on both `mainnet.base.org` and `base.llamarpc.com`. It is NOT gas or contract size.

Diagnostic steps:
- Check the deployer nonce on Base mainnet (there may be stuck/pending transactions after 2 deploys)
- Try an `eth_call` simulation of the AIArbiter deployment to get the actual revert reason
- Check if the Hardhat v3 `conn.viem.deployContract()` wrapper is causing issues vs raw viem
- Try with explicit gas limit (e.g., 1_000_000) to bypass gas estimation issues
- Try a different RPC if needed (e.g., sign up for free Alchemy Base RPC)

### 2. Deploy AIArbiter

Write `scripts/deploy-arbiter-base.ts` that:
- Uses the same Hardhat v3 API pattern as the existing `scripts/deploy.ts`: `const conn = await hre.network.connect()` then `conn.viem.deployContract()`
- Deploys AIArbiter with constructor arg `[account.address]` (deployer = oracle signer)
- If the Hardhat wrapper keeps failing, fall back to deploying via raw viem client with explicit gas parameters
- Prints the deployed AIArbiter address

### 3. Wire AIArbiter to Existing EscrowFactory

After successful deployment, call `setAIArbiter()` on the existing EscrowFactory at `0x93e86fac9a15add437363f7bbec776bdbc932411`:

```typescript
const factoryClient = await conn.viem.getContractAt("EscrowFactory", "0x93e86fac9a15add437363f7bbec776bdbc932411");
await factoryClient.write.setAIArbiter([aiArbiter.address]);
console.log("Factory wired to AIArbiter");
```

### 4. Verify All Three Contracts on Basescan

Once AIArbiter is deployed, verify all three contracts:

```bash
npx hardhat verify --network base <TrustScoreOracle_address>
npx hardhat verify --network base <EscrowFactory_address>
npx hardhat verify --network base <AIArbiter_address> "0x202eBD8c160BF77Eb026406c7C2BA2602E974EaA"
```

- Use `BASESCAN_API_KEY` from `.env`
- If verification fails, check constructor args encoding
- Print Basescan URLs for all three verified contracts

## Constraints
- Do NOT redeploy TrustScoreOracle or EscrowFactory
- Do NOT modify contract Solidity source unless necessary for Base compatibility
- AIArbiter constructor takes one arg: oracle signer address (use deployer)
- Base mainnet Chain ID: 8453
- Base native USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

### 5. Print Final Summary

Print all three addresses plus these .env lines ready to paste:

```
=== Base Mainnet Deployment Complete ===
TrustScoreOracle: 0xf2612fddf7505f6d168c1cbe8b725f3449ea535e ✓ verified
EscrowFactory:    0x93e86fac9a15add437363f7bbec776bdbc932411 ✓ verified
AIArbiter:        0x<new_address> ✓ verified
Factory → AIArbiter wired ✓

NEXT_PUBLIC_FACTORY_ADDRESS=0x93e86fac9a15add437363f7bbec776bdbc932411
NEXT_PUBLIC_ORACLE_ADDRESS=0xf2612fddf7505f6d168c1cbe8b725f3449ea535e
NEXT_PUBLIC_AI_ARBITER_ADDRESS=<NEW_ADDRESS>
AI_ARBITER_ADDRESS=<NEW_ADDRESS>
```
