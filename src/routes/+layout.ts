import { browser } from '$app/environment';
import { PUBLIC_CS_IP, PUBLIC_IP_ID, PUBLIC_ROOM_ID, PUBLIC_TOKEN } from '$env/static/public';

//CrComlib runs in the browser attached to the window object, so we must globally disable SSR and prerendering
export const ssr = false;
export const prerender = false;

//Crestron is naughty and binds to the window object before initialize is called, so we need to make sure that the import is also wrapped in a browser check
//WebXPanel can be started here as well, but we need to make sure this is also done in the browser, as it binds to the window object
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
