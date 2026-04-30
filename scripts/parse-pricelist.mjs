// Parses планы/nerzhaveika_utf8.csv (semicolon, two-stream layout) → src/data/pricelist.json
// Two streams per row: cols 0..3 (Марка/Размер/Ед.изм/Цена) and cols 5..8.
// Applies a configurable price markup (default +5%) and emits a stable URL slug per SKU.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(here, '../планы/nerzhaveika_utf8.csv');
const OUT = resolve(here, '../src/data/pricelist.json');

const PRICE_MARKUP = 1.05; // +5% over the source pricelist
const UPDATED_AT = '2026-04-29';

const SECTION_PATTERNS = [
	{ re: /^СТАЛЬ ЛИСТОВАЯ НЕРЖАВ НИКЕЛЕСОД/i, hub: 'list', sub: 'nikelesod' },
	{ re: /^СТАЛЬ ЛИСТОВАЯ НЕРЖАВ БЕЗ НИКЕЛЯ/i, hub: 'list', sub: 'beznikelya' },
	{ re: /^СТАЛЬ СОРТ НЕРЖ ЖАРОПР КРУГ/i, hub: 'krug', sub: 'zharoprochnyj' },
	{ re: /^СТАЛЬ СОРТ НЕРЖ НИКЕЛ КВАДРАТ/i, hub: 'krug', sub: 'kvadrat' },
	{ re: /^СТАЛЬ СОРТ НЕРЖ НИКЕЛ КРУГ/i, hub: 'krug', sub: 'nikelevyj' },
	{ re: /^СТАЛЬ СОРТ НЕРЖ НИКЕЛ ШЕСТИГРАННИК/i, hub: 'krug', sub: 'shestigrannik' },
	{ re: /^СТАЛЬ СОРТ НЕРЖ ЖАРОПР ШЕСТИГРАННИК/i, hub: 'krug', sub: 'shestigrannik' },
	{ re: /^ПРОВОЛОКА НЕРЖАВЕЮЩАЯ/i, hub: 'provoloka', sub: 'osnovnaya' },
	{ re: /^ДЕТАЛИ ТРУБОПРОВОДОВ\s*-\s*ФЛАНЕЦ/i, hub: 'detali-truboprovoda', sub: 'flanec' },
	{ re: /^ДЕТАЛИ ТРУБОПРОВОДОВ\s*-\s*ОТВОД/i, hub: 'detali-truboprovoda', sub: 'otvod' },
	{ re: /^ТРУБЫ НЕРЖАВ\.?\s*ЭЛ\/СВАРНЫЕ/i, hub: 'truba', sub: 'elsvarnaya' },
	{ re: /^ТРУБЫ НЕРЖАВ\.?\s*БЕСШОВНЫЕ/i, hub: 'truba', sub: 'besshovnaya' },
];

function detectSection(cell) {
	const c = cell.trim();
	if (!c) return null;
	for (const p of SECTION_PATTERNS) if (p.re.test(c)) return { ...p };
	return null;
}

function isHeaderRow(g) {
	const t = (g || '').trim().toLowerCase();
	return t === 'марка' || t.startsWith('марка;') || t === 'размер' || t.startsWith('размер;');
}

function parseSizes(raw) {
	if (!raw) return [];
	const cleaned = raw.trim().replace(/^"|"$/g, '');
	return cleaned
		.split(';')
		.map((s) => s.trim().replace(',', '.'))
		.filter(Boolean);
}

function classifyTreatment(name) {
	const t = name.toLowerCase();
	if (t.startsWith('г/к н/с')) return { roll: 'г/к', alloy: 'никелесодержащий' };
	if (t.startsWith('х/к н/с')) return { roll: 'х/к', alloy: 'никелесодержащий' };
	if (t.startsWith('г/к б/н')) return { roll: 'г/к', alloy: 'без никеля' };
	if (t.startsWith('х/к б/н')) return { roll: 'х/к', alloy: 'без никеля' };
	if (/din1013/i.test(name)) return { roll: 'обточенный', alloy: null };
	if (/h9|h11/i.test(name)) return { roll: 'калиброванный', alloy: null };
	if (/электрошлаковый/i.test(name)) return { roll: 'ЭШП', alloy: null };
	return { roll: null, alloy: null };
}

