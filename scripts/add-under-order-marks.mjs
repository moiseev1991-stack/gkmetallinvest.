#!/usr/bin/env node
/**
 * Одноразовый скрипт (запускать 1 раз, 15.07.2026): добавляет стаб-SKU для
 * марок «под заказ» (жаропрочные / кислотостойкие / duplex / мартенситные).
 *
 * У этих марок:
 *   - price: null и priceUnit: null → PriceTable рисует «по запросу»
 *   - fact: null и ostatok: null → на складе не держим
 *   - slug с суффиксом «-po-zaprosu» — визуальный маркер и защита от
 *     столкновения с реальными SKU при возможной будущей закупке.
 *
 * Идемпотентен: перед вставкой удаляет ранее добавленные стабы по префиксу
 * slug (все slug'и стабов оканчиваются на «-po-zaprosu»).
 */
import { readFile, writeFile } from 'node:fs/promises';

const path = 'src/data/pricelist.json';
const pricelist = JSON.parse(await readFile(path, 'utf8'));

/** Марка: label — точное значение sku.grade (то, что попадёт в фильтр). */
const MARKS = {
	'310s': 'AISI 310S (20Х23Н18)',
	'309s': 'AISI 309S (20Х23Н13)',
	'316ti': 'AISI 316Ti (10Х17Н13М2Т)',
	'904l': 'AISI 904L (06ХН28МДТ)',
	'duplex-2205': 'DUPLEX 2205 (03Х22Н5АМ3)',
	'420': 'AISI 420 (30Х13)',
};

/** Общий шаблон стаба. Все поля, которые могут читаться PriceTable / MarkLanding /
 *  ProductDetail — заданы явно и предсказуемы. */
function stub({ hub, sub, markKey, alloy, surface, size, unit, name, dlina = null, slugParts }) {
	const slug = [...slugParts, 'po-zaprosu'].join('-');
	return {
		hub,
		sub,
		grade: MARKS[markKey],
		roll: null,
		alloy,
		surface,
		size,
		unit,
		price: null,
		priceUnit: null,
		slug,
		dlina,
		fact: null,
		ostatok: null,
		name,
	};
}

/* ============================ LIST ============================
   Толщина в мм. Формат имени — как у существующих: «Лист нержавеющий г/к ...». */
const listStubs = [];
for (const [mk, sizes] of Object.entries({
	'310s':        [ '3', '5', '10' ],
	'309s':        [ '3', '5' ],
	'316ti':       [ '2', '4', '8' ],
	'904l':        [ '3', '5' ],
	'duplex-2205': [ '3', '5', '10' ],
})) {
	for (const t of sizes) {
		listStubs.push(stub({
			hub: 'list',
			sub: 'nikelesod',
			markKey: mk,
			alloy: 'жаропрочный/специальный',
			surface: 'No1',
			size: t,
			unit: 'т',
			slugParts: ['list', mk, `${t}mm`],
			name: `Лист нержавеющий г/к ${t}×1500×6000 ${MARKS[mk]}`,
		}));
	}
}

/* ============================ TRUBA ===========================
   Формат size: «Ø<D> × <wall>» — соответствует существующим бесшовным. */
const trubaStubs = [];
for (const [mk, geom] of Object.entries({
	'310s':        [ ['57', '3'], ['108', '4'], ['159', '5'] ],
	'309s':        [ ['57', '3'], ['108', '4'] ],
	'316ti':       [ ['57', '3'], ['108', '4'], ['159', '5'] ],
	'904l':        [ ['57', '3'], ['108', '4'] ],
	'duplex-2205': [ ['57', '3'], ['108', '5'] ],
})) {
	for (const [D, w] of geom) {
		trubaStubs.push(stub({
			hub: 'truba',
			sub: 'besshovnaya',
			markKey: mk,
			alloy: null,
			surface: null,
			size: `Ø${D} × ${w}`,
			unit: 'т',
			slugParts: ['truba', 'besshovnaya', mk, `${D}x${w}mm`],
			name: `Труба нержавеющая бесшовная ${D}×${w} ${MARKS[mk]}`,
		}));
	}
}

/* ============================ KRUG ============================
   Диаметр в мм. sub для жаропрочных — «zharoprochnyj», для остальных — «nikelesod». */
const krugStubs = [];
for (const [mk, spec] of Object.entries({
	'310s':        { sub: 'zharoprochnyj', diams: ['20', '40', '80'] },
	'309s':        { sub: 'zharoprochnyj', diams: ['20', '40'] },
	'316ti':       { sub: 'nikelesod',     diams: ['20', '40', '80'] },
	'904l':        { sub: 'nikelesod',     diams: ['30', '60'] },
	'duplex-2205': { sub: 'nikelesod',     diams: ['30', '60', '100'] },
	'420':         { sub: 'nikelesod',     diams: ['20', '40', '80'] },
})) {
	for (const d of spec.diams) {
		krugStubs.push(stub({
			hub: 'krug',
			sub: spec.sub,
			markKey: mk,
			alloy: mk === '420' ? 'мартенситный' : (mk === '310s' || mk === '309s' ? 'жаропрочный' : null),
			surface: null,
			size: d,
			unit: 'т',
			slugParts: ['krug', mk, `${d}mm`],
			name: `Круг нержавеющий Ø ${d} ${MARKS[mk]}`,
			dlina: '6000',
		}));
	}
}

