# Crestron CH5 Wrapper for Svelte

**Cybernetically enhanced Crestron UIs**

Use Crestron CH5 signals in Svelte 5 with the Runes API. This library provides a simple and easy to use interface for reading and writing Crestron digital, analog and serial signals from Svelte components.

Version 2 no longer depends on the Crestron `@crestron/ch5-crcomlib`. Out of the box it uses MicroComLib (the `microcomlib` package), a small, dependency-free, ESM implementation of the CrComLib signal layer that needs no script tags or build plugins. If you need the Crestron CrComLib, for example because you also use native CH5 components, you can opt back into it with one line.

This library does not expose any Crestron CH-5 Components directly. There are numerous Svelte UI component libraries that provide feature rich components.

> **Beta:** `2.0.0-beta.x` is a major, breaking release. See [MIGRATION.md](./MIGRATION.md) if you are coming from 1.x. Install it with the `beta` tag (`pnpm add ch5-svelte@beta`); `latest` still points at 1.x. 2.x provides no meaningful features for 1.x users, changes are primarily to ease project setup and to remove the dependency on the Crestron CrComLib. If you have a stable 1.x project, you can continue to use it without migrating.

Note: This library is **not** sponsored, supported or endorsed by Crestron Electronics Inc. Crestron True Blue Support cannot provide support for this library, or any issues that may arise from its use.

## Features

- 📦 Easy to use - Built for A/V programmers.
- 💎 Svelte 5 Runes - Makes use of the Runes API in svelte 5.
- 📡 Realtime Updates - Automatically updates UI as control system feedback changes.
- 🤖 Automatic Subscription Management - Subscription and cleanup of signals handled automatically by Svelte.
- 🪶 No script tags - MicroComLib is a plain ESM import; it installs its own small set of host hooks on `window` automatically, so there is nothing for you to wire up manually.
- 🔌 Pluggable - Use MicroComLib, the Crestron CrComLib, or your own implementation of four functions.
- ✨ Full TypeScript Support - Better code completion and error checking.
- ✅ Open Source - Licensed under the Apache 2.0 License.

## Getting Started

### Prerequisites

