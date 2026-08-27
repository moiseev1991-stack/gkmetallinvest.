/**
 * Полный справочник ГОСТов на металлопрокат — 121 документ в 6 категориях.
 *
 * PDF-файлы стандартов хостятся локально в public/gost/pdf/{slug}.pdf —
 * чтобы посетитель не уходил на сторонние сайты (meganorm.ru и т.п.).
 * Скачать или обновить файлы: `node scripts/download-gost-pdfs.mjs`.
 *
 * Поле `hub` — наш каталожный раздел, в который ГОСТ направляет
 * заинтересованного покупателя. Используется для перелинковки.
 *
 * Поле `priority`:
 *   - 'core' — ключевые для нашей нержавеющей тематики (выводятся первыми)
 *   - 'standard' — общие, входят в раздел справочника
 */

export type GostCategory =
	| 'kachestvennyy'
	| 'listovoy'
	| 'sortovoy'
	| 'armatura'
	| 'trubnyy'
	| 'tsvetnye';

export interface GostItem {
	num: string;
	title: string;
	cat: GostCategory;
	/** Путь к локальному PDF. Необязателен: часть стандартов добавлена как
	 *  справочная карточка (номер, наименование, привязка к разделу), файл
	 *  добирается отдельно. Страница без `pdf` не рисует блок скачивания. */
	pdf?: string;
	hub?: string;
	priority?: 'core' | 'standard';
}

/**
 * Превращает номер ГОСТа в URL-slug.
 * «9941-81» → «9941-81»
 * «Р 52544-2006» → «r-52544-2006»
 * «5267.1-90» → «5267-1-90»
 */
export function gostSlug(num: string): string {
	return num
		.replace(/[Рр]\s*/g, 'r-')
		.replace(/\./g, '-')
		.replace(/\s+/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9-]/g, '')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}

/** Извлекает год введения из номера ГОСТа: «9941-81» → 1981, «5582-75» → 1975, «8240-97» → 1997, «5632-2014» → 2014. */
export function gostYear(num: string): number | null {
	const m = num.match(/-(\d{2}|\d{4})$/);
	if (!m) return null;
	const yy = m[1];
	if (yy.length === 4) return parseInt(yy, 10);
	const y = parseInt(yy, 10);
	// Двузначный год: < 25 → 20хх, иначе 19хх (по практике сортамента).
	return y < 25 ? 2000 + y : 1900 + y;
}

export const gostCategories: { value: GostCategory; label: string; descr: string }[] = [
	{
		value: 'kachestvennyy',
		label: 'Качественный прокат',
		descr: 'Углеродистый, легированный, инструментальный, рессорно-пружинный, подшипниковый, нержавеющий — общие технические условия и марки.',
	},
	{
		value: 'listovoy',
		label: 'Листовой прокат',
		descr: 'Тонколистовой, толстолистовой, оцинкованный, рифлёный, нержавеющий, для холодной штамповки и строительства.',
	},
	{
		value: 'sortovoy',
		label: 'Сортовой прокат',
		descr: 'Круг, квадрат, шестигранник, полоса, арматура, балки, швеллеры, уголки — сортамент и технические условия.',
	},
	{
		value: 'armatura',
		label: 'Трубопроводная арматура',
		descr: 'Фланцы, отводы, тройники, переходы, кресты, муфты, угольники — стальные и из ковкого чугуна.',
	},
	{
		value: 'trubnyy',
		label: 'Трубный прокат',
		descr: 'Бесшовные, электросварные, профильные, водогазопроводные, нержавеющие, овальные, квадратные, прямоугольные трубы.',
	},
	{
		value: 'tsvetnye',
		label: 'Цветные металлы',
		descr: 'Медь, латунь, бронза, алюминий, цинк, свинец, олово, припои, баббиты — листы, прутки, трубы, ленты.',
	},
];

