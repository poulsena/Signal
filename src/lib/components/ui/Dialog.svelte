<script lang="ts">
	import type { Snippet } from 'svelte';
	import { animate } from 'motion';
	import { prefersReducedMotion } from '$lib/motion';
	import IconButton from './IconButton.svelte';

	let {
		title,
		description,
		open = $bindable(false),
		children,
		footer,
		onclose
	}: {
		title: string;
		description?: string;
		open?: boolean;
		children: Snippet;
		footer?: Snippet;
		onclose?: () => void;
	} = $props();

	const generatedId = $props.id();
	let dialog: HTMLDialogElement;

	function closeDialog() {
		dialog?.close();
	}

	function handleClose() {
		open = false;
		onclose?.();
	}

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) {
			dialog.showModal();
			if (!prefersReducedMotion()) {
				animate(
					dialog,
					{ opacity: [0, 1], y: [18, 0], scale: [0.97, 1] },
					{ type: 'spring', stiffness: 380, damping: 32 }
				);
			}
		} else if (!open && dialog.open) {
			dialog.close();
		}
	});
</script>

<dialog
	bind:this={dialog}
	aria-labelledby={`${generatedId}-title`}
	aria-describedby={description ? `${generatedId}-description` : undefined}
	onclose={handleClose}
	onclick={(event) => event.target === dialog && closeDialog()}
>
	<div class="dialog-card">
		<header>
			<div>
				<h2 id={`${generatedId}-title`}>{title}</h2>
				{#if description}<p id={`${generatedId}-description`}>{description}</p>{/if}
			</div>
			<IconButton icon="close" label="Close dialog" onclick={closeDialog} />
		</header>
		<div class="body">{@render children()}</div>
		{#if footer}<footer>{@render footer()}</footer>{/if}
	</div>
</dialog>

<style>
	dialog {
		width: min(calc(100% - 2rem), 32rem);
		max-height: min(42rem, calc(100vh - 2rem));
		padding: 0;
		overflow: auto;
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
	.dialog-card {
		display: grid;
	}
	header {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: var(--space-5);
		padding: var(--space-5);
		border-bottom: 1px solid var(--line);
	}
	h2 {
		margin: 0;
		font-family: var(--font-serif);
		font-size: 1.75rem;
		font-weight: 400;
	}
	p {
		margin: var(--space-2) 0 0;
		color: var(--ink-muted);
		font-size: var(--text-sm);
		line-height: var(--leading-normal);
	}
	.body {
		padding: var(--space-5);
	}
	footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-2);
		padding: var(--space-4) var(--space-5);
		border-top: 1px solid var(--line);
	}
</style>
