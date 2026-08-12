<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';
	import { motionPress } from '$lib/motion';
	import Icon, { type IconName } from './Icon.svelte';

	type Variant = 'primary' | 'secondary' | 'quiet' | 'danger';
	type Size = 'small' | 'medium';

	interface Props extends HTMLButtonAttributes {
		variant?: Variant;
		size?: Size;
		icon?: IconName;
		loading?: boolean;
		children?: Snippet;
	}

	let {
		variant = 'primary',
		size = 'medium',
		icon,
		loading = false,
		children,
		class: className = '',
		disabled,
		...rest
	}: Props = $props();
</script>

<button
	{...rest}
	use:motionPress={0.975}
	class={`ds-button ${variant} ${size} ${className}`}
	disabled={disabled || loading}
	aria-busy={loading}
>
	{#if loading}
		<span class="spinner" aria-hidden="true"></span>
	{:else if icon}
		<Icon name={icon} size={size === 'small' ? 15 : 17} />
	{/if}
	{#if children}{@render children()}{/if}
</button>

<style>
	.ds-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.48rem;
		border: 1px solid transparent;
		border-radius: var(--radius-pill);
		font: inherit;
		font-weight: 650;
		letter-spacing: -0.01em;
		cursor: pointer;
		transition:
			transform var(--duration-fast) var(--ease-out),
			background var(--duration-fast) var(--ease-out),
			border-color var(--duration-fast) var(--ease-out),
			box-shadow var(--duration-fast) var(--ease-out);
	}
	.ds-button.medium {
		min-height: 2.75rem;
		padding: 0.68rem 1.08rem;
		font-size: 0.9rem;
	}
	.ds-button.small {
		min-height: 2.2rem;
		padding: 0.48rem 0.82rem;
		font-size: 0.8rem;
	}
	.ds-button.primary {
		background: var(--ink);
		color: var(--surface);
		box-shadow: var(--shadow-button);
	}
	.ds-button.primary:hover {
		background: var(--ink-soft);
		transform: translateY(-1px);
	}
	.ds-button.secondary {
		background: var(--surface);
		color: var(--ink);
		border-color: var(--line-strong);
	}
	.ds-button.secondary:hover {
		background: var(--canvas);
		border-color: var(--ink-muted);
	}
	.ds-button.quiet {
		background: transparent;
		color: var(--ink-soft);
	}
	.ds-button.quiet:hover {
		background: var(--surface-muted);
		color: var(--ink);
	}
	.ds-button.danger {
		background: var(--red-soft);
		color: var(--red);
	}
	.ds-button.danger:hover {
		background: #f6dcd8;
	}
	.ds-button:focus-visible {
		outline: 2px solid var(--focus);
		outline-offset: 2px;
	}
	.ds-button:disabled {
		opacity: 0.42;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}
	.spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid currentColor;
		border-right-color: transparent;
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
