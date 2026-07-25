/** Декоративные листы из нержавеющей стали — отдельный источник данных.
 *
 * Держим НЕ в pricelist.json намеренно: тот файл правится вручную/парсером,
 * а декор — своя подкатегория (лифты, кассы, интерьер) со своими
 * поверхностями DK-кодов вместо стандартных 2B/BA/4N (ТЗ SEO-встречи, п. 1.2).
 *
 * ⚠️ СЕЙЧАС ЗДЕСЬ ДЕМО-КАРКАС. Цены = «по запросу» (price=null), комбинации
 * марка×толщина×формат×поверхность собраны как реалистичные заглушки, чтобы
 * отрисовать и проверить фильтры/карточки. Заменить реальными позициями
 * DK1–DK9 с MetalService (ms.ru) + Black Mirror/Gold Satin/Black Nanomate с
 * inoxmarket.ru. НЕ выдавать демо за фактический склад.
 *
 * Русские названия DK-кодов взяты из ТЗ (DK1 Лён, DK2 Клетка, DK4 Кожа,
 * DK8 Чёрное зеркало, DK9 Водная рябь). DK3/DK5/DK6/DK7 в ТЗ не расшифрованы —
 * не выдумываем, добавим после уточнения у заказчика.
 */

export interface DekorSku {
	hub: 'dekorativnye-listy';
	/** Ключ группы фактуры (tisnenie/zerkalo/satin/pvd) — используется как «Тип»
	 *  фильтра в PriceTable. */
	sub: string | null;
	grade: string | null;
	roll: string | null;
	alloy: string | null;
	/** DK-код или маркетинговое имя поверхности: DK1, DK8, Gold Satin и т.п. */
	surface: string;
	/** Толщина листа, мм (как строка — единообразно с pricelist). */
	size: string;
	/** Формат листа «ширина×длина» в ASCII: «1250x2500». Отдельное поле, чтобы
	 *  фильтр «Формат» в PriceTable не зависел от разбора названия. */
	format: string;
	/** Словесный цвет поверхности: сталь / чёрный / золото. */
	color: string;
	unit: string;
	price: number | null;
	priceUnit: number | null;
	slug: string;
	dlina: string | null;
	fact: string | null;
	ostatok: number | null;
	name: string;
}

/** Группы фактуры — метки для фильтра «Тип» в PriceTable и карточек. */
export const DEKOR_GROUP_LABELS: Record<string, string> = {
	tisnenie: 'Тиснение',
	zerkalo: 'Зеркало',
	satin: 'Сатин / шлифовка',
	pvd: 'Цветное PVD',
};

export interface DekorSurfaceMeta {
	/** Русское название поверхности. */
	ru: string;
	/** Ключ группы фактуры (см. DEKOR_GROUP_LABELS). */
	group: string;
	/** Словесный цвет. */
	color: string;
	/** CSS-значение background для свотча (чистый CSS, без картинок). */
	swatch: string;
	/** Короткая строка для блока поверхностей на хабе. */
	short: string;
	/** Абзац для карточки товара. */
	desc: string;
	/** Типичные применения. */
	applications: string[];
}

/** Единый справочник поверхностей: название, группа, цвет, CSS-свотч и тексты.
 *  Источник имён — ТЗ SEO (п. 1.2) + маркетинговые названия поставщиков. */
