/**
 * Кластеризует Wordstat-экспорт по URL-структуре сайта.
 *
 * Input:  docs/seo/keywords/yandex-wordstat.csv
 *         (Запрос;Базовая;Точная;ОчТочная;Слов;Объявлений;Документов;CPC;Топоним;Вопрос;Дата)
 * Output: docs/seo/keywords/keyword-map.csv
 *         (keyword,base,exact,intent,hub,mark,city,target_url,priority,note)
 *         docs/seo/keywords/opportunities.md
 *         (высокочастотные ключи без покрытия на сайте → что создать)
 *
 * Запуск: node scripts/build-keyword-map.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

const INPUT = 'docs/seo/keywords/yandex-wordstat.csv';
const OUT_MAP = 'docs/seo/keywords/keyword-map.csv';
const OUT_OPP = 'docs/seo/keywords/opportunities.md';

/* ---------- Парсинг CSV (разделитель `;`, поля в кавычках) ---------- */
function parseCsv(text) {
	const lines = text.split(/\r?\n/).filter((l) => l.trim());
	const out = [];
	for (let i = 1; i < lines.length; i++) {
		const row = [];
		let cur = '';
		let inQ = false;
		for (const ch of lines[i]) {
			if (ch === '"') { inQ = !inQ; continue; }
			if (ch === ';' && !inQ) { row.push(cur); cur = ''; continue; }
			cur += ch;
		}
		row.push(cur);
		out.push({
			keyword: row[0]?.trim().toLowerCase(),
			base: parseInt(row[1] || '0', 10) || 0,
			exact: parseInt(row[2] || '0', 10) || 0,
			veryExact: parseInt(row[3] || '0', 10) || 0,
			words: parseInt(row[4] || '0', 10) || 0,
			ads: parseInt(row[5] || '0', 10) || 0,
			docs: parseInt(row[6] || '0', 10) || 0,
			cpc: parseInt(row[7] || '0', 10) || 0,
			isTopo: row[8] === '1',
			isQuestion: row[9] === '1',
		});
	}
	return out.filter((r) => r.keyword);
}

/* ---------- Словари ---------- */

const HUBS = {
	list: { url: '/list/', tokens: ['лист', 'листо', 'листовой'] },
	truba: { url: '/truba/', tokens: ['труба', 'трубы', 'трубу', 'трубн'] },
	krug: { url: '/krug/', tokens: ['круг', 'пруток', 'пруток нержавеющ', 'квадрат', 'шестигранник'] },
	rulon: { url: '/rulon/', tokens: ['рулон'] },
	polosa: { url: '/polosa/', tokens: ['полоса', 'полосы', 'штрипс'] },
	provoloka: { url: '/provoloka/', tokens: ['проволока'] },
	ugolok: { url: '/ugolok-shveller/', tokens: ['уголок', 'швеллер'] },
	detali: { url: '/detali-truboprovoda/', tokens: ['отвод', 'фланец', 'фланцы', 'тройник', 'переход', 'заглушк'] },
	lenta: { url: '/lenta/', tokens: ['лента'] },
	folga: { url: '/folga/', tokens: ['фольга'] },
	metizy: { url: '/metizy/', tokens: ['метизы', 'болт', 'гайк', 'шайб', 'винт', 'самореез', 'саморез', 'шпильк'] },
	podshipniki: { url: '/podshipniki/', tokens: ['подшипник'] },
	elektrody: { url: '/elektrody/', tokens: ['электрод'] },
	lestnicy: { url: '/lestnichnye-ograzhdeniya/', tokens: ['перил', 'ограждени'] },
};

