// Scrapes mc.ru catalog categories listed in categories.mjs.
// Polite fetch (1 req/sec + jitter), retries, resume via per-category cache.
// Output:
//   src/data/pricelist.json — REPLACED with new aggregated dataset (backup made by caller).
//   public/img/catalog/<hub>/<sub>.webp — uniqueized category image.
//   планы/mc-content.json — h1 / lead / about text per category, for human rewrite later.
//
// Usage:
//   node scripts/scrape-mc/index.mjs                  — all categories
//   node scripts/scrape-mc/index.mjs --only=krug      — only categories whose hub matches
//   node scripts/scrape-mc/index.mjs --only=mc:krug_nerzhaveyushchij_nikelsoderzhashchij
//   node scripts/scrape-mc/index.mjs --dry-run        — parse, don't write outputs
//   node scripts/scrape-mc/index.mjs --no-images      — skip image download

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import * as cheerio from 'cheerio';
import sharp from 'sharp';
import { CATEGORIES } from './categories.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '../..');
const CACHE_DIR = join(here, '.cache');
const PRICELIST = join(ROOT, 'src/data/pricelist.json');
const IMG_DIR = join(ROOT, 'public/img/catalog');
const CONTENT_FILE = join(ROOT, 'планы/mc-content.json');

const PRICE_MARKUP = 1.05;
const UPDATED_AT = '2026-05-12';
const BASE_URL = 'https://mc.ru';
const USER_AGENT = 'GKMetallinvest-Bot (catalog import; +mailto:moiseev1991@gmail.com)';
const REQ_DELAY_MS = 1000;
const REQ_JITTER_MS = 300;
const RETRY_MAX = 3;

// ─── args ─────────────────────────────────────────────────────────────────────
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
	const m = a.match(/^--([^=]+)(?:=(.*))?$/);
	return m ? [m[1], m[2] ?? true] : [a, true];
}));
const DRY_RUN = !!args['dry-run'];
const NO_IMAGES = !!args['no-images'];
const ONLY = args.only ? String(args.only) : null;

// ─── http ─────────────────────────────────────────────────────────────────────
let lastFetchAt = 0;
async function politeFetch(url, { binary = false } = {}) {
	const wait = Math.max(0, lastFetchAt + REQ_DELAY_MS + Math.random() * REQ_JITTER_MS - Date.now());
	if (wait > 0) await sleep(wait);
	lastFetchAt = Date.now();

	let lastErr;
	for (let attempt = 0; attempt < RETRY_MAX; attempt++) {
		try {
			const res = await fetch(url, {
				headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'ru,en;q=0.7' },
				redirect: 'follow',
			});
			if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
			return binary ? Buffer.from(await res.arrayBuffer()) : await res.text();
		} catch (err) {
			lastErr = err;
			const backoff = 2000 * Math.pow(2, attempt);
			console.warn(`  ! ${url} (attempt ${attempt + 1}/${RETRY_MAX}): ${err.message}; retrying in ${backoff}ms`);
			await sleep(backoff);
		}
	}
	throw lastErr;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchCached(url, cachePath) {
	if (existsSync(cachePath)) {
		return await readFile(cachePath, 'utf-8');
	}
	const html = await politeFetch(url);
	await writeFile(cachePath, html, 'utf-8');
	return html;
}

