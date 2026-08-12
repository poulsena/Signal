<script lang="ts" module>
	export type PropRow = { name: string; type: string; defaultValue: string; description: string };
</script>

<script lang="ts">
	let { rows }: { rows: PropRow[] } = $props();
</script>

<div class="table-wrap">
	<table>
		<thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
		<tbody>
			{#each rows as row (row.name)}
				<tr
					><td><code>{row.name}</code></td><td><code>{row.type}</code></td><td
						><code>{row.defaultValue}</code></td
					><td>{row.description}</td></tr
				>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.table-wrap {
		overflow-x: auto;
		border: 1px solid var(--line);
		border-radius: var(--radius-lg);
		background: var(--surface);
	}
	table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
		font-size: 0.68rem;
	}
	th,
	td {
		padding: 0.78rem 1rem;
		border-bottom: 1px solid var(--line);
	}
	th {
		color: var(--ink-faint);
		font-family: var(--font-mono);
		font-size: 0.58rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	td {
		color: var(--ink-muted);
	}
	tbody tr:last-child td {
		border-bottom: 0;
	}
	td:first-child code {
		color: var(--peach-deep);
	}
	code {
		color: var(--ink-soft);
		font-family: var(--font-mono);
		font-size: 0.64rem;
	}
</style>