const SURFACE_PATTERNS = [
	{ re: /No1\b/i, label: 'No1' },
	{ re: /TEAR PLATE|рифлен/i, label: 'TEAR PLATE (рифл.)' },
	{ re: /4N\+LPE/i, label: '4N+LPE (шлиф.)' },
	{ re: /4N\+PE/i, label: '4N+PE (шлиф.)' },
	{ re: /4N\b/i, label: '4N (шлиф.)' },
	{ re: /BA\+LPE/i, label: 'BA+LPE (зерк.)' },
	{ re: /BA\+LASER PE/i, label: 'BA+LASER PE (зерк.)' },
	{ re: /BA\+PE/i, label: 'BA+PE (зерк.)' },
	{ re: /BA\+PI/i, label: 'BA+PI (зерк.)' },
	{ re: /\bBA\b|зеркал/i, label: 'BA (зерк.)' },
	{ re: /2B\+PE/i, label: '2B+PE (мат.)' },
	{ re: /2B\+PI/i, label: '2B+PI (мат.)' },
	{ re: /\b2B\b|матов/i, label: '2B (мат.)' },
	{ re: /DECO\d?\+PE/i, label: 'DECO+PE' },
];

function detectSurface(name) {
	for (const p of SURFACE_PATTERNS) if (p.re.test(name)) return p.label;
	return null;
}

function extractGrade(name) {
	const cleaned = name
		.replace(/^\s*(г\/к|х\/к)\s*(н\/с|б\/н)?/i, '')
		.replace(/\s+No1\b.*$/i, '')
		.replace(/\s+TEAR PLATE.*$/i, '')
		.replace(/\s+(2B|4N|BA)(\+[A-Z]+)?.*$/i, '')
		.replace(/\s+DIN1013.*$/i, '')
		.replace(/\s+h(9|11).*$/i, '')
		.replace(/\s+\(Калиброванный\).*$/i, '')
		.replace(/\s+\(Обточенный\).*$/i, '')
		.replace(/\s+некондиция.*$/i, '')
		.replace(/\s+уценка.*$/i, '')
		.replace(/\s+\(матовый\).*$/i, '')
		.replace(/\s+\(зеркальный\).*$/i, '')
		.replace(/\s+\(шлиф\.\).*$/i, '')
		.replace(/\s+\(рифлен\.\).*$/i, '')
		.replace(/\s{2,}/g, ' ')
		.trim();
	return cleaned || name.trim();
}

function parsePrice(raw) {
	if (!raw) return null;
	const n = Number(String(raw).replace(/\s+/g, ''));
	if (!Number.isFinite(n)) return null;
	return n > 0 ? n : null; // 0 → on request
}

function applyMarkup(p) {
	if (p == null) return null;
	return Math.round(p * PRICE_MARKUP);
}

