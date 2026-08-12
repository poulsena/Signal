<script lang="ts">
	let { status = 'stable' }: { status?: 'stable' | 'beta' | 'draft' } = $props();
</script>

<span class={`status ${status}`}>
	<span aria-hidden="true"></span>
	{status}
</span>

<style>
	.status {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.3rem 0.52rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-pill);
		background: var(--surface);
		color: var(--ink-muted);
		font-family: var(--font-mono);
		font-size: 0.61rem;
		font-weight: 600;
		text-transform: capitalize;
	}
	.status > span {
		width: 0.38rem;
		height: 0.38rem;
		border-radius: 50%;
		background: var(--mint-deep);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--mint) 55%, transparent);
	}
	.status.beta > span {
		background: var(--peach-deep);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--peach) 55%, transparent);
	}
	.status.draft > span {
		background: var(--ink-faint);
		box-shadow: none;
	}
</style>
