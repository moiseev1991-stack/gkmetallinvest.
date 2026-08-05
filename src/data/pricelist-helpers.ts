import pricelist from './pricelist.json';
import { dekorListy } from './dekor-listy';
import { lentaSkus } from './lenta';
import { buildDupMap, variantCandidates, shortGradeForSeo } from './sku-seo.mjs';

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
/* Разбор размеров у деталей трубопровода. В прайсе sku.size хранит только
   первое число обозначения (например "1" для фланца «1x10x40»), а полное
   обозначение по ГОСТ — три или два параметра — сидит в name. Из-за этого
   на карточке товара клиент видел «размер 1 мм», хотя реальный размер —
   исполнение × Ду × Ру. Здесь достаём полную геометрию из имени и
   раскладываем по семантическим полям per-sub. */
export type DetailDimensions = {
	/** Компактная строка для лид-абзаца и meta-description, напр. "1 × 10 × 40 (исполнение × Ду × Ру)". */
	display: string;
	/** Отдельные строки для блока «Характеристики». */
	rows: Array<{ label: string; value: string }>;
	/** Кусок для meta description, обычно тот же display без круглых скобок. */
	descriptionInline: string;
	/** ГОСТ (если распарсен из имени). */
	gost?: string;
};

const GOST_RE = /ГОСТ\s+(\d+[-–]\d+)/i;

function parseGost(name: string): string | undefined {
	const m = name.match(GOST_RE);
	return m ? `ГОСТ ${m[1].replace('–', '-')}` : undefined;
}

/** Заменяет запятую на точку для .replace: source мог прийти как «2,5». */
function num(s: string): string {
	return s.replace(',', '.');
}

export function getDetailDimensions(sku: any): DetailDimensions | null {
	if (sku?.hub !== 'detali-truboprovoda') return null;
	const name = String(sku?.name ?? '').replace(/[Х×хX]/g, 'x');
	const gost = parseGost(name);

	const sub = String(sku?.sub ?? '');

	/* --- Фланец: два формата в зависимости от ГОСТа.
	   - ГОСТ 12820/12821 (старый): <Исп>x<Ду>x<Ру>, напр. «1x100x6» = Исп 1, Ду 100, Ру 6.
	   - ГОСТ 33259-2015 (новый): <Ду>x<Ру>x<Тип>, напр. «15x16x1» = Ду 15, Ру 16, Тип 1
	     (тип 1 плоский / 11 воротниковый / 21 свободный на приварном кольце).
	   До правки 15.07.2026 применяли только старый порядок ко всем — из-за
	   этого 121 фланец по 33259 показывался с «Ду 16 мм, Ру 1 кгс/см²»
	   вместо реального «Ду 15 мм, Ру 16 кгс/см²» и выпадал из фильтра Ру. */
	if (sub === 'flanec' || sub === 'flanec-nastennyy') {
		const m = name.match(/(\d+)x(\d+)x(\d+)/);
		if (m) {
			const is33259 = /33259/.test(name);
			const [_, a, b, c] = m;
			const exec = is33259 ? c : a;
			const du = is33259 ? a : b;
			const ru = is33259 ? b : c;
			/* Тип фланца по ГОСТ 33259 совпадает с «исполнением» по 12820-80
			   в 1 и 11 (плоский/воротниковый), плюс 21 (свободный). Единый
			   словарь на оба ГОСТа. */
			const execHint: Record<string, string> = {
				'1': 'плоский приварной',
				'2': 'воротниковый',
				'3': 'свободный на приварном кольце',
				'11': 'воротниковый (тип 11 по ГОСТ 33259)',
				'21': 'свободный на приварном кольце (тип 21 по ГОСТ 33259)',
			};
			return {
				display: `Ду ${du} мм, Ру ${ru} кгс/см²`,
				descriptionInline: `Ду ${du} мм, Ру ${ru} кгс/см²`,
				rows: [
					{
						label: 'Исполнение (тип по ГОСТ)',
						value: execHint[exec] ? `${exec} — ${execHint[exec]}` : exec,
					},
					{ label: 'Ду (условный проход)', value: `${du} мм` },
					{ label: 'Ру (условное давление)', value: `${ru} кгс/см²` },
				],
				gost,
			};
		}
	}

	/* --- Переход: <Ø1>x<Ø2>x<стенка>, где Ø1 — больший диаметр, Ø2 — меньший.
	   Пример: «Переход 76x48x3» = c 76 на 48, стенка 3 мм. */
	if (sub === 'perehod') {
		const m = name.match(/(\d+(?:[.,]\d+)?)x(\d+(?:[.,]\d+)?)x(\d+(?:[.,]\d+)?)/);
		if (m) {
			const [_, d1, d2, wall] = m;
			return {
				display: `Ø ${num(d1)} → Ø ${num(d2)}, стенка ${num(wall)} мм`,
				descriptionInline: `Ø ${num(d1)} → Ø ${num(d2)} мм, стенка ${num(wall)} мм`,
				rows: [
					{ label: 'Больший диаметр', value: `${num(d1)} мм` },
					{ label: 'Меньший диаметр', value: `${num(d2)} мм` },
					{ label: 'Стенка', value: `${num(wall)} мм` },
				],
				gost,
			};
		}
	}

	/* --- Отвод/тройник/заглушка: <Ø>x<стенка>, два числа. */
	if (sub === 'otvod' || sub === 'troynik' || sub === 'zaglushka') {
		const m = name.match(/(\d+(?:[.,]\d+)?)x(\d+(?:[.,]\d+)?)(?!x)/);
		if (m) {
			const [_, d, wall] = m;
			return {
				display: `Ø ${num(d)} × стенка ${num(wall)} мм`,
				descriptionInline: `Ø ${num(d)} мм, стенка ${num(wall)} мм`,
				rows: [
					{ label: 'Диаметр', value: `${num(d)} мм` },
					{ label: 'Стенка', value: `${num(wall)} мм` },
				],
				gost,
			};
		}
	}

	/* --- Клапан/задвижка: «Ду50 Ру16» в имени, парсим обе.
	   sku.size у этих часто пуст или дублирует Ду. */
	if (sub === 'klapan' || sub === 'zadvizhka') {
		const mDu = name.match(/Ду\s*(\d+)/i);
		const mRu = name.match(/Ру\s*(\d+(?:[.,]\d+)?)/i);
		if (mDu || mRu) {
			const parts: string[] = [];
			const rows: Array<{ label: string; value: string }> = [];
			if (mDu) {
				parts.push(`Ду ${mDu[1]}`);
				rows.push({ label: 'Ду (условный проход)', value: `${mDu[1]} мм` });
			}
			if (mRu) {
				parts.push(`Ру ${num(mRu[1])}`);
				rows.push({ label: 'Ру (условное давление)', value: `${num(mRu[1])} кгс/см²` });
			}
			return {
				display: parts.join(', '),
				descriptionInline: parts.join(', '),
				rows,
				gost,
			};
		}
	}

	/* Прочие sub-типы (декоративные, крепления, лестничные) — оставляем
	   стандартный sku.size fallback, но всё ещё возвращаем ГОСТ, если он есть. */
	if (gost) {
		return { display: '', descriptionInline: '', rows: [], gost };
	}
	return null;
}