export const DEKOR_SURFACE_META: Record<string, DekorSurfaceMeta> = {
	DK1: {
		ru: 'Лён',
		group: 'tisnenie',
		color: 'сталь',
		swatch: 'repeating-linear-gradient(45deg,#e0e5ea 0 2px,#c9d0d7 2px 4px)',
		short: 'Матовое тиснение «под лён» — мягкая тканевая фактура.',
		desc: 'Тиснёная поверхность с рисунком льняного полотна. Матовый рельеф рассеивает свет, маскирует отпечатки и мелкие царапины — практичный вариант для зон с высокой проходимостью.',
		applications: ['Отделка лифтовых кабин и порталов', 'Стеновые панели, ресепшн', 'Мебельные фасады, лифты HoReCa'],
	},
	DK2: {
		ru: 'Клетка',
		group: 'tisnenie',
		color: 'сталь',
		swatch: 'repeating-linear-gradient(0deg,#b9c1c9 0 1px,transparent 1px 7px), repeating-linear-gradient(90deg,#b9c1c9 0 1px,transparent 1px 7px), #d6dbe1',
		short: 'Геометрическое тиснение «клетка» — чёткий регулярный рельеф.',
		desc: 'Регулярный клетчатый рельеф с выраженной геометрией. Хорошо смотрится на больших плоскостях, придаёт поверхности объём и скрывает эксплуатационные следы.',
		applications: ['Облицовка колонн и стен', 'Двери и порталы', 'Декоративные экраны, перегородки'],
	},
	DK4: {
		ru: 'Кожа',
		group: 'tisnenie',
		color: 'сталь',
		swatch: 'repeating-radial-gradient(circle at center,#d4dae0 0 3px,#c3cbd2 3px 5px)',
		short: 'Тиснение «под кожу» — мелкозернистая пластичная фактура.',
		desc: 'Мелкозернистое тиснение, визуально имитирующее выделанную кожу. Тёплая на вид матовая поверхность для интерьеров премиального сегмента.',
		applications: ['Интерьерная отделка', 'Мебель, барные стойки', 'Лифты и входные группы'],
	},
	DK8: {
		ru: 'Чёрное зеркало',
		group: 'zerkalo',
		color: 'чёрный',
		swatch: 'linear-gradient(135deg,#3b4147,#0c0e11 45%,#26292e 62%,#050506)',
		short: 'Зеркальная полировка с чёрным PVD — глубокий глянец.',
		desc: 'Зеркальная полировка (Mirror) с чёрным PVD-покрытием. Даёт глубокий отражающий глянец; поставляется с защитной плёнкой, монтаж — без абразивного контакта.',
		applications: ['Премиальные интерьеры, HoReCa', 'Лифтовые порталы, ресепшн', 'Рекламные и фасадные конструкции'],
	},
	DK9: {
		ru: 'Водная рябь',
		group: 'tisnenie',
		color: 'сталь',
		swatch: 'repeating-radial-gradient(circle at 50% 50%,#dce1e6 0 3px,#c6cdd4 3px 7px)',
		short: 'Тиснение «водная рябь» — волнообразный светоигровой рельеф.',
		desc: 'Волнообразный рельеф «водная рябь». На свету создаёт мягкую игру бликов, визуально «оживляет» большие плоскости без зеркального блеска.',
		applications: ['Стеновые панно и экраны', 'Отделка лифтов', 'Декор фасадов и вывесок'],
	},
	'Gold Satin': {
		ru: 'Золотая шлифовка',
		group: 'satin',
		color: 'золото',
		swatch: 'repeating-linear-gradient(90deg,#e6c46f 0 2px,#c69a3c 2px 4px)',
		short: 'Сатиновая шлифовка с золотым PVD — матовое золото.',
		desc: 'Направленная сатиновая шлифовка (Satin) с золотым PVD-покрытием. Матовый золотой тон без бликов, устойчив к отпечаткам — универсальное решение для тёплых интерьеров.',
		applications: ['Интерьеры, HoReCa, ритейл', 'Лифты, порталы, ресепшн', 'Мебельные и декоративные элементы'],
	},
	'Black Mirror': {
		ru: 'Чёрное зеркало',
		group: 'zerkalo',
		color: 'чёрный',
		swatch: 'linear-gradient(120deg,#2c3035,#000 48%,#1b1e22)',
		short: 'Зеркало Black Mirror — насыщенный чёрный глянец.',
		desc: 'Зеркальная поверхность с чёрным PVD (Black Mirror). Более насыщенный чёрный глянец для акцентных плоскостей; поставляется с защитной плёнкой.',
		applications: ['Акцентные стены и панели', 'Премиальный ритейл', 'Фасады, вывески, рекламные конструкции'],
	},
	'Black Nanomate': {
		ru: 'Чёрное нанопокрытие',
		group: 'pvd',
		color: 'чёрный',
		swatch: 'linear-gradient(135deg,#22262b,#0e1013)',
		short: 'Матовое чёрное нанопокрытие — глубокий чёрный без бликов.',
		desc: 'Матовое чёрное нанопокрытие (Nanomate) — глубокий антибликовый чёрный. Скрывает отпечатки лучше глянца, подходит для сдержанных современных интерьеров.',
		applications: ['Современные интерьеры, лофт', 'Мебель, стеновые панели', 'Отделка лифтов и входных групп'],
	},
};

