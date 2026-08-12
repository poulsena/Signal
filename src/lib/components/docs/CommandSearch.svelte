<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '$lib/components/ui/Icon.svelte';

	type SearchItem = {
		title: string;
		category: 'Getting started' | 'Foundation' | 'Component' | 'Guidance';
		description: string;
		href: `#${string}`;
		keywords?: string;
	};

	const items: SearchItem[] = [
		{
			title: 'Overview',
			category: 'Getting started',
			description: 'Signal UI at a glance',
			href: '#top'
		},
		{
			title: 'Quick start',
			category: 'Getting started',
			description: 'Install and import components',
			href: '#quick-start',
			keywords: 'setup introduction'
		},
		{
			title: 'Design tokens',
			category: 'Foundation',
			description: 'Color, spacing, type, and elevation variables',
			href: '#foundation',
			keywords: 'css variables'
		},
		{
			title: 'Motion strategy',
			category: 'Foundation',
			description: 'Animation tools and reduced-motion behavior',
			href: '#motion',
			keywords: 'transition motion.dev'
		},
		{
			title: 'Typography',
			category: 'Foundation',
			description: 'Serif, sans, and monospace roles',
			href: '#typography',
			keywords: 'font type'
		},
		...[
			['Button', 'Triggers an action with a clear hierarchy'],
			['Checkbox', 'Captures an independent yes-or-no choice'],
			['Chip', 'Compact filters and removable values'],
			['Dialog', 'Contains a focused task'],
			['Icon', 'System-owned line icons'],
			['IconButton', 'Familiar actions in a compact footprint'],
			['Notice', 'Confirms an outcome without interrupting flow'],
			['RadioGroup', 'Select one option from a visible set'],
			['Select', 'Choose from a native option list'],
			['Sketch', 'Brand illustration for editorial moments'],
			['Switch', 'Control a setting with immediate feedback'],
			['TabBar', 'Keyboard-complete tab navigation'],
			['TextArea', 'Collect longer free-form input'],
			['TextField', 'Labeled text input with optional context']
		].map(([title, description]) => ({
			title,
			category: 'Component' as const,
			description,
			href: `#${title.toLowerCase()}` as `#${string}`
		})),
		{
			title: 'Contribution principles',
			category: 'Guidance',
			description: 'Rules for extending the component library',
			href: '#principles',
			keywords: 'contribute coherence api'
		}
	];

	let dialog: HTMLDialogElement;
	let searchInput: HTMLInputElement;
	let query = $state('');

	const results = $derived.by(() => {
		const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
		if (!terms.length) return items.slice(0, 8);

		return items.filter((item) => {
			const searchable = [item.title, item.category, item.description, item.keywords]
				.filter(Boolean)
				.join(' ')
				.toLowerCase();
			return terms.every((term) => searchable.includes(term));
		});
	});

	function openSearch() {
		if (!dialog.open) dialog.showModal();
		requestAnimationFrame(() => searchInput.focus());
	}

	function closeSearch() {
		dialog.close();
	}

	function handleShortcut(event: KeyboardEvent) {
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
			event.preventDefault();
			openSearch();
		}
	}

	function handleInputKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			closeSearch();
		} else if (event.key === 'ArrowDown') {
			event.preventDefault();
			dialog.querySelector<HTMLAnchorElement>('.result')?.focus();
		} else if (event.key === 'Enter' && results[0]) {
			event.preventDefault();
			goToResult(results[0].href);
		}
	}

	function handleResultKeydown(event: KeyboardEvent, index: number) {
		if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
		event.preventDefault();

		if (event.key === 'ArrowUp' && index === 0) {
			searchInput.focus();
			return;
		}

		const resultLinks = dialog.querySelectorAll<HTMLAnchorElement>('.result');
		const nextIndex = event.key === 'ArrowDown' ? index + 1 : index - 1;
		resultLinks[nextIndex]?.focus();
	}

	function goToResult(href: SearchItem['href']) {
		closeSearch();
		query = '';
		requestAnimationFrame(() => {
			document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
			window.history.pushState(null, '', href);
		});
	}

	onMount(() => {
		return () => {
			if (dialog?.open) dialog.close();
		};
	});
