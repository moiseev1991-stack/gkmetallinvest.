// Parses планы/nerzhaveika_utf8.csv (semicolon, two-stream layout) → src/data/pricelist.json
// Two streams per row: cols 0..3 (Марка/Размер/Ед.изм/Цена) and cols 5..8.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(here, '../планы/nerzhaveika_utf8.csv');
const OUT = resolve(here, '../src/data/pricelist.json');

const SECTION_PATTERNS = [
	{ re: /^СТАЛЬ ЛИСТОВАЯ НЕРЖАВ НИКЕЛЕСОД/i, hub: 'list', sub: 'nikelesod' },
	{ re: /^СТАЛЬ ЛИСТОВАЯ НЕРЖАВ БЕЗ НИКЕЛЯ/i, hub: 'list', sub: 'beznikelya' },
	{ re: /^СТАЛЬ СОРТ НЕРЖ ЖАРОПР КРУГ/i, hub: 'krug', sub: 'zharoprochnyj' },
	{ re: /^СТАЛЬ СОРТ НЕРЖ НИКЕЛ КВАДРАТ/i, hub: 'krug', sub: 'kvadrat' },
	{ re: /^СТАЛЬ СОРТ НЕРЖ НИКЕЛ КРУГ/i, hub: 'krug', sub: 'nikelevyj' },
	{ re: /^СТАЛЬ СОРТ НЕРЖ НИКЕЛ ШЕСТИГРАННИК/i, hub: 'krug', sub: 'shestigrannik' },
	{ re: /^ПРОВОЛОКА НЕРЖАВЕЮЩАЯ/i, hub: 'provoloka', sub: 'osnovnaya' },
	{ re: /^ДЕТАЛИ ТРУБОПРОВОДОВ\s*-\s*ФЛАНЕЦ/i, hub: 'detali-truboprovoda', sub: 'flanec' },
	{ re: /^ДЕТАЛИ ТРУБОПРОВОДОВ\s*-\s*ОТВОД/i, hub: 'detali-truboprovoda', sub: 'otvod' },
];

function detectSection(cell) {
	const c = cell.trim();
	if (!c) return null;
	for (const p of SECTION_PATTERNS) if (p.re.test(c)) return { ...p };
	return null;
}

function isHeaderRow(g) {
	const t = (g || '').trim().toLowerCase();
	return t === 'марка' || t.startsWith('марка;');
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

function parseCSV(text) {
	const lines = text.split(/\r?\n/);
	const rows = [];
	for (const line of lines) {
		if (!line) {
			rows.push([]);
			continue;
		}
		// Robust split with quoted field support
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
	const n = sku.rawName;
	const isFitting = /\b90°|\bП90°|\d+x\d+/i.test(n) && (sku.unit === 'шт' || /импорт/i.test(n));
	if (isFitting) {
		const sub = /150x|x\d+x\d+/i.test(n) ? 'flanec' : 'otvod';
		return { hub: 'detali-truboprovoda', sub };
	}
	return null;
}

function processRowsShared(rows) {
	// Per-stream section state + name-based reclassification for fittings.
	const out = [];
	const sections = { L: null, R: null };
	const lastByStream = { L: null, R: null };

	const handleStream = (row, off, streamKey) => {
		const get = (i) => (row[i] ?? '').trim();
		const cell0 = get(off[0]);

		const sec = detectSection(cell0);
		if (sec) {
			sections[streamKey] = sec;
			lastByStream[streamKey] = null;
			return;
		}
		const grade = cell0;
		const size = get(off[1]);
		const unit = get(off[2]);
		const price = get(off[3]);

		if (isHeaderRow(grade)) return;
		const section = sections[streamKey];
		if (!section) return;
		if (!grade && !size) return;

		if (!grade && size) {
			const last = lastByStream[streamKey];
			if (last) last._extraSizes.push(...parseSizes(size));
			return;
		}
		if (!grade) return;

		const sizes = parseSizes(size);
		const priceN = parsePrice(price);
		const treatment = classifyTreatment(grade);
		const surface = detectSurface(grade);
		const cleanGrade = extractGrade(grade);
		const u = unit || 'т';

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
			exp.push({
				hub: s.section.hub,
				sub: s.section.sub,
				grade: s.grade,
				roll: s.roll,
				alloy: s.alloy,
				surface: s.surface,
				size,
				unit: s.unit,
				price: s.price,
			});
		}
	}
	return exp;
}

async function main() {
	const csv = await readFile(SRC, 'utf8');
	const rows = parseCSV(csv);
	const skus = processRowsShared(rows);
	const all = expandSkus(skus);

	// Group by hub
	const byHub = {};
	for (const sku of all) {
		const k = sku.hub;
		(byHub[k] ||= []).push(sku);
	}

	// Sort: grade → roll → surface → size
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
	}

	// Stats
	const stats = Object.fromEntries(
		Object.entries(byHub).map(([k, v]) => [k, { total: v.length, withPrice: v.filter((x) => x.price != null).length }]),
	);

	const out = {
		updatedAt: '2026-04-15',
		source: 'mc.ru',
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