/* ===== SEO: уникальные заголовки карточек =====

   Задача: у карточек одного размера и марки не должно быть одинаковых <title>,
   H1 и description. До правки 30.07.2026 заголовок собирался как
   «хаб + размер + марка», из-за чего, например, 23 разных листа AISI 430
   толщиной 1,5 мм (форматы 1000×2000 / 1250×2500 / рулон, с плёнкой и без,
   разные заводы) получали один и тот же заголовок, а 47 разных изделий
   ограждения Ø50,8 — заголовок «Лестничные элементы 50,8 мм AISI 304».

   Решение: считаем «хвост» заголовка (всё после названия хаба) сразу по всему
   хабу и дописываем к нему минимальный набор различителей из sku-seo.mjs,
   которого хватает, чтобы хвосты не совпадали. Размер берём тот же
   производный, что и в заголовке страницы (Ø × стенка у трубы, Ду/Ру у
   арматуры, ширина×толщина у полосы), иначе группы «одинаковых» считаются не
   по тому, что реально видно в <title>. */

export type SkuSeoBits = {
	/** Хвост <title> после названия хаба: «1,5 мм AISI 304 2B 1250×2500». */
	tail: string;
	/** Хвост для description — все различители, не только минимум. */
	tailLong: string;
	/** Только различитель, без размера и марки — для отдельного span в H1. */
	variant: string;
	/** true — та же позиция, что и `canonicalSlug` (другая партия/остаток). */
	isDup: boolean;
	canonicalSlug: string;
};

const EMPTY_BITS: SkuSeoBits = { tail: '', tailLong: '', variant: '', isDup: false, canonicalSlug: '' };

function ruNumSeo(s: string): string {
	return String(s).replace('.', ',');
}

/** Размер в том виде, в котором он попадает в заголовок страницы. Должен
 *  совпадать с extractMainSize в ProductDetail.astro. */
