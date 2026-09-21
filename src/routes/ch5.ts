import { Ch5Svelte } from '$lib/index.js';

/**
 * The app-wide ch5-svelte instance for the demo, backed by MicroComLib.
 *
 * `+layout.ts` imports this module before starting Web XPanel, so the host hooks that XPanel
 * delivers feedback through exist before `WebXPanel.initialize()` runs.
 */
export const ch5 = new Ch5Svelte();
