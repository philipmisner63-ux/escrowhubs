# NaijaLancers Escrow Marketplace

Standalone escrow app for Africa. MiniPay-native, Celo mainnet, cUSD.

## Chunk 1 Status (DONE)
- [x] Next.js skeleton + Tailwind
- [x] wagmi + AppKit providers for Celo mainnet
- [x] MiniPay auto-detect hook
- [x] UI shell: GlassCard, GlowButton, AnimatedBackground, Nav, Footer, Toast
- [x] Pages: `/` (create), `/escrow/[id]` (buyer), `/dashboard` (track)
- [x] API stubs: create-escrow, escrow detail, update-status, my-escrows, notify
- [x] Supabase client + types
- [x] Celo contract addresses + cUSD token config

## Chunk 2 (PENDING)
- [ ] Wire up viem transactions (cUSD approve, create escrow, release)
- [ ] Wire up Supabase inserts/queries in API routes
- [ ] WhatsApp sharing (copy link + wa.me redirect)
- [ ] Fix any build errors
- [ ] Test with MiniPay

## Install & Dev
```bash
cd frontend-naijalancers
pnpm install
pnpm dev
```

## Env vars
Copy `.env.local.example` to `.env.local` and fill in:
- `NEXT_PUBLIC_WC_PROJECT_ID` — WalletConnect project ID
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key