/* Марки + их слаги на сайте. См. data/marks.ts. */
const MARKS = {
	'aisi-304': {
		tokens: ['aisi 304', 'aisi304', '304l', 'aisi 304l', 'aisi-304', '08х18н10', '08x18h10'],
		exclude: ['304l', 'aisi 304l'],
		hubs: ['list', 'truba', 'krug', 'rulon', 'polosa', 'provoloka', 'detali', 'ugolok'],
	},
	'aisi-316l': {
		tokens: ['aisi 316', 'aisi316', '316l', '316ti', '03х17н14м2', 'aisi 316l', 'aisi 316ti'],
		hubs: ['list', 'truba', 'krug', 'rulon', 'polosa', 'provoloka', 'detali'],
	},
	'aisi-321': {
		tokens: ['aisi 321', 'aisi321', '12х18н10т', '12x18h10t'],
		hubs: ['list', 'truba', 'krug', 'rulon', 'polosa', 'provoloka', 'detali'],
	},
	'aisi-430': {
		tokens: ['aisi 430', 'aisi430', '08х17'],
		hubs: ['list', 'truba', 'rulon', 'provoloka'],
	},
	'aisi-201': {
		tokens: ['aisi 201', 'aisi201', '12х15г9нд'],
		hubs: ['list', 'truba', 'krug'],
	},
};

/* Города из data/cities.ts. */
const CITIES = {
	'v-moskve': ['в москве', 'москва', 'москв'],
	'v-sankt-peterburge': ['санкт-петербург', 'санкт петербург', 'спб', 'в спб', 'в санкт-петербурге', 'питер'],
	'v-ekaterinburge': ['екатеринбург', 'в екатеринбурге'],
	'v-kazani': ['казань', 'в казани'],
	'v-novosibirske': ['новосибирск', 'в новосибирске'],
	'v-krasnodare': ['краснодар', 'в краснодаре'],
	'v-rostove-na-donu': ['ростов-на-дону', 'ростов на дону', 'в ростове'],
	'v-samare': ['самара', 'в самаре'],
	'v-ufe': ['уфа', 'в уфе'],
	'v-perme': ['пермь', 'в перми'],
	'v-voronezhe': ['воронеж', 'в воронеже'],
	'v-chelyabinske': ['челябинск', 'в челябинске'],
	'v-volgograde': ['волгоград', 'в волгограде'],
	'v-krasnoyarske': ['красноярск', 'в красноярске'],
	'v-tyumeni': ['тюмень', 'в тюмени'],
	'v-nizhnem-novgorode': ['нижний новгород', 'в нижнем новгороде'],
};

const COMMERCIAL_MARKERS = [
	'купить', 'цена', 'стоимость', 'прайс', 'оптом', 'опт', 'со склад', 'в наличии',
	'под заказ', 'недорого', 'заказать', 'продаж', 'цена за', 'цены',
];

const INFO_MARKERS = [
	'гост', 'аналог', 'характеристик', 'состав', 'применени', 'расшифровк', 'что такое',
	'плотность', 'удельный вес', 'вес ', 'калькулятор', 'магнитит', 'температура',
	'свойств', 'предел прочност', 'твердост', 'таблиц', 'классификаци', 'виды нержав',
	'чем отличается', 'или ', 'это какая', 'химическ', 'отличие',
];

/* ---------- Хелперы ---------- */

const matchAny = (s, tokens) => tokens.some((t) => s.includes(t));

function detectHub(k) {
	for (const [hub, cfg] of Object.entries(HUBS)) {
		if (matchAny(k, cfg.tokens)) return hub;
	}
	return null;
}

function detectMark(k) {
	for (const [slug, cfg] of Object.entries(MARKS)) {
		if (matchAny(k, cfg.tokens)) return slug;
	}
	return null;
}

function detectCity(k) {
	for (const [slug, tokens] of Object.entries(CITIES)) {
		if (matchAny(k, tokens)) return slug;
	}
	return null;
}

function detectIntent(k) {
	if (matchAny(k, INFO_MARKERS)) return 'informational';
	if (matchAny(k, COMMERCIAL_MARKERS)) return 'commercial';
	return 'navigational';
}

