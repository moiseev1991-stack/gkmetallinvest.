/** SEO-различители карточек товара и честное определение дублей.
 *
 * Модуль на чистом JS (не .ts) специально: его импортирует и `astro.config.mjs`
 * (для фильтра sitemap), и `pricelist-helpers.ts` (для страниц). Иначе логика
 * «что считать дублем» разъезжается между sitemap и метатегами.
 *
 * Предыстория. Парсер прайса даёт слаги вида `<sub>-<марка>-<размер>`, а если
 * такой слаг уже занят — дописывает `-2`, `-3`, `-N`. Раньше суффикс считался
 * признаком «того же товара с другой партии»: такие карточки получали noindex
 * + canonical на базовый слаг и выкидывались из sitemap. По факту одинаковых
 * позиций так помечено всего ~150, а остальные ~1420 — разные товары: у листа
 * различается формат (1000×2000 / 1250×2500 / рулон), плёнка и завод, у трубы —
 * ГОСТ и производитель, а у ограждений под одним базовым слагом лежат вообще
 * разные изделия (отвод поручня, седловина, заглушка, держатель под стекло).
 * Поэтому дубль определяем по совпадению нормализованного имени + размера +
 * марки + единицы, а не по форме слага.
 *
 * Различители (`variantCandidates`) отдаются списком в порядке понятности для
 * покупателя. Кто и сколько из них подставит в заголовок — решает
 * `pricelist-helpers.ts`: он берёт минимум, которого хватает, чтобы <title> и H1
 * у разных карточек не совпадали.
 */

import pricelist from './pricelist.json';

/** «0.6×1250» без третьего числа — поставщик отгружает мотком, а не листом
 *  в размер. Дубль-логика должна фильтровать /list/ так же, как getHubSkus,
 *  иначе канонической карточки в хабе может не оказаться. */
export function isRulonLikeName(name) {
	const s = String(name ?? '').replace(/[хХX]/g, 'x');
	const m = s.match(/(\d+(?:[.,]\d+)?)x(\d+(?:[.,]\d+)?)(?:x(\d+(?:[.,]\d+)?))?/);
	if (!m) return false;
	return !m[3];
}

/** Марка в коротком виде: «AISI 304 (08Х18Н10)» → «AISI 304». */
export function shortGradeForSeo(grade) {
	if (!grade) return '';
	let g = String(grade);
	const p = g.indexOf('(');
	if (p >= 0) g = g.slice(0, p).trim();
	const aisi = g.match(/^(AISI\s*\S+)/i);
	return aisi ? aisi[1].replace(/\s+/g, ' ') : g;
}

