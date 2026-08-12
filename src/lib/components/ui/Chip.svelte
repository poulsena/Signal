<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { motionPress } from '$lib/motion';
	import Icon from './Icon.svelte';

	interface Props extends HTMLButtonAttributes {
		label: string;
		removable?: boolean;
		active?: boolean;
	}

	let { label, removable = false, active = false, ...rest }: Props = $props();
</script>

<button
	{...rest}
	use:motionPress={0.96}
	type="button"
	class:active
	class="chip"
	aria-pressed={active}
	aria-label={removable ? `Remove ${label}` : undefined}
>
	<span>{label}</span>
	{#if removable}<Icon name="close" size={13} strokeWidth={2} />{/if}
</button>

<style>
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.32rem;
		padding: 0.42rem 0.68rem;
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-pill);
		background: var(--surface-muted);
		color: var(--ink);
		font: inherit;
		font-size: 0.74rem;
		font-weight: 650;
		cursor: pointer;
		transition: all var(--duration-fast);
	}
	.chip:hover {
		border-color: var(--line-strong);
		color: var(--ink);
	}
	.chip.active {
		background: var(--mint);
		border-color: transparent;
		color: var(--ink-on-pastel);
	}
	.chip:focus-visible {
		outline: 2px solid var(--focus);
		outline-offset: 2px;
	}
</style>
