<script lang="ts">
	let { size = 260 }: { size?: number } = $props();
</script>

<div
	class="sketch"
	style={`--sketch-size: ${size}px`}
	aria-label="Hand-drawn botanical study"
	role="img"
>
	<svg viewBox="0 0 280 280" fill="none" aria-hidden="true">
		<path
			class="wash peach"
			d="M49 93c20-40 85-69 136-43 44 22 67 82 35 128-31 44-91 67-139 39-47-28-56-79-32-124Z"
		/>
		<path
			class="wash lavender"
			d="M156 30c33 2 73 34 71 72-2 26-24 48-57 42-38-7-61-40-49-75 7-22 18-40 35-39Z"
		/>
		<g class="lines">
			<path d="M137 232c-2-43 2-82 23-125" />
			<path d="M145 180c-28-11-44-29-47-55" />
			<path d="M145 181c-25 2-43 15-54 38" />
			<path d="M151 151c22-8 38-25 47-49" />
			<path d="M159 108c-13-8-20-20-21-36" />
			<path d="M100 126c-5-19-20-26-34-24 2 16 15 29 34 24Z" />
			<path d="M91 218c-2-20-15-31-31-33-2 17 10 33 31 33Z" />
			<path d="M198 102c17-2 29-13 33-29-17-2-31 8-33 29Z" />
			<path d="M138 72c-11-14-9-30 0-42 13 10 14 26 0 42Z" />
			<path d="M155 123c-7-11-6-23 2-32 10 8 9 21-2 32Z" />
		</g>
		<path class="ground" d="M75 234c43 5 84 4 128-1" />
	</svg>
</div>

<style>
	.sketch {
		width: min(100%, var(--sketch-size));
		aspect-ratio: 1;
	}
	svg {
		width: 100%;
		height: 100%;
		overflow: visible;
	}
	.wash {
		stroke: none;
		opacity: 0.83;
	}
	.peach {
		fill: var(--peach);
	}
	.lavender {
		fill: var(--lavender);
		opacity: 0.68;
	}
	.lines {
		stroke: var(--ink);
		stroke-width: 2.15;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.lines path:nth-child(2n) {
		stroke-width: 1.7;
	}
	.ground {
		stroke: var(--ink);
		stroke-width: 1.7;
		stroke-linecap: round;
		stroke-dasharray: 4 4;
		opacity: 0.48;
	}
	.sketch:hover svg {
		animation: breathe 2.6s var(--ease-out) infinite alternate;
	}
	@keyframes breathe {
		to {
			transform: rotate(0.8deg) scale(1.012);
		}
	}
</style>
