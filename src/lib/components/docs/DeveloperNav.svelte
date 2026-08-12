<script lang="ts">
	import { resolve } from '$app/paths';
	import Icon from '$lib/components/ui/Icon.svelte';

	const groups = [
		{
			title: 'Getting started',
			items: [
				{ label: 'Overview', href: '/#top' },
				{ label: 'Quick start', href: '/#quick-start' }
			]
		},
		{
			title: 'Foundations',
			items: [
				{ label: 'Tokens', href: '/#foundation' },
				{ label: 'Motion', href: '/#motion' },
				{ label: 'Typography', href: '/#typography' },
				{ label: 'Principles', href: '/#principles' }
			]
		},
		{
			title: 'Components',
			items: [
				{ label: 'Button', href: '/#button' },
				{ label: 'Checkbox', href: '/#checkbox' },
				{ label: 'Chip', href: '/#chip' },
				{ label: 'Dialog', href: '/#dialog' },
				{ label: 'Icon', href: '/#icon' },
				{ label: 'IconButton', href: '/#iconbutton' },
				{ label: 'Notice', href: '/#notice' },
				{ label: 'RadioGroup', href: '/#radiogroup' },
				{ label: 'Select', href: '/#select' },
				{ label: 'Sketch', href: '/#sketch' },
				{ label: 'Switch', href: '/#switch' },
				{ label: 'TabBar', href: '/#tabbar' },
				{ label: 'TextArea', href: '/#textarea' },
				{ label: 'TextField', href: '/#textfield' }
			]
		}
	] as const;
</script>

<aside class="sidebar">
	<nav aria-label="Documentation index">
		{#each groups as group (group.title)}
			<div class="nav-group">
				<h2>{group.title}</h2>
				{#each group.items as item (item.href)}
					<a href={resolve(item.href)} class:active={item.href === '/#top'}>
						{item.label}
						{#if group.title === 'Components'}<span aria-label="stable"></span>{/if}
					</a>
				{/each}
			</div>
		{/each}
	</nav>
	<div class="coverage">
		<span class="coverage-icon"><Icon name="check" size={14} /></span>
		<div><strong>14 components</strong><small>10 specimens · 4 utilities</small></div>
	</div>
</aside>

<style>
	.sidebar {
		position: sticky;
		top: 4rem;
		height: calc(100vh - 4rem);
		display: flex;
		flex-direction: column;
		padding: 1.7rem 1.25rem 1.3rem;
		border-right: 1px solid var(--line);
		background: color-mix(in srgb, var(--canvas) 92%, transparent);
	}
	nav {
		overflow-y: auto;
		padding-bottom: 1rem;
	}
	.nav-group + .nav-group {
		margin-top: 1.6rem;
	}
	h2 {
		margin: 0 0 0.5rem 0.65rem;
		color: var(--ink-faint);
		font-family: var(--font-mono);
		font-size: 0.58rem;
		font-weight: 650;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}
	a {
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: 2.05rem;
		padding: 0 0.65rem;
		border-radius: var(--radius-sm);
		color: var(--ink-muted);
		font-size: 0.72rem;
		font-weight: 570;
		transition: all var(--duration-fast);
	}
	a:hover {
		background: var(--surface-muted);
		color: var(--ink);
	}
	a.active {
		background: var(--surface);
		color: var(--ink);
		box-shadow: inset 0 0 0 1px var(--line);
	}
	a > span {
		width: 0.35rem;
		height: 0.35rem;
		border-radius: 50%;
		background: var(--mint-deep);
	}
	.coverage {
		flex: 0 0 auto;
		margin-top: auto;
		display: flex;
		align-items: center;
		gap: 0.65rem;
		padding: 0.75rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-md);
		background: var(--surface);
	}
	.coverage-icon {
		width: 1.7rem;
		height: 1.7rem;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: var(--mint);
		color: #292723;
	}
	.coverage div {
		display: grid;
		gap: 0.1rem;
	}
	.coverage strong {
		font-size: 0.65rem;
	}
	.coverage small {
		color: var(--ink-muted);
		font-size: 0.55rem;
	}
	@media (max-width: 980px) {
		.sidebar {
			display: none;
		}
	}
</style>
