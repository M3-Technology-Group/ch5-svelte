import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
	plugins: [sveltekit(), 
		viteStaticCopy({
			targets: [
			  {
				src: 'node_modules/@crestron/ch5-crcomlib/build_bundles/umd/cr-com-lib.js',
				dest: ''
			  }
			]}),
	],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
