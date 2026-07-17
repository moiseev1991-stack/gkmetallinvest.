// Нормализация хаба «Уголок / Швеллер» по правкам заказчика 2026-07-01:
//  8)  округляем цены до 500 ₽ (было 288750 → 289000);
//  10) единый ярлык марки: «AISI 304» → «AISI 304 (08Х18Н10)» (иначе уголки и
//      швеллеры разъезжались по двум разным пунктам фильтра «Марка»);
//  11) классификаторы через sub: ugolok → ugolok-ravnopolochnyy,
//      shveller → shveller-gnutyy;
//  2/4) швеллеры у нас гнутые (ГОСТ 8278), а не прокатные (ГОСТ 8240) —
//      переименовываем «...швеллер горячекатаный 80x40x5» → «Швеллер
//      нержавеющий гнутый 80×40×5», roll = «гнутый».
//
// Запуск:  node scripts/normalize-ugolok-shveller.mjs [--write]

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const PRICELIST = resolve(here, '../src/data/pricelist.json');
const WRITE = process.argv.includes('--write');

const roundTo = (n, step) => (typeof n === 'number' ? Math.round(n / step) * step : n);

async function main() {
	const pl = JSON.parse(await readFile(PRICELIST, 'utf8'));
	const arr = pl.hubs['ugolok-shveller'] || [];

	for (const s of arr) {
		// 8) округление цен до 500 ₽
		s.price = roundTo(s.price, 500);
		s.priceUnit = roundTo(s.priceUnit, 500);

		// 10) единый ярлык AISI 304
		if (s.grade && /AISI\s*304\b/i.test(s.grade) && !/\(/.test(s.grade)) {
			s.grade = 'AISI 304 (08Х18Н10)';
		}

		// 11) + 2/4) классификаторы и гнутый швеллер
		if (s.sub === 'ugolok') {
			s.sub = 'ugolok-ravnopolochnyy';
		} else if (s.sub === 'shveller') {
			s.sub = 'shveller-gnutyy';
			s.roll = 'гнутый';
			// «сталь сорт нерж никел швеллер горячекатаный 80x40x5» → «Швеллер нержавеющий гнутый 80×40×5»
			const dims = String(s.name).replace(/[хХ]/g, 'x').match(/(\d+)x(\d+)x(\d+)/);
			s.name = dims
				? `Швеллер нержавеющий гнутый ${dims[1]}×${dims[2]}×${dims[3]}`
				: String(s.name).replace(/^.*швеллер\s+горячекатаный/i, 'Швеллер нержавеющий гнутый');
		}
	}

	// отчёт
	console.log('=== после нормализации ===');
	for (const s of arr) {
		console.log(`${(s.sub || '').padEnd(24)} ${(s.grade || '').padEnd(22)} ${String(s.price).padEnd(8)} ${String(s.priceUnit).padEnd(8)} | ${s.name}`);
	}
	const grades = [...new Set(arr.map((s) => s.grade))];
	const subs = [...new Set(arr.map((s) => s.sub))];
	console.log('\nМарки:', JSON.stringify(grades));
	console.log('Классификаторы (sub):', JSON.stringify(subs));

	if (WRITE) {
		/* Оригинальный pricelist.json отступает табами — сохраняем формат,
		   иначе diff разрастается на 120 тыс. строк из-за перевёрстки пробелами. */
		await writeFile(PRICELIST, JSON.stringify(pl, null, '\t') + '\n', 'utf8');
		console.log('\n✔ Записано в', PRICELIST);
	} else {
		console.log('\n(dry-run — запусти с --write чтобы сохранить)');
	}
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
