<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { motionPress } from '$lib/motion';
	import Icon, { type IconName } from './Icon.svelte';

	interface Props extends HTMLButtonAttributes {
		icon: IconName;
		label: string;
		selected?: boolean;
		tone?: 'default' | 'soft';
	}

	let {
		icon,
		label,
		selected,
		'aria-pressed': ariaPressed,
		tone = 'default',
		class: className = '',
		...rest
	}: Props = $props();
</script>

<button
	{...rest}
	use:motionPress={0.94}
	class={`icon-button ${tone} ${selected ? 'selected' : ''} ${className}`}
	aria-label={label}
	aria-pressed={ariaPressed ?? (selected !== undefined ? Boolean(selected) : undefined)}
	title={label}
>
	<Icon name={icon} size={18} />
</button>

<style>
	.icon-button {
		width: 2.65rem;
		height: 2.65rem;
		display: inline-grid;
		place-items: center;
		border: 1px solid var(--line);
		border-radius: 50%;
		background: var(--surface-glass);
		color: var(--ink-soft);
		cursor: pointer;
		backdrop-filter: blur(16px);
		transition: all var(--duration-fast) var(--ease-out);
	}
	.icon-button.soft {
		background: var(--surface-muted);
		border-color: transparent;
	}
	.icon-button:hover {
		color: var(--ink);
		border-color: var(--line-strong);
		transform: translateY(-1px);
	}
	.icon-button.selected {
		background: var(--pink);
		color: var(--ink);
		border-color: transparent;
	}
	/* Theme switching is a mode control, not a pastel status chip. */
	.icon-button.theme-toggle.selected {
		background: var(--surface-muted);
		color: var(--ink);
		border-color: var(--line-strong);
		box-shadow: inset 0 0 0 1px var(--line);
	}
	.icon-button:focus-visible {
		outline: 2px solid var(--focus);
		outline-offset: 2px;
	}
</style>
