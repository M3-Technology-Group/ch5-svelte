# Crestron CH5 Wrapper for Svelte

**Cybernetically enhanced Crestron UIs**

Extend the functionality of the @crestron/ch5-crcomlib library with the power of Svelte 5 Runes. This library provides a simple and easy to use interface for using crestron signals using the svelte 5 runes API.

This library does not expose any Crestron CH-5 Components directly. Instead, it provides a simple interface for using the signals from the Crestron CH-5 components in a Svelte application. There are numerous Svelte UI component libraries that provide feature rich components.

Note: This library is **not** sponsored, supported or endorsed by Crestron Electronics Inc. Crestron True Blue Support cannot provide support for this library, or any issues that may arise from its use.

## Features

- 📦 Easy to use - Built for A/V programmers.
- 💎 Svelte 5 Runes - Makes use of the Runes API in svelte 5.
- 📡 Realtime Updates - Automatically updates UI as control system feedback changes.
- 🤖 Automatic Subscription Management - Subscription and cleanup of signals handled automatically by Svelte.
- ✨ Full TypeScript Support - Better code completion and error checking.
- ✅ Open Source - Licensed under the Apache 2.0 License.

## Getting Started

### Prerequisites
- Crestron 3/4-Series Control System or VC-4 Server.
- Crestron ch5-cli tool installed globally - [Link to Crestron Docs - External](https://sdkcon78221.crestron.com/sdk/Crestron_HTML5UI/Content/Topics/QS-Installation.htm)

> Note: it is NOT recommended to install the CH5 VS Code extension, unless you will be using native CH5 components. The extension is not required for using this library.

### Project Creation
It is **strongly recommended** that you start with a plane Svelte project through Vite. (as opposed to SvelteKit - see the section on [SvelteKit](#sveltekit) below if you must use SvelteKit).

Create a new Svelte Project with Vite:
```bash
npm create vite@latest my-ch5-ui -- --template svelte-ts

cd my-ch5-ui
npm install
```
Replace `my-ch5-ui` with the name of your project.

At this point, you may wish to install other UI libraries or tools such as TailwindCSS.

### Installation

Due to how the CrComLib binds itself to the window object, there is some manual setup required to use the library in a Svelte project. We must also statically copy the the CrComLib to the project root on build otherwise it will be omitted in build bundles.

First, install this wrapper, and the the CrComLib:
```bash
npm install ch5-svelte @crestron/ch5-crcomlib
```

Next, install the vite-plugin-static-copy plugin as a dev dependency:
```bash
npm install -d vite-plugin-static-copy
```

Next, we will need to modify the `vite.config.ts` file to copy the CrComLib to the project root on build. This is done by importing the plugin and adding it to the plugins array.

This is done in the `vite.config.ts` file in the root of your project.
```typescript
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelte(),

    //Add this to copy the cr-com-lib.js file to the build directory
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@crestron/ch5-crcomlib/build_bundles/umd/cr-com-lib.js',
          dest: ''
        }
      ]}),
  ],
})
```

The CrComLib must be manually imported in a script tag in the `index.html` file. This is because the CrComLib does not have a default export, and instead binds itself to the window object.

Add the following line to the head of your index.html file. (`./index.html`)

```html
<script src="./cr-com-lib.js"></script>
```

Here is an example of a complete index.html file with the CrComLib imported:

index.html:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + Svelte + TS</title>

    <!-- Import CrComLib here -->
	<script src="./cr-com-lib.js"></script>

  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

### Contract Setup
If you are using the Contract Editor to define signal names, you will need to place the generated `cse2j` file in the `public/config` directory of your project. The `cse2j` file should be renamed `contract.cse2j`. You will need to create the `config` directory in the `public` directory.

The final path to the `contract.cse2j` file should be `[Project Root]/public/config/contract.cse2j`.

> Note: This only makes the contract available when using the development server (`vite dev`). To use contracts with a Crestron touch screen, you will need to follow the instructions to pack the project below in [Packing for Crestron Touch Screens](#packing-for-crestron-touch-screens)

### Web XPanel Setup
WebXpanel support will need to be installed separately. 

Install the WebXPanel support package from npm:
```bash
npm install @crestron/ch5-webxpanel
```

Next configure the XPanel. This can be done in the `src/main.ts` file.
Add the following code to the `src/main.ts` file below the last import statement, changing the values to match your system.
```typescript
import {getWebXPanel, runsInContainerApp} from '@crestron/ch5-webxpanel'

const { isActive, WebXPanel, WebXPanelConfigParams } = getWebXPanel(!runsInContainerApp());
const config: Partial<typeof WebXPanelConfigParams> = {
  host: "Control-system-IP",
  ipId: "0x03",
  roomId: "VC4ROOM",
  authToken: "eyJ....."
};
if (isActive) {
  WebXPanel.initialize(config);
}
```

> NOTE: You may need to accept the self-signed TLS certificate of the control systems websocket server in your browser. This can be done by navigating to the control system's websocket server in your browser and accepting the certificate.
>
> On VC-4 servers, the websocket server is usually at `https://<vc4-ip>:49200`. On Control systems, accepting the certificate by navigating to the control system's admin page is sufficient.
> 
> On 4-Series hardware you may also need to issue the command `webserver allowsharedsession` to allow origins other than the control system to connect to the websocket server. 
> See [The official Crestron Docs for more info (external link)](https://sdkcon78221.crestron.com/sdk/Crestron_HTML5UI/Content/Topics/Platforms/X-CS-Settings.htm)

### Usage
Controls can now be used in any Svelte component. The following is an example of a a button that triggers the clock input of a toggle, and changes color based on the out signal of the toggle.

```svelte
<script lang="ts">
  import {useDigital} from 'ch5-svelte';

  const toggleButton = useDigital("Toggle.Out","Toggle.Toggle")
</script>

<button style="background-color: {toggleButton.value ? 'green' : 'darkgrey'}" onclick={() => toggleButton.pulse()}>Toggle!</button>
```

For more details on the functions provided, see the official docs for definitions and examples.

- [Official Docs (GitHub Pages)](https://m3-technology-group.github.io/ch5-svelte/)
- [Digital Signal Examples](https://m3-technology-group.github.io/ch5-svelte/documents/Digital_Signal_Examples.html)
- [Analog Signal Examples](https://m3-technology-group.github.io/ch5-svelte/documents/Analog_Signal_Examples.html)
- [Serial Signal Examples](https://m3-technology-group.github.io/ch5-svelte/documents/Serial_Signal_Examples.html)

## Packing for Crestron Touch Screens

Crestron Touch Screens run the project from the local file system and not through a web server. This can cause issues with how resources are loaded. The easiest way to deal with this is to pack all resources into a single file. This can be done using the `vite-plugin-singlefile` plugin.

First, install the plugin:
```bash
npm i -d vite-plugin-singlefile
```

Next, import the plugin in the `vite.config.ts` file and add it to the plugins array.
This is done in the `vite.config.ts` file in the root of your project.
```typescript
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    ...
    viteSingleFile(),
  ],
})
```

Here is an example of a complete `vite.config.ts` file with the `vite-plugin-singlefile` plugin added:
```typescript
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelte(),

    //Add this to copy the cr-com-lib.js file to the build directory
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@crestron/ch5-crcomlib/build_bundles/umd/cr-com-lib.js',
          dest: ''
        }
      ]}),

    //Add this to create a single file build
    viteSingleFile(),
  ],
})
```

Now you can build the project with the following command:
```bash
npm run build
```

and then package the project using the Crestron CH5-CLI tool. (omit the `-c` flag if you are not using the Contract Editor)
```bash
ch5-cli archive -p ch5-svelte -d dist/ -o ./ -c ./public/config/contract.cse2j
```

and finally, upload the resulting `.ch5z` file to the touch panel, replace `Touch-Panel-IP` with the IP or Hostname of your touch screen.
```bash
ch5-cli deploy -t touchscreen -p -H Touch-Panel-IP ch5-svelte.ch5
```

## SvelteKit

The CrComLib can only be run in a browser environment, and as such, it is not compatible with server side rendering. In addition, Crestron Touch panels run the project from the local file system and not through a web server. This means that the two main features of SvelteKit, server side rendering and routing, are not useful for a Crestron UI. However, if you still wish to use SvelteKit, you can disable SSR and pre-rendering.

You will still need to follow the steps above to statically copy the CrComlib in the build process by using the vite-plugin-static-copy [as described in the installation section](#installation).

The CrComLib will then be imported in the `src/app.html` file. This file is located in the `src` directory of your project.

Here is a completed example of the `src/app.html` file with the CrComLib imported:
```html
<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<link rel="icon" href="%sveltekit.assets%/favicon.png" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		
		<!-- Import CrComLib here -->
		<script src="./cr-com-lib.js"></script>

		%sveltekit.head%
	</head>
	<body data-sveltekit-preload-data="hover">
		<div>%sveltekit.body%</div>
	</body>
</html>
```

Next you will need to create a global `+layout.ts` file that disables SSR and pre-rendering. This file should be located in the `src/routes` directory of your project. This is also where you can setup the WebXPanel.

> Note: SvelteKit will still attempt to load the WebXPanel on the server side even with SSR disabled. This will cause an error. To prevent this, you will need to import the WebXPanel in a conditional statement that checks if the code is running on a browser.

Here is an example of a complete `src/routes/+layout.ts` file with SSR and pre-rendering disabled, as well as the WebXPanel setup (using a .env file for the configuration):
```typescript
import { browser } from '$app/environment';
import { PUBLIC_CS_IP, PUBLIC_IP_ID, PUBLIC_ROOM_ID, PUBLIC_TOKEN } from '$env/static/public';

//CrComlib runs in the browser attached to the window object, so we must globally disable SSR and prerendering
export const ssr = false;
export const prerender = false;

//Make sure the WebXPanel is only initialized in the browser
if (browser) {
	import('@crestron/ch5-webxpanel').then(({ getWebXPanel, runsInContainerApp }) => {
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