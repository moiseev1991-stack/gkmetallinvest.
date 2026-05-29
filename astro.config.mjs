// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: 'https://gkmetallinvest.ru',
	trailingSlash: 'always',
	compressHTML: true,
	integrations: [
		sitemap({
			// Дубли карточек с суффиксом -2/-3/-N — те же товары с других партий;
			// в sitemap идут только основные slug'и. Пустые хабы (без прайса)
			// тоже отсекаем — они закрыты от индексации и пустые с точки зрения SEO.
			filter: (page) => {
				const path = new URL(page).pathname;
				if (/-\d+\/$/.test(path)) return false;
				if (/^\/(lenta|folga|dekorativnye-listy)(\/|$)/.test(path)) return false;
				return true;
			},
		}),
	],
	// Слушаем 0.0.0.0, иначе на Windows часто только [::1] — браузер по 127.0.0.1 не достучится
	server: {
		host: true,
		port: 4321,
	},
});
