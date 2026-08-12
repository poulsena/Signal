import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
	await page.addInitScript(() => localStorage.setItem('signal-theme', 'light'));
	await page.goto('/docs/design-system');
	await expect(page.locator('.hero-copy')).toHaveCSS('opacity', '1');
});

test('@a11y has no automatically detectable WCAG A/AA violations', async ({ page }) => {
	const results = await new AxeBuilder({ page })
		.withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
		.analyze();
	expect(results.violations).toEqual([]);
});

test('@a11y dark theme has no automatically detectable WCAG A/AA violations', async ({ page }) => {
	await page.getByRole('button', { name: 'Use dark appearance' }).click();
	await expect(page.getByRole('button', { name: 'Use light appearance' })).toBeVisible();
	await page.waitForTimeout(300);
	const results = await new AxeBuilder({ page })
		.withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
		.analyze();
	expect(results.violations).toEqual([]);
});

test('uses a neutral selected style for the dark-theme toggle', async ({ page }) => {
	await page.getByRole('button', { name: 'Use dark appearance' }).click();
	const toggle = page.getByRole('button', { name: 'Use light appearance' });
	await expect(toggle).toHaveCSS('background-color', 'rgb(52, 49, 45)');
	await expect(toggle).toHaveCSS('border-top-color', 'rgba(255, 255, 255, 0.24)');
});

test('keeps selected IconButtons legible in dark mode', async ({ page }) => {
	await page.getByRole('button', { name: 'Use dark appearance' }).click();
	const favorite = page.locator('#iconbutton button.icon-button').first();
	await favorite.click();
	await expect(favorite).toHaveCSS('background-color', 'rgb(95, 70, 80)');
	await expect(favorite).toHaveCSS('color', 'rgb(247, 244, 237)');
});

test('keeps native RadioGroup controls perfectly round', async ({ page }) => {
	const radio = page.locator('#radiogroup input[type="radio"]').first();
	const box = await radio.boundingBox();
	expect(box).not.toBeNull();
	expect(box!.width).toBeCloseTo(box!.height, 2);
});

test('documents the motion strategy', async ({ page }) => {
	await expect(page.locator('#motion')).toContainText('Motion.dev');
	await expect(page.locator('#motion')).toContainText('Lifecycle changes');
	await expect(page.locator('#motion')).toContainText('Micro-interactions');
});

test('supports keyboard tab navigation', async ({ page }) => {
	const defaultTab = page.getByRole('tab', { name: 'Default' });
	await defaultTab.focus();
	await defaultTab.press('ArrowRight');
	await expect(page.getByRole('tab', { name: 'Loading' })).toHaveAttribute('aria-selected', 'true');
});

test('keeps utility component previews inside their cards', async ({ page }) => {
	await expect(page.locator('#switch .chips')).toHaveCount(0);
	await expect(page.locator('#tabbar .utility-tab-preview')).toHaveCSS('flex-direction', 'column');
	const card = await page.locator('#tabbar').boundingBox();
	const tabBar = await page.locator('#tabbar .utility-preview .tab-bar').boundingBox();
	expect(card).not.toBeNull();
	expect(tabBar).not.toBeNull();
	expect(tabBar!.x + tabBar!.width).toBeLessThanOrEqual(card!.x + card!.width);
});

test('searches the documentation instead of jumping to components', async ({ page }) => {
	await page.getByRole('button', { name: 'Search documentation' }).click();
	const dialog = page.getByRole('dialog', { name: 'Search documentation' });
	const search = page.getByRole('searchbox', { name: 'Search documentation' });
	await expect(search).toBeFocused();
	await search.fill('radio');
	await expect(dialog.getByRole('link', { name: /RadioGroup/ })).toBeVisible();
	await expect(dialog.getByRole('link', { name: /Button/ })).toHaveCount(0);

	await dialog.getByRole('link', { name: /RadioGroup/ }).click();
	await expect(page).toHaveURL(/#radiogroup$/);
	await expect(page.getByRole('dialog', { name: 'Search documentation' })).not.toBeVisible();
});

test('opens documentation search with the advertised keyboard shortcut', async ({ page }) => {
	await page.keyboard.press('ControlOrMeta+KeyK');
	await expect(page.getByRole('searchbox', { name: 'Search documentation' })).toBeFocused();
});

test('closes documentation search with Escape while the search input is focused', async ({
	page
}) => {
	await page.getByRole('button', { name: 'Search documentation' }).click();
	const dialog = page.getByRole('dialog', { name: 'Search documentation' });
	const search = page.getByRole('searchbox', { name: 'Search documentation' });
	await search.fill('button');
	await search.press('Escape');
	await expect(dialog).not.toBeVisible();
});

test('positions documentation search below the top and centered in the viewport', async ({
	page
}) => {
	await page.getByRole('button', { name: 'Search documentation' }).click();
	const box = await page.getByRole('dialog', { name: 'Search documentation' }).boundingBox();
	expect(box).not.toBeNull();
	expect(box!.y).toBeGreaterThanOrEqual(64);
	expect(Math.abs(box!.x + box!.width / 2 - page.viewportSize()!.width / 2)).toBeLessThan(2);
});

test('keeps mobile header actions inside the header', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	const headerBox = await page.locator('.topbar').boundingBox();
	const themeBox = await page.getByRole('button', { name: 'Use dark appearance' }).boundingBox();
	expect(headerBox).not.toBeNull();
	expect(themeBox).not.toBeNull();
	expect(themeBox!.y).toBeGreaterThanOrEqual(headerBox!.y);
	expect(themeBox!.y + themeBox!.height).toBeLessThanOrEqual(headerBox!.y + headerBox!.height);
});
