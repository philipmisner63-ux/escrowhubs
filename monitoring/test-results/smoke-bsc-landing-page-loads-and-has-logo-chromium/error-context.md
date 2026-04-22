# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> bsc >> landing page loads and has logo
- Location: smoke.spec.ts:17:9

# Error details

```
Error: Console errors: Connecting to 'https://api.web3modal.org/appkit/v1/config?projectId=9401741cff120268fe4e4df8acbda44f&st=appkit&sv=html-core-1.7.8' violates the following Content Security Policy directive: "connect-src 'self' https://bsc-dataseed.binance.org https://bsc-dataseed1.binance.org https://bsc-dataseed2.binance.org https://bsc-rpc.publicnode.com https://*.walletconnect.com https://*.walletconnect.org wss://*.walletconnect.com wss://*.walletconnect.org https://*.cloudflare-eth.com https://explorer.walletconnect.com https://pulse.walletconnect.org https://api.etherscan.io https://api.bscscan.com https://api.pinata.cloud https://gateway.pinata.cloud https://ipfs.io https://cloudflare-ipfs.com". The action has been blocked., Fetch API cannot load https://api.web3modal.org/appkit/v1/config?projectId=9401741cff120268fe4e4df8acbda44f&st=appkit&sv=html-core-1.7.8. Refused to connect because it violates the document's Content Security Policy.

expect(received).toHaveLength(expected)

Expected length: 0
Received length: 2
Received array:  ["Connecting to 'https://api.web3modal.org/appkit/v1/config?projectId=9401741cff120268fe4e4df8acbda44f&st=appkit&sv=html-core-1.7.8' violates the following Content Security Policy directive: \"connect-src 'self' https://bsc-dataseed.binance.org https://bsc-dataseed1.binance.org https://bsc-dataseed2.binance.org https://bsc-rpc.publicnode.com https://*.walletconnect.com https://*.walletconnect.org wss://*.walletconnect.com wss://*.walletconnect.org https://*.cloudflare-eth.com https://explorer.walletconnect.com https://pulse.walletconnect.org https://api.etherscan.io https://api.bscscan.com https://api.pinata.cloud https://gateway.pinata.cloud https://ipfs.io https://cloudflare-ipfs.com\". The action has been blocked.", "Fetch API cannot load https://api.web3modal.org/appkit/v1/config?projectId=9401741cff120268fe4e4df8acbda44f&st=appkit&sv=html-core-1.7.8. Refused to connect because it violates the document's Content Security Policy."]
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic:
    - alert
  - generic:
    - button "Support":
      - generic: 🛟
      - text: Support
    - button "Feedback":
      - generic: 💡
      - text: Feedback
    - generic:
      - generic:
        - navigation:
          - generic:
            - generic:
              - generic:
                - generic:
                  - link "EscrowHubs EscrowHubs":
                    - /url: /en
                    - generic:
                      - generic:
                        - img "EscrowHubs":
                          - generic: E
                          - generic: H
                    - generic: EscrowHubs
                  - generic:
                    - link "Dashboard":
                      - /url: /en/dashboard
                    - link "Create":
                      - /url: /en/create
                    - link "Learn":
                      - /url: /en/learn
                    - link "Security":
                      - /url: /en/security
                - generic:
                  - generic:
                    - button "Language":
                      - generic: 🇬🇧
                      - generic: English
                      - img
                  - button "Notification settings":
                    - img
                  - generic:
                    - generic:
                      - button "Connect Wallet"
        - main:
          - generic:
            - generic: Live on BNB Smart Chain
            - heading "EscrowHubs locks funds safely until both sides agree." [level=1] [ref=e2]:
              - generic [ref=e3]: EscrowHubs locks funds safely
              - generic [ref=e4]: until both sides agree.
            - paragraph: Trustless P2P escrow for traders, freelancers, and DAO contractors — enforced by smart contracts and AI arbitration.
            - generic:
              - link "Create an Escrow →":
                - /url: /en/dashboard
              - link "View Contracts":
                - /url: https://github.com/philipmisner63-ux/blockdag-escrow
            - generic:
              - generic: ❝
              - paragraph: Safer than trust. Simpler than multisig.
              - generic: ❞
            - generic:
              - generic: No custody — funds locked in contract
              - generic: No accounts — just connect and go
              - generic: No unilateral withdrawals
              - generic: AI arbitration — fast, unbiased, on-chain
              - generic: "Multi-chain: Base, Polygon, BlockDAG"
          - generic:
            - generic:
              - generic:
                - paragraph: Welcome to EscrowHubs
                - paragraph: Connect your wallet and create a secure escrow in under a minute.
              - link "Go to Dashboard →":
                - /url: /en/dashboard
            - generic:
              - link "⬡ Create New Escrow Start a simple or milestone escrow in seconds":
                - /url: /en/create
                - generic: ⬡
                - heading "Create New Escrow" [level=3]
                - paragraph: Start a simple or milestone escrow in seconds
              - link "🔍 View Existing Open your dashboard to manage active escrows":
                - /url: /en/dashboard
                - generic: 🔍
                - heading "View Existing" [level=3]
                - paragraph: Open your dashboard to manage active escrows
          - generic:
            - generic:
              - generic: 🛡️
              - heading "Simple Escrow" [level=3]
              - paragraph: Lock funds for any P2P deal. Released only when you confirm delivery — or an arbiter resolves the dispute.
            - generic:
              - generic: ◈
              - heading "Milestone Payments" [level=3]
              - paragraph: Break large projects into phases. Release each milestone independently as work is delivered and verified.
            - generic:
              - generic: ⚡
              - heading "AI Dispute Resolution" [level=3]
              - paragraph: AI reviews evidence from both parties and issues a binding on-chain ruling in minutes. No lawyers, no delays.
          - generic:
            - generic:
              - generic:
                - generic: 📘
                - generic:
                  - heading "How EscrowHubs Works" [level=3]
                  - paragraph: Learn how to use escrows with anyone worldwide. See how roles work, how funds move, and how disputes are resolved — all on-chain.
                - link "Open Guide →":
                  - /url: /en/learn
          - generic:
            - generic:
              - generic: 🤖 Powered by AI
              - heading "Disputes Resolved by AI, Not Lawyers" [level=2]
              - paragraph: Select AI Arbiter when creating an escrow. Both parties have 48 hours to submit evidence — our AI oracle reviews it and executes the ruling on-chain automatically.
            - generic:
              - generic:
                - paragraph: "01"
                - paragraph: Dispute raised
                - paragraph: Either party marks the escrow as disputed. Both sides are notified immediately.
              - generic:
                - paragraph: "02"
                - paragraph: Evidence submitted
                - paragraph: Both parties submit evidence — text, screenshots, or file links — directly on-chain.
              - generic:
                - paragraph: "03"
                - paragraph: AI reviews
                - paragraph: Our oracle fetches all evidence and sends it to an AI model for impartial analysis.
              - generic:
                - paragraph: "04"
                - paragraph: Automatic resolution
                - paragraph: The AI ruling is signed and executed on-chain. Funds released or refunded within minutes.
            - generic:
              - generic:
                - paragraph: AI Arbiter Pricing
                - paragraph: 0.5% protocol fee on all escrows · +0.5 MATIC flat fee when AI Arbiter is selected
              - link "Create Escrow →":
                - /url: /en/create
          - generic:
            - generic:
              - generic:
                - generic:
                  - generic: live
                - paragraph: "0"
                - paragraph: Total Escrows
              - generic:
                - generic:
                  - generic: live
                - paragraph: 0.00ETH
                - paragraph: ETH Locked
              - generic:
                - generic:
                  - generic: live
                - paragraph: 100%
                - paragraph: Success Rate
              - generic:
                - paragraph: "56"
                - paragraph: Chain ID
              - generic:
                - paragraph: "0"
                - paragraph: Exploits
        - contentinfo:
          - generic:
            - generic:
              - generic:
                - generic:
                  - generic: EscrowHubs
                - paragraph: Trustless escrow powered by Base
                - paragraph: © 2026 EscrowHubs. All rights reserved.
              - generic:
                - heading "Product" [level=3]
                - list:
                  - listitem:
                    - link "Create Escrow":
                      - /url: /create
                  - listitem:
                    - link "Dashboard":
                      - /url: /dashboard
                  - listitem:
                    - link "How It Works":
                      - /url: /how-it-works
                  - listitem:
                    - link "Pricing":
                      - /url: /#pricing
              - generic:
                - heading "Resources" [level=3]
                - list:
                  - listitem:
                    - link "FAQ":
                      - /url: /learn/faq
                  - listitem:
                    - link "Security":
                      - /url: /security
                  - listitem:
                    - link "GitHub":
                      - /url: https://github.com/philipmisner63-ux/blockdag-escrow
                  - listitem:
                    - link "Documentation":
                      - /url: "#"
                  - listitem:
                    - button "Take a Tour"
                  - listitem:
                    - button "Support"
                  - listitem:
                    - button "Suggest a Feature"
              - generic:
                - heading "Community" [level=3]
                - list:
                  - listitem:
                    - link "Twitter / X":
                      - /url: https://x.com/
                      - text: Twitter / X
                      - img
                  - listitem:
                    - link "Telegram":
                      - /url: https://t.me/
                      - text: Telegram
                      - img
                  - listitem:
                    - link "Discord":
                      - /url: https://discord.gg/
                      - text: Discord
                      - img
          - generic:
            - generic:
              - generic:
                - img
                - text: Built on BNB Chain
              - generic:
                - link "Terms of Service":
                  - /url: "#"
                - generic: ·
                - link "Privacy Policy":
                  - /url: "#"
                - generic: ·
                - generic: © 2026 EscrowHubs — Patent Pending
  - dialog "Welcome to EscrowHubs 👋" [ref=e5]:
    - button "Close" [active] [ref=e6] [cursor=pointer]: ×
    - banner [ref=e8]: Welcome to EscrowHubs 👋
    - generic [ref=e9]: Secure P2P escrow enforced by smart contracts. No accounts, no custody, no middlemen. Let us show you around — takes 30 seconds.
    - contentinfo [ref=e10]:
      - generic [ref=e11]: 1 / 5
      - generic [ref=e12]:
        - button "←" [disabled]
        - button "Next →" [ref=e13] [cursor=pointer]
  - img
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import * as fs from 'fs';
  3  | import * as path from 'path';
  4  | 
  5  | const SITES = [
  6  |   { name: 'blockdag', url: 'https://app.escrowhubs.io' },
  7  |   { name: 'base',     url: 'https://base.escrowhubs.io' },
  8  |   { name: 'polygon',  url: 'https://polygon.escrowhubs.io' },
  9  |   { name: 'bsc',      url: 'https://bsc.escrowhubs.io' },
  10 | ];
  11 | 
  12 | const PAGES = ['/en', '/en/dashboard', '/en/create'];
  13 | 
  14 | for (const site of SITES) {
  15 |   test.describe(site.name, () => {
  16 | 
  17 |     test('landing page loads and has logo', async ({ page }) => {
  18 |       const errors: string[] = [];
  19 |       page.on('console', msg => {
  20 |         if (msg.type() === 'error') errors.push(msg.text());
  21 |       });
  22 | 
  23 |       const response = await page.goto(site.url + '/en', { waitUntil: 'domcontentloaded', timeout: 20000 });
  24 |       expect(response?.status()).toBeLessThan(400);
  25 | 
  26 |       // Wait for hydration
  27 |       await page.waitForTimeout(3000);
  28 | 
  29 |       // Check logo exists
  30 |       const logo = page.locator('[data-testid="brand-logo"]');
  31 |       await expect(logo).toBeVisible({ timeout: 10000 });
  32 | 
  33 |       // Screenshot
  34 |       const dir = path.join(__dirname, 'screenshots');
  35 |       if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  36 |       await page.screenshot({ path: path.join(dir, site.name + '-landing.png'), fullPage: false });
  37 | 
  38 |       // No critical console errors (filter out known noise)
  39 |       const critical = errors.filter(e =>
  40 |         !e.includes('lockdown') &&
  41 |         !e.includes('SES') &&
  42 |         !e.includes('woff2') &&
  43 |         !e.includes('preload') &&
  44 |         !e.includes('Removing') &&
  45 |         !e.includes('intrinsics')
  46 |       );
> 47 |       expect(critical, 'Console errors: ' + critical.join(', ')).toHaveLength(0);
     |                                                                  ^ Error: Console errors: Connecting to 'https://api.web3modal.org/appkit/v1/config?projectId=9401741cff120268fe4e4df8acbda44f&st=appkit&sv=html-core-1.7.8' violates the following Content Security Policy directive: "connect-src 'self' https://bsc-dataseed.binance.org https://bsc-dataseed1.binance.org https://bsc-dataseed2.binance.org https://bsc-rpc.publicnode.com https://*.walletconnect.com https://*.walletconnect.org wss://*.walletconnect.com wss://*.walletconnect.org https://*.cloudflare-eth.com https://explorer.walletconnect.com https://pulse.walletconnect.org https://api.etherscan.io https://api.bscscan.com https://api.pinata.cloud https://gateway.pinata.cloud https://ipfs.io https://cloudflare-ipfs.com". The action has been blocked., Fetch API cannot load https://api.web3modal.org/appkit/v1/config?projectId=9401741cff120268fe4e4df8acbda44f&st=appkit&sv=html-core-1.7.8. Refused to connect because it violates the document's Content Security Policy.
  48 |     });
  49 | 
  50 |     test('dashboard page loads', async ({ page }) => {
  51 |       const response = await page.goto(site.url + '/en/dashboard', { waitUntil: 'domcontentloaded', timeout: 20000 });
  52 |       expect(response?.status()).toBeLessThan(400);
  53 |     });
  54 | 
  55 |   });
  56 | }
  57 | 
```