/* ====================== DETALI-TRUBOPROVODA ====================
   Флáнец: size = «1» (исполнение), в name — исполнение × Ду × Ру × ГОСТ.
   Отвод: size = «Ø», в name — Ø × стенка × ГОСТ. */
const detaliStubs = [];
for (const mk of ['310s', '316ti', '904l', 'duplex-2205']) {
	// Флáнец Ду 50 Ру 16
	detaliStubs.push(stub({
		hub: 'detali-truboprovoda',
		sub: 'flanec',
		markKey: mk,
		alloy: null,
		surface: null,
		size: '1',
		unit: 'шт',
		slugParts: ['flanec', mk, 'du50-ru16'],
		name: `Фланец нержавеющий плоский 1x50x16 ГОСТ 33259-2015 ${MARKS[mk]}`,
	}));
	// Флáнец Ду 100 Ру 16
	detaliStubs.push(stub({
		hub: 'detali-truboprovoda',
		sub: 'flanec',
		markKey: mk,
		alloy: null,
		surface: null,
		size: '1',
		unit: 'шт',
		slugParts: ['flanec', mk, 'du100-ru16'],
		name: `Фланец нержавеющий плоский 1x100x16 ГОСТ 33259-2015 ${MARKS[mk]}`,
	}));
	// Отвод 90° Ø 57 × 3
	detaliStubs.push(stub({
		hub: 'detali-truboprovoda',
		sub: 'otvod',
		markKey: mk,
		alloy: null,
		surface: null,
		size: '57',
		unit: 'шт',
		slugParts: ['otvod', mk, '57x3'],
		name: `Отвод нержавеющий 90° 57x3 ГОСТ 17375-2001 ${MARKS[mk]}`,
	}));
}

/* ============================ POLOSA ==========================
   Для мартенситной 420 — под ножевой прокат. size = ширина в мм. */
const polosaStubs = [];
for (const [w, t] of [ ['40', '3'], ['60', '4'] ]) {
	polosaStubs.push(stub({
		hub: 'polosa',
		sub: 'nikelesod',
		markKey: '420',
		alloy: 'мартенситный',
		surface: null,
		size: w,
		unit: 'т',
		slugParts: ['polosa', '420', `${w}x${t}mm`],
		name: `Полоса нержавеющая ${w}×${t} ${MARKS['420']}`,
	}));
}

/* ============================ MERGE ===========================
   Удаляем ранее вставленные стабы (по суффиксу slug) — идемпотентность. */
function isStub(sku) {
	return typeof sku?.slug === 'string' && sku.slug.endsWith('-po-zaprosu');
}
function appendStubs(hub, stubs) {
	const arr = pricelist.hubs[hub];
	const cleaned = arr.filter((s) => !isStub(s));
	pricelist.hubs[hub] = [...cleaned, ...stubs];
}
appendStubs('list', listStubs);
appendStubs('truba', trubaStubs);
appendStubs('krug', krugStubs);
appendStubs('detali-truboprovoda', detaliStubs);
appendStubs('polosa', polosaStubs);

/* Обновляем stats — total и withPrice для тех хабов, куда добавили. У стабов
   price === null, поэтому withPrice не растёт, а total растёт на len(stubs). */
function updateStats(hub) {
	const arr = pricelist.hubs[hub];
	pricelist.stats[hub] = {
		total: arr.length,
		withPrice: arr.filter((s) => s.price != null).length,
	};
}
updateStats('list');
updateStats('truba');
updateStats('krug');
updateStats('detali-truboprovoda');
updateStats('polosa');

/* Оригинальный pricelist.json отступает табами — сохраняем формат, чтобы diff
   не разросся на 120 тыс. строк из-за перевёрстки пробелами. */
await writeFile(path, JSON.stringify(pricelist, null, '\t') + '\n', 'utf8');

const added = listStubs.length + trubaStubs.length + krugStubs.length + detaliStubs.length + polosaStubs.length;
console.log(`✓ Добавлено ${added} стаб-SKU «под заказ»:`);
console.log(`  list: +${listStubs.length}  →  total ${pricelist.stats.list.total}`);
console.log(`  truba: +${trubaStubs.length}  →  total ${pricelist.stats.truba.total}`);
console.log(`  krug: +${krugStubs.length}  →  total ${pricelist.stats.krug.total}`);
console.log(`  detali-truboprovoda: +${detaliStubs.length}  →  total ${pricelist.stats['detali-truboprovoda'].total}`);
console.log(`  polosa: +${polosaStubs.length}  →  total ${pricelist.stats.polosa.total}`);