/* Целевой URL: гео > марка-в-хабе > марка > хаб > информационка */
function targetUrl(hub, mark, city, intent, k) {
	if (hub && city) return `${HUBS[hub].url}${city.replace(/^v-/, 'v-')}/`;
	if (hub && mark) {
		const allowed = MARKS[mark].hubs.includes(hub);
		if (allowed) return `${HUBS[hub].url}${mark}/`;
		return HUBS[hub].url; // марка не подходит к хабу — таргет хаб
	}
	if (mark && !hub) return `/list/${mark}/`; // марка без хаба → главная марочная (лист)
	if (city && !hub) {
		// город без хаба — общая воронка по этому городу. Сейчас гео-страниц без хаба нет.
		return '/postavka-nerzhaveyushchego-metalloprokata/';
	}
	if (hub) return HUBS[hub].url;
	/* Без хаба и без марки — информационка или брендовая */
	if (intent === 'informational') {
		if (k.includes('калькулятор') || k.includes('вес ')) return '/kalkulyator-vesa/';
		return '/'; // покрываем общими текстами на главной/о компании
	}
	if (k.includes('инокс') || k.includes('inox') || k.includes('нержав')) return '/';
	return '/';
}

/* Размерный тег — не таргетит отдельный URL, но помечает строку. */
const SIZE_RE = /\b\d+(?:[,.]\d+)?\s*(?:мм|мм\.?|х\d|\d+х\d+)\b|\b\d+х\d+(?:[,.]\d+)?\b/;
function detectSize(k) {
	const m = k.match(SIZE_RE);
	return m ? m[0] : null;
}

/* Приоритет — комбинация частотности и intent.
 * navigational в B2B-нерже = тоже коммерческое намерение (юзер ищет марку → потом купит).
 * Поэтому navigational с высокой частотой идёт в P1-high, не в P1-info. */
function priority(row) {
	const e = row.exact;
	const isInfo = row.intent === 'informational';
	if (e >= 500) return 'P0-anchor';
	if (e >= 100 && !isInfo) return 'P1-high';
	if (e >= 100) return 'P1-info';
	if (e >= 30 && !isInfo) return 'P2-mid';
	if (e >= 30) return 'P2-info-mid';
	if (e >= 5) return 'P3-tail';
	return 'P4-zero';
}

/* ---------- Главный пайплайн ---------- */

const text = readFileSync(INPUT, 'utf-8');
const rows = parseCsv(text);

console.log(`Прочитано ${rows.length} строк из ${INPUT}`);

const mapped = rows.map((r) => {
	const k = r.keyword;
	const hub = detectHub(k);
	const mark = detectMark(k);
	const city = detectCity(k);
	const intent = detectIntent(k);
	const size = detectSize(k);
	const target = targetUrl(hub, mark, city, intent, k);
	const note = [
		size ? `size:${size}` : null,
		r.isQuestion ? 'question' : null,
		r.isTopo ? 'topo' : null,
	].filter(Boolean).join('|');
	const row = { ...r, hub, mark, city, intent, target, note };
	row.priority = priority(row);
	return row;
});

mapped.sort((a, b) => b.exact - a.exact);

/* CSV-выгрузка keyword-map */
const header = 'keyword,base,exact,intent,hub,mark,city,target_url,priority,note';
const csvLines = [header];
for (const r of mapped) {
	const q = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
	csvLines.push([
		q(r.keyword),
		r.base,
		r.exact,
		r.intent,
		r.hub ?? '',
		r.mark ?? '',
		r.city ?? '',
		r.target,
		r.priority,
		q(r.note),
	].join(','));
}
writeFileSync(OUT_MAP, csvLines.join('\n') + '\n', 'utf-8');
console.log(`✓ ${OUT_MAP} (${csvLines.length} строк, включая заголовок)`);

/* ---------- Анализ покрытия ---------- */