// ─── slug / transliteration ──────────────────────────────────────────────────
// "Metallurgical" transliteration: Х→h (not kh), Ц→ts, etc.
const TRANSLIT_MAP = {
	'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E', 'Ж': 'Zh', 'З': 'Z',
	'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R',
	'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
	'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
};
function translit(s) {
	let out = '';
	for (const ch of String(s)) {
		const up = ch.toUpperCase();
		out += TRANSLIT_MAP[up] !== undefined
			? (ch === up ? TRANSLIT_MAP[up] : TRANSLIT_MAP[up].toLowerCase())
			: ch;
	}
	return out;
}
function slugify(...parts) {
	return parts
		.filter((p) => p !== null && p !== undefined && p !== '')
		.map((p) => translit(String(p)).toLowerCase())
		.join('-')
		.replace(/[^a-z0-9-]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}

// ─── parsing ─────────────────────────────────────────────────────────────────
function parsePrice(text) {
	const cleaned = String(text || '').replace(/ |&nbsp;|\s/g, '').replace(',', '.');
	const n = parseFloat(cleaned);
	return Number.isFinite(n) ? n : null;
}

// detect rolling type from product name
function detectRoll(name) {
	const t = String(name).toLowerCase();
	if (/\bх[\/.]?[тк]\b|холоднокатан|калиброван/.test(t)) return 'х/к';
	if (/\bг[\/.]?[тк]\b|горячекатан/.test(t)) return 'г/к';
	return null;
}

// detect surface from product name (only some categories have it)
function detectSurface(name) {
	const t = String(name).toLowerCase();
	if (/2b\b/.test(t)) return '2B';
	if (/no\.?1\b|n1\b|нo1\b/.test(t)) return 'No1';
	if (/4n\b/.test(t)) return '4N';
	if (/ba\b/.test(t)) return 'BA';
	return null;
}

// for detali-truboprovoda: detect sub from name (flanec/otvod/troynik/perehod)
function detectDetaliSub(name) {
	const t = String(name).toLowerCase();
	if (/фланец/.test(t)) return 'flanec';
	if (/отвод/.test(t)) return 'otvod';
	if (/тройник/.test(t)) return 'troynik';
	if (/переход/.test(t)) return 'perehod';
	if (/заглушк/.test(t)) return 'zaglushka';
	if (/задвижк/.test(t)) return 'zadvizhka';
	if (/штуцер/.test(t)) return 'shtutser';
	return 'prochee';
}

// Extract tube size "Ø×wall" from product name. e.g. "трубы 6x1 ГОСТ" → "Ø6 × 1"
function extractTubeSize(name, r1) {
	const m = String(name).match(/(\d+(?:[.,]\d+)?)\s*[xх×]\s*(\d+(?:[.,]\d+)?)/i);
	if (m) return `Ø${m[1].replace(',', '.')} × ${m[2].replace(',', '.')}`;
	return r1 ? `Ø${r1}` : null;
}

function parseCategoryPage(html) {
	const $ = cheerio.load(html);
	const rows = [];
	$('table.catalogTable tr').each((_i, tr) => {
		const tov = $(tr).find('td.TovName');
		if (!tov.length) return; // header/junk row
		const name = tov.find('.refstr._nm, .refstr ._nm').first().text().trim()
			|| tov.text().trim();
		if (!name) return;
		// size column may contain link/meta children — take leading number
		const razmerCell = $(tr).find('td._razmer');
		const r1Raw = razmerCell.clone().children().remove().end().text().trim();
		const grade = $(tr).find('td._mark').text().trim();
		const dlina = $(tr).find('td._dlina').text().trim();
		const ost = $(tr).find('td._ost').text().trim();
		const fact = $(tr).find('td._fact').clone().children().remove().end().text().trim();
		const priceFrom1t = parsePrice($(tr).find('td[data-price-val="3"] .pr').first().text());
		const priceFromMid = parsePrice($(tr).find('td[data-price-val="2"] .pr').first().text());
		const priceFromZero = parsePrice($(tr).find('td[data-price-val="1"] .pr').first().text());
		const detailHref = tov.find('a').attr('href') || null;
		const imageUrl = razmerCell.find('link[itemprop="image"]').attr('href') || null;
		const fullName = razmerCell.find('meta[itemprop="name"]').attr('content') || null;
		rows.push({
			name, r1: r1Raw, grade, dlina, ost, fact,
			priceFromZero, priceFromMid, priceFrom1t,
			detailHref, imageUrl, fullName,
		});
	});

	// Alternative layout: razmertable — used for bearings/components (columns: pict, name, marking, sku, descr, price)
	if (rows.length === 0) {
		$('table.razmertable tr').each((_i, tr) => {
			const cells = $(tr).find('td');
			if (cells.length < 5) return;
			const imgEl = $(cells[0]).find('img.Picture, img.refstr').first();
			const imageUrl = imgEl.attr('src') ? `https://mc.ru${imgEl.attr('src')}` : null;
			const name = $(cells[1]).text().trim();
			const marking = $(cells[2]).text().trim();
			const sku = $(cells[3]).text().trim();
			const descr = $(cells[4]).text().trim();
			const priceText = $(cells[5] || cells[cells.length - 1]).text();
			const price = parsePrice(priceText);
			if (!name) return;
			rows.push({
				name: descr || name,
				r1: marking, grade: marking, dlina: null,
				ost: null, fact: 'Москва',
				priceFromZero: price, priceFromMid: price, priceFrom1t: price,
				detailHref: null, imageUrl, fullName: name + (sku ? ` (арт. ${sku})` : ''),
			});
		});
	}

	// extract H1 + lead/intro
	const h1 = $('h1').first().text().trim();
	const lead = $('.catalogTopText, .pageDescription, .catalogDescription').first().text().trim()
		|| $('meta[name="description"]').attr('content') || '';
	const about = $('.catalogBottomText, .pageBottomText, .catalogSeoText').first().text().trim();

	// pagination: find max PageN number for this base
	const pageHrefs = [];
	$('a[href*="/PageN/"]').each((_i, a) => {
		const href = $(a).attr('href') || '';
		const m = href.match(/\/PageN\/(\d+)/);
		if (m) pageHrefs.push(parseInt(m[1], 10));
	});
	const maxPage = pageHrefs.length ? Math.max(...pageHrefs) : 1;

	return { rows, maxPage, meta: { h1, lead, about } };
}

// ─── normalizer: mc.ru row → pricelist SKU entry ─────────────────────────────
function rowToSku(row, cat) {
	const isTuba = cat.hub === 'truba';
	const size = isTuba ? extractTubeSize(row.name, row.r1) : (row.r1 || null);
	if (!size) return null;
	const basePrice = row.priceFrom1t ?? row.priceFromMid ?? row.priceFromZero;
	if (!basePrice && !cat.acceptNoPrice) return null;
	const price = basePrice ? Math.round(basePrice * PRICE_MARKUP) : null;
	// retail price (от 0т) — for the second price column shown in PriceTable like mc.ru
	const priceUnit = row.priceFromZero ? Math.round(row.priceFromZero * PRICE_MARKUP) : null;
	const sub = cat.sub === 'auto' ? detectDetaliSub(row.name) : cat.sub;
	const roll = detectRoll(row.name) ?? cat.defaultRoll;
	const surface = detectSurface(row.name);

	// slug parts: grade + roll + size, normalize
	const sizeForSlug = isTuba
		? size.replace(/Ø/g, '').replace(/\s*×\s*/g, '-').replace(/\s+/g, '')
		: String(size);
	const slug = slugify(row.grade, roll, surface, sizeForSlug + 'mm');

	return {
		hub: cat.hub,
		sub,
		grade: row.grade || null,
		roll: roll || null,
		alloy: cat.alloy || null,
		surface: surface || null,
		size: String(size),
		unit: cat.unit,
		price,
		priceUnit,
		slug,
		// extra fields (kept for new pages; existing code ignores them):
		dlina: row.dlina || null,
		fact: row.fact || null,
		ostatok: row.ost ? parseInt(row.ost.replace(/\D/g, ''), 10) || null : null,
		name: row.name,
	};
}

// ─── image: download category cover + uniqueize ──────────────────────────────
async function processCategoryImage(imageUrl, hub, sub) {
	if (!imageUrl || NO_IMAGES) return null;
	const url = imageUrl.startsWith('http')
		? imageUrl.replace(/\/\/+img/, '/img').replace(/(https?:\/\/[^/]+)\/+/, '$1/')
		: BASE_URL + imageUrl;
	const dir = join(IMG_DIR, hub);
	const outPath = join(dir, `${sub}.webp`);
	if (existsSync(outPath)) return `/img/catalog/${hub}/${sub}.webp`;
	await mkdir(dir, { recursive: true });
	try {
		const buf = await politeFetch(url, { binary: true });
		// uniqueize: resize, slight gamma shift (sharp accepts 1.0-3.0 only), strip metadata, webp 82
		const gamma = 1.0 + Math.random() * 0.05; // 1.00 – 1.05
		const brightness = 1 + (Math.random() * 0.04 - 0.02); // 0.98 – 1.02
		await sharp(buf)
			.resize({ width: 800, height: 800, fit: 'cover', position: 'centre' })
			.modulate({ brightness })
			.gamma(gamma)
			.webp({ quality: 82, effort: 4 })
			.toFile(outPath);
		return `/img/catalog/${hub}/${sub}.webp`;
	} catch (err) {
		console.warn(`  ! image failed: ${url}: ${err.message}`);
		return null;
	}
}

// ─── orchestrator ─────────────────────────────────────────────────────────────
function categoryMatches(cat) {
	if (!ONLY) return true;
	if (ONLY.startsWith('mc:')) return cat.mc === ONLY.slice(3);
	return cat.hub === ONLY;
}

async function scrapeCategory(cat) {
	console.log(`\n── ${cat.hub}/${cat.sub} ← ${cat.mc}`);
	await mkdir(CACHE_DIR, { recursive: true });

	const baseUrl = `${BASE_URL}/metalloprokat/${cat.mc}`;
	const cacheKey = cat.mc.replace(/[^a-z0-9]+/gi, '_');
	const page1Path = join(CACHE_DIR, `${cacheKey}__p1.html`);
	const page1Html = await fetchCached(baseUrl, page1Path);
	const page1 = parseCategoryPage(page1Html);
	console.log(`   page 1: ${page1.rows.length} rows; total pages: ${page1.maxPage}`);

	const allRows = [...page1.rows];
	for (let p = 2; p <= page1.maxPage; p++) {
		const pageUrl = `${baseUrl}/PageN/${p}`;
		const pagePath = join(CACHE_DIR, `${cacheKey}__p${p}.html`);
		const html = await fetchCached(pageUrl, pagePath);
		const parsed = parseCategoryPage(html);
		console.log(`   page ${p}: ${parsed.rows.length} rows`);
		allRows.push(...parsed.rows);
	}

	// dedupe by slug + optional keyword filter
	const skus = [];
	const seen = new Set();
	const filterRe = cat.filterKeyword ? new RegExp(cat.filterKeyword, 'i') : null;
	let filteredOut = 0;
	for (const row of allRows) {
		if (filterRe && !filterRe.test(row.name) && !filterRe.test(row.fullName || '')) {
			filteredOut++;
			continue;
		}
		const sku = rowToSku(row, cat);
		if (!sku) continue;
		let unique = sku.slug;
		let n = 1;
		while (seen.has(unique)) unique = `${sku.slug}-${++n}`;
		sku.slug = unique;
		seen.add(unique);
		skus.push(sku);
	}
	if (filteredOut > 0) console.log(`   (filtered out ${filteredOut} non-matching rows)`);

	// process category image (one per category, from first row that has one)
	const firstWithImage = allRows.find((r) => r.imageUrl);
	const imagePath = firstWithImage
		? await processCategoryImage(firstWithImage.imageUrl, cat.hub, cat.sub === 'auto' ? 'cover' : cat.sub)
		: null;

	console.log(`   ✔ ${skus.length} SKUs; image: ${imagePath || '—'}`);
	return { skus, content: { ...page1.meta, image: imagePath } };
}

async function main() {
	const cats = CATEGORIES.filter(categoryMatches);
	if (!cats.length) {
		console.error(`No categories matched --only=${ONLY}`);
		process.exit(1);
	}
	console.log(`Scraping ${cats.length} categor${cats.length > 1 ? 'ies' : 'y'}`);

	// Aggregate per hub
	const hubs = {};
	const stats = {};
	const content = {};

	for (const cat of cats) {
		try {
			const { skus, content: c } = await scrapeCategory(cat);
			hubs[cat.hub] = hubs[cat.hub] || [];
			hubs[cat.hub].push(...skus);
			stats[cat.hub] = stats[cat.hub] || { total: 0, withPrice: 0 };
			stats[cat.hub].total += skus.length;
			stats[cat.hub].withPrice += skus.filter((s) => s.price > 0).length;
			content[`${cat.hub}/${cat.sub}`] = { mc: cat.mc, title: cat.title, ...c };
		} catch (err) {
			console.error(`✗ ${cat.mc}: ${err.message}`);
		}
	}

	if (DRY_RUN) {
		console.log('\n[dry-run] skipping writes');
		console.log(JSON.stringify({ stats, hubKeys: Object.keys(hubs).map((k) => `${k}:${hubs[k].length}`) }, null, 2));
		// dump 2 sample SKUs from each scraped hub for schema sanity-check
		for (const [hub, skus] of Object.entries(hubs)) {
			console.log(`\n--- sample ${hub} (${skus.length}) ---`);
			console.log(JSON.stringify(skus.slice(0, 2), null, 2));
		}
		return;
	}

	// Always merge with existing pricelist: never overwrite a non-empty hub with empty.
	let existing = { hubs: {}, stats: {} };
	try { existing = JSON.parse(await readFile(PRICELIST, 'utf-8')); } catch {}
	const finalHubs = { ...(existing.hubs || {}) };
	const finalStats = { ...(existing.stats || {}) };
	for (const [hub, skus] of Object.entries(hubs)) {
		if (skus.length === 0 && (existing.hubs?.[hub]?.length || 0) > 0) {
			console.warn(`  ! skipping empty overwrite of ${hub} (existing ${existing.hubs[hub].length} SKUs kept)`);
			continue;
		}
		finalHubs[hub] = skus;
		finalStats[hub] = stats[hub];
	}

	const out = {
		updatedAt: UPDATED_AT,
		source: 'mc.ru +5% markup applied',
		stats: finalStats,
		hubs: finalHubs,
	};
	await writeFile(PRICELIST, JSON.stringify(out, null, 2), 'utf-8');
	console.log(`\n✔ wrote ${PRICELIST}`);

	await mkdir(dirname(CONTENT_FILE), { recursive: true });
	let existingContent = {};
	try { existingContent = JSON.parse(await readFile(CONTENT_FILE, 'utf-8')); } catch {}
	const mergedContent = { ...existingContent, ...content };
	await writeFile(CONTENT_FILE, JSON.stringify(mergedContent, null, 2), 'utf-8');
	console.log(`✔ wrote ${CONTENT_FILE}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
