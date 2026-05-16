import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Per-site config. i18n frontends use /en prefix; Celo uses root paths.
const SITES = [
  { name: 'blockdag', url: 'https://app.escrowhubs.io',    pages: ['/en', '/en/dashboard', '/en/create'] },
  { name: 'base',     url: 'https://base.escrowhubs.io',   pages: ['/en', '/en/dashboard', '/en/create'] },
  { name: 'polygon',  url: 'https://polygon.escrowhubs.io',pages: ['/en', '/en/dashboard', '/en/create'] },
  { name: 'bsc',      url: 'https://bsc.escrowhubs.io',    pages: ['/en', '/en/dashboard', '/en/create'] },
  { name: 'celo',     url: 'https://celo.escrowhubs.io',   pages: ['/', '/create', '/escrows'] },
];

for (const site of SITES) {
  const landing = site.pages[0];
  const dashboard = site.pages[1];

  test.describe(site.name, () => {

    test('landing page loads and has logo', async ({ page }) => {
      const errors: string[] = [];
      const failedRequests: string[] = [];

      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
      });

      page.on('response', res => {
        if (res.status() === 404 && (res.url().includes('.css') || res.url().includes('.js'))) {
          failedRequests.push(res.url());
        }
      });

      // Use 'load' instead of 'networkidle' — SPAs with background polling make networkidle flaky
      const response = await page.goto(site.url + landing, { waitUntil: 'load', timeout: 20000 });
      expect(response?.status()).toBeLessThan(400);

      // Wait for SPA hydration and any late-rendered content
      await page.waitForTimeout(2000);

      // Check logo/brand exists — match visible text, image alt, or testid
      // Different frontends render the brand differently:
      //   - Celo: h1 text "EscrowHubs 🟢"
      //   - Base/BlockDAG/Polygon/BSC: BrandLogo img with alt="EscrowHubs" + "Welcome to EscrowHubs" text
      const brandByText = page.locator('text=EscrowHubs').first();
      const brandByAlt = page.locator('[alt="EscrowHubs"]').first();
      const brandByTestId = page.locator('[data-testid="brand-logo"]').first();
      await expect(brandByText.or(brandByAlt).or(brandByTestId)).toBeVisible({ timeout: 10000 });

      // Check that CSS actually loaded — body or html should have dark background or gradient
      const pageStyles = await page.evaluate(() => {
        const body = getComputedStyle(document.body);
        const html = getComputedStyle(document.documentElement);
        return {
          bodyBg: body.backgroundColor,
          bodyBgImage: body.backgroundImage,
          htmlBg: html.backgroundColor,
          htmlBgImage: html.backgroundImage,
        };
      });
      const isDark = (color: string) => {
        const rgb = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        return rgb ? (parseInt(rgb[1]) < 50 && parseInt(rgb[2]) < 50 && parseInt(rgb[3]) < 50) : false;
      };
      const hasGradient = (img: string) => img !== 'none';
      const backgroundOK =
        isDark(pageStyles.bodyBg) || hasGradient(pageStyles.bodyBgImage) ||
        isDark(pageStyles.htmlBg) || hasGradient(pageStyles.htmlBgImage);
      expect(
        backgroundOK,
        `CSS missing — body bg: ${pageStyles.bodyBg} / ${pageStyles.bodyBgImage}, html bg: ${pageStyles.htmlBg} / ${pageStyles.htmlBgImage} (expected dark theme)`
      ).toBe(true);

      // Screenshot
      const dir = path.join(__dirname, 'screenshots');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: path.join(dir, site.name + '-landing.png'), fullPage: false });

      // No critical console errors (filter out known noise)
      const critical = errors.filter(e =>
        !e.includes('lockdown') &&
        !e.includes('SES') &&
        !e.includes('woff2') &&
        !e.includes('preload') &&
        !e.includes('Removing') &&
        !e.includes('intrinsics') &&
        !e.includes('Content Security Policy') &&
        !e.includes('unrecognized feature') &&   // MiniPay / wallet provider noise
        !e.includes('deprecated') &&               // Browser deprecation warnings
        !e.includes('WebSocket')                  // Wallet provider WebSocket noise
      );
      expect(critical, 'Console errors: ' + critical.join(', ')).toHaveLength(0);

      // No failed CSS/JS requests
      expect(failedRequests, '404 on static assets: ' + failedRequests.join(', ')).toHaveLength(0);
    });

    test('dashboard page loads', async ({ page }) => {
      const response = await page.goto(site.url + dashboard, { waitUntil: 'domcontentloaded', timeout: 20000 });
      expect(response?.status()).toBeLessThan(400);
    });

  });
}