const stats = {
	total: mapped.length,
	exactSum: mapped.reduce((s, r) => s + r.exact, 0),
	byPriority: {},
	byIntent: {},
	byTarget: {},
	byHub: {},
};

for (const r of mapped) {
	stats.byPriority[r.priority] = (stats.byPriority[r.priority] || 0) + 1;
	stats.byIntent[r.intent] = (stats.byIntent[r.intent] || { count: 0, exact: 0 });
	stats.byIntent[r.intent].count += 1;
	stats.byIntent[r.intent].exact += r.exact;
	stats.byTarget[r.target] = (stats.byTarget[r.target] || { count: 0, exact: 0 });
	stats.byTarget[r.target].count += 1;
	stats.byTarget[r.target].exact += r.exact;
	if (r.hub) {
		stats.byHub[r.hub] = (stats.byHub[r.hub] || { count: 0, exact: 0 });
		stats.byHub[r.hub].count += 1;
		stats.byHub[r.hub].exact += r.exact;
	}
}

/* ---------- Opportunities — что покрыто слабо/не покрыто ---------- */

const opportunities = [];

/* 1) Информационные ключи без целевой страницы (target = /). */
const infoOrphans = mapped
	.filter((r) => r.intent === 'informational' && r.target === '/' && r.exact >= 20)
	.sort((a, b) => b.exact - a.exact);

/* 2) Информационные на калькулятор, но возможно требующие отдельной статьи */
const calcInfo = mapped
	.filter((r) => r.target === '/kalkulyator-vesa/' && r.intent === 'informational' && r.exact >= 20)
	.sort((a, b) => b.exact - a.exact);

/* 3) Города без хаба — клиенты ищут «нержавейка в москве» без указания формата.
 *    Можно сделать страницу /v-<city>/ (гео-главная) или редиректить на /postavka-... */
const cityOnly = mapped
	.filter((r) => r.city && !r.hub && r.exact >= 5)
	.sort((a, b) => b.exact - a.exact);

/* 4) ГОСТ-страницы — целая семья ключей с высокой частотой */
const gostKeys = mapped
	.filter((r) => /гост \d/.test(r.keyword) && r.exact >= 20)
	.sort((a, b) => b.exact - a.exact);

/* 5) Хабы, на которые мы ссылаемся, но они «заглушки» (нет прайса) */
const stubHubs = ['lenta', 'folga', 'metizy', 'podshipniki', 'elektrody', 'lestnicy'];
const stubTraffic = mapped
	.filter((r) => r.hub && stubHubs.includes(r.hub) && r.exact >= 10)
	.sort((a, b) => b.exact - a.exact);

/* 6) Марки, для которых на сайте нет посадочной (вне 5 марок из data/marks.ts) */
const ownedMarkTokens = Object.values(MARKS).flatMap((m) => m.tokens);
const isOwnedMark = (k) => ownedMarkTokens.some((t) => k.includes(t));
const orphanMarks = {};
const ORPHAN_MARK_PATTERNS = [
	{ name: '20х13', re: /\b20х13\b/, family: 'мартенситная' },
	{ name: '40х13', re: /\b40х13\b/, family: 'мартенситная' },
	{ name: '30х13', re: /\b30х13\b/, family: 'мартенситная' },
	{ name: '12х13', re: /\b12х13\b/, family: 'мартенситная' },
	{ name: '20х23н18', re: /\b20х23н18\b/, family: 'жаропрочная' },
	{ name: '06хн28мдт', re: /\b06хн28мдт\b/, family: 'кислотостойкая' },
	{ name: 'AISI 904L', re: /\b(?:aisi )?904l\b/, family: 'супераустенитная' },
	{ name: 'AISI 310S', re: /\b(?:aisi )?310s\b/, family: 'жаропрочная' },
	{ name: 'AISI 309S', re: /\b(?:aisi )?309s\b/, family: 'жаропрочная' },
	{ name: 'AISI 420', re: /\b(?:aisi )?420\b/, family: 'мартенситная' },
	{ name: 'AISI 440', re: /\b(?:aisi )?440\b/, family: 'мартенситная' },
	{ name: 'AISI 410', re: /\b(?:aisi )?410\b/, family: 'мартенситная' },
	{ name: '08х17', re: /\b08х17\b/, family: 'ферритная' },
	{ name: 'дуплекс', re: /\bдуплекс\b/, family: 'дуплекс' },
];
for (const r of mapped) {
	for (const p of ORPHAN_MARK_PATTERNS) {
		if (p.re.test(r.keyword)) {
			if (!orphanMarks[p.name]) orphanMarks[p.name] = { family: p.family, exact: 0, base: 0, count: 0, samples: [] };
			orphanMarks[p.name].exact += r.exact;
			orphanMarks[p.name].base += r.base;
			orphanMarks[p.name].count += 1;
			if (orphanMarks[p.name].samples.length < 3) orphanMarks[p.name].samples.push(r.keyword);
		}
	}
}