const TRANSLIT_MAP = {
	а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh',
	з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
	п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c',
	ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

function transliterate(s) {
	return String(s)
		.toLowerCase()
		.split('')
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
	return slugify(surface.replace(/\(.*?\)/g, ''));
}

function buildSlug(sku) {
	const parts = [
		slugify(sku.grade),
		rollSlug(sku.roll),
		surfaceSlug(sku.surface),
		sku.size ? `${slugify(sku.size)}mm` : '',
	].filter(Boolean);
	return parts.join('-');
}

function parseCSV(text) {
	const lines = text.split(/\r?\n/);
	const rows = [];
	for (const line of lines) {
		if (!line) {
			rows.push([]);
			continue;
		}
		const cols = [];
		let cur = '';
		let inQ = false;
		for (let i = 0; i < line.length; i++) {
			const ch = line[i];
			if (ch === '"') {
				inQ = !inQ;
				continue;
			}
			if (ch === ';' && !inQ) {
				cols.push(cur);
				cur = '';
				continue;
			}
			cur += ch;
		}
		cols.push(cur);
		rows.push(cols);
	}
	return rows;
}

function reclassifyByName(sku) {
	if (sku.section.hub === 'truba') return null;
	const n = sku.rawName;
	const isFitting = /\b90°|\bП90°|\d+x\d+/i.test(n) && (sku.unit === 'шт' || /импорт/i.test(n));
	if (isFitting) {
		const sub = /150x|x\d+x\d+/i.test(n) ? 'flanec' : 'otvod';
		return { hub: 'detali-truboprovoda', sub };
	}
	return null;
}

function processRowsShared(rows) {
	const out = [];
	// Single shared section for both column streams. The prayslist is laid
	// out as one logical document; when any column shows a new section
	// heading, BOTH columns are now in that section. Keeping per-stream
	// section state caused the right column to keep adding e.g. truba rows
	// to the previous "list/beznikelya" section because some section
	// headings appear only in col 0 and never in col 5.
	const state = { section: null };
	const lastByStream = { L: null, R: null };

	const handleStream = (row, off, streamKey) => {
		const get = (i) => (row[i] ?? '').trim();
		const cell0 = get(off[0]);

		const sec = detectSection(cell0);
		if (sec) {
			state.section = sec;
			lastByStream.L = null;
			lastByStream.R = null;
			return;
		}
		const grade = cell0;
		const size = get(off[1]);
		const unit = get(off[2]);
		const price = get(off[3]);

		if (isHeaderRow(grade)) return;
		const section = state.section;
		if (!section) return;
		if (!grade && !size) return;

		if (!grade && size) {
			const last = lastByStream[streamKey];
			if (last) last._extraSizes.push(...parseSizes(size));
			return;
		}
		if (!grade) return;

		const priceN = parsePrice(price);
		const u = unit || 'т';

		// Truba section uses a different layout: col0 = "<diameter>   <grade>",
		// col1 = wall thickness, col2 = unit (м), col3 = price.
		if (section.hub === 'truba') {
			const m = grade.match(/^\s*([\d.,]+)\s+(.+)$/);
			if (!m) return;
			const diameter = m[1].replace(',', '.');
			const restName = m[2].trim();
			const cleanRest = extractGrade(restName);
			const wall = (size || '').replace(',', '.');
			const sku = {
				section: { hub: section.hub, sub: section.sub },
				rawName: grade,
				grade: cleanRest,
				roll: null,
				alloy: null,
				surface: null,
				sizes: [wall ? `Ø${diameter} × ${wall}` : `Ø${diameter}`],
				_extraSizes: [],
				unit: u || 'м',
				price: priceN,
			};
			out.push(sku);
			lastByStream[streamKey] = sku;
			return;
		}

		const sizes = parseSizes(size);
		const treatment = classifyTreatment(grade);
		const surface = detectSurface(grade);
		const cleanGrade = extractGrade(grade);

		const sku = {
			section: { hub: section.hub, sub: section.sub },
			rawName: grade,
			grade: cleanGrade,
			roll: treatment.roll,
			alloy: treatment.alloy,
			surface,
			sizes,
			_extraSizes: [],
			unit: u,
			price: priceN,
		};
		const reSec = reclassifyByName(sku);
		if (reSec) sku.section = reSec;
		out.push(sku);
		lastByStream[streamKey] = sku;
	};

	for (const row of rows) {
		handleStream(row, [0, 1, 2, 3], 'L');
		handleStream(row, [5, 6, 7, 8], 'R');
	}
	for (const sku of out) {
		if (sku._extraSizes.length) sku.sizes = [...sku.sizes, ...sku._extraSizes];
		delete sku._extraSizes;
	}
	return out;
}

function expandSkus(skus) {
	const exp = [];
	for (const s of skus) {
		const sizes = s.sizes.length ? s.sizes : [''];
		for (const size of sizes) {
			// Skip rows with placeholder/missing size (e.g. CSV had "0").
			const trimmed = String(size).trim();
			if (!trimmed || trimmed === '0' || /^Ø?0(\b|\s|$)/.test(trimmed)) continue;
			exp.push({
				hub: s.section.hub,
				sub: s.section.sub,
				grade: s.grade,
				roll: s.roll,
				alloy: s.alloy,
				surface: s.surface,
				size: trimmed,
				unit: s.unit,
				price: applyMarkup(s.price),
			});
		}
	}
	return exp;
}

function ensureUniqueSlugs(skus) {
	const seen = new Map();
	for (const sku of skus) {
		const base = buildSlug(sku) || 'pozition';
		const key = `${sku.hub}/${base}`;
		const n = (seen.get(key) ?? 0) + 1;
		seen.set(key, n);
		sku.slug = n === 1 ? base : `${base}-${n}`;
	}
}

async function main() {
	const csv = await readFile(SRC, 'utf8');
	const rows = parseCSV(csv);
	const skus = processRowsShared(rows);
	const all = expandSkus(skus);

	const byHub = {};
	for (const sku of all) {
		const k = sku.hub;
		(byHub[k] ||= []).push(sku);
	}

	for (const hub of Object.keys(byHub)) {
		byHub[hub].sort((a, b) => {
			const cmp = (a.grade || '').localeCompare(b.grade || '', 'ru');
			if (cmp) return cmp;
			const r = (a.roll || '').localeCompare(b.roll || '', 'ru');
			if (r) return r;
			const s = (a.surface || '').localeCompare(b.surface || '', 'ru');
			if (s) return s;
			return parseFloat(a.size) - parseFloat(b.size) || 0;
		});
		ensureUniqueSlugs(byHub[hub]);
	}

	const stats = Object.fromEntries(
		Object.entries(byHub).map(([k, v]) => [k, { total: v.length, withPrice: v.filter((x) => x.price != null).length }]),
	);

	const out = {
		updatedAt: UPDATED_AT,
		source: `mc.ru +${Math.round((PRICE_MARKUP - 1) * 100)}% markup applied`,
		stats,
		hubs: byHub,
	};

	await writeFile(OUT, JSON.stringify(out, null, 2), 'utf8');
	console.log('Wrote', OUT);
	console.log('Stats:', JSON.stringify(stats, null, 2));
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
