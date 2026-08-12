<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';

	let { code, label = 'Svelte' }: { code: string; label?: string } = $props();
	let copied = $state(false);

	async function copyCode() {
		await navigator.clipboard?.writeText(code);
		copied = true;
		window.setTimeout(() => (copied = false), 1200);
	}
</script>

<div class="code-block">
	<header>
		<div class="traffic" aria-hidden="true"><span></span><span></span><span></span></div>
		<span>{label}</span>
		<button type="button" aria-label="Copy code" onclick={copyCode}>
			<Icon name={copied ? 'check' : 'copy'} size={14} />
			{copied ? 'Copied' : 'Copy'}
		</button>
	</header>
	<pre><code>{code}</code></pre>
</div>

<style>
	.code-block {
		width: 100%;
		overflow: hidden;
		border: 1px solid rgb(255 255 255 / 0.1);
		border-radius: var(--radius-lg);
		background: #252421;
		color: #eeebe4;
		box-shadow: inset 0 1px rgb(255 255 255 / 0.04);
	}
	header {
		height: 2.55rem;
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		padding: 0 0.75rem;
		border-bottom: 1px solid rgb(255 255 255 / 0.08);
		color: rgb(255 255 255 / 0.58);
		font-family: var(--font-mono);
		font-size: 0.62rem;
	}
	.traffic {
		display: flex;
		gap: 0.34rem;
	}
	.traffic span {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background: rgb(255 255 255 / 0.14);
	}
	.traffic span:first-child {
		background: var(--peach);
	}
	.traffic span:nth-child(2) {
		background: var(--lavender);
	}
	.traffic span:last-child {
		background: var(--mint);
	}
	button {
		justify-self: end;
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.32rem 0.45rem;
		border: 0;
		border-radius: var(--radius-sm);
		background: transparent;
		color: rgb(255 255 255 / 0.58);
		font: inherit;
		cursor: pointer;
	}
	button:hover {
		color: white;
		background: rgb(255 255 255 / 0.08);
	}
	button:focus-visible {
		outline: 3px solid var(--lavender);
	}
	pre {
		min-height: 8.6rem;
		margin: 0;
		padding: 1.2rem 1.3rem;
		overflow: auto;
		font-family: var(--font-mono);
		font-size: 0.75rem;
		line-height: 1.75;
		tab-size: 2;
		white-space: pre-wrap;
	}
</style>
