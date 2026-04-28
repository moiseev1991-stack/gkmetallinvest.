// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://gkmetallinvest.ru',
	trailingSlash: 'always',
	compressHTML: true,
	// Слушаем 0.0.0.0, иначе на Windows часто только [::1] — браузер по 127.0.0.1 не достучится
	server: {
		host: true,
		port: 4321,
	},
});
