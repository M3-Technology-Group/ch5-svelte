---
title: Migrating from 1.x to 2.0
group: Guides
category: Guides
---

# Migrating from 1.x to 2.0

ch5-svelte 2.0 is a breaking release. It removes the hard dependency on the Crestron `@crestron/ch5-crcomlib` and replaces the module-level functions with methods on a single `Ch5Svelte` instance that you create and export yourself. This lets you choose the signal layer: MicroComLib (the `microcomlib` package) by default, the Crestron CrComLib if you opt in, or your own.

If you cannot migrate yet, stay on the 1.x release line. It remains on npm under the `latest` tag until 2.0 leaves beta.

## What changed

| 1.x                                                                     | 2.0                                                                          |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `import { useDigital } from 'ch5-svelte'`                               | `import { ch5 } from './ch5'` (your own instance module)                     |
| `useDigital(fb, set)`                                                   | `ch5.useDigital(fb, set)`                                                    |
| `useAnalog(fb, set)`                                                    | `ch5.useAnalog(fb, set)`                                                     |
| `useSerial(fb, set)`                                                    | `ch5.useSerial(fb, set)`                                                     |
| `pulseDigital(signal)`                                                  | `ch5.pulseDigital(signal)`                                                   |
| `setDigital(signal, held)`                                              | `ch5.setDigital(signal, held)`                                               |
| `setAnalog(signal, value)`                                              | `ch5.setAnalog(signal, value)`                                               |
| `setSerial(signal, value)`                                              | `ch5.setSerial(signal, value)`                                               |
| Always reads `window.CrComLib`                                          | Uses the com lib passed to `new Ch5Svelte(comLib)`, MicroComLib when omitted |
| `@crestron/ch5-crcomlib` peer dependency                                | Not required by consumers; `microcomlib` is a regular dependency instead     |
| `<script src="./cr-com-lib.js">` and `vite-plugin-static-copy` required | Not needed with MicroComLib; still required if you opt into the CrComLib     |
| Press-and-hold state shared globally                                    | Press-and-hold state is per instance                                         |

The objects returned by `useDigital`, `useAnalog` and `useSerial` are unchanged: `value` is still a `$state` rune with a setter that writes to the control system, and `DigitalSignal` still has `pulse()`. The RepeatDigital re-send (every 250 ms, `REPEAT_DIGITAL_INTERVAL_MS`) is unchanged for both `useDigital` and `setDigital`. Automatic release on destroy is not: it only ever applied to a hold started through `useDigital`'s `value` setter, because that release is wired to the calling component's `$effect` cleanup. A hold started with `setDigital` has no component to tie into in either version, and keeps re-sending until you call `setDigital(signal, false)` or `releaseAll()` yourself.

## Step by step

### 1. Update the package

```bash
pnpm add ch5-svelte@beta
```

### 2. Create your instance

Add a module that creates and exports one `Ch5Svelte` instance. In a Vite project, `src/ch5.ts`; in SvelteKit, `src/lib/ch5.ts` so you can import it as `$lib/ch5`.

```typescript
import { Ch5Svelte } from 'ch5-svelte';

export const ch5 = new Ch5Svelte();
```

### 3. Update your components

Replace the named imports with an import of your instance, and prefix every call with `ch5.`:

```svelte
<!-- before -->
<script lang="ts">
	import { useAnalog, useDigital, pulseDigital } from 'ch5-svelte';

	const level = useAnalog('ramp.levelF', 'ramp.level');
	const up = useDigital('ramp.Up');
</script>

<button onclick={() => pulseDigital('Toggle.Toggle')}>Toggle</button>

<!-- after -->
<script lang="ts">
	import { ch5 } from './ch5';

	const level = ch5.useAnalog('ramp.levelF', 'ramp.level');
	const up = ch5.useDigital('ramp.Up');
</script>

<button onclick={() => ch5.pulseDigital('Toggle.Toggle')}>Toggle</button>
```

A project-wide search for `from 'ch5-svelte'` finds every file that needs the change.

### 4. Choose your com lib

**Switching to MicroComLib (recommended).** Remove the CrComLib plumbing:

- Delete `<script src="./cr-com-lib.js"></script>` from `index.html` (or `src/app.html` in SvelteKit). MicroComLib refuses to start if a `CrComLib` global is present.
- Remove the `viteStaticCopy` entry for `cr-com-lib.js` from `vite.config.ts`, and uninstall `vite-plugin-static-copy` if nothing else uses it.
- Uninstall `@crestron/ch5-crcomlib`.

**Staying on the Crestron CrComLib (not recommended).** Do this only if you have a concrete reason, most commonly that you also use native CH5 web components, which MicroComLib does not implement. Keep the script tag and the static copy plugin exactly as in 1.x, and pass the CrComLib to the instance:

```typescript
import { Ch5Svelte, crComLibFromWindow } from 'ch5-svelte';

export const ch5 = new Ch5Svelte(crComLibFromWindow());
```

### 5. Move the Web XPanel setup into `src/ch5.ts`

In 1.x this commonly lived in `src/main.ts`, wherever the module-level functions happened to already be imported. In 2.x, move it into `src/ch5.ts`, below the `ch5` export, instead:

```typescript
import { Ch5Svelte } from 'ch5-svelte';
import { getWebXPanel, runsInContainerApp } from '@crestron/ch5-webxpanel';

export const ch5 = new Ch5Svelte();

const { isActive, WebXPanel, WebXPanelConfigParams } = getWebXPanel(!runsInContainerApp());
// ... unchanged from 1.x
```

The instance must exist before `WebXPanel.initialize()` is called; putting both in one file makes that automatic (the module runs top to bottom) instead of something you have to get right across files in `main.ts`.

In SvelteKit, chain the dynamic imports in `+layout.ts` so the instance loads first:

```typescript
if (browser) {
	import('$lib/ch5')
		.then(() => import('@crestron/ch5-webxpanel'))
		.then(({ getWebXPanel, runsInContainerApp }) => {
			// ... unchanged from 1.x
		});
}
```

### 6. Remove the `Window.CrComLib` type declaration

If your 1.x project declared `interface Window { CrComLib: ... }` in `app.d.ts` or elsewhere, it is no longer needed. `crComLibFromWindow()` performs its own runtime check and returns a typed `ComLib`.

## Behaviour notes

- **Feedback timing** is the same with both com libs: the first render uses the current value, and later updates arrive through the subscription.
- **Press-and-hold** is still implemented by ch5-svelte itself using RepeatDigital, so it works identically whichever com lib you choose. Holds are tracked per `Ch5Svelte` instance; with a single exported instance this is indistinguishable from 1.x.
- **Join numbers** work as before. When you subscribe to `"200"`, both com libs read the feedback side of that join; when you write to `"200"`, the value goes to the control system.
- **Object signals** are not wrapped. Use `ch5.comLib.publishEvent('o', name, value)` and `ch5.comLib.subscribeState('o', name, cb)` directly if you need them.

## Removed

- The module-level exports `useDigital`, `useAnalog`, `useSerial`, `setDigital`, `setAnalog`, `setSerial` and `pulseDigital`.
- The `@crestron/ch5-crcomlib` peer dependency.
