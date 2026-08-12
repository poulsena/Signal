<script lang="ts">
	import { onMount } from 'svelte';
	import { motionReveal } from '$lib/motion';
	import {
		CodeBlock,
		CommandSearch,
		ComponentSpecimen,
		DeveloperNav,
		PropTable,
		StatusBadge,
		TokenGrid,
		type PropRow
	} from '$lib/components/docs';
	import {
		Button,
		Checkbox,
		Chip,
		Dialog,
		Icon,
		IconButton,
		Notice,
		RadioGroup,
		Select,
		Sketch,
		Switch,
		TabBar,
		TextArea,
		TextField
	} from '$lib/components/ui';

	let darkMode = $state(false);
	let notifications = $state(true);
	let selectedTab = $state('Default');
	let selectedUtilityTab = $state('Overview');
	let selectedChip = $state('Thoughtful');
	let toastVisible = $state(true);
	let liked = $state(false);
	let searchValue = $state('');
	let loading = $state(false);
	let themeReady = $state(false);
	let termsAccepted = $state(true);
	let selectedPlan = $state('studio');
	let selectedRegion = $state('eu');
	let notes = $state('');
	let dialogOpen = $state(false);

	const installCode = `import { Button, IconButton } from '$lib/components/ui';

<Button variant="primary" icon="arrow-right">
  Continue
</Button>`;

	const buttonCode = `<Button variant="primary">Continue</Button>
<Button variant="secondary" icon="plus">New item</Button>
<Button variant="quiet">Maybe later</Button>`;

	const iconButtonCode = `<IconButton
  icon="heart"
  label="Add to favorites"
  selected={liked}
/>`;

	const fieldCode = `<TextField
  label="Search"
  icon="search"
  placeholder="Find anything…"
  bind:value={query}
/>`;

	const switchCode = `<Switch
  label="Notifications"
  description="A gentle nudge when something matters."
  bind:checked={notifications}
/>`;

	const noticeCode = `<Notice
  title="Saved to your library"
  message="Everything is right where you left it."
  bind:visible={toastVisible}
/>`;

	const checkboxCode = `<Checkbox
  label="Email summaries"
  description="A concise digest every Friday."
  bind:checked={subscribed}
/>`;

	const radioCode = `<RadioGroup
  label="Workspace plan"
  options={plans}
  bind:value={plan}
/>`;

	const selectCode = `<Select
  label="Data region"
  options={regions}
  bind:value={region}
/>`;

	const textareaCode = `<TextArea
  label="Notes"
  hint="Keep it short and useful."
  bind:value={notes}
/>`;

	const dialogCode = `<Button onclick={() => (open = true)}>Open dialog</Button>

<Dialog title="Invite collaborator" bind:open>
  <TextField label="Email address" type="email" />
</Dialog>`;

	const plans = [
		{ label: 'Studio', value: 'studio', description: 'For focused product teams.' },
		{ label: 'Company', value: 'company', description: 'For multiple connected teams.' }
	];

	const regions = [
		{ label: 'Europe', value: 'eu' },
		{ label: 'United States', value: 'us' },
		{ label: 'Asia Pacific', value: 'apac' }
	];

	const buttonProps: PropRow[] = [
		{
			name: 'variant',
			type: "'primary' | 'secondary' | 'quiet' | 'danger'",
			defaultValue: "'primary'",
			description: 'Sets visual importance.'
		},
		{
			name: 'size',
			type: "'small' | 'medium'",
			defaultValue: "'medium'",
			description: 'Controls height and spacing.'
		},
		{
			name: 'icon',
			type: 'IconName',
			defaultValue: 'undefined',
			description: 'Optional leading icon.'
		},
		{
			name: 'loading',
			type: 'boolean',
			defaultValue: 'false',
			description: 'Shows progress and disables input.'
		}
	];

	function showLoading() {
		loading = true;
		window.setTimeout(() => (loading = false), 850);
	}

	onMount(() => {
		darkMode = document.documentElement.dataset.theme === 'dark';
		themeReady = true;
	});

	$effect(() => {
		if (!themeReady) return;
		const theme = darkMode ? 'dark' : 'light';
		document.documentElement.dataset.theme = theme;
		localStorage.setItem('signal-theme', theme);
	});
