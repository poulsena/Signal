import { page, userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import DesignSystemTestHarness from './DesignSystemTestHarness.svelte';

describe('Signal UI accessibility contracts', () => {
	it('connects field labels, descriptions, errors, and native attributes', async () => {
		render(DesignSystemTestHarness);

		const email = page.getByRole('textbox', { name: 'Email address', exact: true });
		await expect.element(email).toHaveAttribute('name', 'email');
		await expect.element(email).toHaveAttribute('autocomplete', 'email');
		await expect.element(email).toHaveAttribute('aria-describedby');

		const invalid = page.getByRole('textbox', { name: 'Workspace slug' });
		await expect.element(invalid).toHaveAttribute('aria-invalid', 'true');
		await expect.element(page.getByText('Use lowercase letters only.')).toBeVisible();
	});

	it('implements the keyboard tabs pattern', async () => {
		render(DesignSystemTestHarness);

		const overview = page.getByRole('tab', { name: 'Overview' });
		await overview.click();
		await userEvent.keyboard('{ArrowRight}');

		await expect
			.element(page.getByRole('tab', { name: 'Activity' }))
			.toHaveAttribute('aria-selected', 'true');
		await expect
			.element(page.getByRole('tabpanel', { name: 'Activity panel' }))
			.toHaveTextContent('Activity');
	});

	it('exposes state through native and ARIA semantics', async () => {
		render(DesignSystemTestHarness);

		await expect.element(page.getByRole('button', { name: 'Saving changes' })).toBeDisabled();
		await expect
			.element(page.getByRole('button', { name: 'Thoughtful' }))
			.toHaveAttribute('aria-pressed', 'true');
		await expect.element(page.getByRole('checkbox', { name: /Email summaries/ })).toBeChecked();
		await expect.element(page.getByRole('radio', { name: 'Studio' })).toBeChecked();
		await expect.element(page.getByRole('combobox', { name: 'Region' })).toHaveValue('eu');
	});

	it('opens and closes the native modal dialog', async () => {
		render(DesignSystemTestHarness);

		await page.getByRole('button', { name: 'Open test dialog' }).click();
		await expect.element(page.getByRole('dialog', { name: 'Test dialog' })).toBeVisible();
		await page.getByRole('button', { name: 'Done' }).click();
		expect(document.querySelector('dialog')?.hasAttribute('open')).toBe(false);
	});
});
