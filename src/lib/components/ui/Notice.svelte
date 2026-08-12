<script lang="ts">
	import { onMount } from 'svelte';
	import { animate } from 'motion';
	import { prefersReducedMotion } from '$lib/motion';
	import Icon, { type IconName } from './Icon.svelte';

	type Tone = 'success' | 'info' | 'warning' | 'error';

	let {
		title,
		message,
		tone = 'success',
		duration = 0,
		visible = $bindable(true),
		ondismiss
	}: {
		title: string;
		message: string;
		tone?: Tone;
		duration?: number;
		visible?: boolean;
		ondismiss?: () => void;
	} = $props();

	let notice = $state<HTMLDivElement>();
	const icons: Record<Tone, IconName> = {
		success: 'check',
		info: 'sparkle',
		warning: 'bell',
		error: 'close'
	};

	function finishDismiss() {
		visible = false;
		ondismiss?.();
	}

	async function dismiss() {
		if (!notice || prefersReducedMotion()) return finishDismiss();
		await animate(
			notice,
			{ opacity: [1, 0], y: [0, 8], scale: [1, 0.98] },
			{ duration: 0.18, ease: 'easeIn' }
		);
		finishDismiss();
	}

	onMount(() => {
		if (!prefersReducedMotion()) {
			animate(
				notice,
				{ opacity: [0, 1], y: [10, 0], scale: [0.98, 1] },
				{ type: 'spring', stiffness: 420, damping: 32 }
			);
		}

		if (duration > 0) {
			const timeout = window.setTimeout(dismiss, duration);
			return () => window.clearTimeout(timeout);
		}
	});
</script>

{#if visible}
	<div bind:this={notice} class={`notice ${tone}`}>
		<span class="mark"><Icon name={icons[tone]} size={15} strokeWidth={2.2} /></span>
		<span class="copy" role={tone === 'error' ? 'alert' : 'status'} aria-live="polite">
			<strong>{title}</strong><small>{message}</small>
		</span>
		<button type="button" aria-label="Dismiss notification" onclick={dismiss}
			><Icon name="close" size={16} /></button
		>
	</div>
{/if}

<style>
	.notice {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: var(--space-3);
		width: min(100%, 23rem);
		padding: var(--space-3);
		border: 1px solid rgb(255 255 255 / 0.22);
		border-radius: var(--radius-lg);
		background: rgb(35 33 30 / 0.97);
		color: white;
		box-shadow: var(--shadow-float);
	}
	.mark {
		width: 2rem;
		height: 2rem;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: var(--success-soft);
		color: var(--success);
	}
	.notice.info .mark {
		background: var(--info-soft);
		color: var(--info);
	}
	.notice.warning .mark {
		background: var(--warning-soft);
		color: var(--warning);
	}
	.notice.error .mark {
		background: var(--red-soft);
		color: var(--red);
	}
	.copy {
		display: grid;
		gap: 0.13rem;
	}
	.copy strong {
		font-size: 0.8rem;
		font-weight: 650;
	}
	.copy small {
		color: rgb(255 255 255 / 0.74);
		font-size: 0.7rem;
	}
	button {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: transparent;
		color: rgb(255 255 255 / 0.8);
		cursor: pointer;
	}
	button:hover {
		background: rgb(255 255 255 / 0.1);
		color: white;
	}
	button:focus-visible {
		outline: 2px solid var(--lavender);
		outline-offset: 2px;
	}
</style>
