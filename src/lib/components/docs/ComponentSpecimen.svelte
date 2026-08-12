<script lang="ts">
	import type { Snippet } from 'svelte';
	import { motionReveal } from '$lib/motion';
	import TabBar from '$lib/components/ui/TabBar.svelte';
	import StatusBadge from './StatusBadge.svelte';
	import CodeBlock from './CodeBlock.svelte';

	let {
		name,
		description,
		code,
		status = 'stable',
		children
	}: {
		name: string;
		description: string;
		code: string;
		status?: 'stable' | 'beta' | 'draft';
		children: Snippet;
	} = $props();

	let view = $state('Preview');
	const generatedId = $props.id();
</script>

<article class="specimen" id={name.toLowerCase()} use:motionReveal>
	<header class="specimen-header">
		<div>
			<div class="component-name"><code>&lt;{name} /&gt;</code><StatusBadge {status} /></div>
			<p>{description}</p>
		</div>
		<code class="source-path">$lib/components/ui/{name}.svelte</code>
	</header>
	<div class="view-switcher">
		<TabBar
			items={['Preview', 'Code']}
			label={`${name} specimen view`}
			panelId={`${generatedId}-panel`}
			bind:selected={view}
		/>
	</div>
	<div
		class="stage"
		class:code-view={view === 'Code'}
		id={`${generatedId}-panel`}
		role="tabpanel"
		aria-label={`${view} for ${name}`}
	>
		{#if view === 'Preview'}
			{@render children()}
		{:else}
			<CodeBlock {code} />
		{/if}
	</div>
</article>

<style>
	.specimen {
		display: flex;
		flex-direction: column;
		scroll-margin-top: 6.5rem;
		overflow: hidden;
		border: 1px solid var(--line);
		border-radius: var(--radius-xl);
		background: var(--surface);
		box-shadow: var(--shadow-card);
	}
	.specimen-header {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: 2rem;
		padding: 1.3rem 1.4rem 1.05rem;
	}
	.component-name {
		display: flex;
		align-items: center;
		gap: 0.65rem;
	}
	.component-name > code {
		color: var(--ink);
		font-family: var(--font-mono);
		font-size: 0.86rem;
		font-weight: 650;
	}
	.specimen-header p {
		margin: 0.42rem 0 0;
		color: var(--ink-muted);
		font-size: 0.72rem;
		line-height: 1.45;
	}
	.source-path {
		margin-top: 0.2rem;
		color: var(--ink-faint);
		font-family: var(--font-mono);
		font-size: 0.59rem;
	}
	.view-switcher {
		display: flex;
		padding: 0.45rem 1.4rem;
		border-top: 1px solid var(--line);
		border-bottom: 1px solid var(--line);
	}
	.stage {
		flex: 1;
		min-height: 15.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.7rem;
		padding: 2rem;
		background-color: var(--surface-muted);
		background-image: radial-gradient(var(--line-strong) 0.7px, transparent 0.7px);
		background-size: 16px 16px;
	}
	.stage.code-view {
		display: block;
		padding: 1rem;
		background-image: none;
	}
	@media (max-width: 700px) {
		.source-path {
			display: none;
		}
		.specimen-header {
			padding: 1.1rem;
		}
		.view-switcher {
			padding: 0 1.1rem;
		}
		.stage {
			min-height: 14rem;
			padding: 1.2rem;
			flex-wrap: wrap;
		}
	}
</style>
