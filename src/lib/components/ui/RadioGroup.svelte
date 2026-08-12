<script lang="ts">
	export type RadioOption = {
		label: string;
		value: string;
		description?: string;
		disabled?: boolean;
	};

	let {
		label,
		options,
		value = $bindable(''),
		name,
		disabled = false
	}: {
		label: string;
		options: RadioOption[];
		value?: string;
		name?: string;
		disabled?: boolean;
	} = $props();

	const generatedId = $props.id();
	let groupName = $derived(name ?? `${generatedId}-radio`);
</script>

<fieldset {disabled}>
	<legend>{label}</legend>
	<div class="options">
		{#each options as option, index (option.value)}
			<label class="option">
				<input
					type="radio"
					name={groupName}
					value={option.value}
					bind:group={value}
					disabled={option.disabled}
					aria-describedby={option.description ? `${generatedId}-${index}-description` : undefined}
				/>
				<span class="copy">
					<strong>{option.label}</strong>
					{#if option.description}
						<small id={`${generatedId}-${index}-description`}>{option.description}</small>
					{/if}
				</span>
			</label>
		{/each}
	</div>
</fieldset>

<style>
	fieldset {
		min-width: 0;
		margin: 0;
		padding: 0;
		border: 0;
	}
	legend {
		margin-bottom: var(--space-3);
		color: var(--ink-soft);
		font-size: var(--text-sm);
		font-weight: 650;
	}
	.options {
		display: grid;
		gap: var(--space-3);
	}
	.option {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: start;
		gap: var(--space-3);
		cursor: pointer;
	}
	input {
		inline-size: 1.25rem;
		block-size: 1.25rem;
		margin: 0.05rem 0 0;
		accent-color: var(--ink);
	}
	input:disabled ~ .copy,
	fieldset:disabled .option {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.copy {
		display: grid;
		gap: var(--space-1);
	}
	.copy strong {
		font-size: var(--text-sm);
	}
	.copy small {
		color: var(--ink-muted);
		font-size: var(--text-xs);
		line-height: var(--leading-normal);
	}
</style>
