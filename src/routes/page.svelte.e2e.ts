import { expect, test } from '@playwright/test';

test('opens the application entry point', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'Signal' })).toBeVisible();
});
