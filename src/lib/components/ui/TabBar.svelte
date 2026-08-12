<script lang="ts">
	let {
		items,
		selected = $bindable(),
		label = 'Tabs',
		panelId
	}: { items: string[]; selected?: string; label?: string; panelId?: string } = $props();

	const generatedId = $props.id();

	function selectFromKeyboard(event: KeyboardEvent, index: number) {
		let nextIndex: number | undefined;
		if (event.key === 'ArrowRight') nextIndex = (index + 1) % items.length;
		if (event.key === 'ArrowLeft') nextIndex = (index - 1 + items.length) % items.length;
		if (event.key === 'Home') nextIndex = 0;
		if (event.key === 'End') nextIndex = items.length - 1;
		if (nextIndex === undefined) return;

		event.preventDefault();
		selected = items[nextIndex];
		const tabs = (event.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLElement>(
			'[role="tab"]'
		);
		tabs?.[nextIndex]?.focus();
	}
</script>

<div class="tab-bar" role="tablist" aria-label={label}>
	{#each items as item, index (item)}
		<button
			type="button"
			role="tab"
			id={`${generatedId}-tab-${index}`}
			aria-controls={panelId}
			aria-selected={selected === item}
			tabindex={selected === item ? 0 : -1}
			class:active={selected === item}
			onclick={() => (selected = item)}
			onkeydown={(event) => selectFromKeyboard(event, index)}
		>
			{item}
		</button>
	{/each}
</div>

<style>
	.tab-bar {
		display: inline-flex;
		align-items: center;
		padding: 0.24rem;
		border-radius: var(--radius-pill);
		background: var(--surface-muted);
		border: 1px solid var(--line);
	}
	button {
		min-width: 4.7rem;
		padding: 0.48rem 0.72rem;
		border: 0;
		border-radius: var(--radius-pill);
		background: transparent;
		color: var(--ink-muted);
		font: inherit;
		font-size: var(--text-xs);
		font-weight: 650;
		cursor: pointer;
		transition: all var(--duration-fast) var(--ease-out);
	}
	button:hover,
	button.active {
		color: var(--ink);
	}
	button.active {
		background: var(--surface);
		box-shadow: 0 1px 6px rgb(34 31 27 / 0.08);
	}
	button:focus-visible {
		outline: 2px solid var(--focus);
		outline-offset: 1px;
	}
</style>