function mainSizeForSeo(sku: any): string {
	const dims = getDetailDimensions(sku);
	if (dims?.descriptionInline) return dims.descriptionInline;
	const size = sku?.size;
	if (!size) return '';
	const raw = String(size).trim();
	if (sku.hub === 'truba') {
		const m = raw.match(/Ø?\s*([\d.,]+)\s*[×x]\s*([\d.,]+)/i);
		if (m) return `Ø ${ruNumSeo(m[1])} × ${ruNumSeo(m[2])} мм`;
		const m1 = raw.match(/Ø?\s*([\d.,]+)/);
		return m1 ? `Ø ${ruNumSeo(m1[1])} мм` : raw;
	}
	/* Полоса: size уже нормализован в «ширина×толщина» — берём целиком, иначе
	   полосы 40×3 и 40×4 дают один заголовок «Полоса 40 мм». */
	if (sku.hub === 'polosa' && /[×x]/.test(raw)) return `${ruNumSeo(raw)} мм`;
	const m = raw.match(/([\d.,]+)/);
	return m ? `${ruNumSeo(m[1])} мм` : raw;
}

/** Обрезка по границе слова — чтобы длинные названия из прайса не раздували
 *  <title> целиком. */
function clampBaseForSeo(s: string, limit: number): string {
	const str = String(s ?? '').trim();
	if (str.length <= limit) return str;
	const cut = str.slice(0, limit);
	const sp = cut.lastIndexOf(' ');
	return (sp > limit * 0.5 ? cut.slice(0, sp) : cut).trim();
}