export const gosts: GostItem[] = [
	// 1. КАЧЕСТВЕННЫЙ ПРОКАТ — 11 документов
	{ num: '1050-88', title: 'Прокат сортовой, калиброванный со специальной отделкой поверхности из углеродистой качественной конструкционной стали (технические условия)', cat: 'kachestvennyy', pdf: '/gost/pdf/1050-88.pdf', hub: '/krug-nerzhaveyushchiy/' },
	{ num: '1435-99', title: 'Прутки, полосы и мотки из инструментальной нелегированной стали (общие технические условия)', cat: 'kachestvennyy', pdf: '/gost/pdf/1435-99.pdf', hub: '/krug-nerzhaveyushchiy/' },
	{ num: '14959-79', title: 'Прокат из рессорно-пружинной углеродистой и легированной стали (технические условия)', cat: 'kachestvennyy', pdf: '/gost/pdf/14959-79.pdf', hub: '/krug-nerzhaveyushchiy/' },
	{ num: '19265-73', title: 'Прутки и полосы из быстрорежущей стали (технические условия)', cat: 'kachestvennyy', pdf: '/gost/pdf/19265-73.pdf', hub: '/krug-nerzhaveyushchiy/' },
	{ num: '20072-74', title: 'Сталь теплоустойчивая (технические условия)', cat: 'kachestvennyy', pdf: '/gost/pdf/20072-74.pdf', hub: '/krug-nerzhaveyushchiy/' },
	{ num: '3836-83', title: 'Сталь электротехническая нелегированная тонколистовая и ленты (технические условия)', cat: 'kachestvennyy', pdf: '/gost/pdf/3836-83.pdf', hub: '/list-nerzhaveyushchiy/' },
	{ num: '4405-75', title: 'Сталь полосовая горячекатаная и кованная инструментальная (сортамент)', cat: 'kachestvennyy', pdf: '/gost/pdf/4405-75.pdf', hub: '/polosa-nerzhaveyushchaya/' },
	{ num: '4543-71', title: 'Прокат из легированной конструкционной стали (технические условия)', cat: 'kachestvennyy', pdf: '/gost/pdf/4543-71.pdf', hub: '/krug-nerzhaveyushchiy/' },
	{ num: '5632-72', title: 'Стали высоколегированные и сплавы коррозионно-стойкие, жаростойкие и жаропрочные (марки)', cat: 'kachestvennyy', pdf: '/gost/pdf/5632-72.pdf', hub: '/list-nerzhaveyushchiy/', priority: 'core' },
	/* Действующие ТУ на сортовой нержавеющий прокат (пришёл на смену 5949-75):
	   по нему идут круг, квадрат и шестигранник в каталоге. */
	{ num: '5949-2018', title: 'Металлопродукция из сталей нержавеющих и сплавов на железоникелевой основе коррозионно-стойких, жаростойких и жаропрочных (технические условия)', cat: 'kachestvennyy', pdf: '/gost/pdf/5949-2018.pdf', hub: '/krug-nerzhaveyushchiy/', priority: 'core' },
	{ num: '5950-2000', title: 'Прутки, полосы и мотки из инструментальной легированной стали (общие технические условия)', cat: 'kachestvennyy', pdf: '/gost/pdf/5950-2000.pdf', hub: '/krug-nerzhaveyushchiy/' },
	{ num: '801-78', title: 'Сталь подшипниковая (технические условия)', cat: 'kachestvennyy', pdf: '/gost/pdf/801-78.pdf', hub: '/krug-nerzhaveyushchiy/' },

	// 2. ЛИСТОВОЙ ПРОКАТ — 14 документов
	{ num: '14637-89', title: 'Прокат толстолистовой из углеродистой стали обыкновенного качества (технические условия)', cat: 'listovoy', pdf: '/gost/pdf/14637-89.pdf', hub: '/list-nerzhaveyushchiy/' },
	{ num: '14918-80', title: 'Сталь тонколистовая оцинкованная с непрерывных линий (технические условия)', cat: 'listovoy', pdf: '/gost/pdf/14918-80.pdf', hub: '/list-nerzhaveyushchiy/' },
	{ num: '1577-93', title: 'Прокат толстолистовой и широкополосный из конструкционной качественной стали (технические условия)', cat: 'listovoy', pdf: '/gost/pdf/1577-93.pdf', hub: '/list-nerzhaveyushchiy/' },
	{ num: '16523-97', title: 'Прокат тонколистовой из углеродистой стали качественной и обыкновенного качества общего назначения (технические условия)', cat: 'listovoy', pdf: '/gost/pdf/16523-97.pdf', hub: '/list-nerzhaveyushchiy/' },
	{ num: '19281-89', title: 'Прокат из стали повышенной прочности (общие технические условия)', cat: 'listovoy', pdf: '/gost/pdf/19281-89.pdf', hub: '/list-nerzhaveyushchiy/' },
	{ num: '19903-74', title: 'Прокат листовой горячекатаный (сортамент)', cat: 'listovoy', pdf: '/gost/pdf/19903-74.pdf', hub: '/list-nerzhaveyushchiy/', priority: 'core' },
	{ num: '19904-90', title: 'Прокат листовой холоднокатаный (сортамент)', cat: 'listovoy', pdf: '/gost/pdf/19904-90.pdf', hub: '/list-nerzhaveyushchiy/', priority: 'core' },
	{ num: '24045-94', title: 'Профили стальные листовые гнутые с трапециевидными гофрами для строительства (технические условия)', cat: 'listovoy', pdf: '/gost/pdf/24045-94.pdf' },
	{ num: '30246-94', title: 'Прокат тонколистовой рулонный с защитно-декоративным покрытием для строительных конструкций (технические условия)', cat: 'listovoy', pdf: '/gost/pdf/30246-94.pdf', hub: '/rulon-nerzhaveyushchiy/' },
	{ num: '4041-71', title: 'Прокат листовой для холодной штамповки из конструкционной качественной стали (технические условия)', cat: 'listovoy', pdf: '/gost/pdf/4041-71.pdf', hub: '/list-nerzhaveyushchiy/' },
	/* Профильный стандарт для разделов ленты и фольги: толщина 0,05–2,0 мм,
	   ширина 6–410 мм — ровно наш сортамент штрипса. Классифицирует ленту по
	   состоянию материала (М / ПН / Н / ВН), виду поверхности (группы 1–3) и
	   качеству поверхности (классы А–Е). Отсюда же правильные названия
	   поверхностей: «блестящая» и «серебристо-матовая», а «зеркальная» — это
	   уже полированная, отдельная операция. */
	{ num: '4986-79', title: 'Лента холоднокатаная из коррозионно-стойкой и жаростойкой стали (технические условия)', cat: 'listovoy', pdf: '/gost/pdf/4986-79.pdf', hub: '/lenta-nerzhaveyushchaya/', priority: 'core' },
	{ num: '5582-75', title: 'Прокат тонколистовой коррозионно-стойкий, жаростойкий и жаропрочный (технические условия)', cat: 'listovoy', pdf: '/gost/pdf/5582-75.pdf', hub: '/list-nerzhaveyushchiy/', priority: 'core' },
	{ num: '7350-77', title: 'Сталь толстолистовая коррозионно-стойкая, жаростойкая и жаропрочная (технические условия)', cat: 'listovoy', pdf: '/gost/pdf/7350-77.pdf', hub: '/list-nerzhaveyushchiy/', priority: 'core' },
	{ num: '8568-77', title: 'Листы стальные с ромбическим и чечевичным рифлением (технические условия)', cat: 'listovoy', pdf: '/gost/pdf/8568-77.pdf', hub: '/kalkulyator-riflenogo-lista/' },
	{ num: '9045-93', title: 'Прокат тонколистовой холоднокатаный из низкоуглеродистой качественной стали для холодной штамповки (технические условия)', cat: 'listovoy', pdf: '/gost/pdf/9045-93.pdf', hub: '/list-nerzhaveyushchiy/' },

	// 3. СОРТОВОЙ ПРОКАТ — 20 документов
	{ num: '103-76', title: 'Полоса стальная горячекатаная (сортамент)', cat: 'sortovoy', pdf: '/gost/pdf/103-76.pdf', hub: '/polosa-nerzhaveyushchaya/' },
	{ num: '10884-94', title: 'Сталь арматурная термомеханически упрочненная для железобетонных конструкций (технические условия)', cat: 'sortovoy', pdf: '/gost/pdf/10884-94.pdf', hub: '/kalkulyator-armatury/' },
	{ num: '1133-71', title: 'Сталь кованная круглая и квадратная (сортамент)', cat: 'sortovoy', pdf: '/gost/pdf/1133-71.pdf', hub: '/krug-nerzhaveyushchiy/' },
	{ num: '11474-76', title: 'Профили стальные гнутые (технические условия)', cat: 'sortovoy', pdf: '/gost/pdf/11474-76.pdf' },
	{ num: '19425-74', title: 'Балки двутавровые и швеллеры стальные специальные (сортамент)', cat: 'sortovoy', pdf: '/gost/pdf/19425-74.pdf', hub: '/kalkulyator-balki/' },
	{ num: '2590-88', title: 'Прокат стальной горячекатаный круглый (сортамент)', cat: 'sortovoy', pdf: '/gost/pdf/2590-88.pdf', hub: '/krug-nerzhaveyushchiy/' },
	{ num: '2591-88', title: 'Прокат стальной горячекатаный квадратный (сортамент)', cat: 'sortovoy', pdf: '/gost/pdf/2591-88.pdf', hub: '/krug-nerzhaveyushchiy/' },
	{ num: '18143-72', title: 'Проволока из высоколегированной коррозионно-стойкой и жаростойкой стали (технические условия)', cat: 'sortovoy', hub: '/provoloka-nerzhaveyushchaya/', priority: 'core' },
	{ num: '30136-95', title: 'Катанка из углеродистой стали обыкновенного качества (технические условия)', cat: 'sortovoy', pdf: '/gost/pdf/30136-95.pdf', hub: '/provoloka-nerzhaveyushchaya/' },
	{ num: '380-94', title: 'Сталь углеродистая обыкновенного качества (марки)', cat: 'sortovoy', pdf: '/gost/pdf/380-94.pdf' },
	{ num: '5267.1-90', title: 'Швеллеры (сортамент)', cat: 'sortovoy', pdf: '/gost/pdf/5267-1-90.pdf', hub: '/kalkulyator-shvellera/' },
	{ num: '535-2005', title: 'Прокат сортовой и фасонный из стали углеродистой обыкновенного качества (общие технические условия)', cat: 'sortovoy', pdf: '/gost/pdf/535-2005.pdf', hub: '/krug-nerzhaveyushchiy/' },
	{ num: '5781-82', title: 'Сталь горячекатаная для армирования железобетонных конструкций (технические условия)', cat: 'sortovoy', pdf: '/gost/pdf/5781-82.pdf', hub: '/kalkulyator-armatury/', priority: 'core' },
	{ num: '7511-73', title: 'Профили стальные для оконных и фонарных переплетов и оконных панелей промышленных зданий', cat: 'sortovoy', pdf: '/gost/pdf/7511-73.pdf' },
	{ num: '8239-89', title: 'Двутавры стальные горячекатаные (сортамент)', cat: 'sortovoy', pdf: '/gost/pdf/8239-89.pdf', hub: '/kalkulyator-balki/', priority: 'core' },
	{ num: '8240-97', title: 'Швеллеры стальные горячекатаные (сортамент)', cat: 'sortovoy', pdf: '/gost/pdf/8240-97.pdf', hub: '/kalkulyator-shvellera/', priority: 'core' },
	{ num: '8278-83', title: 'Швеллеры стальные гнутые равнополочные (сортамент)', cat: 'sortovoy', pdf: '/gost/pdf/8278-83.pdf', hub: '/kalkulyator-shvellera/' },
	{ num: '8281-80', title: 'Швеллеры стальные гнутые неравнополочные (сортамент)', cat: 'sortovoy', pdf: '/gost/pdf/8281-80.pdf', hub: '/kalkulyator-shvellera/' },
	{ num: '8509-93', title: 'Уголки стальные горячекатаные равнополочные (сортамент)', cat: 'sortovoy', pdf: '/gost/pdf/8509-93.pdf', hub: '/ugolok-shveller-nerzhaveyushchiy/', priority: 'core' },
	{ num: '8510-86', title: 'Уголки стальные горячекатаные неравнополочные (сортамент)', cat: 'sortovoy', pdf: '/gost/pdf/8510-86.pdf', hub: '/ugolok-shveller-nerzhaveyushchiy/', priority: 'core' },
	{ num: 'Р 52544-2006', title: 'Прокат арматурный свариваемый', cat: 'sortovoy', pdf: '/gost/pdf/r-52544-2006.pdf', hub: '/kalkulyator-armatury/' },

	// 4. ТРУБОПРОВОДНАЯ АРМАТУРА — 17 документов
	{ num: '1215-79', title: 'Отливки из ковкого чугуна (общие технические условия)', cat: 'armatura', pdf: '/gost/pdf/1215-79.pdf' },
	{ num: '12815-80', title: 'Фланцы арматуры, соединительных частей и трубопроводов на Ру от 0,1 до 20 МПа', cat: 'armatura', pdf: '/gost/pdf/12815-80.pdf', hub: '/kalkulyator-flantsa/' },
	{ num: '12816-80', title: 'Фланцы арматуры, соединительных частей и трубопроводов на Ру от 0,1 до 20 МПа (общие технические условия)', cat: 'armatura', pdf: '/gost/pdf/12816-80.pdf', hub: '/kalkulyator-flantsa/' },
	{ num: '12820-80', title: 'Фланцы стальные плоские приварные на Ру от 0,1 до 2,5 МПа (конструкция и размеры)', cat: 'armatura', pdf: '/gost/pdf/12820-80.pdf', hub: '/kalkulyator-flantsa/', priority: 'core' },
	{ num: '12821-80', title: 'Фланцы стальные приварные встык на Ру от 0,1 до 20,0 МПа (конструкция и размеры)', cat: 'armatura', pdf: '/gost/pdf/12821-80.pdf', hub: '/kalkulyator-flantsa/', priority: 'core' },
	{ num: '17375-2001', title: 'Отводы крутоизогнутые типа 3D (R = 1.5DN) (конструкция)', cat: 'armatura', pdf: '/gost/pdf/17375-2001.pdf', hub: '/kalkulyator-otvoda/', priority: 'core' },
	/* Комплект к 17375: тройники, переходы и заглушки той же серии — по ним
	   разбираются обозначения карточек в /detali-truboprovoda/. PDF пока не
	   приложены (в открытых зеркалах нашлись только карточки документов). */
	{ num: '17376-2001', title: 'Детали трубопроводов бесшовные приварные из углеродистой и низколегированной стали. Тройники (конструкция)', cat: 'armatura', hub: '/detali-truboprovoda/' },
	{ num: '17378-2001', title: 'Детали трубопроводов бесшовные приварные из углеродистой и низколегированной стали. Переходы (конструкция)', cat: 'armatura', hub: '/detali-truboprovoda/' },
	{ num: '17379-2001', title: 'Детали трубопроводов бесшовные приварные из углеродистой и низколегированной стали. Заглушки эллиптические (конструкция)', cat: 'armatura', hub: '/detali-truboprovoda/' },
	/* Базовый стандарт на фланцы: на нём построены обозначения Ду × Ру × тип во
	   всех 161 карточке фланцев, самый цитируемый документ на сайте. */
	{ num: '33259-2015', title: 'Фланцы арматуры, соединительных частей и трубопроводов на номинальное давление до PN 250 (конструкция, размеры и общие технические требования)', cat: 'armatura', pdf: '/gost/pdf/33259-2015.pdf', hub: '/detali-truboprovoda/', priority: 'core' },
	{ num: '4666-2015', title: 'Арматура трубопроводная (требования к маркировке)', cat: 'armatura', pdf: '/gost/pdf/4666-2015.pdf', hub: '/zapornaya-armatura/' },
	{ num: '9544-2015', title: 'Арматура трубопроводная. Нормы герметичности затворов', cat: 'armatura', pdf: '/gost/pdf/9544-2015.pdf', hub: '/zapornaya-armatura/' },
	{ num: '17380-83', title: 'Детали трубопроводов стальные бесшовные приварные на Ру 10 МПа (технические условия)', cat: 'armatura', pdf: '/gost/pdf/17380-83.pdf', hub: '/detali-truboprovoda/' },
	{ num: '8944-75', title: 'Соединительные части из ковкого чугуна с цилиндрической резьбой для трубопроводов (технические требования)', cat: 'armatura', pdf: '/gost/pdf/8944-75.pdf' },
	{ num: '8946-75', title: 'Соединительные части — Угольники проходные (основные размеры)', cat: 'armatura', pdf: '/gost/pdf/8946-75.pdf' },
	{ num: '8947-75', title: 'Соединительные части — Угольники переходные (основные размеры)', cat: 'armatura', pdf: '/gost/pdf/8947-75.pdf' },
	{ num: '8948-75', title: 'Соединительные части — Тройники прямые (основные размеры)', cat: 'armatura', pdf: '/gost/pdf/8948-75.pdf', hub: '/detali-truboprovoda/' },
	{ num: '8949-75', title: 'Соединительные части — Тройники переходные (основные размеры)', cat: 'armatura', pdf: '/gost/pdf/8949-75.pdf', hub: '/detali-truboprovoda/' },
	{ num: '8952-75', title: 'Соединительные части — Кресты переходные (основные размеры)', cat: 'armatura', pdf: '/gost/pdf/8952-75.pdf' },
	{ num: '8956-75', title: 'Соединительные части — Муфты компенсирующие (основные размеры)', cat: 'armatura', pdf: '/gost/pdf/8956-75.pdf' },
	{ num: '8960-75', title: 'Соединительные части — Футорки (основные размеры)', cat: 'armatura', pdf: '/gost/pdf/8960-75.pdf' },
	{ num: '8965-75', title: 'Части соединительные стальные с цилиндрической резьбой для трубопроводов Р=1,6 МПа', cat: 'armatura', pdf: '/gost/pdf/8965-75.pdf' },
	{ num: '8969-75', title: 'Части соединительные стальные — Сгоны (основные размеры)', cat: 'armatura', pdf: '/gost/pdf/8969-75.pdf' },

	// 5. ТРУБНЫЙ ПРОКАТ — 17 документов
	{ num: '10704-91', title: 'Трубы стальные электросварные прямошовные (сортамент)', cat: 'trubnyy', pdf: '/gost/pdf/10704-91.pdf', hub: '/truba-nerzhaveyushchaya/' },
	{ num: '10705-80', title: 'Трубы стальные электросварные (технические условия)', cat: 'trubnyy', pdf: '/gost/pdf/10705-80.pdf', hub: '/truba-nerzhaveyushchaya/' },
	{ num: '10706-76', title: 'Трубы стальные электросварные прямошовные (технические требования)', cat: 'trubnyy', pdf: '/gost/pdf/10706-76.pdf', hub: '/truba-nerzhaveyushchaya/' },
	{ num: '11068-81', title: 'Трубы электросварные из коррозионно-стойкой стали (технические условия)', cat: 'trubnyy', pdf: '/gost/pdf/11068-81.pdf', hub: '/truba-nerzhaveyushchaya/', priority: 'core' },
	{ num: '13663-86', title: 'Трубы стальные профильные (технические требования)', cat: 'trubnyy', pdf: '/gost/pdf/13663-86.pdf', hub: '/truba-nerzhaveyushchaya/' },
	{ num: '30245-03', title: 'Профили стальные гнутые замкнутые сварные квадратные и прямоугольные для строительных конструкций (технические условия)', cat: 'trubnyy', pdf: '/gost/pdf/30245-03.pdf', hub: '/truba-nerzhaveyushchaya/' },
	{ num: '3262-75', title: 'Трубы стальные водогазопроводные (технические условия)', cat: 'trubnyy', pdf: '/gost/pdf/3262-75.pdf' },
	{ num: '550-75', title: 'Трубы стальные бесшовные для нефтеперерабатывающей и нефтехимической промышленности (технические условия)', cat: 'trubnyy', pdf: '/gost/pdf/550-75.pdf' },
	{ num: '8639-82', title: 'Трубы стальные квадратные (сортамент)', cat: 'trubnyy', pdf: '/gost/pdf/8639-82.pdf', hub: '/truba-nerzhaveyushchaya/' },
	{ num: '8642-68', title: 'Трубы стальные овальные (сортамент)', cat: 'trubnyy', pdf: '/gost/pdf/8642-68.pdf', hub: '/kalkulyator-ovalnoy-truby/' },
	{ num: '8645-68', title: 'Трубы стальные прямоугольные (сортамент)', cat: 'trubnyy', pdf: '/gost/pdf/8645-68.pdf', hub: '/truba-nerzhaveyushchaya/' },
	{ num: '8731-87', title: 'Трубы стальные бесшовные горячедеформированные (технические условия)', cat: 'trubnyy', pdf: '/gost/pdf/8731-87.pdf', hub: '/truba-nerzhaveyushchaya/' },
	{ num: '8732-78', title: 'Трубы стальные бесшовные горячедеформированные (сортамент)', cat: 'trubnyy', pdf: '/gost/pdf/8732-78.pdf', hub: '/truba-nerzhaveyushchaya/' },
	{ num: '8733-74', title: 'Трубы стальные бесшовные холоднодеформированные и теплодеформированные (технические требования)', cat: 'trubnyy', pdf: '/gost/pdf/8733-74.pdf', hub: '/truba-nerzhaveyushchaya/' },
	{ num: '8734-75', title: 'Трубы стальные бесшовные холоднодеформированные (сортамент)', cat: 'trubnyy', pdf: '/gost/pdf/8734-75.pdf', hub: '/truba-nerzhaveyushchaya/' },
	{ num: '9940-81', title: 'Трубы бесшовные горячедеформированные из коррозионно-стойкой стали (технические условия)', cat: 'trubnyy', pdf: '/gost/pdf/9940-81.pdf', hub: '/truba-nerzhaveyushchaya/', priority: 'core' },
	{ num: '9941-81', title: 'Трубы бесшовные холодно- и теплодеформированные из коррозионностойкой стали (технические условия)', cat: 'trubnyy', pdf: '/gost/pdf/9941-81.pdf', hub: '/truba-nerzhaveyushchaya/', priority: 'core' },

	// 6. ЦВЕТНЫЕ МЕТАЛЛЫ — 33 документа
	{ num: '1066-90', title: 'Проволока латунная (технические условия)', cat: 'tsvetnye', pdf: '/gost/pdf/1066-90.pdf' },
	{ num: '11069-01', title: 'Алюминий первичный (марки)', cat: 'tsvetnye', pdf: '/gost/pdf/11069-01.pdf' },
	{ num: '1173-93', title: 'Ленты медные (технические условия)', cat: 'tsvetnye', pdf: '/gost/pdf/1173-93.pdf' },
	{ num: '1180-91', title: 'Аноды цинковые (технические условия)', cat: 'tsvetnye', pdf: '/gost/pdf/1180-91.pdf' },
	{ num: '1208-90', title: 'Трубы бронзовые прессованные (технические условия)', cat: 'tsvetnye', pdf: '/gost/pdf/1208-90.pdf' },
	{ num: '1209-90', title: 'Баббиты кальциевые в чушках (технические условия)', cat: 'tsvetnye', pdf: '/gost/pdf/1209-90.pdf' },
	{ num: '1320-74', title: 'Баббиты оловянные и свинцовые (технические условия)', cat: 'tsvetnye', pdf: '/gost/pdf/1320-74.pdf' },
	{ num: '1535-91', title: 'Прутки медные (технические условия)', cat: 'tsvetnye', pdf: '/gost/pdf/1535-91.pdf' },
	{ num: '15527-04', title: 'Сплавы медно-цинковые (латуни), обрабатываемые давлением (марки)', cat: 'tsvetnye', pdf: '/gost/pdf/15527-04.pdf' },
	{ num: '1628-78', title: 'Прутки бронзовые (технические условия)', cat: 'tsvetnye', pdf: '/gost/pdf/1628-78.pdf' },
	{ num: '17232-99', title: 'Плиты из алюминия и алюминиевых сплавов (технические условия)', cat: 'tsvetnye', pdf: '/gost/pdf/17232-99.pdf' },
	{ num: '18175-78', title: 'Бронзы безоловянные, обрабатываемые давлением (марки)', cat: 'tsvetnye', pdf: '/gost/pdf/18175-78.pdf' },
	{ num: '18482-79', title: 'Трубы прессованные из алюминия и алюминиевых сплавов (технические условия)', cat: 'tsvetnye', pdf: '/gost/pdf/18482-79.pdf' },
	{ num: '2060-90', title: 'Прутки латунные (технические условия)', cat: 'tsvetnye', pdf: '/gost/pdf/2060-90.pdf' },
	{ num: '21488-97', title: 'Прутки прессованные из алюминия и алюминиевых сплавов (технические условия)', cat: 'tsvetnye', pdf: '/gost/pdf/21488-97.pdf' },
	{ num: '21631-76', title: 'Листы из алюминия и алюминиевых сплавов (технические условия)', cat: 'tsvetnye', pdf: '/gost/pdf/21631-76.pdf' },
	{ num: '21646-03', title: 'Трубы медные и латунные для теплообменных аппаратов (технические условия)', cat: 'tsvetnye', pdf: '/gost/pdf/21646-03.pdf' },
	{ num: '21930-76', title: 'Припои оловянно-свинцовые в чушках (технические условия)', cat: 'tsvetnye', pdf: '/gost/pdf/21930-76.pdf' },
	{ num: '21931-76', title: 'Припои оловянно-свинцовые в изделиях (технические условия)', cat: 'tsvetnye', pdf: '/gost/pdf/21931-76.pdf' },
	{ num: '2208-91', title: 'Ленты латунные общего назначения (технические условия)', cat: 'tsvetnye', pdf: '/gost/pdf/2208-91.pdf' },
	{ num: '22861-93', title: 'Свинец высокой чистоты (технические условия)', cat: 'tsvetnye', pdf: '/gost/pdf/22861-93.pdf' },
	{ num: '3640-94', title: 'Цинк (технические условия)', cat: 'tsvetnye', pdf: '/gost/pdf/3640-94.pdf' },
	{ num: '3778-98', title: 'Свинец (технические условия)', cat: 'tsvetnye', pdf: '/gost/pdf/3778-98.pdf' },
	{ num: '434-78', title: 'Проволока прямоугольного сечения и шины медные для электрических целей (технические условия)', cat: 'tsvetnye', pdf: '/gost/pdf/434-78.pdf' },
	{ num: '4784-97', title: 'Алюминий и сплавы алюминиевые деформируемые (марки)', cat: 'tsvetnye', pdf: '/gost/pdf/4784-97.pdf' },
	{ num: '494-90', title: 'Трубы латунные (технические условия)', cat: 'tsvetnye', pdf: '/gost/pdf/494-90.pdf' },
	{ num: '495-92', title: 'Листы и полосы медные (технические условия)', cat: 'tsvetnye', pdf: '/gost/pdf/495-92.pdf' },
	{ num: '598-90', title: 'Листы цинковые общего назначения (технические условия)', cat: 'tsvetnye', pdf: '/gost/pdf/598-90.pdf' },
	{ num: '617-90', title: 'Трубы медные (технические условия)', cat: 'tsvetnye', pdf: '/gost/pdf/617-90.pdf' },
	{ num: '859-01', title: 'Медь (марки)', cat: 'tsvetnye', pdf: '/gost/pdf/859-01.pdf' },
	{ num: '860-75', title: 'Олово (технические условия)', cat: 'tsvetnye', pdf: '/gost/pdf/860-75.pdf' },
	{ num: '931-90', title: 'Листы и полосы латунные (технические условия)', cat: 'tsvetnye', pdf: '/gost/pdf/931-90.pdf' },
	{ num: '9559-89', title: 'Листы свинцовые (технические условия)', cat: 'tsvetnye', pdf: '/gost/pdf/9559-89.pdf' },
];
