import pricelist from './pricelist.json';

/* Эвристика «рулон-стайл»: в названии шаблон «толщина × ширина» без третьего
   числа (длины) — поставщик отгружает позицию мотком/рулоном, а не как лист
   в размер. Например: «Лист нержавеющий х/к 0.6×1250 2B (матовый)» — это
   реально рулон, и клиент это путает с настоящим листом. См. правку
   клиента 2026-06-24. */
export function isRulonLikeName(name: string | null | undefined): boolean {
	const s = String(name ?? '').replace(/[хХX]/g, 'x');
	const m = s.match(/(\d+(?:[.,]\d+)?)x(\d+(?:[.,]\d+)?)(?:x(\d+(?:[.,]\d+)?))?/);
	if (!m) return false;
	return !m[3];
}

/* Заменяем «Лист» → «Рулон» в названиях позиций рулонного хаба. Источник
   данных (mc.ru) для рулонов выдаёт строки вида «лист нержавеющий х/к 0.4×1000»,
   что путает покупателя на странице /rulon/. Если в названии уже есть слово
   «рулон» — не трогаем, чтобы не получить «Рулон ... рулон». */
export function rulonizeName(name: string | null | undefined): string {
	const s = String(name ?? '');
	if (!s) return s;
	if (/рулон/i.test(s)) return s;
	/* `\b` в JS работает только с ASCII (`\w` = [A-Za-z0-9_]) — для кириллицы
	   границу слова делаем lookbehind/lookahead по `\p{L}` с флагом /u. */
	return s.replace(/(?<!\p{L})[Лл]ист(?!\p{L})/gu, (m) =>
		/^[А-Я]/.test(m) ? 'Рулон' : 'рулон',
	);
}

/* Плотность нержавейки, г/см³ (≈ 7,9 для аустенитных, чуть меньше для
   феррита/мартенсита; берём усреднённое значение для конвертации цен). */
const RHO_STEEL = 7.9;

/* Источник прайса (mc.ru) хранит цены электросварных и перфорированных труб
   в ₽/м, а не ₽/т, но `unit` у всех труб помечен как «т». Это давало
   нонсенс «119 ₽/т» для маленьких ESV (правка клиента 24.06.2026).
   Конвертируем: parsим геометрию из названия → кг/м → умножаем на 1000
   и делим на кг/м, чтобы получить ₽/т. ostatok (метры на складе) тоже
   приводим к тоннам. Бесшовные оставляем без изменений — у них цены и
   так в ₽/т. */
function esvKgPerMeter(s: any): number | null {
	const sub = String(s?.sub ?? '');
	const name = String(s?.name ?? '').replace(/[хХX×]/g, 'x');
	if (sub === 'elsvarnaya-pryamougolnaya') {
		/* Прямоугольная — a×b×wall в названии (size хранит только a×b). */
		const m = name.match(/(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)/);
		if (!m) return null;
		const a = parseFloat(m[1]);
		const b = parseFloat(m[2]);
		const w = parseFloat(m[3]);
		if (!(a > 0 && b > 0 && w > 0 && w < Math.min(a, b) / 2)) return null;
		return ((2 * (a + b) - 4 * w) * w * RHO_STEEL) / 1000;
	}
	if (sub === 'elsvarnaya-kvadrat') {
		/* Квадратная — A×wall, два числа. */
		const m = name.match(/(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)(?!\.?\d|x)/);
		if (!m) return null;
		const a = parseFloat(m[1]);
		const w = parseFloat(m[2]);
		if (!(a > 0 && w > 0 && w < a / 2)) return null;
		return ((4 * a - 4 * w) * w * RHO_STEEL) / 1000;
	}
	if (sub === 'elsvarnaya' || sub === 'perforirovannaya') {
		/* Круглая — D×wall. У perforirovannaya по факту меньше материала
		   (есть отверстия), но это всего 4 SKU — допустимая погрешность. */
		const m = name.match(/(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)(?!\.?\d|x)/);
		if (!m) return null;
		const D = parseFloat(m[1]);
		const w = parseFloat(m[2]);
		if (!(D > 0 && w > 0 && w < D / 2)) return null;
		return (Math.PI * (D - w) * w * RHO_STEEL) / 1000;
	}
	return null;
}

/* Полоса хранится в прайсе как size=«20» (одно число), хотя в названии
   полная геометрия «20×3» (ширина × толщина). Из-за этого ProductDetail
   подписывал 20 как «толщина», блок «Другие толщины» по факту перебирал
   ширины, а в табличном прайсе колонка «Размер» давала 20 (это ширина,
   а не размер). Правка клиента 24.06.2026.

   Парсим обе цифры из названия и: size делаем строкой «ширина×толщина»
   (видно сразу обе), кладём отдельные числовые width/thickness для
   корректной фильтрации и группировок. Slug не трогаем — URL-стабильность. */
function normalizePolosaSku(s: any): any {
	if (!s || s.hub !== 'polosa') return s;
	const name = String(s.name ?? '').replace(/[хХX×]/g, 'x');
	const m = name.match(/(\d+(?:[.,]\d+)?)x(\d+(?:[.,]\d+)?)/);
	if (!m) return s;
	const width = parseFloat(m[1].replace(',', '.'));
	const thickness = parseFloat(m[2].replace(',', '.'));
	if (!Number.isFinite(width) || !Number.isFinite(thickness)) return s;
	return { ...s, width, thickness, size: `${width}×${thickness}` };
}

function normalizeTrubaSku(s: any): any {
	if (!s || s.hub !== 'truba') return s;
	const sub = String(s.sub ?? '');
	const isEsv =
		sub === 'elsvarnaya' ||
		sub === 'elsvarnaya-kvadrat' ||
		sub === 'elsvarnaya-pryamougolnaya' ||
		sub === 'perforirovannaya';
	if (!isEsv) return s;
	const kgPerM = esvKgPerMeter(s);
	if (kgPerM == null || kgPerM <= 0) return s;
	const out: any = { ...s };
	if (typeof s.price === 'number') out.price = Math.round((s.price * 1000) / kgPerM);
	if (typeof s.priceUnit === 'number') out.priceUnit = Math.round((s.priceUnit * 1000) / kgPerM);
	if (typeof s.ostatok === 'number') out.ostatok = Math.round((s.ostatok * kgPerM) / 1000);
	return out;
}

/* Единая точка чтения SKU из прайса: для /list/ выкидывает рулон-стайл,
   для /rulon/ — переименовывает «лист» в «рулон», для /truba/ — конвертирует
   ESV-трубы из ₽/м в ₽/т. Все потребители (PriceTable, страницы хабов,
   [slug]-роуты) должны идти через неё, иначе данные и счётчики разойдутся. */
export function getHubSkus(hub: string): any[] {
	const raw = ((pricelist as any).hubs?.[hub] ?? []) as any[];
	if (hub === 'list') {
		return raw.filter((s) => !isRulonLikeName(s?.name));
	}
	if (hub === 'rulon') {
		return raw.map((s) => ({ ...s, name: rulonizeName(s?.name) }));
	}
	if (hub === 'truba') {
		return raw.map(normalizeTrubaSku);
	}
	if (hub === 'polosa') {
		return raw.map(normalizePolosaSku);
	}
	return raw;
}