</script>

<svelte:window onkeydown={handleShortcut} />

<button class="search-trigger" type="button" aria-haspopup="dialog" onclick={openSearch}>
	<Icon name="search" size={15} />
	<span>Search documentation…</span>
	<kbd>⌘ K</kbd>
</button>

<dialog
	bind:this={dialog}
	aria-labelledby="documentation-search-title"
	onclose={() => (query = '')}
	onclick={(event) => event.target === dialog && closeSearch()}
>
	<div class="search-panel">
		<h2 id="documentation-search-title">Search documentation</h2>
		<div class="search-field">
			<Icon name="search" size={18} />
			<input
				bind:this={searchInput}
				bind:value={query}
				type="search"
				placeholder="Search components, foundations, and guides…"
				aria-label="Search documentation"
				autocomplete="off"
				onkeydown={handleInputKeydown}
			/>
			<button class="close-button" type="button" aria-label="Close search" onclick={closeSearch}>
				<Icon name="close" size={17} />
			</button>
		</div>

		<div class="results-heading">
			<span>{query.trim() ? 'Search results' : 'Suggested pages'}</span>
			<small aria-live="polite"
				>{results.length} {results.length === 1 ? 'result' : 'results'}</small
			>
		</div>

		<div class="results">
			{#each results as result (result.href)}
				<a
					class="result"
					href={result.href}
					onkeydown={(event) => handleResultKeydown(event, results.indexOf(result))}
					onclick={(event) => {
						event.preventDefault();
						goToResult(result.href);
					}}
				>
					<span class="result-copy">
						<strong>{result.title}</strong>
						<small>{result.description}</small>
					</span>
					<span class="category">{result.category}</span>
					<Icon name="arrow-right" size={15} />
				</a>
			{:else}
				<div class="empty-state">
					<Icon name="search" size={22} />
					<strong>No documentation found</strong>
					<span>Try a component name or a broader term.</span>
				</div>
			{/each}
		</div>

		<footer>
			<span><kbd>↑↓</kbd> navigate</span><span><kbd>↵</kbd> open</span><span
				><kbd>esc</kbd> close</span
			>
		</footer>
	</div>
</dialog>

<style>
	.search-trigger {
		width: min(23rem, 32vw);
		min-height: 2.35rem;
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 0.55rem;
		padding: 0 0.55rem 0 0.75rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-md);
		background: var(--surface);
		color: var(--ink-muted);
		font: inherit;
		text-align: left;
		cursor: pointer;
		transition: all var(--duration-fast);
	}
	.search-trigger:hover {
		border-color: var(--line-strong);
		box-shadow: 0 3px 12px rgb(41 39 35 / 0.06);
	}
	.search-trigger > span {
		overflow: hidden;
		font-size: 0.7rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	kbd {
		padding: 0.2rem 0.36rem;
		border: 1px solid var(--line);
		border-bottom-color: var(--line-strong);
		border-radius: 0.35rem;
		background: var(--surface-muted);
		color: var(--ink-faint);
		font-family: var(--font-mono);
		font-size: 0.55rem;
	}
	.search-trigger:focus-visible,
	.close-button:focus-visible,
	.result:focus-visible {
		outline: 3px solid var(--focus);
		outline-offset: 2px;
	}
	dialog {
		--search-dialog-top: clamp(5rem, 12vh, 8rem);
		position: fixed;
		inset: var(--search-dialog-top) 0 auto;
		width: min(calc(100% - 2rem), 39rem);
		max-height: min(42rem, calc(100dvh - var(--search-dialog-top) - 2rem));
		margin: 0 auto;
		padding: 0;
		overflow: hidden;
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-xl);
		background: var(--surface);
		color: var(--ink);
		box-shadow: var(--shadow-float);
	}
	dialog::backdrop {
		background: rgb(25 23 20 / 0.56);
		backdrop-filter: blur(4px);
	}
	.search-panel {
		display: grid;
		grid-template-rows: auto auto minmax(0, 1fr) auto;
		max-height: min(42rem, calc(100dvh - var(--search-dialog-top) - 2rem));
	}
	h2 {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
	.search-field {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 0.75rem;
		padding: 0.85rem 0.9rem 0.85rem 1.1rem;
		border-bottom: 1px solid var(--line);
		color: var(--ink-muted);
	}
	input {
		min-width: 0;
		padding: 0;
		border: 0;
		outline: 0;
		background: transparent;
		color: var(--ink);
		font: inherit;
		font-size: 0.92rem;
	}
	input::placeholder {
		color: var(--ink-faint);
	}
	input::-webkit-search-cancel-button {
		display: none;
	}
	.close-button {
		width: 2rem;
		height: 2rem;
		display: grid;
		place-items: center;
		padding: 0;
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
		background: var(--surface-muted);
		color: var(--ink-muted);
		cursor: pointer;
	}
	.results-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1.1rem 0.45rem;
		color: var(--ink-faint);
		font-family: var(--font-mono);
		font-size: 0.58rem;
		font-weight: 650;
		text-transform: uppercase;
		letter-spacing: 0.07em;
	}
	.results-heading small {
		font: inherit;
		text-transform: none;
		letter-spacing: 0;
	}
	.results {
		display: grid;
		align-content: start;
		gap: 0.2rem;
		padding: 0.25rem 0.55rem 0.75rem;
		overflow-y: auto;
	}
	.result {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto auto;
		align-items: center;
		gap: 0.8rem;
		min-height: 3.8rem;
		padding: 0.65rem 0.75rem;
		border-radius: var(--radius-md);
		color: var(--ink-muted);
		transition:
			background var(--duration-fast),
			color var(--duration-fast);
	}
	.result:hover,
	.result:focus-visible {
		background: var(--surface-muted);
		color: var(--ink);
	}
	.result-copy {
		min-width: 0;
		display: grid;
		gap: 0.2rem;
	}
	.result-copy strong {
		color: var(--ink);
		font-size: 0.74rem;
		font-weight: 650;
	}
	.result-copy small {
		overflow: hidden;
		color: var(--ink-muted);
		font-size: 0.62rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.category {
		padding: 0.24rem 0.42rem;
		border-radius: var(--radius-pill);
		background: var(--surface-muted);
		color: var(--ink-faint);
		font-family: var(--font-mono);
		font-size: 0.52rem;
	}
	.empty-state {
		min-height: 12rem;
		display: grid;
		place-items: center;
		align-content: center;
		gap: 0.45rem;
		color: var(--ink-faint);
		text-align: center;
	}
	.empty-state strong {
		color: var(--ink);
		font-size: 0.78rem;
	}
	.empty-state span {
		font-size: 0.68rem;
	}
	footer {
		display: flex;
		gap: 1rem;
		padding: 0.65rem 1rem;
		border-top: 1px solid var(--line);
		color: var(--ink-faint);
		font-size: 0.58rem;
	}
	footer span {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}
	footer kbd {
		padding: 0;
		border: 0;
		background: transparent;
	}
	@media (max-width: 700px) {
		.search-trigger {
			width: 2.4rem;
			grid-template-columns: 1fr;
			place-items: center;
			padding: 0;
			border-radius: 50%;
		}
		.search-trigger > span,
		.search-trigger > kbd,
		.category {
			display: none;
		}
		.result {
			grid-template-columns: minmax(0, 1fr) auto;
		}
		footer {
			display: none;
		}
	}
</style>
