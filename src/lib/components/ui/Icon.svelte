<script lang="ts" module>
	export type IconName =
		| 'arrow-right'
		| 'bell'
		| 'check'
		| 'code'
		| 'chevron-down'
		| 'close'
		| 'copy'
		| 'heart'
		| 'home'
		| 'moon'
		| 'plus'
		| 'search'
		| 'settings'
		| 'sparkle'
		| 'sun'
		| 'user';
</script>

<script lang="ts">
	let {
		name,
		size = 18,
		strokeWidth = 1.8
	}: { name: IconName; size?: number; strokeWidth?: number } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width={strokeWidth}
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	{#if name === 'arrow-right'}
		<path d="M5 12h14M14 7l5 5-5 5" />
	{:else if name === 'bell'}
		<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
	{:else if name === 'check'}
		<path d="m5 12 4 4L19 6" />
	{:else if name === 'code'}
		<path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14" />
	{:else if name === 'chevron-down'}
		<path d="m7 9 5 5 5-5" />
	{:else if name === 'close'}
		<path d="m6 6 12 12M18 6 6 18" />
	{:else if name === 'copy'}
		<rect x="8" y="8" width="11" height="11" rx="2" /><path
			d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"
		/>
	{:else if name === 'heart'}
		<path
			d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.4 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"
		/>
	{:else if name === 'home'}
		<path d="m3 11 9-8 9 8M5 10v10h14V10M9 20v-6h6v6" />
	{:else if name === 'moon'}
		<path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.6 6.6 0 0 0 21 12.8Z" />
	{:else if name === 'plus'}
		<path d="M12 5v14M5 12h14" />
	{:else if name === 'search'}
		<circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" />
	{:else if name === 'settings'}
		<circle cx="12" cy="12" r="3" /><path
			d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"
		/>
	{:else if name === 'sparkle'}
		<path
			d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3ZM19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z"
		/>
	{:else if name === 'sun'}
		<circle cx="12" cy="12" r="4" /><path
			d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
		/>
	{:else if name === 'user'}
		<circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" />
	{/if}
</svg>