/** Имя без артикула и без разнобоя в пунктуации — для сравнения позиций. */
export function normNameForDup(name) {
	return String(name ?? '')
		.toLowerCase()
		.replace(/арт\.?\s*\S+\s*$/i, '')
		.replace(/[хx×]/g, 'x')
		.replace(/,/g, '.')
		.replace(/[^\p{L}\p{Nd}x.+]+/gu, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

const FILM_RE = /\+\s*(LPE|PE|PI|PVC)/i;
const FACTORY_RE =
	/(ЧМК|Тайвань|Китай|Украина|Россия|Индия|Корея|Финляндия|Испания|Турция|Бразилия|Швеция|Япония)/i;
/** Хабы, где «формат» осмыслен: плоский прокат режется в лист заданного
 *  размера. У трубы/круга/полосы два числа в имени — это геометрия профиля,
 *  и «рулон 1.5» там был бы бессмыслицей. */
const SHEET_HUBS = new Set(['list', 'rulon', 'dekorativnye-listy', 'lenta', 'folga']);

function surfaceBit(sku) {
	const s = String(sku?.surface ?? '').trim();
	if (s) return s;
	/* У части позиций поверхность в прайсе пустая, но в имени есть маркер
	   отделки — он и различает карточки. Прайс пишет сокращениями: «зерк»,
	   «шлиф», «матовая», «полир». */
	const name = String(sku?.name ?? '');
	const marker = name.match(/\b(DECO\s*\d+|DK\d+|TEAR\s*PLATE|8K|BA)\b/i);
	if (marker) return marker[1].toUpperCase().replace(/\s+/g, ' ');
	if (/рифлен/i.test(name)) return 'рифлёный';
	if (/зерк/i.test(name)) return 'зеркальная';
	if (/шлиф/i.test(name)) return 'шлифованная';
	if (/полир/i.test(name)) return 'полированная';
	if (/матов/i.test(name)) return 'матовая';
	if (/травл/i.test(name)) return 'травлёная';
	return '';
}

/** Стенка профильной трубы: в прайсе `size` хранит только габарит («Ø40 × 20»),
 *  а толщина стенки сидит третьим числом в имени («40x20x1.5»). Без неё
 *  11 прямоугольных труб 40×20 получали один заголовок. */
function wallBit(sku) {
	if (String(sku?.hub ?? '') !== 'truba') return '';
	const s = String(sku?.name ?? '').replace(/[хХX×]/g, 'x');
	const m = s.match(/(\d+(?:[.,]\d+)?)x(\d+(?:[.,]\d+)?)x(\d+(?:[.,]\d+)?)/);
	if (!m) return '';
	return `стенка ${String(m[3]).replace('.', ',')} мм`;
}

/** Стандарт из имени: ГОСТ, ASTM, EN, DIN — у импорта вместо ГОСТа. */
function standardBit(sku) {
	const name = String(sku?.name ?? '');
	const gost = name.match(/ГОСТ\s*([\d-]+)/i);
	if (gost) return `ГОСТ ${gost[1]}`;
	const astm = name.match(/\bASTM\s*([A-Z]?\d+[A-Za-z0-9-]*)/i);
	if (astm) return `ASTM ${astm[1].toUpperCase()}`;
	const en = name.match(/\bEN\s*(\d{4,5}(?:-\d+)?)/i);
	if (en) return `EN ${en[1]}`;
	const din = name.match(/\bDIN\s*(\d+)/i);
	if (din) return `DIN ${din[1]}`;
	return '';
}

/** Формат плоского проката: «0.5х1250х2500» → «1250×2500», «0.6х1250» → «рулон 1250».
 *  У ленты и фольги формат — ширина штрипса из поля width. */
function formatBit(sku) {
	if (!SHEET_HUBS.has(String(sku?.hub ?? ''))) return '';
	if (sku?.width) return `${sku.width} мм`;
	const s = String(sku?.name ?? '').replace(/[хХX×]/g, 'x');
	const m = s.match(/(\d+(?:[.,]\d+)?)x(\d+(?:[.,]\d+)?)(?:x(\d+(?:[.,]\d+)?))?/);
	if (!m) return '';
	if (m[3]) return `${m[2]}×${m[3]}`;
	return `рулон ${m[2]}`;
}

function dlinaBit(sku) {
	const d = String(sku?.dlina ?? '').trim();
	if (!d || d === 'н/д') return '';
	return /^\d+$/.test(d) ? `дл. ${d}` : d;
}

function filmBit(sku) {
	if (sku?.film === true) return 'с плёнкой';
	return FILM_RE.test(String(sku?.name ?? '')) ? 'с плёнкой' : '';
}

function factoryBit(sku) {
	const m = String(sku?.name ?? '').match(FACTORY_RE);
	return m ? m[1] : '';
}

/** Склад отгрузки («Москва») — последний осмысленный различитель: одна и та же
 *  позиция может лежать на разных складах с разной ценой. */
function factBit(sku) {
	const f = String(sku?.fact ?? '').trim();
	return f && f !== 'н/д' ? `склад ${f}` : '';
}

function rollBit(sku) {
	return String(sku?.roll ?? '').trim();
}

function articleBit(sku) {
	const m = String(sku?.name ?? '').match(/арт\.?\s*(\S+)\s*$/i);
	return m ? `арт. ${m[1]}` : '';
}

/** Признаки-различители в порядке понятности покупателю: сначала то, что
 *  реально выбирают (стенка, отделка, формат), потом стандарт и завод. */
export function variantCandidates(sku) {
	return [
		wallBit(sku),
		surfaceBit(sku),
		formatBit(sku),
		standardBit(sku),
		rollBit(sku),
		dlinaBit(sku),
		filmBit(sku),
		factoryBit(sku),
		factBit(sku),
		articleBit(sku),
	];
}

/**
 * Дубли внутри массива SKU одного хаба.
 * @returns {Map<string, {isDup: boolean, canonicalSlug: string}>}
 */
export function buildDupMap(skus) {
	const list = Array.isArray(skus) ? skus : [];
	/* Группируем по всему хабу, а не внутри семьи базового слага: одна и та же
	   позиция попадает в прайс дважды и с разным написанием марки («AISI 304»
	   и «AISI 304 (08Х18Н10)»), из-за чего слаги оказываются в разных семьях,
	   а товар — один и тот же. */
	const bySignature = new Map();
	for (const sku of list) {
		const sig = `${normNameForDup(sku.name)}|${sku.size ?? ''}|${shortGradeForSeo(sku.grade)}|${sku.unit ?? ''}`;
		if (!bySignature.has(sig)) bySignature.set(sig, []);
		bySignature.get(sig).push(sku);
	}
	const out = new Map();
	for (const same of bySignature.values()) {
		/* Каноническая — без числового суффикса, при равенстве — короткий слаг,
		   дальше по алфавиту: выбор должен быть стабильным между сборками. */
		const canonical = [...same].sort((a, b) => {
			const sa = /-\d+$/.test(String(a.slug)) ? 1 : 0;
			const sb = /-\d+$/.test(String(b.slug)) ? 1 : 0;
			if (sa !== sb) return sa - sb;
			if (a.slug.length !== b.slug.length) return a.slug.length - b.slug.length;
			return String(a.slug).localeCompare(String(b.slug));
		})[0];
		for (const sku of same) {
			out.set(sku.slug, {
				isDup: sku.slug !== canonical.slug,
				canonicalSlug: canonical.slug,
			});
		}
	}
	return out;
}

/**
 * Пути настоящих дублей («<хаб>/<слаг>») по всем хабам прайса — для фильтра
 * sitemap. Лента, фольга и декоративные листы живут в отдельных модулях и
 * суффиксов `-N` не имеют, поэтому здесь достаточно pricelist.json.
 * @returns {Set<string>}
 */
export function getSitemapDupPaths() {
	const dup = new Set();
	/* Считаем по сырым массивам хабов: страницы карточек генерируются для всех
	   позиций прайса (в т.ч. рулон-стайл, отфильтрованных из таблицы /list/),
	   и набор слагов здесь должен совпадать с тем, по которому считается
	   noindex+canonical на страницах (seoSkuUniverse в pricelist-helpers). */
	for (const [hub, arr] of Object.entries(pricelist.hubs ?? {})) {
		for (const [slug, bits] of buildDupMap(arr)) {
			if (bits.isDup) dup.add(`${hub}/${slug}`);
		}
	}
	return dup;
}
