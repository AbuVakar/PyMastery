import { expect, test } from '@playwright/test';

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

for (const viewport of viewports) {
  test(`${viewport.name} layout stays full width and footer remains aligned`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);

    const horizontalOverflow = await page.evaluate(
      () => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
    );
    expect(horizontalOverflow).toBeLessThanOrEqual(2);

    const footer = page.locator('footer');
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();

    const footerBox = await footer.boundingBox();
    expect(footerBox?.width ?? 0).toBeGreaterThan(viewport.width * 0.8);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('\uFFFD');
  });
}

test('navigation links and protected redirects are working', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.context().clearCookies();
  await page.goto('/');

  const loginLink = page.locator('nav').first().getByRole('link', { name: /^log in$/i });
  await expect(loginLink).toBeVisible();
  await loginLink.click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);

  await page.locator('nav').first().getByRole('link', { name: /pymastery/i }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('offline page has clean text encoding', async ({ page }) => {
  await page.goto('/offline.html');
  await expect(page).toHaveTitle(/offline/i);
  const html = await page.content();
  expect(html).not.toContain('\uFFFD');
});
