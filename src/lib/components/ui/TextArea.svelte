<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLTextareaAttributes, 'value'> {
		label: string;
		hint?: string;
		error?: string;
		value?: string;
	}

	let {
		label,
		hint,
		error,
		value = $bindable(''),
		id,
		class: className = '',
		rows = 4,
		...rest
	}: Props = $props();

	const generatedId = $props.id();
	let textareaId = $derived(id ?? `${generatedId}-textarea`);
	let descriptionId = $derived(hint || error ? `${textareaId}-description` : undefined);
</script>

<div class={`field ${className}`}>
	<label for={textareaId}>{label}</label>
	<textarea
		{...rest}
		id={textareaId}
		{rows}
		bind:value
		class:invalid={Boolean(error)}
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={descriptionId}></textarea>
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
	textarea {
		width: 100%;
		min-height: 7rem;
		resize: vertical;
		padding: 0.8rem 0.92rem;
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-md);
		background: var(--surface);
		color: var(--ink);
		font-size: var(--text-sm);
		line-height: var(--leading-normal);
		outline: none;
	}
	textarea:focus-visible {
		outline: 2px solid var(--focus);
		outline-offset: 1px;
	}
	textarea.invalid {
		border-color: var(--red);
	}
	.message {
		color: var(--ink-muted);
		font-size: var(--text-xs);
	}
	.message.error {
		color: var(--red);
	}
</style>
