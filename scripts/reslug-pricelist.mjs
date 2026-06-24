// One-shot: переписать sku.slug в pricelist.json с учётом sub.
// До этого slug = grade+roll+surface+size — без sub. На /detali-truboprovoda/
// 333 из 756 SKU делили slug с другим типом (отвод/фланец/тройник одной
// марки и размера). Клик из PriceTable открывал чужую страницу.
// После — sub в начале, коллизии разводятся естественно; для остатков
// (одинаковая marka+размер внутри одного sub) — суффикс -2/-3.
// Все прочие поля не трогаем — JSON содержит ручные правки, parse-pricelist
// их не воспроизведёт.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const FILE = resolve(here, '../src/data/pricelist.json');

const TRANSLIT_MAP = {
	'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z',
	'и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
	'с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'c','ч':'ch','ш':'sh','щ':'sch',
	'ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',
};

function transliterate(s) {
	return String(s ?? '').toLowerCase().split('')
		.map((ch) => (TRANSLIT_MAP[ch] !== undefined ? TRANSLIT_MAP[ch] : ch))
		.join('');
}
function slugify(s) {
	return transliterate(s)
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.replace(/-{2,}/g, '-');
}
function rollSlug(roll) {
	if (!roll) return '';
	const m = { 'г/к': 'gk', 'х/к': 'hk', 'обточенный': 'din1013', 'калиброванный': 'kalibr', 'ЭШП': 'eshp' };
	return m[roll] ?? slugify(roll);
}
function surfaceSlug(surface) {
	if (!surface) return '';
	return slugify(String(surface).replace(/\(.*?\)/g, ''));
}
function buildSlug(sku) {
	const parts = [
		sku.sub ? slugify(sku.sub) : '',
		slugify(sku.grade),
		rollSlug(sku.roll),
		surfaceSlug(sku.surface),
		sku.size ? `${slugify(sku.size)}mm` : '',
	].filter(Boolean);
	return parts.join('-');
}

const data = JSON.parse(await readFile(FILE, 'utf8'));
const stats = {};

for (const hub of Object.keys(data.hubs || {})) {
	const seen = new Map();
	const skus = data.hubs[hub];
	let renamed = 0;
	for (const sku of skus) {
		const base = buildSlug(sku) || 'pozition';
		const n = (seen.get(base) ?? 0) + 1;
		seen.set(base, n);
		const next = n === 1 ? base : `${base}-${n}`;
		if (sku.slug !== next) renamed++;
		sku.slug = next;
	}
	const u = new Set(skus.map((s) => s.slug)).size;
	stats[hub] = { total: skus.length, unique: u, dupes: skus.length - u, renamed };
}

await writeFile(FILE, JSON.stringify(data, null, '\t') + '\n', 'utf8');
console.log(JSON.stringify(stats, null, 2));
