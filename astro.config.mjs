// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { getSitemapDupPaths } from './src/data/sku-seo.mjs';

/* Слаги реальных дублей (одна и та же позиция с другой партии). Считаются той
   же логикой, что noindex+canonical на карточках, — см. src/data/sku-seo.mjs. */
const dupPaths = getSitemapDupPaths();

// https://astro.build/config
export default defineConfig({
	site: 'https://gkmetallinvest.ru',
	trailingSlash: 'always',
	compressHTML: true,
	integrations: [
		sitemap({
			/* В sitemap не идут только настоящие дубли — та же позиция с другой
			   партии (canonical у них указывает на основную карточку).
			   Раньше здесь стояло `/-\d+\/$/` по форме URL, и это выбивало из
			   sitemap всё, что кончается цифрой: марочные посадочные
			   /list/aisi-304/, /list/aisi-321/, /list/aisi-430/, весь
			   ГОСТ-справочник (/gost/9941-81/ — 112 страниц), статью
			   /blog/aisi-304-vs-316l-vs-321/ и карточки с форматом в слаге.
			   Заодно снят запрет на dekorativnye-listy и folga-nerzhaveyushchaya:
			   это уже не заглушки, разделы наполнены (30 и 16 страниц). */
			filter: (page) => {
				const path = new URL(page).pathname;
				const segments = path.split('/').filter(Boolean);
				if (segments.length === 2) return !dupPaths.has(segments.join('/'));
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