</script>

<svelte:head>
	<title>Signal UI — Developer preview</title>
	<meta name="description" content="Interactive documentation for the Signal design system." />
</svelte:head>

<div class="app-shell">
	<header class="topbar">
		<a class="brand" href="#top" aria-label="Signal UI documentation home">
			<span class="brand-mark"><Icon name="code" size={16} strokeWidth={1.8} /></span>
			<span>Signal</span><code>/ ui</code>
		</a>
		<CommandSearch />
		<div class="header-actions">
			<StatusBadge status="beta" />
			<span class="version">v0.1.0</span>
			<IconButton
				icon={darkMode ? 'sun' : 'moon'}
				label={darkMode ? 'Use light appearance' : 'Use dark appearance'}
				tone="soft"
				class="theme-toggle"
				selected={darkMode}
				onclick={() => (darkMode = !darkMode)}
			/>
		</div>
	</header>

	<div class="docs-layout">
		<DeveloperNav />
		<main id="top">
			<section class="hero">
				<div class="hero-copy" use:motionReveal={{ distance: 22 }}>
					<div class="package-line">
						<code>@signal/ui</code><span>Svelte 5</span><span>TypeScript</span><span>WCAG AA</span>
					</div>
					<h1>Design once.<br /><i>Ship consistently.</i></h1>
					<p>
						A calm component system with expressive details, predictable APIs, and production-minded
						defaults.
					</p>
					<div class="hero-actions">
						<Button
							icon="arrow-right"
							onclick={() =>
								document.querySelector('#quick-start')?.scrollIntoView({ behavior: 'smooth' })}
							>Get started</Button
						>
						<Button
							variant="secondary"
							icon="code"
							onclick={() =>
								document.querySelector('#components')?.scrollIntoView({ behavior: 'smooth' })}
							>Browse components</Button
						>
					</div>
				</div>
				<div class="hero-art" use:motionReveal={{ distance: 12, delay: 0.08 }}>
					<Sketch size={245} />
					<div class="build-card">
						<span class="pulse"></span>
						<div><code>build passing</code><small>14 components · 0 warnings</small></div>
						<Icon name="check" size={15} />
					</div>
				</div>
			</section>

			<section class="doc-section quick-start" id="quick-start">
				<div class="section-intro" use:motionReveal>
					<span class="section-kicker">00 · Introduction</span>
					<h2>Start with one import.</h2>
					<p>
						Components expose small, typed APIs and inherit the same design tokens automatically.
					</p>
				</div>
				<div class="quick-grid">
					<CodeBlock code={installCode} label="+page.svelte" />
					<div class="quick-notes">
						<div>
							<span>01</span>
							<p>
								<strong>Import from one place</strong><small
									>Every approved component is exported through the UI barrel.</small
								>
							</p>
						</div>
						<div>
							<span>02</span>
							<p>
								<strong>Compose with confidence</strong><small
									>Types, focus behavior, and motion defaults are included.</small
								>
							</p>
						</div>
						<div>
							<span>03</span>
							<p>
								<strong>Prototype before shipping</strong><small
									>New elements enter product UI only after specimen approval.</small
								>
							</p>
						</div>
					</div>
				</div>
			</section>

			<section class="doc-section" id="foundation">
				<div class="section-intro inline" use:motionReveal>
					<div>
						<span class="section-kicker">01 · Foundation</span>
						<h2>Tokens, not guesses.</h2>
					</div>
					<p>
						Semantic variables keep implementation language consistent with design intent. Select a
						token to copy its CSS variable.
					</p>
				</div>
				<TokenGrid />

				<div class="type-contract" id="typography">
					<div class="serif-sample">
						<span>Aa</span>
						<div>
							<code>--font-serif</code>
							<p>Character for editorial moments.</p>
						</div>
					</div>
					<div class="sans-sample">
						<span>Aa</span>
						<div>
							<code>--font-sans</code>
							<p>Clarity for interfaces and data.</p>
						</div>
					</div>
					<div class="mono-sample">
						<span>Aa</span>
						<div>
							<code>--font-mono</code>
							<p>Precision for paths, props, and tokens.</p>
						</div>
					</div>
				</div>

				<div class="motion-contract" id="motion">
					<div class="motion-contract-heading">
						<div>
							<span class="section-kicker">Interaction guidance</span>
							<h3>Use the lightest tool that fits.</h3>
						</div>
						<code>prefers-reduced-motion aware</code>
					</div>
					<div class="motion-contract-grid">
						<article>
							<code>CSS</code>
							<strong>Micro-interactions</strong>
							<p>Hover, focus, color, and small layout transitions stay in CSS.</p>
						</article>
						<article>
							<code>Svelte</code>
							<strong>Lifecycle changes</strong>
							<p>Use native transitions for simple conditional UI entering or leaving.</p>
						</article>
						<article>
							<code>Motion.dev</code>
							<strong>Behaviors with physics</strong>
							<p>Use shared actions for press feedback, springs, and in-view reveals.</p>
						</article>
					</div>
				</div>
			</section>

			<section class="doc-section" id="components">
				<div class="section-intro inline" use:motionReveal>
					<div>
						<span class="section-kicker">02 · Library</span>
						<h2>Components</h2>
					</div>
					<p>
						Switch every specimen between live behavior and its implementation. Stable components
						are ready for product prototypes.
					</p>
				</div>

				<div class="specimen-stack">
					<ComponentSpecimen
						name="Button"
						description="Triggers an action with a clear hierarchy."
						code={buttonCode}
					>
						<div class="button-preview">
							<TabBar
								items={['Default', 'Loading', 'Disabled']}
								label="Button states"
								panelId="button-state-panel"
								bind:selected={selectedTab}
							/>
							<div id="button-state-panel" role="tabpanel" aria-label="Button state examples">
								<Button
									loading={selectedTab === 'Loading' || loading}
									disabled={selectedTab === 'Disabled'}
									onclick={showLoading}>Continue</Button
								>
								<Button variant="secondary" icon="plus" disabled={selectedTab === 'Disabled'}
									>New item</Button
								>
								<Button variant="quiet" disabled={selectedTab === 'Disabled'}>Maybe later</Button>
							</div>
						</div>
					</ComponentSpecimen>
					<div class="api-block">
						<div class="api-heading">
							<h3>Button API</h3>
							<code>HTMLButtonAttributes</code>
						</div>
						<PropTable rows={buttonProps} />
					</div>

					<div class="specimen-pair">
						<ComponentSpecimen
							name="IconButton"
							description="Familiar actions in a compact footprint."
							code={iconButtonCode}
						>
							<IconButton
								icon="heart"
								label={liked ? 'Remove from favorites' : 'Add to favorites'}
								selected={liked}
								onclick={() => (liked = !liked)}
							/>
							<IconButton icon="bell" label="Notifications" />
							<IconButton icon="copy" label="Copy" />
							<IconButton icon="settings" label="Settings" />
						</ComponentSpecimen>

						<ComponentSpecimen
							name="TextField"
							description="Labeled input with optional context."
							code={fieldCode}
						>
							<div class="field-preview">
								<TextField
									label="Search"
									icon="search"
									placeholder="Find anything…"
									type="search"
									bind:value={searchValue}
								/><TextField
									label="Email address"
									placeholder="you@example.com"
									type="email"
									hint="Helpful context lives close to the field."
								/>
							</div>
						</ComponentSpecimen>
					</div>

					<div class="specimen-pair">
						<ComponentSpecimen
							name="Switch"
							description="Controls a setting with immediate feedback."
							code={switchCode}
						>
							<div class="choice-preview">
								<Switch
										label="Notifications"
										description="A gentle nudge when something matters."
										bind:checked={notifications}
									/><Switch
									label="Evening mode"
									description="A warmer palette after sunset."
									bind:checked={darkMode}
								/>
							</div>
						</ComponentSpecimen>

						<ComponentSpecimen
							name="Notice"
							description="Confirms an outcome without interrupting flow."
							code={noticeCode}
						>
							<div class="notice-preview">
								<Notice
									title="Saved to your library"
									message="Everything is right where you left it."
									bind:visible={toastVisible}
								/>{#if !toastVisible}<Button
										variant="secondary"
										size="small"
										onclick={() => (toastVisible = true)}>Show notification</Button
									>{/if}
							</div>
						</ComponentSpecimen>
					</div>

					<div class="specimen-pair">
						<ComponentSpecimen
							name="Checkbox"
							description="Captures an independent yes-or-no choice."
							code={checkboxCode}
						>
							<div class="field-preview">
								<Checkbox
									label="Email summaries"
									description="A concise digest every Friday."
									bind:checked={termsAccepted}
								/>
								<Checkbox label="Unavailable option" disabled />
							</div>
						</ComponentSpecimen>

						<ComponentSpecimen
							name="RadioGroup"
							description="Selects one option from a visible set."
							code={radioCode}
						>
							<div class="field-preview">
								<RadioGroup label="Workspace plan" options={plans} bind:value={selectedPlan} />
							</div>
						</ComponentSpecimen>
					</div>

					<div class="specimen-pair">
						<ComponentSpecimen
							name="Select"
							description="Chooses from a longer native option list."
							code={selectCode}
						>
							<div class="field-preview">
								<Select
									label="Data region"
									options={regions}
									hint="This controls where new data is stored."
									bind:value={selectedRegion}
								/>
							</div>
						</ComponentSpecimen>

						<ComponentSpecimen
							name="TextArea"
							description="Collects longer free-form input."
							code={textareaCode}
						>
							<div class="field-preview">
								<TextArea
									label="Notes"
									placeholder="Add useful context…"
									hint="Keep it short and useful."
									bind:value={notes}
								/>
							</div>
						</ComponentSpecimen>
					</div>

					<ComponentSpecimen
						name="Dialog"
						description="Contains a focused task with native focus trapping and Escape behavior."
						code={dialogCode}
					>
						<Button icon="plus" onclick={() => (dialogOpen = true)}>Invite collaborator</Button>
						<Dialog
							title="Invite collaborator"
							description="They will receive a secure invitation by email."
							bind:open={dialogOpen}
						>
							<TextField label="Email address" type="email" placeholder="you@example.com" />
							{#snippet footer()}
								<Button variant="quiet" onclick={() => (dialogOpen = false)}>Cancel</Button>
								<Button onclick={() => (dialogOpen = false)}>Send invitation</Button>
							{/snippet}
						</Dialog>
					</ComponentSpecimen>
				</div>

				<div class="utility-section" use:motionReveal>
					<div>
						<span class="section-kicker">Supporting utilities</span>
						<h3>Small pieces with a narrow job.</h3>
					</div>
					<div class="utility-grid">
						<article id="chip">
							<code>&lt;Chip /&gt;</code>
							<p>Compact filters and removable values.</p>
							<div class="utility-preview chips" role="group" aria-label="Choose a tone">
								{#each ['Thoughtful', 'Warm', 'Simple'] as chip (chip)}
									<Chip
										label={chip}
										active={selectedChip === chip}
										onclick={() => (selectedChip = chip)}
									/>
								{/each}
							</div>
						</article>
						<article id="tabbar">
							<code>&lt;TabBar /&gt;</code>
							<p>Keyboard-complete tab navigation.</p>
							<div class="utility-preview">
								<TabBar
									items={['Overview', 'Activity']}
									label="Utility example sections"
									panelId="utility-tab-panel"
									bind:selected={selectedUtilityTab}
								/>
								<span id="utility-tab-panel" role="tabpanel">{selectedUtilityTab}</span>
							</div>
						</article>
						<article id="icon">
							<code>&lt;Icon /&gt;</code>
							<p>Decorative system-owned line icons.</p>
							<div class="utility-preview icon-preview" aria-label="Icon examples">
								<Icon name="sparkle" size={22} />
								<Icon name="heart" size={22} />
								<Icon name="settings" size={22} />
								<Icon name="arrow-right" size={22} />
							</div>
						</article>
						<article id="sketch">
							<code>&lt;Sketch /&gt;</code>
							<p>Brand illustration for editorial moments.</p>
							<div class="utility-preview sketch-preview"><Sketch size={128} /></div>
						</article>
					</div>
				</div>
			</section>

			<section class="principles" id="principles">
				<div class="principle-lead">
					<span class="section-kicker">03 · Contribution rules</span>
					<h2>Built to stay coherent.</h2>
					<p>
						These constraints make the library easier to extend without losing its point of view.
					</p>
				</div>
				<div class="rules">
					<div>
						<code>01</code><span
							><strong>Compose before creating</strong><small
								>Prefer existing primitives over one-off UI.</small
							></span
						>
					</div>
					<div>
						<code>02</code><span
							><strong>Prototype every state</strong><small
								>Default, hover, focus, loading, disabled, and error.</small
							></span
						>
					</div>
					<div>
						<code>03</code><span
							><strong>Keep APIs small</strong><small
								>Add a prop only when composition cannot solve it clearly.</small
							></span
						>
					</div>
				</div>
			</section>

			<footer>
				<span>Signal UI · v1 foundation</span><code
					>14 components · semantic tokens · Motion powered</code
				><a href="#top">Back to top <Icon name="arrow-right" size={13} /></a>
			</footer>
		</main>
	</div>
</div>

<style>
	.app-shell {
		min-height: 100vh;
		overflow-x: clip;
		color: var(--ink);
		background: var(--canvas);
		transition:
			color var(--duration-medium),
			background var(--duration-medium);
	}
	.topbar {
		position: sticky;
		top: 0;
		z-index: var(--z-header);
		height: 4rem;
		display: grid;
		grid-template-columns: 15rem 1fr 15rem;
		align-items: center;
		gap: 1.5rem;
		padding: 0 1.25rem;
		border-bottom: 1px solid var(--line);
		background: color-mix(in srgb, var(--canvas) 86%, transparent);
		backdrop-filter: blur(20px) saturate(150%);
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 0.48rem;
		color: var(--ink);
		font-weight: 720;
		letter-spacing: -0.025em;
	}
	.brand-mark {
		width: 1.8rem;
		height: 1.8rem;
		display: grid;
		place-items: center;
		border-radius: 0.55rem;
		background: var(--peach);
		color: #292723;
	}
	.brand code {
		color: var(--ink-faint);
		font-family: var(--font-mono);
		font-size: 0.67rem;
		font-weight: 500;
		letter-spacing: 0;
	}
	.topbar :global(.command-search) {
		justify-self: center;
	}
	.header-actions {
		justify-self: end;
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}
	.version {
		color: var(--ink-faint);
		font-family: var(--font-mono);
		font-size: 0.59rem;
	}
	.docs-layout {
		display: grid;
		grid-template-columns: 15rem minmax(0, 1fr);
	}
	main {
		min-width: 0;
	}
	.hero,
	.doc-section,
	footer {
		max-width: 1080px;
		margin: 0 auto;
	}
	.hero {
		min-height: 34rem;
		display: grid;
		grid-template-columns: 1.15fr 0.85fr;
		align-items: center;
		gap: 3rem;
		padding: 5.5rem var(--page-gutter) 4.5rem;
	}
	.package-line {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}
	.package-line code {
		color: var(--peach-deep);
		font-family: var(--font-mono);
		font-size: 0.69rem;
		font-weight: 650;
	}
	.package-line span {
		padding: 0.27rem 0.45rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-pill);
		color: var(--ink-muted);
		font-family: var(--font-mono);
		font-size: 0.52rem;
	}
	h1 {
		margin: 0;
		font-family: var(--font-serif);
		font-size: clamp(3.8rem, 6vw, 6rem);
		font-weight: 400;
		line-height: 0.92;
		letter-spacing: -0.055em;
	}
	h1 i {
		color: var(--peach-deep);
		font-weight: 400;
	}
	.hero-copy > p {
		max-width: 35rem;
		margin: 1.7rem 0 0;
		color: var(--ink-muted);
		font-size: 0.95rem;
		line-height: 1.65;
	}
	.hero-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.65rem;
		margin-top: 2rem;
	}
	.hero-art {
		position: relative;
		display: grid;
		place-items: center;
		min-height: 19rem;
	}
	.hero-art::before {
		content: '';
		position: absolute;
		width: 17rem;
		aspect-ratio: 1;
		border: 1px dashed var(--line-strong);
		border-radius: 50%;
	}
	.build-card {
		position: absolute;
		right: 0;
		bottom: 0.2rem;
		width: 13rem;
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 0.55rem;
		padding: 0.68rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-md);
		background: var(--surface-glass);
		box-shadow: var(--shadow-card);
		backdrop-filter: blur(14px);
	}
	.pulse {
		width: 0.45rem;
		height: 0.45rem;
		border-radius: 50%;
		background: var(--mint-deep);
		box-shadow: 0 0 0 4px color-mix(in srgb, var(--mint) 58%, transparent);
	}
	.build-card div {
		display: grid;
		gap: 0.16rem;
	}
	.build-card code {
		font-family: var(--font-mono);
		font-size: 0.61rem;
	}
	.build-card small {
		color: var(--ink-muted);
		font-size: 0.52rem;
	}
	.build-card > :last-child {
		color: var(--mint-deep);
	}
	.doc-section {
		padding: 5.5rem var(--page-gutter);
		scroll-margin-top: 3.5rem;
		border-top: 1px solid var(--line);
	}
	.section-intro {
		margin-bottom: 2rem;
	}
	.section-intro.inline {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 3rem;
	}
	.section-kicker {
		display: block;
		margin-bottom: 0.65rem;
		color: var(--peach-deep);
		font-family: var(--font-mono);
		font-size: 0.59rem;
		font-weight: 650;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}
	.section-intro h2,
	.principle-lead h2 {
		margin: 0;
		font-family: var(--font-serif);
		font-size: clamp(2.4rem, 4vw, 3.6rem);
		font-weight: 400;
		letter-spacing: -0.045em;
	}
	.section-intro > p,
	.section-intro.inline > p {
		max-width: 31rem;
		margin: 0.8rem 0 0;
		color: var(--ink-muted);
		font-size: 0.76rem;
		line-height: 1.65;
	}
	.section-intro.inline > p {
		margin: 0;
	}
	.quick-grid {
		display: grid;
		grid-template-columns: 1.15fr 0.85fr;
		gap: 1rem;
	}
	.quick-notes {
		display: grid;
		overflow: hidden;
		border: 1px solid var(--line);
		border-radius: var(--radius-lg);
		background: var(--surface);
	}
	.quick-notes > div {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: center;
		gap: 0.8rem;
		padding: 0.85rem 1rem;
		border-bottom: 1px solid var(--line);
	}
	.quick-notes > div:last-child {
		border: 0;
	}
	.quick-notes > div > span {
		display: grid;
		place-items: center;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 50%;
		background: var(--surface-muted);
		color: var(--ink-faint);
		font-family: var(--font-mono);
		font-size: 0.55rem;
	}
	.quick-notes p {
		display: grid;
		gap: 0.18rem;
		margin: 0;
	}
	.quick-notes strong {
		font-size: 0.68rem;
	}
	.quick-notes small {
		color: var(--ink-muted);
		font-size: 0.59rem;
		line-height: 1.4;
	}
	.type-contract {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.65rem;
		margin-top: 0.65rem;
		scroll-margin-top: 5rem;
	}
	.motion-contract {
		margin-top: 2.5rem;
		padding: 1.25rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-lg);
		background: var(--surface);
	}
	.motion-contract-heading {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
	}
	.motion-contract h3 {
		margin: 0;
		font-size: 1.1rem;
		letter-spacing: -0.025em;
	}
	.motion-contract-heading > code {
		color: var(--ink-faint);
		font-family: var(--font-mono);
		font-size: 0.57rem;
	}
	.motion-contract-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.65rem;
	}
	.motion-contract-grid article {
		display: grid;
		gap: 0.3rem;
		padding: 0.9rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-md);
		background: var(--canvas);
	}
	.motion-contract-grid article > code {
		color: var(--peach-deep);
		font-family: var(--font-mono);
		font-size: 0.59rem;
		font-weight: 650;
	}
	.motion-contract-grid strong {
		font-size: 0.7rem;
	}
	.motion-contract-grid p {
		margin: 0;
		color: var(--ink-muted);
		font-size: 0.61rem;
		line-height: 1.5;
	}
	.type-contract > div {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		padding: 1rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-lg);
		background: var(--surface);
	}
	.type-contract > div > span {
		font-size: 2.1rem;
		letter-spacing: -0.08em;
	}
	.serif-sample > span {
		font-family: var(--font-serif);
	}
	.sans-sample > span {
		font-weight: 650;
	}
	.mono-sample > span {
		font-family: var(--font-mono);
	}
	.type-contract code {
		font-family: var(--font-mono);
		font-size: 0.59rem;
	}
	.type-contract p {
		margin: 0.25rem 0 0;
		color: var(--ink-muted);
		font-size: 0.57rem;
	}
	.specimen-stack {
		display: grid;
		gap: 1rem;
	}
	.specimen-pair {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
	}
	.button-preview {
		width: 100%;
		display: grid;
		place-items: center;
		gap: 1.2rem;
	}
	.button-preview > div {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.65rem;
	}
	.field-preview,
	.choice-preview {
		width: min(100%, 25rem);
		display: grid;
		gap: 0.9rem;
		padding: 1rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-lg);
		background: var(--surface-glass);
		backdrop-filter: blur(10px);
	}
	.choice-preview > :global(.switch-row) {
		padding-bottom: 0.9rem;
		border-bottom: 1px solid var(--line);
	}
	.chips {
		display: flex;
		gap: 0.45rem;
		padding-top: 0.2rem;
	}
	.notice-preview {
		width: 100%;
		display: grid;
		place-items: center;
		gap: 1rem;
	}
	.api-block {
		padding: 0 0 1rem;
	}
	.utility-section {
		display: grid;
		gap: var(--space-4);
		margin-top: var(--space-7);
	}
	.utility-section h3 {
		margin: 0;
		font-family: var(--font-serif);
		font-size: 1.8rem;
		font-weight: 400;
	}
	.utility-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: var(--space-3);
	}
	.utility-grid article {
		scroll-margin-top: 5rem;
		padding: var(--space-4);
		border: 1px solid var(--line);
		border-radius: var(--radius-lg);
		background: var(--surface);
	}
	.utility-preview {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		min-height: 5rem;
		margin-top: var(--space-4);
	}
	.utility-preview.chips {
		flex-wrap: wrap;
		align-content: center;
	}
	.utility-preview > :global(.tab-bar) {
		width: 100%;
		min-width: 0;
	}
	.utility-preview > :global(.tab-bar) :global(button) {
		min-width: 0;
		flex: 1 1 0;
	}
	.icon-preview {
		justify-content: space-between;
		color: var(--ink-muted);
	}
	.sketch-preview {
		justify-content: center;
		min-height: 8rem;
		margin-top: var(--space-2);
	}
	.utility-grid code {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		font-weight: 650;
	}
	.utility-grid p {
		margin: var(--space-2) 0 0;
		color: var(--ink-muted);
		font-size: var(--text-xs);
		line-height: var(--leading-normal);
	}
	.api-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin: 0 0 0.65rem;
		padding: 0 0.2rem;
	}
	.api-heading h3 {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 0.69rem;
	}
	.api-heading code {
		color: var(--ink-faint);
		font-family: var(--font-mono);
		font-size: 0.56rem;
	}
	.principles {
		max-width: none;
		display: grid;
		grid-template-columns: 0.75fr 1.25fr;
		gap: 5rem;
		margin: 0;
		padding: 5.5rem max(var(--page-gutter), calc((100vw - 15rem - 1080px) / 2 + var(--page-gutter)));
		background: #292723;
		color: #f7f4ed;
		scroll-margin-top: 4rem;
	}
	.principle-lead p {
		max-width: 25rem;
		color: rgb(255 255 255 / 0.5);
		font-size: 0.72rem;
		line-height: 1.6;
	}
	.principles .section-kicker {
		color: var(--peach);
	}
	.rules {
		display: grid;
	}
	.rules > div {
		display: grid;
		grid-template-columns: 2rem 1fr;
		gap: 1rem;
		padding: 1.2rem 0;
		border-bottom: 1px solid rgb(255 255 255 / 0.12);
	}
	.rules > div:first-child {
		border-top: 1px solid rgb(255 255 255 / 0.12);
	}
	.rules code {
		color: var(--peach);
		font-family: var(--font-mono);
		font-size: 0.57rem;
	}
	.rules span {
		display: grid;
		gap: 0.35rem;
	}
	.rules strong {
		font-family: var(--font-serif);
		font-size: 1.15rem;
		font-weight: 400;
	}
	.rules small {
		color: rgb(255 255 255 / 0.5);
		font-size: 0.66rem;
	}
	footer {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		padding: 1.7rem var(--page-gutter);
		color: var(--ink-muted);
		font-size: 0.6rem;
	}
	footer code {
		font-family: var(--font-mono);
	}
	footer a {
		justify-self: end;
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}
	@media (max-width: 980px) {
		.topbar {
			grid-template-columns: 1fr auto 1fr;
		}
		.docs-layout {
			grid-template-columns: 1fr;
		}
		.hero,
		.doc-section,
		footer {
			max-width: 900px;
		}
		.principles {
			padding-right: var(--page-gutter);
			padding-left: var(--page-gutter);
		}
	}
	@media (max-width: 760px) {
		.topbar {
			grid-template-columns: minmax(0, 1fr) auto auto;
			gap: 0.45rem;
			padding: 0 0.75rem;
		}
		.topbar > :nth-child(2) {
			justify-self: center;
		}
		.header-actions .version,
		.header-actions :global(.status) {
			display: none;
		}
		.header-actions {
			gap: 0;
		}
		.hero {
			grid-template-columns: 1fr;
			padding-top: 4rem;
		}
		.hero-art {
			min-height: 16rem;
		}
		.quick-grid,
		.specimen-pair,
		.principles,
		.utility-grid {
			grid-template-columns: 1fr;
		}
		.section-intro.inline {
			display: block;
		}
		.section-intro.inline > p {
			margin-top: 0.8rem;
		}
		.type-contract {
			grid-template-columns: 1fr;
		}
		.motion-contract-grid {
			grid-template-columns: 1fr;
		}
		.motion-contract-heading {
			align-items: start;
			flex-direction: column;
		}
		.principles {
			gap: 2rem;
		}
		.package-line {
			flex-wrap: wrap;
		}
		footer {
			grid-template-columns: 1fr auto;
		}
		footer code {
			display: none;
		}
	}
	@media (max-width: 480px) {
		.brand code {
			display: none;
		}
		h1 {
			font-size: 3.6rem;
		}
		.hero {
			padding-top: 3.2rem;
		}
		.hero-art {
			margin-top: -1.5rem;
		}
		.doc-section {
			padding-top: 4rem;
			padding-bottom: 4rem;
		}
		.button-preview > div {
			flex-direction: column;
			align-items: stretch;
		}
		.chips {
			flex-wrap: wrap;
		}
	}
</style>