/* ---------- Сборка opportunities.md ---------- */

let md = `# Анализ Wordstat — opportunities\n\n`;
md += `Источник: \`docs/seo/keywords/yandex-wordstat.csv\` (${stats.total} ключей, суммарно ${stats.exactSum.toLocaleString('ru-RU')} точных показов/мес).\n\n`;

md += `## Сводка по приоритетам\n\n`;
md += `| Приоритет | Кол-во | Что это |\n|---|---:|---|\n`;
const prioLabels = {
	'P0-anchor': 'Якоря — топ-трафик, нельзя проебать',
	'P1-high': 'Высокий коммерческий — основа конверсии',
	'P1-info': 'Высокий информационный — для блога/калькулятора',
	'P2-mid': 'Средний коммерческий',
	'P2-info-mid': 'Средний информационный',
	'P3-tail': 'Хвост (5-30 показов)',
	'P4-zero': 'Около нуля — оставляем как broad-match',
};
const sortedPrio = ['P0-anchor', 'P1-high', 'P1-info', 'P2-mid', 'P2-info-mid', 'P3-tail', 'P4-zero'];
for (const p of sortedPrio) {
	const c = stats.byPriority[p] || 0;
	md += `| **${p}** | ${c} | ${prioLabels[p]} |\n`;
}

md += `\n## Распределение по intent\n\n`;
md += `| Intent | Ключей | Точных показов/мес |\n|---|---:|---:|\n`;
for (const [intent, v] of Object.entries(stats.byIntent).sort((a, b) => b[1].exact - a[1].exact)) {
	md += `| ${intent} | ${v.count} | ${v.exact.toLocaleString('ru-RU')} |\n`;
}

md += `\n## Распределение по хабам (по точной частоте)\n\n`;
md += `| Хаб | Ключей | Точных/мес |\n|---|---:|---:|\n`;
for (const [hub, v] of Object.entries(stats.byHub).sort((a, b) => b[1].exact - a[1].exact)) {
	const stub = stubHubs.includes(hub) ? ' ⚠️ заглушка' : '';
	md += `| ${hub}${stub} | ${v.count} | ${v.exact.toLocaleString('ru-RU')} |\n`;
}

md += `\n---\n\n# 🎯 Конкретные opportunity\n\n`;

md += `## 1. Информационные ключи без специальной страницы\n\n`;
md += `Сейчас все таргетятся на \`/\` (главную). Многие из них достойны отдельной статьи в блоге или раздела на странице — иначе главная распыляется по 20 темам, а отдельные посадочные могли бы ранжироваться лучше.\n\n`;
md += `| Ключ | Точная | Рекомендация |\n|---|---:|---|\n`;
for (const r of infoOrphans.slice(0, 30)) {
	md += `| ${r.keyword} | ${r.exact} | ${suggestForInfo(r.keyword)} |\n`;
}

