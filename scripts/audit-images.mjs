// Проверяет, что у каждой подкатегории каталога есть своя картинка.
//
// Зачем. Карточка товара берёт файл по пути /img/catalog/<hub>/<sub>.webp.
// Имена `sub` живут в трёх местах — scrape-mc/categories.mjs (скрапер mc.ru),
// постобработчики прайса (normalize-ugolok-shveller.mjs, разбор фланцев) и
// add-under-order-marks.mjs, — а имена файлов лежат на диске и ни за кем не
// следуют. Стоит переименовать `sub` при перепарсе — и карточки тихо пустеют:
// на 2026-08-02 так пустовали 832 из 4197 (20 %), причём заметили это только
// глазами на скриншоте. Каскад в src/data/catalog-images.mjs больше не даёт
// показать пустоту, но подмена «фото фланца» на «обложку раздела» — не то, что
// должно проходить молча. Этот скрипт печатает такие подмены при каждом билде.
//
// Использование:
//   node scripts/audit-images.mjs            — отчёт, всегда exit 0 (часть npm run build)
//   node scripts/audit-images.mjs --strict   — exit 1, если у пары нет своего файла
//   node scripts/audit-images.mjs --verbose  — плюс список картинок без товаров

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { catalogImage, catalogImageLevel, catalogImageFiles } from '../src/data/catalog-images.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DATA_DIR = join(ROOT, 'src/data');
const STRICT = process.argv.includes('--strict');
const VERBOSE = process.argv.includes('--verbose');

/** hub|sub → сколько карточек. */
const counts = new Map();
const bump = (hub, sub) => {
	const key = `${hub}|${sub ?? ''}`;
	counts.set(key, (counts.get(key) || 0) + 1);
};

// 1) прайс — основной источник карточек
const pricelist = JSON.parse(readFileSync(join(DATA_DIR, 'pricelist.json'), 'utf8'));
for (const [hub, skus] of Object.entries(pricelist.hubs || {})) {
	for (const sku of skus) bump(hub, sku.sub);
}

// 2) датасеты-.ts (лента и прочие разделы вне прайса). Читаем регуляркой, а не
//    импортом: это .ts, а скрипт запускается голым node без транспиляции.
const TS_PAIR_RE = /hub:\s*["']([^"']+)["'][^\n]*?sub:\s*["']([^"']*)["']/g;
for (const file of readdirSync(DATA_DIR)) {
	if (!file.endsWith('.ts') || file.includes('backup')) continue;
	const text = readFileSync(join(DATA_DIR, file), 'utf8');
	for (const m of text.matchAll(TS_PAIR_RE)) bump(m[1], m[2]);
}

// 3) сверка
const pairs = [...counts.entries()]
	.map(([key, n]) => {
		const [hub, sub] = key.split('|');
		return { hub, sub, n, level: catalogImageLevel(hub, sub), src: catalogImage(hub, sub) };
	})
	.sort((a, b) => b.n - a.n);

const total = pairs.reduce((sum, p) => sum + p.n, 0);
const degraded = pairs.filter((p) => p.level !== 'exact');
const empty = pairs.filter((p) => p.level === 'none');

console.log(`[images] подкатегорий: ${pairs.length}, карточек: ${total}`);

if (degraded.length === 0) {
	console.log('[images] ✔ у каждой подкатегории своя картинка');
} else {
	for (const p of degraded) {
		const what = p.level === 'none'
			? 'НЕТ КАРТИНКИ ВООБЩЕ'
			: `подставлен запасной вариант (${p.src})`;
		console.warn(`[images] ! ${p.hub}/${p.sub} — ${p.n} карточек: нет ${p.hub}/${p.sub}.webp, ${what}`);
	}
	const affected = degraded.reduce((sum, p) => sum + p.n, 0);
	console.warn(`[images] ! всего затронуто карточек: ${affected} из ${total}`);
	console.warn('[images]   починка: положить файл через scripts/make-catalog-image.mjs');
	console.warn('[images]   либо привести sub к имени файла в scripts/scrape-mc/categories.mjs');
}

if (VERBOSE) {
	const used = new Set(pairs.filter((p) => p.level === 'exact').map((p) => `${p.hub}/${p.sub}.webp`));

	/* Часть разделов (арматура, трубопроводные детали) не идёт через hub/sub:
	   путь к картинке прописан прямо в данных — `image: '/img/catalog/...'`.
	   Собираем такие ссылки по исходникам, иначе они попадут в «сироты». */
	const LINK_RE = /\/img\/catalog\/([\w-]+\/[\w-]+\.\w+)/g;
	const walk = (dir) => {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const p = join(dir, entry.name);
			if (entry.isDirectory()) walk(p);
			else if (/\.(ts|astro|mjs|js|json)$/.test(entry.name)) {
				for (const m of readFileSync(p, 'utf8').matchAll(LINK_RE)) used.add(m[1]);
			}
		}
	};
	walk(join(ROOT, 'src'));

	// Обложки хабов и cover.webp — законные, они и есть запасные варианты каскада.
	const orphans = catalogImageFiles().filter(
		(f) => f.includes('/') && !f.endsWith('/cover.webp') && !used.has(f),
	);
	console.log(`[images] картинок без товаров: ${orphans.length}`);
	for (const o of orphans) console.log(`[images]   ${o}`);
}

if (STRICT && degraded.length > 0) process.exit(1);