/** Имя позиции без артикула, с заглавной буквы — заголовок штучного товара. */
function pieceNameForSeo(sku: any): string {
	const raw = String(sku?.name ?? '').replace(/\s+арт\.?\s*\S+\s*$/i, '').trim();
	if (!raw) return '';
	return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/* Часть роутов (`/list/[slug].astro`) генерирует страницы из сырого массива
   прайса, а не через getHubSkus — то есть страницы есть и у позиций, которые
   отфильтрованы из таблицы хаба (рулон-стайл). Если считать SEO-раскладку
   только по getHubSkus, такие карточки остаются без различителя и снова
   получают одинаковые заголовки. Поэтому объединяем: нормализованные записи в
   приоритете, сырые — добираем по слагу. */
function seoSkuUniverse(hub: string): any[] {
	const bySlug = new Map<string, any>();
	for (const sku of getHubSkus(hub)) bySlug.set(sku.slug, sku);
	const raw = ((pricelist as any).hubs?.[hub] ?? []) as any[];
	for (const sku of raw) if (!bySlug.has(sku.slug)) bySlug.set(sku.slug, sku);
	return [...bySlug.values()];
}

function buildHubSeo(hub: string): Map<string, SkuSeoBits> {
	const skus = seoSkuUniverse(hub);
	const dupMap = buildDupMap(skus);
	const out = new Map<string, SkuSeoBits>();

	const canonicalSkus = skus.filter((s) => !dupMap.get(s.slug)?.isDup);

	/* Базовый хвост: у штучного товара — имя позиции (оно уникально и
	   описательно), у тонного проката — размер + марка. */
	const baseOf = new Map<string, string>();
	for (const sku of canonicalSkus) {
		const raw =
			sku.unit === 'шт' && pieceNameForSeo(sku)
				? pieceNameForSeo(sku)
				: [mainSizeForSeo(sku), shortGradeForSeo(sku.grade)].filter(Boolean).join(' ');
		/* Обрезаем базу здесь, а не в шаблоне: если резать готовый хвост, срежется
		   как раз различитель, и заголовки снова станут одинаковыми (так вышло у
		   фланцев «100x10x11 ГОСТ 33259-2015» — 4 карточки). */
		baseOf.set(sku.slug, clampBaseForSeo(raw, sku.unit === 'шт' ? 58 : 70));
	}

	/* Группируем по базовому хвосту и добавляем ровно столько различителей,
	   сколько нужно для уникальности внутри группы. */
	const groups = new Map<string, any[]>();
	for (const sku of canonicalSkus) {
		const k = baseOf.get(sku.slug)!;
		if (!groups.has(k)) groups.set(k, []);
		groups.get(k)!.push(sku);
	}

	const resolved = new Map<string, { tail: string; tailLong: string; variant: string }>();
	for (const [base, members] of groups) {
		if (members.length === 1) {
			resolved.set(members[0].slug, { tail: base, tailLong: base, variant: '' });
			continue;
		}
		const candidateLists = new Map<string, string[]>();
		for (const sku of members) candidateLists.set(sku.slug, variantCandidates(sku));
		/* Берём только признаки, которые внутри группы реально различаются: иначе
		   в заголовок лезет «2B 1000×2000 Россия» там, где хватает формата. */
		const total = variantCandidates(members[0]).length;
		const varyingIdx: number[] = [];
		for (let i = 0; i < total; i++) {
			const vals = new Set(members.map((m) => candidateLists.get(m.slug)![i] ?? ''));
			if (vals.size > 1) varyingIdx.push(i);
		}
		const bitsOf = (slug: string, upto: number) =>
			varyingIdx
				.slice(0, upto)
				.map((i) => candidateLists.get(slug)![i])
				.filter(Boolean);
		/* Минимальное число признаков, при котором хвосты в группе различаются. */
		let depth = varyingIdx.length;
		for (let d = 1; d <= varyingIdx.length; d++) {
			const tails = members.map((m) => `${base} ${bitsOf(m.slug, d).join(' ')}`.trim());
			if (new Set(tails).size === members.length) {
				depth = d;
				break;
			}
		}
		/* Крайний случай (полностью идентичные по всем признакам, но разные
		   позиции) — размер как последний различитель, потом слаг. */
		for (const sku of members) {
			const minBits = bitsOf(sku.slug, depth);
			const allBits = bitsOf(sku.slug, varyingIdx.length);
			let tail = `${base} ${minBits.join(' ')}`.trim();
			resolved.set(sku.slug, {
				tail,
				tailLong: `${base}${allBits.length ? ', ' + allBits.join(', ') : ''}`,
				variant: minBits.join(' '),
			});
		}
		/* Позиции, неразличимые по всем признакам (в прайсе действительно нет
		   отличий, кроме цены/остатка). Первый проход дописывает штучному
		   товару размер — он часто и есть отличие («Низ стойки малый» Ø38,1 и
		   Ø50,8 с одинаковым названием). Второй проход добивает остаток
		   коротким «вар. N»: длинный хвост не годится — заголовок обрезается по
		   лимиту и снова становится одинаковым. */
		const disambiguate = (force: boolean) => {
			const seen = new Map<string, number>();
			for (const sku of members) {
				const r = resolved.get(sku.slug)!;
				const n = (seen.get(r.tail) ?? 0) + 1;
				seen.set(r.tail, n);
				if (n === 1) continue;
				const size = mainSizeForSeo(sku);
				const extra =
					!force && sku.unit === 'шт' && size && !r.tail.includes(size) ? size : `вар. ${n}`;
				r.tail = `${r.tail} ${extra}`.trim();
				r.variant = `${r.variant} ${extra}`.trim();
				r.tailLong = `${r.tailLong}, ${extra}`;
			}
		};
		disambiguate(false);
		disambiguate(true);
	}

	for (const sku of skus) {
		const dup = dupMap.get(sku.slug) ?? { isDup: false, canonicalSlug: sku.slug };
		const r = resolved.get(dup.canonicalSlug) ?? resolved.get(sku.slug);
		out.set(sku.slug, {
			tail: r?.tail ?? '',
			tailLong: r?.tailLong ?? '',
			variant: r?.variant ?? '',
			isDup: dup.isDup,
			canonicalSlug: dup.canonicalSlug,
		});
	}
	return out;
}

/* Считается один раз на хаб за сборку: до 1000+ карточек на хаб, пересчёт на
   каждой странице заметно удлиняет билд. */
const seoBitsCache = new Map<string, Map<string, SkuSeoBits>>();

export function getSkuSeoBits(hub: string, slug: string): SkuSeoBits {
	if (!seoBitsCache.has(hub)) seoBitsCache.set(hub, buildHubSeo(hub));
	return seoBitsCache.get(hub)!.get(slug) ?? { ...EMPTY_BITS, canonicalSlug: slug };
}

export function getHubSkus(hub: string): any[] {
	/* Декоративные листы живут в отдельном модуле (не в pricelist.json) —
	   своя подкатегория с поверхностями DK-кодов. */
	if (hub === 'dekorativnye-listy') {
		return dekorListy as any[];
	}
	/* Лента (штрипс х/к) — отдельный модуль, собранный из импорта двух
	   каталогов, не из pricelist.json. См. src/data/lenta.ts. */
	if (hub === 'lenta') {
		/* Тонкая фольга (толщина < 0,15 мм) лежит в тех же данных lentaSkus, но
		   относится к разделу /folga-. На страницах ленты (заявлено «0,15–0,8 мм»)
		   её не показываем — иначе штрипс и фольга смешиваются. */
		return (lentaSkus as any[]).filter(
			(s) => typeof s.thickness !== 'number' || s.thickness >= 0.15,
		);
	}
	/* Фольга — самые тонкие позиции ленты, толщина 0,05–0,15 мм (правило заказчика:
	   лента этих толщин — это уже фольга). Отдельного каталога нет: физически это
	   лента с фольговыми параметрами, поэтому выносим её на /folga-nerzhaveyushchaya/,
	   ссылаясь на те же карточки товара в /lenta-nerzhaveyushchaya/. Сейчас в данных
	   тоньше 0,15 мм ничего нет — диапазон задан на вырост, под будущие тонкие позиции. */
	if (hub === 'folga') {
		return (lentaSkus as any[]).filter(
			(s) => typeof s.thickness === 'number' && s.thickness >= 0.05 && s.thickness <= 0.15,
		);
	}
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
