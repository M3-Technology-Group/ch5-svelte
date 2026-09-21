import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig(({ mode }) => ({
	plugins: [sveltekit()],
	// Tell Vitest to use the `browser` entry points in `package.json` files, even though it's
	// running in Node, so `flushSync` and friends are the real client implementations.
	resolve: mode === 'test' ? { conditions: ['browser'] } : undefined,
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		// A DOM environment makes Vitest use the web transform, which compiles `.svelte.ts` files
		// (and the `.svelte.test.ts` files that exercise them) for the client instead of the server.
		environment: 'jsdom'
	}
}));
