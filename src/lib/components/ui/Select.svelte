<script lang="ts">
	import type { HTMLSelectAttributes } from 'svelte/elements';
	import Icon from './Icon.svelte';

	export type SelectOption = { label: string; value: string; disabled?: boolean };

	interface Props extends Omit<HTMLSelectAttributes, 'value'> {
		label: string;
		options: SelectOption[];
		placeholder?: string;
		hint?: string;
		error?: string;
		value?: string;
	}

	let {
		label,
		options,
		placeholder,
		hint,
		error,
		value = $bindable(''),
		id,
		class: className = '',
		...rest
	}: Props = $props();

	const generatedId = $props.id();
	let selectId = $derived(id ?? `${generatedId}-select`);
	let descriptionId = $derived(hint || error ? `${selectId}-description` : undefined);
</script>

<div class={`field ${className}`}>
	<label for={selectId}>{label}</label>
	<span class="select-wrap">
		<select
			{...rest}
			id={selectId}
			bind:value
			class:invalid={Boolean(error)}
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={descriptionId}
		>
			{#if placeholder}<option value="" disabled>{placeholder}</option>{/if}
			{#each options as option (option.value)}
				<option value={option.value} disabled={option.disabled}>{option.label}</option>
			{/each}
		</select>
		<span class="chevron" aria-hidden="true"><Icon name="chevron-down" size={16} /></span>
	</span>
	{#if error}<span class="message error" id={descriptionId}>{error}</span>
	{:else if hint}<span class="message" id={descriptionId}>{hint}</span>{/if}
</div>

<style>
	.field {
		display: grid;
		gap: var(--space-2);
	}
	label {
		color: var(--ink-soft);
		font-size: var(--text-sm);
		font-weight: 650;
	}
	.select-wrap {
		position: relative;
	}
	select {
		width: 100%;
		height: var(--control-md);
		appearance: none;
		padding: 0 2.6rem 0 0.92rem;
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-md);
		background: var(--surface);
		color: var(--ink);
		font-size: var(--text-sm);
		outline: none;
	}
	select:focus-visible {
		outline: 2px solid var(--focus);
		outline-offset: 1px;
	}
	select.invalid {
		border-color: var(--red);
	}
	.chevron {
		position: absolute;
		right: 0.85rem;
		top: 50%;
		display: grid;
		transform: translateY(-50%);
		color: var(--ink-muted);
		pointer-events: none;
	}
	.message {
		color: var(--ink-muted);
		font-size: var(--text-xs);
	}
	.message.error {
		color: var(--red);
	}
</style>
