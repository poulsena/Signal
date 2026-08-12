<script lang="ts">
	const colors = [
		{ name: '--ink', value: '#292723' },
		{ name: '--surface', value: '#FCFBF8' },
		{ name: '--peach', value: '#F4C7AD' },
		{ name: '--lavender', value: '#DCD7F5' },
		{ name: '--mint', value: '#CAE5D7' },
		{ name: '--sky', value: '#CFE2F1' },
		{ name: '--red', value: '#A64439' },
		{ name: '--focus', value: '#8F5A42' }
	];

	const foundations = [
		{
			title: 'Spacing',
			tokens: [
				'--space-1',
				'--space-2',
				'--space-3',
				'--space-4',
				'--space-5',
				'--space-6',
				'--space-7'
			]
		},
		{
			title: 'Type',
			tokens: [
				'--text-xs',
				'--text-sm',
				'--text-md',
				'--text-lg',
				'--leading-tight',
				'--leading-normal'
			]
		},
		{
			title: 'Shape & size',
			tokens: [
				'--radius-sm',
				'--radius-md',
				'--radius-lg',
				'--radius-xl',
				'--control-sm',
				'--control-md'
			]
		},
		{
			title: 'Motion & layers',
			tokens: [
				'--duration-fast',
				'--duration-medium',
				'--ease-out',
				'--ease-spring',
				'--z-header',
				'--z-overlay'
			]
		}
	];

	let copied = $state('');

	async function copyToken(name: string) {
		await navigator.clipboard?.writeText(`var(${name})`);
		copied = name;
		window.setTimeout(() => (copied = ''), 1100);
	}
</script>

<div class="token-grid">
	{#each colors as token (token.name)}
		<button
			type="button"
			aria-label={`Copy ${token.name} token`}
			onclick={() => copyToken(token.name)}
		>
			<span class="color" style={`--swatch: ${token.value}`}></span>
			<span class="meta"
				><code>{token.name}</code><small>{copied === token.name ? 'Copied' : token.value}</small
				></span
			>
		</button>
	{/each}
</div>

<div class="foundation-grid">
	{#each foundations as group (group.title)}
		<section>
			<h3>{group.title}</h3>
			<div>
				{#each group.tokens as token (token)}
					<button type="button" onclick={() => copyToken(token)}>
						<code>{token}</code><span>{copied === token ? 'Copied' : 'Copy'}</span>
					</button>
				{/each}
			</div>
		</section>
	{/each}
</div>

<style>
	.token-grid {
		display: grid;
		grid-template-columns: repeat(8, minmax(0, 1fr));
		gap: var(--space-2);
	}
	.token-grid button {
		min-width: 0;
		padding: 0;
		overflow: hidden;
		border: 1px solid var(--line);
		border-radius: var(--radius-lg);
		background: var(--surface);
		color: var(--ink);
		text-align: left;
		cursor: pointer;
		transition:
			transform var(--duration-fast),
			box-shadow var(--duration-fast);
	}
	.token-grid button:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-card);
	}
	button:focus-visible {
		outline: 2px solid var(--focus);
		outline-offset: 2px;
	}
	.color {
		display: block;
		height: 4.6rem;
		border-bottom: 1px solid var(--line);
		background: var(--swatch);
	}
	.meta {
		display: grid;
		gap: var(--space-1);
		padding: var(--space-3);
	}
	code {
		overflow: hidden;
		color: var(--ink-soft);
		font-family: var(--font-mono);
		font-size: 0.64rem;
		text-overflow: ellipsis;
	}
	small {
		color: var(--ink-muted);
		font-family: var(--font-mono);
		font-size: 0.58rem;
	}
	.foundation-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: var(--space-3);
		margin-top: var(--space-3);
	}
	.foundation-grid section {
		padding: var(--space-4);
		border: 1px solid var(--line);
		border-radius: var(--radius-lg);
		background: var(--surface);
	}
	.foundation-grid h3 {
		margin: 0 0 var(--space-3);
		font-size: var(--text-xs);
	}
	.foundation-grid section > div {
		display: grid;
		gap: var(--space-1);
	}
	.foundation-grid button {
		display: flex;
		justify-content: space-between;
		gap: var(--space-2);
		padding: var(--space-1) 0;
		border: 0;
		background: transparent;
		color: var(--ink-muted);
		cursor: pointer;
	}
	.foundation-grid button span {
		font-size: 0.6rem;
		opacity: 0;
	}
	.foundation-grid button:hover span,
	.foundation-grid button:focus-visible span {
		opacity: 1;
	}
	@media (max-width: 900px) {
		.token-grid,
		.foundation-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}
	@media (max-width: 520px) {
		.token-grid,
		.foundation-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
