# Signal UI

Signal UI is the internal Svelte 5 design system for this application. It provides semantic design tokens, accessible native-first components, responsive documentation, dark and light themes, and Motion-powered interaction patterns.

## Start

```sh
pnpm install
pnpm dev
```

Import components from the public UI barrel:

```svelte
<script lang="ts">
	import { Button, TextField } from '$lib/components/ui';
</script>

<TextField label="Email address" type="email" autocomplete="email" />
<Button>Continue</Button>
```

## v1 scope

The public component set is `Button`, `Checkbox`, `Chip`, `Dialog`, `Icon`, `IconButton`, `Notice`, `RadioGroup`, `Select`, `Sketch`, `Switch`, `TabBar`, `TextArea`, and `TextField`.

All form components preserve native browser behavior and expose labels, descriptions, disabled states, and validation semantics. `TabBar` follows the arrow-key, Home, End, and roving-tabindex pattern. `Dialog` uses the native modal element for focus trapping and Escape handling.

Menus, popovers, tooltips, and product-specific composite patterns are intentionally outside the v1 scope. Add them when a real product flow requires them.

## Tokens and themes

Global tokens live in `src/routes/layout.css`. Use semantic tokens such as `--surface`, `--ink-muted`, `--focus`, and `--success` rather than raw colors. Spacing, type, control size, radius, motion, and layer tokens are also defined there.

Theme selection is applied with `data-theme="light|dark"` on the root element. The documentation follows the saved `signal-theme` preference and falls back to the operating-system preference.

## Motion

Motion is integrated through `src/lib/motion.ts`. Use the shared `motionReveal` and `motionPress` actions so animations clean up correctly and respect `prefers-reduced-motion`. Components with lifecycle-specific transitions, such as `Notice` and `Dialog`, use Motion directly with the same reduced-motion guard.

## Quality checks

```sh
pnpm check
pnpm lint
pnpm test:unit -- --run
pnpm test:e2e
pnpm build
```

The browser suite covers component semantics and keyboard interaction. Playwright runs automated WCAG A/AA checks, a mobile-header regression, and a desktop hero visual snapshot.

## Contribution contract

1. Compose existing primitives before adding another component.
2. Document and test default, hover, focus, disabled, loading, and error states where applicable.
3. Preserve native HTML attributes and behavior.
4. Run accessibility, responsive, and reduced-motion checks before changing a component to stable.
5. Treat a new prop or token as a public API that requires documentation.