md += `\n## 2. Калькулятор и теория веса\n\n`;
md += `Эти ключи сейчас ведут на \`/kalkulyator-vesa/\`. Стоит убедиться, что в FAQ и текстах калькулятора есть прямые ответы.\n\n`;
md += `| Ключ | Точная | Покрыто на странице? |\n|---|---:|---|\n`;
for (const r of calcInfo.slice(0, 15)) {
	md += `| ${r.keyword} | ${r.exact} | проверить |\n`;
}

md += `\n## 3. Город без хаба — «нержавейка в N»\n\n`;
md += `Пользователь ищет общую поставку в город, не уточняя формат. Сейчас все таргетятся на \`/postavka-nerzhaveyushchego-metalloprokata/\` — но эта страница не геолокализована. Можно: (а) сделать на ней блок «доставка по городам РФ», (б) создать страницы \`/v-<city>/\` под популярные.\n\n`;
md += `| Ключ | Точная | Город |\n|---|---:|---|\n`;
for (const r of cityOnly.slice(0, 15)) {
	md += `| ${r.keyword} | ${r.exact} | ${r.city} |\n`;
}

md += `\n## 4. ГОСТы — отдельный кластер\n\n`;
md += `Запросы вида «гост 9941», «гост 5582», «гост 7350» с **высокими частотами** (693-1920 точных!). Это золото — пользователь ищет конкретный ГОСТ, чтобы свериться. Идея: страница-справочник \`/gost/\` с расшифровкой каждого ГОСТа + ссылкой на хаб, который этим ГОСТом регулируется.\n\n`;
md += `| Ключ | Точная | Что регулирует |\n|---|---:|---|\n`;
const gostNotes = {
	'9941': 'Бесшовные холоднодеформированные трубы → /truba/',
	'5582': 'Холоднокатаный лист → /list/',
	'7350': 'Толстолистовая нержавеющая сталь → /list/',
	'4986': 'Лента холоднокатаная → /lenta/',
	'2879': 'Шестигранник → /krug/ (квадрат/шестигранник)',
	'19903': 'Лист горячекатаный → /list/',
	'18143': 'Проволока → /provoloka/',
};
for (const r of gostKeys.slice(0, 20)) {
	const gostNum = r.keyword.match(/гост (\d+)/)?.[1] ?? '';
	md += `| ${r.keyword} | ${r.exact} | ${gostNotes[gostNum] ?? 'уточнить'} |\n`;
}

if (stubTraffic.length > 0) {
	md += `\n## 5. Заглушки — есть трафик, но страница пустая\n\n`;
	md += `Эти хабы у нас сейчас без прайса (страницы-заглушки). По ним идёт реальный спрос — стоит решить: либо наполнить, либо честно убрать ссылки, либо редиректить.\n\n`;
	md += `| Ключ | Точная | Хаб (заглушка) |\n|---|---:|---|\n`;
	for (const r of stubTraffic.slice(0, 20)) {
		md += `| ${r.keyword} | ${r.exact} | ${r.hub} |\n`;
	}
}

md += `\n## 6. Марки без своей посадочной\n\n`;
md += `На сайте сейчас 5 марочных слагов (aisi-304, 316l, 321, 430, 201). Эти марки тоже имеют ощутимый спрос, но посадочных под них нет — трафик утекает.\n\n`;
md += `| Марка | Семейство | Ключей | Сумма точных | Примеры запросов |\n|---|---|---:|---:|---|\n`;
const orphanList = Object.entries(orphanMarks).sort((a, b) => b[1].exact - a[1].exact);
for (const [name, v] of orphanList) {
	md += `| **${name}** | ${v.family} | ${v.count} | ${v.exact} | ${v.samples.join(' / ')} |\n`;
}
md += `\n**Что сделать:** на марочных страницах текущих марок добавить «Аналоги и родственные марки» с inline-описаниями 20Х13/40Х13/904L и т.д. — без отдельных URL. Если конкретная семья (например, мартенситные 20Х13/30Х13/40Х13) даёт >1000 точных в сумме — есть смысл создать одну общую посадочную /list/martensitnaya-stal/ или /list/20h13/ с привязкой к прокату из прайса.\n`;

