// Обогащает клапаны/задвижки в src/data/pricelist.json полями country + vesNetto,
// парся карточки товара mc.ru. URL берутся из кэша scrape-mc/.cache.
// Правка заказчика: показывать обозначение + производителя + вес нетто как на MC.
//
// Запуск:  node scripts/enrich-valves.mjs         (dry-run, печатает таблицу)
//          node scripts/enrich-valves.mjs --write  (пишет в pricelist.json)

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const CACHE = resolve(here, 'scrape-mc/.cache');
const PRICELIST = resolve(here, '../src/data/pricelist.json');
const BASE = 'https://mc.ru';
const WRITE = process.argv.includes('--write');

function extractUrls(html, sub) {
	const re =
		sub === 'klapan'
			? /href="(\/metalloprokat\/klapany_nerzhaveyushie[^"]*razmer[^"]*)"/gi
			: /href="(\/metalloprokat\/zadvizhki_nerzhaveyushie[^"]*razmer[^"]*)"/gi;
	return [...new Set([...html.matchAll(re)].map((m) => m[1]))];
}

// Из URL достаём Ду/Ру: ..._razmer_<du>_marka_<ru>...
function parseDuRu(url) {
	const du = (url.match(/razmer_(\d+)/i) || [])[1];
	const ru = (url.match(/marka_(\d+)/i) || [])[1];
	return { du, ru };
}

async function politeFetch(url) {
	for (let attempt = 0; attempt < 3; attempt++) {
		try {
			const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
			if (r.ok) return await r.text();
		} catch (e) {
			/* retry */
		}
		await new Promise((res) => setTimeout(res, 800));
	}
	return null;
}

function parseWeight(html) {
	if (!html) return null;
	const text = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
	const m = text.match(/ВесНетто,?\s*кг\s*([\d]+(?:[.,]\d+)?)/i);
	if (!m) return null;
	const n = parseFloat(m[1].replace(',', '.'));
	return Number.isFinite(n) && n > 0 ? n : null;
}

async function main() {
	const klHtml = await readFile(resolve(CACHE, 'klapany_zatvory_nerz__p1.html'), 'utf8');
	const zaHtml = await readFile(resolve(CACHE, 'zadvizhki_nerzav__p1.html'), 'utf8');
	const jobs = [
		...extractUrls(klHtml, 'klapan').map((u) => ({ sub: 'klapan', url: u })),
		...extractUrls(zaHtml, 'zadvizhka').map((u) => ({ sub: 'zadvizhka', url: u })),
	];

	const map = new Map(); // key `sub|du|ru` -> { country, vesNetto }
	for (const job of jobs) {
		const { du, ru } = parseDuRu(job.url);
		const country = /kitay|kitaj/i.test(job.url) ? 'Китай' : /rossiya|_ross/i.test(job.url) ? 'Россия' : null;
		const html = await politeFetch(BASE + job.url);
		const vesNetto = parseWeight(html);
		const key = `${job.sub}|${du}|${ru}`;
		map.set(key, { country, vesNetto });
		console.log(`${job.sub.padEnd(9)} Ду${String(du).padEnd(4)} Ру${String(ru).padEnd(3)} ${country} вес=${vesNetto ?? '—'} кг`);
	}

	// Применяем к прайсу
	const pl = JSON.parse(await readFile(PRICELIST, 'utf8'));
	const arr = pl.hubs['detali-truboprovoda'] || [];
	let matched = 0,
		missed = 0;
	for (const s of arr) {
		if (s.sub !== 'klapan' && s.sub !== 'zadvizhka') continue;
		const du = (String(s.name).match(/Ду\s*(\d+)/i) || [])[1];
		const ru = (String(s.name).match(/Ру\s*(\d+)/i) || [])[1];
		const hit = map.get(`${s.sub}|${du}|${ru}`);
		if (hit) {
			if (hit.country) s.country = hit.country;
			if (hit.vesNetto != null) s.vesNetto = hit.vesNetto;
			matched++;
		} else {
			console.log('  ! нет данных для', s.slug, `(Ду${du} Ру${ru})`);
			missed++;
		}
	}
	console.log(`\nСопоставлено: ${matched}, без данных: ${missed}`);

	if (WRITE) {
		await writeFile(PRICELIST, JSON.stringify(pl, null, 2), 'utf8');
		console.log('✔ Записано в', PRICELIST);
	} else {
		console.log('(dry-run — запусти с --write чтобы сохранить)');
	}
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
