# EscrowHubs

Trustless multi-chain escrow with AI dispute resolution. Deployed on BNB Smart Chain (BSC), Base, Polygon, and BlockDAG.

**Live:** https://bsc.escrowhubs.io (BNB Smart Chain) · https://base.escrowhubs.io (Base) · https://polygon.escrowhubs.io (Polygon) · https://app.escrowhubs.io (BlockDAG)

---

## Architecture

```
contracts/          Solidity contracts (Hardhat 3, OpenZeppelin v5)
frontend/           Next.js frontend — BlockDAG (port 3000)
frontend-base/      Next.js frontend — Base (port 3001)
frontend-polygon/   Next.js frontend — Polygon (port 3002)
oracle/             Node.js AI arbiter oracle (watches disputes, calls Claude)
subgraph/           The Graph subgraph — Polygon
subgraph-base/      The Graph subgraph — Base
```

## Contracts

| Contract | Address (Base) | Address (Polygon) | Address (BlockDAG) |
|---|---|---|---|
| EscrowFactory | `0x93e86fac...` | `0x93e86fac...` | `0x14e03bbd...` |
| AIArbiter | `0x79e78c1e...` | `0x79e78c1e...` | `0xf8c77189...` |
| TrustScoreOracle | `0xf2612fdd...` | `0xf2612fdd...` | `0x91779986...` |

## Stack

- **Contracts:** Solidity 0.8.24, Hardhat 3, OpenZeppelin v5, viem
- **Frontend:** Next.js 15, Tailwind, shadcn/ui, wagmi v2, next-intl (12 locales)
- **Oracle:** Node.js, Claude (Anthropic), IPFS via Pinata
- **Infra:** DigitalOcean, nginx, PM2, Certbot

## Local Development

```bash
# Contracts
cd contracts && pnpm install && pnpm test

# Frontend (BlockDAG)
cd frontend && pnpm install && pnpm dev

# Oracle
cd oracle && pnpm install && node index.js
```

## Environment Variables

Each frontend requires a `.env.local` — see `.env.example` in each directory.
Oracle requires `oracle/.env` with `ANTHROPIC_API_KEY`, `ORACLE_PRIVATE_KEY`, and RPC URLs.

## Security

Contracts audited with Slither — zero high/medium findings. See `contracts/` for details.

## License

MIT
