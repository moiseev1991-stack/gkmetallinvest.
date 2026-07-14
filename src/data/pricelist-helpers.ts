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

	/* --- Фланец: <исполнение>x<Ду>x<Ру>, три целых числа. Ру в наименовании
	   идёт как «кгс/см²» (0.25, 0.6, 1, 1.6, 2.5, 4, 6.3, 10, 16, 25, 40, 63),
	   исполнение = тип фланца по ГОСТ 12820-80 (1 — плоский приварной). */
	if (sub === 'flanec' || sub === 'flanec-nastennyy') {
		const m = name.match(/(\d+)x(\d+)x(\d+)/);
		if (m) {
			const [_, exec, du, ru] = m;
			return {
				display: `${exec} × ${du} × ${ru} (исполнение × Ду × Ру)`,
				descriptionInline: `исполнение ${exec}, Ду ${du} мм, Ру ${ru} кгс/см²`,
				rows: [
					{ label: 'Исполнение', value: exec },
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
