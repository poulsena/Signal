<script lang="ts">
	import {
		Button,
		Checkbox,
		Chip,
		Dialog,
		Notice,
		RadioGroup,
		Select,
		Switch,
		TabBar,
		TextArea,
		TextField
	} from './index';

	let selectedTab = $state('Overview');
	let checked = $state(true);
	let switched = $state(false);
	let plan = $state('studio');
	let region = $state('eu');
	let dialogOpen = $state(false);
</script>

<main>
	<Button>Save changes</Button>
	<Button loading>Saving changes</Button>
	<TextField
		label="Email address"
		type="email"
		name="email"
		autocomplete="email"
		hint="We only use this for account messages."
	/>
	<TextField label="Workspace slug" error="Use lowercase letters only." />
	<TabBar
		items={['Overview', 'Activity']}
		label="Workspace sections"
		panelId="workspace-panel"
		bind:selected={selectedTab}
	/>
	<div id="workspace-panel" role="tabpanel" aria-label={`${selectedTab} panel`}>{selectedTab}</div>
	<Chip label="Thoughtful" active />
	<Checkbox label="Email summaries" description="Delivered on Friday." bind:checked />
	<Switch label="Notifications" bind:checked={switched} />
	<RadioGroup
		label="Plan"
		options={[
			{ label: 'Studio', value: 'studio' },
			{ label: 'Company', value: 'company' }
		]}
		bind:value={plan}
	/>
	<Select
		label="Region"
		options={[
			{ label: 'Europe', value: 'eu' },
			{ label: 'United States', value: 'us' }
		]}
		bind:value={region}
	/>
	<TextArea label="Notes" hint="Optional context." />
	<Notice title="Saved" message="Your changes are safe." />
	<Button onclick={() => (dialogOpen = true)}>Open test dialog</Button>
	<Dialog title="Test dialog" description="A focused task." bind:open={dialogOpen}>
		<p>Dialog body</p>
		{#snippet footer()}
			<Button onclick={() => (dialogOpen = false)}>Done</Button>
		{/snippet}
	</Dialog>
</main>