md += `\n---\n\n# Топ-30 ключей-якорей (P0/P1)\n\n`;
md += `Это «нельзя проебать». Title/H1/первый абзац соответствующих страниц должны их содержать.\n\n`;
md += `| Ключ | Точная | Intent | Target URL |\n|---|---:|---|---|\n`;
const anchors = mapped.filter((r) => r.priority === 'P0-anchor' || r.priority === 'P1-high').slice(0, 30);
for (const r of anchors) {
	md += `| ${r.keyword} | ${r.exact} | ${r.intent} | \`${r.target}\` |\n`;
}

md += `\n# Топ-15 информационных (P1-info) — кандидаты в блог\n\n`;
md += `| Ключ | Точная | Кандидат на пост / FAQ |\n|---|---:|---|\n`;
const p1info = mapped.filter((r) => r.priority === 'P1-info').slice(0, 15);
for (const r of p1info) {
	md += `| ${r.keyword} | ${r.exact} | ${suggestForInfo(r.keyword)} |\n`;
}

writeFileSync(OUT_OPP, md, 'utf-8');
console.log(`✓ ${OUT_OPP}`);

/* ---------- Подсказки для информационных ключей ---------- */

function suggestForInfo(k) {
	if (k.includes('магнитит')) return 'Пост в блог: «Магнитится ли нержавейка — простой разбор»';
	if (k.includes('температура плавления')) return 'Раздел в калькуляторе / FAQ калькулятора';
	if (k.includes('плотность')) return 'Уже в /kalkulyator-vesa/ → проверить, что есть таблица с этим значением';
	if (k.includes('что такое нержав')) return 'Раздел /o-kompanii/ или отдельный пост в блог';
	if (k.includes('виды нержав') || k.includes('классификаци')) return 'Блог-пост «Виды нержавеющей стали — обзор»';
	if (k.includes('инокс') || k.includes('inox')) return 'Упомянуть в /o-kompanii/ + meta description главной';
	if (k.startsWith('гост ')) return 'Справочник /gost/ или раздел на хабе';
	if (k.includes('аналог')) return 'Раздел «Аналоги» на марочной странице';
	if (k.includes('состав') || k.includes('характеристик')) return 'Раздел «Характеристики» на марочной';
	if (k.includes('применени')) return 'Раздел «Применение» на марочной / странице услуг';
	if (k.includes('или ')) return 'Сравнительный блог-пост «X vs Y»';
	if (k.includes('расшифровк')) return 'Раздел «Расшифровка марки» на марочной';
	if (k.includes('твердост') || k.includes('предел прочност') || k.includes('свойств')) return 'Технические характеристики на марочной';
	return 'Раздел на ближайшей релевантной странице';
}

/* ---------- Сводка в консоль ---------- */

console.log(`\nСводка:`);
console.log(`  Всего ключей: ${stats.total}`);
console.log(`  Суммарная точная частота: ${stats.exactSum}`);
console.log(`  По приоритетам:`);
for (const p of sortedPrio) console.log(`    ${p}: ${stats.byPriority[p] || 0}`);
console.log(`  По intent:`);
for (const [i, v] of Object.entries(stats.byIntent)) console.log(`    ${i}: ${v.count} ключей, ${v.exact} точных`);
console.log(`  Топ-5 хабов по точной частоте:`);
const hubsSorted = Object.entries(stats.byHub).sort((a, b) => b[1].exact - a[1].exact).slice(0, 5);
for (const [h, v] of hubsSorted) console.log(`    ${h}: ${v.count} ключей, ${v.exact} точных`);
