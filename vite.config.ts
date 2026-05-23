import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	plugins: [
		tailwindcss(),
		SvelteKitPWA({
			devOptions: {
				enabled: true
			},
			registerType: 'autoUpdate',
			manifest: {
				name: 'Simply Sudoku',
				short_name: 'Simply Sudoku',
				start_url: '/',
				display: 'standalone',
				background_color: '#000000',
				theme_color: '#386c0b',

				icons: [
					{
						src: '/icon-192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'maskable'
					},
					{
						src: '/icon-512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				]
			}
		}),
		sveltekit()
	]
});
