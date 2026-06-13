/**
 * Полный справочник ГОСТов на металлопрокат — 112 документов в 6 категориях.
 *
 * Источник перечня: metal-calculator.ru → meganorm.ru.
 * Мы НЕ хостим PDF локально (юридически чище и легче по весу сборки):
 * ссылки ведут на meganorm.ru — тот же подход, что у первоисточника.
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
	pdf: string;
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
	{ num: '1050-88', title: 'Прокат сортовой, калиброванный со специальной отделкой поверхности из углеродистой качественной конструкционной стали (технические условия)', cat: 'kachestvennyy', pdf: 'https://meganorm.ru/Data2/1/4294852/4294852803.pdf', hub: '/krug/' },
	{ num: '1435-99', title: 'Прутки, полосы и мотки из инструментальной нелегированной стали (общие технические условия)', cat: 'kachestvennyy', pdf: 'https://meganorm.ru/Data2/1/4294849/4294849970.pdf', hub: '/krug/' },
	{ num: '14959-79', title: 'Прокат из рессорно-пружинной углеродистой и легированной стали (технические условия)', cat: 'kachestvennyy', pdf: 'https://meganorm.ru/Data2/1/4294847/4294847504.pdf', hub: '/krug/' },
	{ num: '19265-73', title: 'Прутки и полосы из быстрорежущей стали (технические условия)', cat: 'kachestvennyy', pdf: 'https://meganorm.ru/Data/83/8322.pdf', hub: '/krug/' },
	{ num: '20072-74', title: 'Сталь теплоустойчивая (технические условия)', cat: 'kachestvennyy', pdf: 'https://meganorm.ru/Data2/1/4294852/4294852653.pdf', hub: '/krug/' },
	{ num: '3836-83', title: 'Сталь электротехническая нелегированная тонколистовая и ленты (технические условия)', cat: 'kachestvennyy', pdf: 'https://meganorm.ru/Data2/1/4294824/4294824378.pdf', hub: '/list/' },
	{ num: '4405-75', title: 'Сталь полосовая горячекатаная и кованная инструментальная (сортамент)', cat: 'kachestvennyy', pdf: 'https://meganorm.ru/Data2/1/4294850/4294850526.pdf', hub: '/polosa/' },
	{ num: '4543-71', title: 'Прокат из легированной конструкционной стали (технические условия)', cat: 'kachestvennyy', pdf: 'https://meganorm.ru/Data2/1/4294848/4294848226.pdf', hub: '/krug/' },
	{ num: '5632-72', title: 'Стали высоколегированные и сплавы коррозионно-стойкие, жаростойкие и жаропрочные (марки)', cat: 'kachestvennyy', pdf: 'https://meganorm.ru/Data2/1/4294852/4294852763.pdf', hub: '/list/', priority: 'core' },
	{ num: '5950-2000', title: 'Прутки, полосы и мотки из инструментальной легированной стали (общие технические условия)', cat: 'kachestvennyy', pdf: 'https://meganorm.ru/Data2/1/4294847/4294847318.pdf', hub: '/krug/' },
	{ num: '801-78', title: 'Сталь подшипниковая (технические условия)', cat: 'kachestvennyy', pdf: 'https://meganorm.ru/Data2/1/4294821/4294821803.pdf', hub: '/krug/' },

	// 2. ЛИСТОВОЙ ПРОКАТ — 14 документов
	{ num: '14637-89', title: 'Прокат толстолистовой из углеродистой стали обыкновенного качества (технические условия)', cat: 'listovoy', pdf: 'https://meganorm.ru/Data2/1/4294852/4294852671.pdf', hub: '/list/' },
	{ num: '14918-80', title: 'Сталь тонколистовая оцинкованная с непрерывных линий (технические условия)', cat: 'listovoy', pdf: 'https://meganorm.ru/Data2/1/4294852/4294852669.pdf', hub: '/list/' },
	{ num: '1577-93', title: 'Прокат толстолистовой и широкополосный из конструкционной качественной стали (технические условия)', cat: 'listovoy', pdf: 'https://meganorm.ru/Data2/1/4294852/4294852799.pdf', hub: '/list/' },
	{ num: '16523-97', title: 'Прокат тонколистовой из углеродистой стали качественной и обыкновенного качества общего назначения (технические условия)', cat: 'listovoy', pdf: 'https://meganorm.ru/Data2/1/4294852/4294852664.pdf', hub: '/list/' },
	{ num: '19281-89', title: 'Прокат из стали повышенной прочности (общие технические условия)', cat: 'listovoy', pdf: 'https://meganorm.ru/Data2/1/4294852/4294852660.pdf', hub: '/list/' },
	{ num: '19903-74', title: 'Прокат листовой горячекатаный (сортамент)', cat: 'listovoy', pdf: 'https://meganorm.ru/Data2/1/4294852/4294852655.pdf', hub: '/list/', priority: 'core' },
	{ num: '19904-90', title: 'Прокат листовой холоднокатаный (сортамент)', cat: 'listovoy', pdf: 'https://meganorm.ru/Data2/1/4294852/4294852654.pdf', hub: '/list/', priority: 'core' },
	{ num: '24045-94', title: 'Профили стальные листовые гнутые с трапециевидными гофрами для строительства (технические условия)', cat: 'listovoy', pdf: 'https://meganorm.ru/Data2/1/4294853/4294853276.pdf' },
	{ num: '30246-94', title: 'Прокат тонколистовой рулонный с защитно-декоративным покрытием для строительных конструкций (технические условия)', cat: 'listovoy', pdf: 'https://meganorm.ru/Data2/1/4294853/4294853261.pdf', hub: '/rulon/' },
	{ num: '4041-71', title: 'Прокат листовой для холодной штамповки из конструкционной качественной стали (технические условия)', cat: 'listovoy', pdf: 'https://meganorm.ru/Data2/1/4294824/4294824005.pdf', hub: '/list/' },
	{ num: '5582-75', title: 'Прокат тонколистовой коррозионно-стойкий, жаростойкий и жаропрочный (технические условия)', cat: 'listovoy', pdf: 'https://meganorm.ru/Data2/1/4294846/4294846405.pdf', hub: '/list/', priority: 'core' },
	{ num: '7350-77', title: 'Сталь толстолистовая коррозионно-стойкая, жаростойкая и жаропрочная (технические условия)', cat: 'listovoy', pdf: 'https://meganorm.ru/Data2/1/4294846/4294846403.pdf', hub: '/list/', priority: 'core' },
	{ num: '8568-77', title: 'Листы стальные с ромбическим и чечевичным рифлением (технические условия)', cat: 'listovoy', pdf: 'https://meganorm.ru/Data2/1/4294852/4294852728.pdf', hub: '/kalkulyator-riflenogo-lista/' },
	{ num: '9045-93', title: 'Прокат тонколистовой холоднокатаный из низкоуглеродистой качественной стали для холодной штамповки (технические условия)', cat: 'listovoy', pdf: 'https://meganorm.ru/Data2/1/4294847/4294847557.pdf', hub: '/list/' },

	// 3. СОРТОВОЙ ПРОКАТ — 20 документов
	{ num: '103-76', title: 'Полоса стальная горячекатаная (сортамент)', cat: 'sortovoy', pdf: 'https://meganorm.ru/Data2/1/4294852/4294852812.pdf', hub: '/polosa/' },
	{ num: '10884-94', title: 'Сталь арматурная термомеханически упрочненная для железобетонных конструкций (технические условия)', cat: 'sortovoy', pdf: 'https://meganorm.ru/Data2/1/4294852/4294852685.pdf', hub: '/kalkulyator-armatury/' },
	{ num: '1133-71', title: 'Сталь кованная круглая и квадратная (сортамент)', cat: 'sortovoy', pdf: 'https://meganorm.ru/Data2/1/4294852/4294852802.pdf', hub: '/krug/' },
	{ num: '11474-76', title: 'Профили стальные гнутые (технические условия)', cat: 'sortovoy', pdf: 'https://meganorm.ru/Data2/1/4294852/4294852681.pdf' },
	{ num: '19425-74', title: 'Балки двутавровые и швеллеры стальные специальные (сортамент)', cat: 'sortovoy', pdf: 'https://meganorm.ru/Data2/1/4294852/4294852659.pdf', hub: '/kalkulyator-balki/' },
	{ num: '2590-88', title: 'Прокат стальной горячекатаный круглый (сортамент)', cat: 'sortovoy', pdf: 'https://meganorm.ru/Data/286/28657.pdf', hub: '/krug/' },
	{ num: '2591-88', title: 'Прокат стальной горячекатаный квадратный (сортамент)', cat: 'sortovoy', pdf: 'https://meganorm.ru/Data2/1/4294852/4294852792.pdf', hub: '/krug/' },
	{ num: '30136-95', title: 'Катанка из углеродистой стали обыкновенного качества (технические условия)', cat: 'sortovoy', pdf: 'https://meganorm.ru/Data2/1/4294851/4294851116.pdf', hub: '/provoloka/' },
	{ num: '380-94', title: 'Сталь углеродистая обыкновенного качества (марки)', cat: 'sortovoy', pdf: 'https://meganorm.ru/Data2/1/4294852/4294852809.pdf' },
	{ num: '5267.1-90', title: 'Швеллеры (сортамент)', cat: 'sortovoy', pdf: 'https://meganorm.ru/Data/385/38578.pdf', hub: '/kalkulyator-shvellera/' },
	{ num: '535-2005', title: 'Прокат сортовой и фасонный из стали углеродистой обыкновенного качества (общие технические условия)', cat: 'sortovoy', pdf: 'https://meganorm.ru/Data2/1/4293837/4293837739.pdf', hub: '/krug/' },
	{ num: '5781-82', title: 'Сталь горячекатаная для армирования железобетонных конструкций (технические условия)', cat: 'sortovoy', pdf: 'https://meganorm.ru/Data2/1/4294852/4294852762.pdf', hub: '/kalkulyator-armatury/', priority: 'core' },
	{ num: '7511-73', title: 'Профили стальные для оконных и фонарных переплетов и оконных панелей промышленных зданий', cat: 'sortovoy', pdf: 'https://meganorm.ru/Data2/1/4294852/4294852745.pdf' },
	{ num: '8239-89', title: 'Двутавры стальные горячекатаные (сортамент)', cat: 'sortovoy', pdf: 'https://meganorm.ru/Data2/1/4294852/4294852738.pdf', hub: '/kalkulyator-balki/', priority: 'core' },
	{ num: '8240-97', title: 'Швеллеры стальные горячекатаные (сортамент)', cat: 'sortovoy', pdf: 'https://meganorm.ru/Data2/1/4294847/4294847929.pdf', hub: '/kalkulyator-shvellera/', priority: 'core' },
	{ num: '8278-83', title: 'Швеллеры стальные гнутые равнополочные (сортамент)', cat: 'sortovoy', pdf: 'https://meganorm.ru/Data2/1/4294852/4294852736.pdf', hub: '/kalkulyator-shvellera/' },
	{ num: '8281-80', title: 'Швеллеры стальные гнутые неравнополочные (сортамент)', cat: 'sortovoy', pdf: 'https://meganorm.ru/Data2/1/4294852/4294852735.pdf', hub: '/kalkulyator-shvellera/' },
	{ num: '8509-93', title: 'Уголки стальные горячекатаные равнополочные (сортамент)', cat: 'sortovoy', pdf: 'https://meganorm.ru/Data/92/9227.pdf', hub: '/ugolok-shveller/', priority: 'core' },
	{ num: '8510-86', title: 'Уголки стальные горячекатаные неравнополочные (сортамент)', cat: 'sortovoy', pdf: 'https://meganorm.ru/Data2/1/4294852/4294852729.pdf', hub: '/ugolok-shveller/', priority: 'core' },
	{ num: 'Р 52544-2006', title: 'Прокат арматурный свариваемый', cat: 'sortovoy', pdf: 'https://meganorm.ru/Data2/1/4293849/4293849988.pdf', hub: '/kalkulyator-armatury/' },

	// 4. ТРУБОПРОВОДНАЯ АРМАТУРА — 17 документов
	{ num: '1215-79', title: 'Отливки из ковкого чугуна (общие технические условия)', cat: 'armatura', pdf: 'https://meganorm.ru/Data2/1/4294838/4294838798.pdf' },
	{ num: '12815-80', title: 'Фланцы арматуры, соединительных частей и трубопроводов на Ру от 0,1 до 20 МПа', cat: 'armatura', pdf: 'https://meganorm.ru/Data/232/23277.pdf', hub: '/kalkulyator-flantsa/' },
	{ num: '12816-80', title: 'Фланцы арматуры, соединительных частей и трубопроводов на Ру от 0,1 до 20 МПа (общие технические условия)', cat: 'armatura', pdf: 'https://meganorm.ru/Data2/1/4294848/4294848685.pdf', hub: '/kalkulyator-flantsa/' },
	{ num: '12820-80', title: 'Фланцы стальные плоские приварные на Ру от 0,1 до 2,5 МПа (конструкция и размеры)', cat: 'armatura', pdf: 'https://meganorm.ru/Data/304/30451.pdf', hub: '/kalkulyator-flantsa/', priority: 'core' },
	{ num: '12821-80', title: 'Фланцы стальные приварные встык на Ру от 0,1 до 20,0 МПа (конструкция и размеры)', cat: 'armatura', pdf: 'https://meganorm.ru/Data/142/14272.pdf', hub: '/kalkulyator-flantsa/', priority: 'core' },
	{ num: '17375-2001', title: 'Отводы крутоизогнутые типа 3D (R = 1.5DN) (конструкция)', cat: 'armatura', pdf: 'https://meganorm.ru/Data/546/54607.pdf', hub: '/kalkulyator-otvoda/', priority: 'core' },
	{ num: '17380-83', title: 'Детали трубопроводов стальные бесшовные приварные на Ру 10 МПа (технические условия)', cat: 'armatura', pdf: 'https://meganorm.ru/Data2/1/4294852/4294852648.pdf', hub: '/detali-truboprovoda/' },
	{ num: '8944-75', title: 'Соединительные части из ковкого чугуна с цилиндрической резьбой для трубопроводов (технические требования)', cat: 'armatura', pdf: 'https://meganorm.ru/Data/160/16076.pdf' },
	{ num: '8946-75', title: 'Соединительные части — Угольники проходные (основные размеры)', cat: 'armatura', pdf: 'https://meganorm.ru/Data2/1/4294852/4294852722.pdf' },
	{ num: '8947-75', title: 'Соединительные части — Угольники переходные (основные размеры)', cat: 'armatura', pdf: 'https://meganorm.ru/Data2/1/4294852/4294852721.pdf' },
	{ num: '8948-75', title: 'Соединительные части — Тройники прямые (основные размеры)', cat: 'armatura', pdf: 'https://meganorm.ru/Data2/1/4294852/4294852720.pdf', hub: '/detali-truboprovoda/' },
	{ num: '8949-75', title: 'Соединительные части — Тройники переходные (основные размеры)', cat: 'armatura', pdf: 'https://meganorm.ru/Data/351/35153.pdf', hub: '/detali-truboprovoda/' },
	{ num: '8952-75', title: 'Соединительные части — Кресты переходные (основные размеры)', cat: 'armatura', pdf: 'https://meganorm.ru/Data2/1/4294852/4294852716.pdf' },
	{ num: '8956-75', title: 'Соединительные части — Муфты компенсирующие (основные размеры)', cat: 'armatura', pdf: 'https://meganorm.ru/Data/255/25576.pdf' },
	{ num: '8960-75', title: 'Соединительные части — Футорки (основные размеры)', cat: 'armatura', pdf: 'https://meganorm.ru/Data2/1/4294852/4294852708.pdf' },
	{ num: '8965-75', title: 'Части соединительные стальные с цилиндрической резьбой для трубопроводов Р=1,6 МПа', cat: 'armatura', pdf: 'https://meganorm.ru/Data/409/40925.pdf' },
	{ num: '8969-75', title: 'Части соединительные стальные — Сгоны (основные размеры)', cat: 'armatura', pdf: 'https://meganorm.ru/Data2/1/4294848/4294848660.pdf' },

	// 5. ТРУБНЫЙ ПРОКАТ — 17 документов
	{ num: '10704-91', title: 'Трубы стальные электросварные прямошовные (сортамент)', cat: 'trubnyy', pdf: 'https://meganorm.ru/Data/1/169.pdf', hub: '/truba/' },
	{ num: '10705-80', title: 'Трубы стальные электросварные (технические условия)', cat: 'trubnyy', pdf: 'https://meganorm.ru/Data2/1/4294852/4294852688.pdf', hub: '/truba/' },
	{ num: '10706-76', title: 'Трубы стальные электросварные прямошовные (технические требования)', cat: 'trubnyy', pdf: 'https://meganorm.ru/Data2/1/4294852/4294852687.pdf', hub: '/truba/' },
	{ num: '11068-81', title: 'Трубы электросварные из коррозионно-стойкой стали (технические условия)', cat: 'trubnyy', pdf: 'https://meganorm.ru/Data/78/7813.pdf', hub: '/truba/', priority: 'core' },
	{ num: '13663-86', title: 'Трубы стальные профильные (технические требования)', cat: 'trubnyy', pdf: 'https://meganorm.ru/Data2/1/4294852/4294852675.pdf', hub: '/truba/' },
	{ num: '30245-03', title: 'Профили стальные гнутые замкнутые сварные квадратные и прямоугольные для строительных конструкций (технические условия)', cat: 'trubnyy', pdf: 'https://meganorm.ru/Data2/1/4294814/4294814553.pdf', hub: '/truba/' },
	{ num: '3262-75', title: 'Трубы стальные водогазопроводные (технические условия)', cat: 'trubnyy', pdf: 'https://meganorm.ru/Data2/1/4294852/4294852785.pdf' },
	{ num: '550-75', title: 'Трубы стальные бесшовные для нефтеперерабатывающей и нефтехимической промышленности (технические условия)', cat: 'trubnyy', pdf: 'https://meganorm.ru/Data2/1/4294849/4294849973.pdf' },
	{ num: '8639-82', title: 'Трубы стальные квадратные (сортамент)', cat: 'trubnyy', pdf: 'https://meganorm.ru/Data2/1/4294848/4294848129.pdf', hub: '/truba/' },
	{ num: '8642-68', title: 'Трубы стальные овальные (сортамент)', cat: 'trubnyy', pdf: 'https://meganorm.ru/Data2/1/4294821/4294821490.pdf', hub: '/kalkulyator-ovalnoy-truby/' },
	{ num: '8645-68', title: 'Трубы стальные прямоугольные (сортамент)', cat: 'trubnyy', pdf: 'https://meganorm.ru/Data/431/43139.pdf', hub: '/truba/' },
	{ num: '8731-87', title: 'Трубы стальные бесшовные горячедеформированные (технические условия)', cat: 'trubnyy', pdf: 'https://meganorm.ru/Data2/1/4294848/4294848269.pdf', hub: '/truba/' },
	{ num: '8732-78', title: 'Трубы стальные бесшовные горячедеформированные (сортамент)', cat: 'trubnyy', pdf: 'https://meganorm.ru/Data2/1/4294848/4294848699.pdf', hub: '/truba/' },
	{ num: '8733-74', title: 'Трубы стальные бесшовные холоднодеформированные и теплодеформированные (технические требования)', cat: 'trubnyy', pdf: 'https://meganorm.ru/Data2/1/4294848/4294848735.pdf', hub: '/truba/' },
	{ num: '8734-75', title: 'Трубы стальные бесшовные холоднодеформированные (сортамент)', cat: 'trubnyy', pdf: 'https://meganorm.ru/Data2/1/4294848/4294848270.pdf', hub: '/truba/' },
	{ num: '9940-81', title: 'Трубы бесшовные горячедеформированные из коррозионно-стойкой стали (технические условия)', cat: 'trubnyy', pdf: 'https://meganorm.ru/Data2/1/4294848/4294848734.pdf', hub: '/truba/', priority: 'core' },
	{ num: '9941-81', title: 'Трубы бесшовные холодно- и теплодеформированные из коррозионностойкой стали (технические условия)', cat: 'trubnyy', pdf: 'https://meganorm.ru/Data2/1/4294850/4294850480.pdf', hub: '/truba/', priority: 'core' },

	// 6. ЦВЕТНЫЕ МЕТАЛЛЫ — 33 документа
	{ num: '1066-90', title: 'Проволока латунная (технические условия)', cat: 'tsvetnye', pdf: 'https://meganorm.ru/Data2/1/4294840/4294840135.pdf' },
	{ num: '11069-01', title: 'Алюминий первичный (марки)', cat: 'tsvetnye', pdf: 'https://meganorm.ru/Data2/1/4294846/4294846342.pdf' },
	{ num: '1173-93', title: 'Ленты медные (технические условия)', cat: 'tsvetnye', pdf: 'https://meganorm.ru/Data/72/7288.pdf' },
	{ num: '1180-91', title: 'Аноды цинковые (технические условия)', cat: 'tsvetnye', pdf: 'https://meganorm.ru/Data/105/10566.pdf' },
	{ num: '1208-90', title: 'Трубы бронзовые прессованные (технические условия)', cat: 'tsvetnye', pdf: 'https://meganorm.ru/Data2/1/4294838/4294838837.pdf' },
	{ num: '1209-90', title: 'Баббиты кальциевые в чушках (технические условия)', cat: 'tsvetnye', pdf: 'https://meganorm.ru/Data2/1/4294838/4294838829.pdf' },
	{ num: '1320-74', title: 'Баббиты оловянные и свинцовые (технические условия)', cat: 'tsvetnye', pdf: 'https://meganorm.ru/Data/82/8294.pdf' },
	{ num: '1535-91', title: 'Прутки медные (технические условия)', cat: 'tsvetnye', pdf: 'https://meganorm.ru/Data/73/7344.pdf' },
	{ num: '15527-04', title: 'Сплавы медно-цинковые (латуни), обрабатываемые давлением (марки)', cat: 'tsvetnye', pdf: 'https://meganorm.ru/Data/58/5803.pdf' },
	{ num: '1628-78', title: 'Прутки бронзовые (технические условия)', cat: 'tsvetnye', pdf: 'https://meganorm.ru/Data2/1/4294838/4294838804.pdf' },
	{ num: '17232-99', title: 'Плиты из алюминия и алюминиевых сплавов (технические условия)', cat: 'tsvetnye', pdf: 'https://meganorm.ru/Data2/1/4294847/4294847107.pdf' },
	{ num: '18175-78', title: 'Бронзы безоловянные, обрабатываемые давлением (марки)', cat: 'tsvetnye', pdf: 'https://meganorm.ru/Data2/1/4294834/4294834920.pdf' },
	{ num: '18482-79', title: 'Трубы прессованные из алюминия и алюминиевых сплавов (технические условия)', cat: 'tsvetnye', pdf: 'https://meganorm.ru/Data/22/2256.pdf' },
	{ num: '2060-90', title: 'Прутки латунные (технические условия)', cat: 'tsvetnye', pdf: 'https://meganorm.ru/Data/106/10606.pdf' },
	{ num: '21488-97', title: 'Прутки прессованные из алюминия и алюминиевых сплавов (технические условия)', cat: 'tsvetnye', pdf: 'https://meganorm.ru/Data2/1/4294832/4294832160.pdf' },
	{ num: '21631-76', title: 'Листы из алюминия и алюминиевых сплавов (технические условия)', cat: 'tsvetnye', pdf: 'https://meganorm.ru/Data2/1/4294849/4294849345.pdf' },
	{ num: '21646-03', title: 'Трубы медные и латунные для теплообменных аппаратов (технические условия)', cat: 'tsvetnye', pdf: 'https://meganorm.ru/Data2/1/4294813/4294813215.pdf' },
	{ num: '21930-76', title: 'Припои оловянно-свинцовые в чушках (технические условия)', cat: 'tsvetnye', pdf: 'https://meganorm.ru/Data2/1/4294831/4294831823.pdf' },
	{ num: '21931-76', title: 'Припои оловянно-свинцовые в изделиях (технические условия)', cat: 'tsvetnye', pdf: 'https://meganorm.ru/Data2/1/4294831/4294831822.pdf' },
	{ num: '2208-91', title: 'Ленты латунные общего назначения (технические условия)', cat: 'tsvetnye', pdf: 'https://meganorm.ru/Data2/1/4294831/4294831674.pdf' },
	{ num: '22861-93', title: 'Свинец высокой чистоты (технические условия)', cat: 'tsvetnye', pdf: 'https://meganorm.ru/Data2/1/4294831/4294831083.pdf' },
	{ num: '3640-94', title: 'Цинк (технические условия)', cat: 'tsvetnye', pdf: 'https://meganorm.ru/Data2/1/4294824/4294824439.pdf' },
	{ num: '3778-98', title: 'Свинец (технические условия)', cat: 'tsvetnye', pdf: 'https://meganorm.ru/Data2/1/4294847/4294847502.pdf' },
	{ num: '434-78', title: 'Проволока прямоугольного сечения и шины медные для электрических целей (технические условия)', cat: 'tsvetnye', pdf: 'https://meganorm.ru/Data2/1/4294823/4294823884.pdf' },
	{ num: '4784-97', title: 'Алюминий и сплавы алюминиевые деформируемые (марки)', cat: 'tsvetnye', pdf: 'https://meganorm.ru/Data2/1/4294850/4294850525.pdf' },
	{ num: '494-90', title: 'Трубы латунные (технические условия)', cat: 'tsvetnye', pdf: 'https://meganorm.ru/Data2/1/4294846/4294846876.pdf' },
	{ num: '495-92', title: 'Листы и полосы медные (технические условия)', cat: 'tsvetnye', pdf: 'https://meganorm.ru/Data2/1/4294847/4294847548.pdf' },
	{ num: '598-90', title: 'Листы цинковые общего назначения (технические условия)', cat: 'tsvetnye', pdf: 'https://meganorm.ru/Data2/1/4294823/4294823275.pdf' },
	{ num: '617-90', title: 'Трубы медные (технические условия)', cat: 'tsvetnye', pdf: 'https://meganorm.ru/Data2/1/4294847/4294847581.pdf' },
	{ num: '859-01', title: 'Медь (марки)', cat: 'tsvetnye', pdf: 'https://meganorm.ru/Data/65/6556.pdf' },
	{ num: '860-75', title: 'Олово (технические условия)', cat: 'tsvetnye', pdf: 'https://meganorm.ru/Data/353/35393.pdf' },
	{ num: '931-90', title: 'Листы и полосы латунные (технические условия)', cat: 'tsvetnye', pdf: 'https://meganorm.ru/Data2/1/4294846/4294846898.pdf' },
	{ num: '9559-89', title: 'Листы свинцовые (технические условия)', cat: 'tsvetnye', pdf: 'https://meganorm.ru/Data2/1/4294820/4294820820.pdf' },
];
