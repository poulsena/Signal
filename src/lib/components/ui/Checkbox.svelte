<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Icon from './Icon.svelte';

	interface Props extends Omit<HTMLInputAttributes, 'type' | 'checked'> {
		label: string;
		description?: string;
		checked?: boolean;
	}

	let {
		label,
		description,
		checked = $bindable(false),
		id,
		class: className = '',
		...rest
	}: Props = $props();

	const generatedId = $props.id();
	let inputId = $derived(id ?? `${generatedId}-checkbox`);
	let descriptionId = $derived(description ? `${inputId}-description` : undefined);
</script>

<label class={`checkbox ${className}`} for={inputId}>
	<input {...rest} id={inputId} type="checkbox" bind:checked aria-describedby={descriptionId} />
	<span class="indicator" aria-hidden="true"><Icon name="check" size={14} strokeWidth={2.4} /></span
	>
	<span class="copy">
		<strong>{label}</strong>
		{#if description}<small id={descriptionId}>{description}</small>{/if}
	</span>
</label>

<style>
	.checkbox {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: start;
		gap: var(--space-3);
		color: var(--ink);
		cursor: pointer;
	}
	input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}
	.indicator {
		width: 1.25rem;
		height: 1.25rem;
		display: grid;
		place-items: center;
		margin-top: 0.05rem;
		border: 1px solid var(--line-strong);
		border-radius: 0.38rem;
		background: var(--surface);
		color: transparent;
		transition: all var(--duration-fast) var(--ease-out);
	}
	input:checked + .indicator {
		border-color: var(--ink);
		background: var(--ink);
		color: var(--surface);
	}
	input:focus-visible + .indicator {
		outline: 2px solid var(--focus);
		outline-offset: 2px;
	}
	input:disabled + .indicator,
	input:disabled ~ .copy {
		opacity: 0.5;
	}
	.copy {
		display: grid;
		gap: var(--space-1);
	}
	.copy strong {
		font-size: var(--text-sm);
		font-weight: 650;
	}
	.copy small {
		color: var(--ink-muted);
		font-size: var(--text-xs);
		line-height: var(--leading-normal);
	}
</style>