- Crestron 3/4-Series Control System or VC-4 Server.
- Crestron ch5-cli tool installed globally - [Link to Crestron Docs - External](https://sdkcon78221.crestron.com/sdk/Crestron_HTML5UI/Content/Topics/QS-Installation.htm)

> Note: it is NOT recommended to install the CH5 VS Code extension, unless you will be using native CH5 components. The extension is not required for using this library.

### Project Creation

It is **strongly recommended** that you start with a plain Svelte project through Vite. (as opposed to SvelteKit - see the section on [SvelteKit](#sveltekit) below if you must use SvelteKit).

Create a new Svelte Project with Vite:

```bash
pnpm create vite@latest my-ch5-ui --template svelte-ts

cd my-ch5-ui
pnpm install
```

Replace `my-ch5-ui` with the name of your project. `npm` works just as well as `pnpm` throughout this guide.

At this point, you may wish to install other UI libraries or tools such as TailwindCSS.

### Installation

```bash
pnpm add ch5-svelte@beta
```

If you plan to use the bundled `microcomlib` (the default), there are no further steps. If you plan to use the Crestron CrComLib, see [Using the Crestron CrComLib](#using-the-crestron-crcomlib) below.

### Create your instance

Create one `Ch5Svelte` instance for your app and export it. Every component imports this instance and calls the `use*` methods on it.

`src/ch5.ts`:

```typescript
import { Ch5Svelte } from 'ch5-svelte';

export const ch5 = new Ch5Svelte();
```

With no arguments, `Ch5Svelte` uses MicroComLib. Creating the instance also installs the hooks that Crestron touch screens, the Crestron mobile app and Web XPanel deliver feedback through, so create it early, before Web XPanel is initialized. If you use Web XPanel, its setup goes in this same file, below this export — see [Web XPanel Setup](#web-xpanel-setup) below.

### Contract Setup

If you are using the Contract Editor to define signal names, you will need to place the generated `cse2j` file in the `public/config` directory of your project. The `cse2j` file should be renamed `contract.cse2j`. You will need to create the `config` directory in the `public` directory.

The final path to the `contract.cse2j` file should be `[Project Root]/public/config/contract.cse2j`.

Neither MicroComLib nor the CrComLib signal layer parses this file themselves; signal names are opaque strings to both. It is read by two other consumers: Web XPanel fetches `config/contract.cse2j` over HTTP to map contract names to joins in the browser (this works against `vite dev` and against a deployed `vite build` output, since Vite copies `public/` into the build verbatim), and a real Crestron touch panel resolves it natively once it is packed into the project, as described in [Packing for Crestron Touch Screens](#packing-for-crestron-touch-screens).

### Web XPanel Setup

WebXpanel support will need to be installed separately.

Install the WebXPanel support package from npm:

```bash
pnpm add @crestron/ch5-webxpanel
```

Next configure the XPanel. Add this to the same `src/ch5.ts` file, below the `ch5` export you created above, changing the values to match your system:

```typescript
import { Ch5Svelte } from 'ch5-svelte';
import { getWebXPanel, runsInContainerApp } from '@crestron/ch5-webxpanel';

export const ch5 = new Ch5Svelte();

const { isActive, WebXPanel, WebXPanelConfigParams } = getWebXPanel(!runsInContainerApp());
const config: Partial<typeof WebXPanelConfigParams> = {
	host: 'Control-system-IP',
	ipId: '0x03',
	roomId: 'VC4ROOM',
	authToken: 'eyJ.....'
};
if (isActive) {
	WebXPanel.initialize(config);
}
```

Keeping both in `src/ch5.ts` means the `ch5` instance (and MicroComLib) always exists before `WebXPanel.initialize()` runs, since it's the same module executing top to bottom — there's no separate file or import order to get right, and every part of the com-lib/panel setup lives in one place.

> NOTE: You may need to accept the self-signed TLS certificate of the control systems websocket server in your browser. This can be done by navigating to the control system's websocket server in your browser and accepting the certificate.
>
> On VC-4 servers, the websocket server is usually at `https://<vc4-ip>:49200`. On Control systems, accepting the certificate by navigating to the control system's admin page is sufficient.
>
> On 4-Series hardware you may also need to issue the command `webserver allowsharedsession` to allow origins other than the control system to connect to the websocket server.
> See [The official Crestron Docs for more info (external link)](https://sdkcon78221.crestron.com/sdk/Crestron_HTML5UI/Content/Topics/Platforms/X-CS-Settings.htm)

### Usage

Controls can now be used in any Svelte component. The following is an example of a button that triggers the clock input of a toggle, and changes color based on the out signal of the toggle.

```svelte
<script lang="ts">
	import { ch5 } from './ch5';

	const toggleButton = ch5.useDigital('Toggle.Out', 'Toggle.Toggle');
</script>

<button
	style="background-color: {toggleButton.value ? 'green' : 'darkgrey'}"
	onclick={() => toggleButton.pulse()}
>
	Toggle!
</button>
```

Adjust the import path to wherever you created your instance.

The instance provides:

| Method                     | Purpose                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------ |
| `useDigital(fb, set?)`     | `$state<boolean>` following `fb`; setting `value` holds/releases `set`; `pulse()` sends an edge. |
| `useAnalog(fb, set?)`      | `$state<number>` following `fb`; setting `value` writes to `set`.                                |
| `useSerial(fb, set?)`      | `$state<string>` following `fb`; setting `value` writes to `set`.                                |
| `pulseDigital(signal)`     | Rising then falling edge, without subscribing.                                                   |
| `setDigital(signal, held)` | Hold or release a digital (RepeatDigital), without subscribing.                                  |
| `setAnalog(signal, value)` | Write an analog value, without subscribing.                                                      |
| `setSerial(signal, value)` | Write a serial value, without subscribing.                                                       |
| `releaseAll()`             | Release every digital this instance is holding.                                                  |
| `comLib`                   | The underlying com lib, for anything not wrapped here.                                           |

The `use*` methods must be called during component initialization (the top level of a `<script>` block), because they use `$effect` to manage the subscription for the lifetime of the component.

A held digital is only released automatically when it was held through `useDigital`'s `value` setter, because that release is wired to the component's `$effect` cleanup. A hold started with `setDigital` has no component to tie into and keeps re-sending (every `REPEAT_DIGITAL_INTERVAL_MS`, exported from `ch5-svelte`, 250 ms by default) until you call `setDigital(signal, false)` or `releaseAll()` yourself — do this in a `beforeunload` handler or wherever else your UI can disappear without its components being destroyed.

For more details on the functions provided, see the official docs for definitions and examples.

- [Official Docs (GitHub Pages)](https://m3-technology-group.github.io/ch5-svelte/)
- [Digital Signal Examples](https://m3-technology-group.github.io/ch5-svelte/documents/Digital_Signal_Examples.html)
- [Analog Signal Examples](https://m3-technology-group.github.io/ch5-svelte/documents/Analog_Signal_Examples.html)
- [Serial Signal Examples](https://m3-technology-group.github.io/ch5-svelte/documents/Serial_Signal_Examples.html)

## Using the Crestron CrComLib

> **Not the recommended path.** MicroComLib is the default for a reason: it is a plain ESM import with no script tag, no build plugin and no ~1.8 MB UMD bundle to load. Reach for the CrComLib only if you have a concrete reason to need it, most commonly that you also use native CH5 web components elsewhere on the same page, which MicroComLib does not implement.

If you need the full Crestron CrComLib (for example alongside native CH5 components), pass it to the instance instead of using MicroComLib. The CrComLib binds itself to `window` and has no ES module entry point, so it needs the same manual setup as 1.x did.

First, install the CrComLib and the static copy plugin:

```bash
pnpm add @crestron/ch5-crcomlib
pnpm add -D vite-plugin-static-copy
```

Copy the CrComLib bundle into the build output in `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
	plugins: [
		svelte(),
		viteStaticCopy({
			targets: [
				{
					src: 'node_modules/@crestron/ch5-crcomlib/build_bundles/umd/cr-com-lib.js',
					dest: ''
				}
			]
		})
	]
});
```

Load it with a script tag in the `<head>` of `index.html`, before your app's module script:

```html
<script src="./cr-com-lib.js"></script>
```

Then hand it to `Ch5Svelte`:

```typescript
import { Ch5Svelte, crComLibFromWindow } from 'ch5-svelte';

export const ch5 = new Ch5Svelte(crComLibFromWindow());
```

`crComLibFromWindow()` throws a clear error if the script tag is missing. Never load the CrComLib script and use MicroComLib on the same page: MicroComLib refuses to start when a `CrComLib` global is already present, because two signal layers cannot share one host.

## Bring your own com lib

`Ch5Svelte` accepts any object that implements the four CrComLib signal functions:

```typescript
interface ComLib {
	getState(type: string, name: string, defaultValue?: SignalValue): SignalValue | null;
	subscribeState(
		type: string,
		name: string,
		callback: (value: unknown) => void,
		errorCallback?: (error: unknown) => void
	): string;
	unsubscribeState(type: string, name: string, subscriptionId: string): void;
	publishEvent(type: string, name: string, value: SignalValue): void;
}
```

This is handy for unit tests and Storybook, where an in-memory implementation can stand in for the control system. `ch5-svelte` exports `isComLib(candidate)`, a runtime type guard for this same interface, if you want to validate your implementation (or a value from somewhere else) before handing it to `Ch5Svelte`.

## Packing for Crestron Touch Screens

Crestron Touch Screens run the project from the local file system and not through a web server. This can cause issues with how resources are loaded. The easiest way to deal with this is to pack all resources into a single file. This can be done using the `vite-plugin-singlefile` plugin.

First, install the plugin:

```bash
pnpm add -D vite-plugin-singlefile
```

Next, import the plugin in the `vite.config.ts` file and add it to the plugins array.

```typescript
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { viteSingleFile } from 'vite-plugin-singlefile';

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		svelte(),

		//Add this to create a single file build
		viteSingleFile()
	]
});
```

If you are [using the Crestron CrComLib](#using-the-crestron-crcomlib), keep the `viteStaticCopy` plugin in the list as well.

Now you can build the project with the following command:

```bash
pnpm build
```

and then package the project using the Crestron CH5-CLI tool. (omit the `-c` flag if you are not using the Contract Editor)

```bash
ch5-cli archive -p ch5-svelte -d dist/ -o ./ -c ./public/config/contract.cse2j
```

and finally, upload the resulting `.ch5z` file to the touch panel, replace `Touch-Panel-IP` with the IP or Hostname of your touch screen.

```bash
ch5-cli deploy -t touchscreen -p -H Touch-Panel-IP ch5-svelte.ch5z
```

## SvelteKit

The com libs talk to the panel through browser globals, and as such are not compatible with server side rendering. In addition, Crestron Touch panels run the project from the local file system and not through a web server. This means that the two main features of SvelteKit, server side rendering and routing, are not useful for a Crestron UI. However, if you still wish to use SvelteKit, you can disable SSR and pre-rendering.

Create your instance in `src/lib/ch5.ts` so components can import it as `$lib/ch5`:

```typescript
import { Ch5Svelte } from 'ch5-svelte';

export const ch5 = new Ch5Svelte();
```

Next you will need to create a global `+layout.ts` file that disables SSR and pre-rendering. This file should be located in the `src/routes` directory of your project. This is also where you can setup the WebXPanel.

> Note: SvelteKit will still evaluate `+layout.ts` on the server side even with SSR disabled. Web XPanel binds to the window object as soon as it is imported, so both the instance and Web XPanel are imported dynamically inside a browser check. The instance must be imported first.

Here is an example of a complete `src/routes/+layout.ts` file with SSR and pre-rendering disabled, as well as the WebXPanel setup (using a .env file for the configuration):

```typescript
import { browser } from '$app/environment';
import { PUBLIC_CS_IP, PUBLIC_IP_ID, PUBLIC_ROOM_ID, PUBLIC_TOKEN } from '$env/static/public';

// The com lib talks to the panel or Web XPanel through browser globals, so SSR and
// prerendering are disabled for the whole app.
export const ssr = false;
export const prerender = false;

if (browser) {
	// The Ch5Svelte instance (and with it MicroComLib) must exist before WebXPanel.initialize().
	import('$lib/ch5')
		.then(() => import('@crestron/ch5-webxpanel'))
		.then(({ getWebXPanel, runsInContainerApp }) => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { isActive, WebXPanel, WebXPanelConfigParams } = getWebXPanel(!runsInContainerApp());

			const config: Partial<typeof WebXPanelConfigParams> = {
				host: PUBLIC_CS_IP,
				ipId: PUBLIC_IP_ID,
				roomId: PUBLIC_ROOM_ID,
				authToken: PUBLIC_TOKEN
			};
			if (isActive) {
				WebXPanel.initialize(config);
			}
		});
}
```

If you are using the Crestron CrComLib instead, add the `<script src="./cr-com-lib.js"></script>` tag to the `<head>` of `src/app.html` and keep the `viteStaticCopy` plugin from the [CrComLib section](#using-the-crestron-crcomlib).

## Migrating from 1.x

Version 2 replaces the module-level `useDigital`, `useAnalog`, `useSerial`, `setDigital`, `setAnalog`, `setSerial` and `pulseDigital` exports with methods on a `Ch5Svelte` instance, and no longer requires the Crestron CrComLib. The returned signal objects are unchanged.

```svelte
<!-- 1.x -->
<script lang="ts">
	import { useDigital } from 'ch5-svelte';
	const toggle = useDigital('Toggle.Out', 'Toggle.Toggle');
</script>

<!-- 2.x -->
<script lang="ts">
	import { ch5 } from './ch5';
	const toggle = ch5.useDigital('Toggle.Out', 'Toggle.Toggle');
</script>
```

See [MIGRATION.md](./MIGRATION.md) for the full step-by-step guide. If you cannot migrate yet, stay on the 1.x release line.

## Development

This repository uses [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm test      # unit tests (vitest)
pnpm check     # svelte-check
pnpm lint      # prettier + eslint
pnpm build     # demo app + npm package (svelte-package + publint)
pnpm run docs  # regenerate ./docs with typedoc (plain `pnpm docs` is a pnpm built-in)
pnpm dev       # demo app, configured through .env (see +layout.ts)
```
