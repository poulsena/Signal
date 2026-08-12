import { animate, inView, press, type AnimationPlaybackControls } from 'motion';

export type RevealOptions = {
	distance?: number;
	delay?: number;
	duration?: number;
};

export function prefersReducedMotion() {
	return (
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);
}

export function motionReveal(node: HTMLElement, options: RevealOptions = {}) {
	if (prefersReducedMotion()) return {};

	const { distance = 18, delay = 0, duration = 0.52 } = options;
	node.style.opacity = '0';

	const stopObserving = inView(
		node,
		() => {
			animate(
				node,
				{ opacity: [0, 1], y: [distance, 0] },
				{ duration, delay, ease: [0.2, 0.8, 0.2, 1] }
			);
		},
		{ amount: 0.12, margin: '0px 0px -6% 0px' }
	);

	return { destroy: stopObserving };
}

export function motionPress(node: HTMLElement, scale = 0.97) {
	if (prefersReducedMotion()) return {};

	let animation: AnimationPlaybackControls | undefined;
	const stopPress = press(node, (element) => {
		animation?.stop();
		animation = animate(element, { scale }, { type: 'spring', stiffness: 700, damping: 32 });

		return () => {
			animation?.stop();
			animation = animate(element, { scale: 1 }, { type: 'spring', stiffness: 520, damping: 28 });
		};
	});

	return {
		destroy() {
			animation?.stop();
			stopPress();
		}
	};
}
