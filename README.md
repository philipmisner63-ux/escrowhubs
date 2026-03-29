# BlockDAG Escrow dApp

Modular escrow smart contracts with a Web3-native frontend.

## Architecture

- **SimpleEscrow** — single-release escrow between two parties
- **MilestoneEscrow** — phased escrow with adaptive verification layers

Trust score, transaction size, and user history drive which verification path is invoked.

## Stack

| Layer | Tech |
|-------|------|
| Smart Contracts | Solidity + Hardhat |
| Frontend | Next.js + Tailwind CSS + shadcn/ui |
| Design | Glassmorphism, neon accents |
| Package Manager | pnpm |

## Project Structure

```
blockdag-escrow/
├── contracts/     # Hardhat project
├── frontend/      # Next.js app
└── .github/       # CI workflows
```

## Getting Started

### Contracts

```bash
cd contracts
pnpm install
pnpm hardhat compile
pnpm hardhat test
```

### Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

## Environment Variables

Copy `.env.example` to `.env` in the relevant subdirectory and fill in values.
