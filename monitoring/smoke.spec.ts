import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SITES = [
  { name: 'blockdag', url: 'https://app.escrowhubs.io' },
  { name: 'base',     url: 'https://base.escrowhubs.io' },
  { name: 'polygon',  url: 'https://polygon.escrowhubs.io' },
  { name: 'bsc',      url: 'https://bsc.escrowhubs.io' },
];

const PAGES = ['/en', '/en/dashboard', '/en/create'];

for (const site of SITES) {
  test.describe(site.name, () => {

    test('landing page loads and has logo', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
      });

      const response = await page.goto(site.url + '/en', { waitUntil: 'domcontentloaded', timeout: 20000 });
      expect(response?.status()).toBeLessThan(400);

      // Wait for hydration
      await page.waitForTimeout(3000);

      // Check logo exists (may appear in both nav and footer)
      const logo = page.locator('[data-testid="brand-logo"]').first();
      await expect(logo).toBeVisible({ timeout: 10000 });

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
        !e.includes('intrinsics')
      );
      expect(critical, 'Console errors: ' + critical.join(', ')).toHaveLength(0);
    });

    test('dashboard page loads', async ({ page }) => {
      const response = await page.goto(site.url + '/en/dashboard', { waitUntil: 'domcontentloaded', timeout: 20000 });
      expect(response?.status()).toBeLessThan(400);
    });

  });
}
