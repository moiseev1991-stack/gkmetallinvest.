/** Декоративные листы из нержавеющей стали — отдельный источник данных.
 *
 * Держим НЕ в pricelist.json намеренно: тот файл правится вручную/парсером,
 * а декор — своя подкатегория (лифты, кассы, интерьер) со своими
 * поверхностями DK-кодов вместо стандартных 2B/BA/4N (ТЗ SEO-встречи, п. 1.2).
 *
 * ⚠️ СЕЙЧАС ЗДЕСЬ ДЕМО-КАРКАС. Позиции ниже — заглушки со стандартными
 * форматами и ценой «по запросу» (price=null), нужны только чтобы отрисовать
 * и проверить фильтр поверхности. Заменить реальными позициями DK1–DK9 с
 * MetalService (ms.ru) + Black Mirror/Gold Satin/Black Nanomate с
 * inoxmarket.ru, добавить картинки. НЕ выдавать демо за фактический склад.
 *
 * Русские названия DK-кодов взяты из ТЗ (DK1 Лён, DK2 Клетка, DK4 Кожа,
 * DK8 Чёрное зеркало, DK9 Водная рябь). DK3/DK5/DK6/DK7 в ТЗ не расшифрованы —
 * не выдумываем, добавим после уточнения у заказчика.
 */

export interface DekorSku {
	hub: 'dekorativnye-listy';
	sub: string | null;
	grade: string | null;
	roll: string | null;
	alloy: string | null;
	/** DK-код или маркетинговое имя поверхности: DK1, DK8, Gold Satin и т.п. */
	surface: string;
	/** Толщина листа, мм (как строка — единообразно с pricelist). */
	size: string;
	unit: string;
	price: number | null;
	priceUnit: number | null;
	slug: string;
	dlina: string | null;
	fact: string | null;
	ostatok: number | null;
	name: string;
}

/** Подписи поверхностей декора: «код / русское название» — закрывает оба
 *  варианта поиска (люди вбивают и «DK8», и «нержавейка чёрное зеркало»).
 *  Импортируется в PriceTable для меток фильтра/чипов. */
export const DEKOR_SURFACE_LABELS: Record<string, string> = {
	DK1: 'DK1 / Лён',
	DK2: 'DK2 / Клетка',
	DK4: 'DK4 / Кожа',
	DK8: 'DK8 / Чёрное зеркало',
	DK9: 'DK9 / Водная рябь',
	'Gold Satin': 'Gold Satin / Золотая шлифовка',
	'Black Mirror': 'Black Mirror / Чёрное зеркало',
	'Black Nanomate': 'Black Nanomate / Чёрное нанопокрытие',
};

const demo = (
	surface: string,
	ruName: string,
	thickness: string,
	format: string,
): DekorSku => {
	const t = thickness.replace('.', ',');
	return {
		hub: 'dekorativnye-listy',
		sub: null,
		grade: 'AISI 304',
		roll: null,
		alloy: null,
		surface,
		size: thickness,
		unit: 'лист',
		price: null,
		priceUnit: null,
		slug: `list-dekorativnyy-${surface.toLowerCase().replace(/\s+/g, '-')}-${t.replace(',', '_')}x${format.replace(/[×x]/g, '-')}`,
		dlina: null,
		fact: null,
		ostatok: null,
		name: `Лист нержавеющий декоративный AISI 304 ${t}×${format} ${surface} (${ruName})`,
	};
};

/** ДЕМО-каркас: по стандартным форматам, цена по запросу. Заменить реальными. */
export const dekorListy: DekorSku[] = [
	demo('DK1', 'лён', '0.8', '1250×2500'),
	demo('DK2', 'клетка', '0.8', '1250×2500'),
	demo('DK4', 'кожа', '0.8', '1250×2500'),
	demo('DK8', 'чёрное зеркало', '0.8', '1250×2500'),
	demo('DK8', 'чёрное зеркало', '1.0', '1000×2000'),
	demo('DK9', 'водная рябь', '0.8', '1250×2500'),
	demo('Gold Satin', 'золотая шлифовка', '0.8', '1250×2500'),
	demo('Black Mirror', 'чёрное зеркало', '0.8', '1250×2500'),
	demo('Black Nanomate', 'чёрное нанопокрытие', '0.8', '1250×2500'),
];
