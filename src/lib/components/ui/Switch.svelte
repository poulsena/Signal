<script lang="ts">
	let {
		label,
		description,
		checked = $bindable(false),
		disabled = false
	}: { label: string; description?: string; checked?: boolean; disabled?: boolean } = $props();
</script>

<button
	type="button"
	class="switch-row"
	class:disabled
	role="switch"
	aria-checked={checked}
	{disabled}
	onclick={() => (checked = !checked)}
>
	<span class="copy">
		<strong>{label}</strong>
		{#if description}<small>{description}</small>{/if}
	</span>
	<span class="track" class:on={checked} aria-hidden="true"><span class="thumb"></span></span>
</button>

<style>
	.switch-row {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0;
		border: 0;
		background: transparent;
		text-align: left;
		color: var(--ink);
		font: inherit;
		cursor: pointer;
	}
	.copy {
		display: grid;
		gap: 0.18rem;
	}
	.copy strong {
		color: var(--ink);
		font-size: 0.86rem;
		font-weight: 650;
	}
	.copy small {
		color: var(--ink-soft);
		font-size: 0.74rem;
		line-height: 1.35;
	}
	.track {
		flex: 0 0 auto;
		width: 2.65rem;
		height: 1.55rem;
		padding: 0.17rem;
		display: flex;
		align-items: center;
		border-radius: var(--radius-pill);
		background: var(--line-strong);
		transition: background var(--duration-fast) var(--ease-out);
	}
	.track.on {
		background: var(--ink);
	}
	.thumb {
		width: 1.21rem;
		height: 1.21rem;
		border-radius: 50%;
		background: var(--surface);
		box-shadow: 0 1px 4px rgb(30 28 26 / 0.18);
		transform: translateX(0);
		transition: transform var(--duration-fast) var(--ease-spring);
	}
	.track.on .thumb {
		transform: translateX(1.1rem);
	}
	.switch-row:focus-visible {
		outline: 3px solid var(--focus);
		outline-offset: 5px;
		border-radius: var(--radius-sm);
	}
	.switch-row.disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
</style>
