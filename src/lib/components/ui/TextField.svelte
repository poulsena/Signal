<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Icon, { type IconName } from './Icon.svelte';

	interface Props extends Omit<HTMLInputAttributes, 'type' | 'value'> {
		label: string;
		placeholder?: string;
		icon?: IconName;
		type?: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url';
		hint?: string;
		error?: string;
		value?: string;
	}

	let {
		label,
		placeholder = '',
		icon,
		type = 'text',
		hint,
		error,
		value = $bindable(''),
		id,
		class: className = '',
		...rest
	}: Props = $props();

	const generatedId = $props.id();
	let inputId = $derived(id ?? `${generatedId}-input`);
	let descriptionId = $derived(hint || error ? `${inputId}-description` : undefined);
</script>

<div class={`field ${className}`}>
	<label class="label" for={inputId}>{label}</label>
	<span class="input-wrap">
		{#if icon}<span class="leading"><Icon name={icon} size={17} /></span>{/if}
		<input
			{...rest}
			id={inputId}
			{type}
			{placeholder}
			bind:value
			class:with-icon={icon}
			class:invalid={Boolean(error)}
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={descriptionId}
		/>
	</span>
	{#if error}
		<span class="message error" id={descriptionId}>{error}</span>
	{:else if hint}
		<span class="message" id={descriptionId}>{hint}</span>
	{/if}
</div>

<style>
	.field {
		display: grid;
		gap: var(--space-2);
	}
	.label {
		color: var(--ink-soft);
		font-size: var(--text-sm);
		font-weight: 650;
	}
	.input-wrap {
		position: relative;
		display: block;
	}
	.leading {
		position: absolute;
		left: 0.92rem;
		top: 50%;
		transform: translateY(-50%);
		color: var(--ink-muted);
		display: grid;
		pointer-events: none;
	}
	input {
		width: 100%;
		height: var(--control-md);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-md);
		background: var(--surface);
		padding: 0 0.92rem;
		color: var(--ink);
		font: inherit;
		font-size: var(--text-sm);
		outline: none;
		transition:
			border-color var(--duration-fast),
			box-shadow var(--duration-fast),
			background var(--duration-fast);
	}
	input.with-icon {
		padding-left: 2.65rem;
	}
	input::placeholder {
		color: var(--ink-muted);
	}
	input:hover:not(:disabled) {
		border-color: var(--ink-muted);
	}
	input:focus-visible {
		border-color: var(--ink);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--focus) 28%, transparent);
		outline: 2px solid var(--focus);
		outline-offset: 1px;
	}
	input.invalid {
		border-color: var(--red);
	}
	input:disabled {
		cursor: not-allowed;
		opacity: 0.55;
	}
	.message {
		color: var(--ink-muted);
		font-size: var(--text-xs);
		line-height: var(--leading-normal);
	}
	.message.error {
		color: var(--red);
	}
</style>