/** Подписи поверхностей «код / русское название» — закрывает оба варианта
 *  поиска (люди вбивают и «DK8», и «нержавейка чёрное зеркало»).
 *  Импортируется в PriceTable для меток фильтра/чипов. Строится из META. */
export const DEKOR_SURFACE_LABELS: Record<string, string> = Object.fromEntries(
	Object.entries(DEKOR_SURFACE_META).map(([code, m]) => [code, `${code} / ${m.ru}`]),
);

const fmtHuman = (f: string): string => f.replace('x', '×');

function mk(surface: string, grade: string, thickness: string, format: string): DekorSku {
	const meta = DEKOR_SURFACE_META[surface];
	const t = thickness.replace('.', ',');
	const gradeSlug = grade.toLowerCase().replace(/\s+/g, '-');
	const surfSlug = surface.toLowerCase().replace(/\s+/g, '-');
	return {
		hub: 'dekorativnye-listy',
		sub: meta.group,
		grade,
		roll: null,
		alloy: null,
		surface,
		size: thickness,
		format,
		color: meta.color,
		unit: 'лист',
		price: null,
		priceUnit: null,
		slug: `list-dekorativnyy-${surfSlug}-${gradeSlug}-${t.replace(',', '_')}x${format.replace('x', '-')}`,
		dlina: null,
		fact: null,
		ostatok: null,
		name: `Лист нержавеющий декоративный ${grade} ${t}×${fmtHuman(format)} ${surface} (${meta.ru.toLowerCase()})`,
	};
}

/** ДЕМО-каркас: реалистичные комбинации, цена по запросу. Заменить реальными. */
export const dekorListy: DekorSku[] = [
	// Тиснение (AISI 304)
	mk('DK1', 'AISI 304', '0.5', '1250x2500'),
	mk('DK1', 'AISI 304', '0.8', '1000x2000'),
	mk('DK1', 'AISI 304', '0.8', '1250x2500'),
	mk('DK1', 'AISI 304', '1.0', '1250x2500'),
	mk('DK2', 'AISI 304', '0.8', '1250x2500'),
	mk('DK2', 'AISI 304', '1.0', '1250x2500'),
	mk('DK4', 'AISI 304', '0.8', '1000x2000'),
	mk('DK4', 'AISI 304', '0.8', '1250x2500'),
	mk('DK9', 'AISI 304', '0.8', '1250x2500'),
	mk('DK9', 'AISI 304', '1.0', '1250x2500'),
	// Зеркало (304 + 316)
	mk('DK8', 'AISI 304', '0.8', '1250x2500'),
	mk('DK8', 'AISI 304', '1.0', '1250x2500'),
	mk('DK8', 'AISI 316', '1.0', '1500x3000'),
	mk('DK8', 'AISI 316', '1.5', '1500x3000'),
	mk('Black Mirror', 'AISI 304', '0.8', '1250x2500'),
	mk('Black Mirror', 'AISI 304', '0.8', '1500x3000'),
	mk('Black Mirror', 'AISI 316', '1.0', '1500x3000'),
	// Сатин / шлифовка (304 + 316)
	mk('Gold Satin', 'AISI 304', '0.8', '1250x2500'),
	mk('Gold Satin', 'AISI 304', '1.0', '1250x2500'),
	mk('Gold Satin', 'AISI 316', '1.0', '1250x2500'),
	// Цветное PVD
	mk('Black Nanomate', 'AISI 304', '0.8', '1000x2000'),
	mk('Black Nanomate', 'AISI 304', '0.8', '1250x2500'),
	mk('Black Nanomate', 'AISI 304', '1.0', '1250x2500'),
];
