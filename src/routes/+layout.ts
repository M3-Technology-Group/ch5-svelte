import { browser } from '$app/environment';
import { PUBLIC_CS_IP, PUBLIC_IP_ID, PUBLIC_ROOM_ID, PUBLIC_TOKEN } from '$env/static/public';

// The com lib talks to the panel or Web XPanel through browser globals, so SSR and prerendering
// are disabled for the whole app.
export const ssr = false;
export const prerender = false;

// Web XPanel binds to the window object as soon as it is imported, so both the import and the
// initialisation are wrapped in a browser check. The Ch5Svelte instance (and with it MicroComLib)
// must exist before WebXPanel.initialize() is called, hence the import order below.
if (browser) {
	import('./ch5.js')
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
