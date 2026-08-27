/** Контент главной страницы (смыслы с gkmetallinvest.ru) */

/**
 * IMAGE-СЛОТЫ.
 * Везде, где у объекта есть поле `image`, оно заполнено `null` и UI
 * автоматически рендерит SVG-плейсхолдер. Когда придут реальные фото:
 *  1. Положить файл в /public/img/<категория>/<имя>.jpg (или .webp/.svg)
 *  2. Заменить null на путь, например image: '/img/products/list-aisi-304.jpg'
 *  3. По возможности указать `alt` (если не указан — берётся `title` или
 *     генерируется из контекста).
 */

export const heroBullets = [
	'Широкий спектр услуг по обработке металла',
	'Оптовая и розничная продажа',
	'Все марки и типоразмеры',
	'Доставка по всей России',
];

/** Hero — три фото товаров (трубы AISI / рулоны / декоративные листы) */
export const heroProducts: Array<{
	title: string;
	hint: string;
	image: string | null;
	alt?: string;
	href: string;
}> = [
	{ title: 'Трубы ЭСВ', hint: 'AISI 304 / 321', image: '/img/catalog/truba.png', href: '/truba-nerzhaveyushchaya/' },
	{ title: 'Рулоны', hint: '0.4–8 мм, 1000–1500', image: '/img/catalog/rulon.jpg', href: '/rulon-nerzhaveyushchiy/' },
	{ title: 'Декоративные', hint: 'BA, 4N, DECO', image: '/img/catalog/dekorativnye.webp', href: '/dekorativnye-listy/' },
];

/** Производственные возможности — с иконкой и нумерацией */
export const capabilities: Array<{ title: string; text: string; icon: string }> = [
	{ title: 'ЭСВ и гофрированные трубы', text: 'Производим электросварные и гофрированные трубы под задачи заказчика.', icon: 'tube' },
	{ title: 'Резка листов до 12 м', text: 'Режем листы в размер — длина реза до 12 метров.', icon: 'cut-sheet' },
	{ title: 'Резка в штрипс до 4 мм', text: 'Продольная резка рулона в штрипс толщиной до 4 мм.', icon: 'strip' },
	{ title: 'Шлифовка и перфорация', text: 'Шлифуем и перфорируем нержавеющие листы на современном оборудовании.', icon: 'grind' },
	{ title: 'Редкие позиции на складе', text: 'Держим редкие позиции металлопроката на складах.', icon: 'warehouse' },
];

/** Каталог на главной — слоты под изображения товара */
export const catalogCategories: Array<{
	href: string;
	title: string;
	description: string;
	image: string | null;
	alt?: string;
}> = [
	{ href: '/list-nerzhaveyushchiy/', title: 'Лист нержавеющий', description: 'Холоднокатаный, горячекатаный, рифленый, декоративный и перфорированный лист.', image: '/img/catalog/list.jpg' },
	{ href: '/truba-nerzhaveyushchaya/', title: 'Труба нержавеющая', description: 'Круглая бесшовная, электросварная, прямоугольная и квадратная.', image: '/img/catalog/truba.png' },
	{ href: '/krug-nerzhaveyushchiy/', title: 'Круг / Квадрат / Шестигранник', description: 'Сортовой нержавеющий прокат по маркам.', image: '/img/catalog/krug.jpg' },
	{ href: '/polosa-nerzhaveyushchaya/', title: 'Полоса нержавеющая', description: 'Полоса нержавеющая по маркам.', image: '/img/catalog/polosa.jpg' },
	{ href: '/ugolok-shveller-nerzhaveyushchiy/', title: 'Уголок / Швеллер', description: 'Уголок и швеллер по маркам.', image: '/img/catalog/ugolok-shveller.jpg' },
	{ href: '/rulon-nerzhaveyushchiy/', title: 'Рулон нержавеющий', description: 'Рулонный прокат AISI 304, 316L, 321. Толщины 0,4–8 мм.', image: '/img/catalog/rulon.jpg' },
	{ href: '/detali-truboprovoda/', title: 'Детали трубопровода', description: 'Фланцы, отводы, переходы, тройники, задвижки, клапаны.', image: '/img/catalog/detali-truboprovoda.jpg' },
	{ href: '/provoloka-nerzhaveyushchaya/', title: 'Проволока нержавеющая', description: 'Проволока AISI 304, 316L, 12Х18Н10Т, Ø 0,1–6 мм.', image: '/img/catalog/provoloka.jpg' },
	{ href: '/lenta-nerzhaveyushchaya/', title: 'Лента нержавеющая', description: 'По маркам, толщинам и ширинам с шагом 5 мм.', image: '/img/catalog/lenta.jpg' },
	{ href: '/folga-nerzhaveyushchaya/', title: 'Фольга нержавеющая', description: 'По маркам и толщинам без разбивки на ширины.', image: '/img/catalog/folga.avif' },
	{ href: '/dekorativnye-listy/', title: 'Декоративные листы', description: 'BA, 4N, шлифовка, ткань — для интерьера и фасадов.', image: '/img/catalog/dekorativnye.webp' },
];

/** Популярные направления */
export const popularDirections = [
	{ href: '/provoloka-nerzhaveyushchaya/', label: 'Нержавеющая проволока', note: '' },
	{ href: '/dekorativnye-listy/', label: 'Декоративные листы', note: '' },
	{ href: '/list-nerzhaveyushchiy/', label: 'Лист AISI 304', note: '' },
	{ href: '/truba-nerzhaveyushchaya/', label: 'Труба нержавеющая', note: '' },
	{ href: '/rulon-nerzhaveyushchiy/', label: 'Рулон нержавеющий', note: '' },
];

/**
 * SOLUTIONS — отдельный блок 3 карточки
 * (нетиповой заказ / поставки из Китая / экспресс-доставка)
 * Слот icon — путь к SVG-иконке или null (тогда рисуем нумерованный круг).
 */
export const solutions: Array<{
	title: string;
	text: string;
	icon: string | null;
	cta?: { href: string; label: string };
}> = [
	{
		title: 'Нетиповые заказы',
		text: 'Реализуем сложные и нетиповые запросы по металлопрокату — подберём марку и формат под задачу.',
		icon: 'gear',
		cta: { href: '/zapros-kp/', label: 'Запросить расчёт' },
	},
	{
		title: 'Поставки из Китая',
		text: 'Организуем поставки по выгодным ценам с соответствием российским стандартам качества.',
		icon: 'globe',
		cta: { href: '/postavka-nerzhaveyushchego-metalloprokata/', label: 'Подробнее' },
	},
	{
		title: 'Экспресс-доставка 2–3 дня',
		text: 'Свой отдел логистики, попутные отправки, страхование груза. Доставка по России и СНГ.',
		icon: 'truck-fast',
		cta: { href: '/dostavka-i-oplata/', label: 'Условия доставки' },
	},
];

/** Услуги — слот под иконку */
export const homeServices: Array<{
	href: string;
	title: string;
	text: string;
	icon: string | null;
}> = [
	{ href: '/uslugi/rezka-rulonov/', title: 'Продольная и поперечная резка рулонов', text: 'Резка рулона в лист и штрипс по заданным параметрам.', icon: null },
	{ href: '/rulon-nerzhaveyushchiy/', title: 'Перемотка рулонов', text: 'Перемотка в нужный вес и ширину.', icon: null },
	{ href: '/uslugi/perforaciya-listov/', title: 'Перфорация листов', text: 'Лазер и координатно-пробивной пресс, рисунок по эскизу.', icon: null },
	{ href: '/uslugi/', title: 'Выравнивание плоскостности', text: 'Подготовка листового металла к дальнейшей обработке.', icon: null },
	{ href: '/uslugi/', title: 'Резка сортового проката до 600 мм', text: 'Резка сортового проката на заданные длины.', icon: null },
	{ href: '/truba-nerzhaveyushchaya/', title: 'Электросварные трубы под заказ', text: 'Изготовление ЭСВ труб по ТЗ.', icon: null },
	{ href: '/uslugi/polirovka/', title: 'Шлифование и полировка листов', text: 'Подготовка поверхности под требования проекта.', icon: null },
];

/** Отгрузки — слайдер с видео реальных отгрузок */
export const shipments: Array<{
	title: string;
	video: string;
	poster?: string;
}> = [
	{ title: 'Лист нержавеющий', video: '/slaider/video.mp4', poster: '/slaider/videoframe_1477.webp' },
	{ title: 'Отгрузка с маркировкой', video: '/slaider/video (1).mp4', poster: '/slaider/videoframe_1591.webp' },
	{ title: 'Погрузка манипулятором', video: '/slaider/video (2).mp4' },
	{ title: 'Рулон в упаковке', video: '/slaider/video (3).mp4', poster: '/slaider/videoframe_1876.webp' },
	{ title: 'Загрузка в фуру', video: '/slaider/video (4).mp4' },
	{ title: 'Палета на отгрузке', video: '/slaider/video (5).mp4' },
	{ title: 'Подготовка к доставке', video: '/slaider/video (6).mp4' },
	{ title: 'Профильная труба', video: '/slaider/video (7).mp4' },
	{ title: 'Закрепление стропами', video: '/slaider/video (8).mp4' },
	{ title: 'Контроль упаковки', video: '/slaider/video (9).mp4' },
	{ title: 'Резка под размер', video: '/slaider/video (10).mp4' },
	{ title: 'Отгрузка профиля', video: '/slaider/video (11).mp4' },
	{ title: 'Складская площадка', video: '/slaider/video (12).mp4' },
	{ title: 'Экспедирование', video: '/slaider/video (13).mp4' },
];

/** Преимущества — слот под иконку */
export const advantageGroups: Array<{
	title: string;
	text: string;
	icon: string | null;
}> = [
	{ title: 'Надёжные партнёры', text: 'За годы работы выстроена система партнёрства с поставщиками металла.', icon: 'handshake' },
	{ title: 'Широкий ассортимент', text: 'Подбор импортных и отечественных марок любых параметров.', icon: 'layers' },
	{ title: 'Без лишних остатков', text: 'Отгрузим ровно нужный объём — без навязанных остатков.', icon: 'scale' },
	{ title: 'Гарантия качества', text: 'По запросу — благодарственные письма и сертификаты.', icon: 'shield-check' },
];

/** Доверие / стандарты */
export const trustItems = [
	{ stat: '7+ лет', text: 'на рынке металлопроката' },
	{ stat: 'ГОСТ, ТУ', text: 'ASTM, EN, DIN — работаем по российским и зарубежным стандартам' },
	{ stat: 'Сертификаты', text: 'Предоставляем документы и благодарственные письма по запросу' },
	{ stat: 'B2B', text: 'Снабжение производств, стройки, металлообработки по всей РФ' },
];

/** Гарантии */
export const guarantees = [
	'Отгрузка в день оплаты — при наличии на складе',
	'Свой отдел логистики и проверенные перевозчики',
	'Страхование груза при отгрузке',
];

/** Доставка */
export const deliveryItems = [
	'Экспресс-доставка по России и СНГ',
	'СДЭК, «Деловые линии» и другие операторы',
	'Попутный транспорт — быстро и экономично',
];

/** Транспортные компании — слот под лого ТК */
export const deliveryPartners: Array<{ name: string; logo: string | null }> = [
	{ name: 'СДЭК', logo: null },
	{ name: 'Деловые линии', logo: null },
	{ name: 'ПЭК', logo: null },
	{ name: 'Байкал-Сервис', logo: null },
];

/**
 * Дополнительные продукты — крупные карточки с фото
 * (проволока + декоративные листы DECO).
 */
export const additionalProducts: Array<{
	href: string;
	title: string;
	subtitle: string;
	bullets: string[];
	image: string | null;
}> = [
	{
		href: '/provoloka-nerzhaveyushchaya/',
		title: 'Проволока нержавеющая',
		subtitle: 'Технологическая, пружинная и сварочная',
		bullets: ['12Х18Н10Т, AISI 304/316L/321', 'EN 10270-3 (пружинная)', 'ER308L / ER316L (сварочная)'],
		image: '/img/catalog/provoloka.jpg',
	},
	{
		href: '/dekorativnye-listy/',
		title: 'Декоративные листы DECO',
		subtitle: 'Зеркальные, шлифованные, тиснёные',
		bullets: ['BA / 4N / 4N+PE', 'DECO1 / DECO8 / DECO9', 'AISI 304, 430 — фасад и интерьер'],
		image: '/img/catalog/dekorativnye.webp',
	},
];

export const aboutTeaser =
	'Группа компаний Металлинвест — ваш надёжный партнёр в мире нержавеющей стали и профильных труб. Мы предоставляем широкий выбор продукции и услуг для различных отраслей, включая металлообработку, строительство и многие другие.';

/** Развёрнутый текст внизу страницы (SEO + смыслы) — текст с gkmetallinvest.ru */
export const longDescription: Array<{ h: string; p: string; icon: string }> = [
	{
		h: 'Нержавеющая сталь',
		p: 'Нержавеющая сталь — это материал, который сочетает в себе выдающуюся коррозионную стойкость и долговечность. В ГК Металлинвест вы найдёте нержавеющие листы, трубы, профили и многое другое. Наши продукты идеально подходят для использования в агрессивных средах и при высоких нагрузках.',
		icon: 'shield-check',
	},
	{
		h: 'Профильные трубы',
		p: 'Профильные трубы — это универсальное решение для строительства и монтажа различных конструкций. Мы предлагаем широкий ассортимент профильных труб разных размеров и форм. Наши инженеры готовы помочь вам выбрать оптимальное решение для вашего проекта.',
		icon: 'tube',
	},
	{
		h: 'Лазерная резка и резка по металлу',
		p: 'Современные оборудование и технологии позволяют нам предоставлять услуги высокоточной лазерной резки и резки по металлу. Независимо от того, нужны ли вам листы нержавеющей стали определённой толщины или профильные трубы с определёнными размерами, мы обеспечим качественное изготовление.',
		icon: 'cut-sheet',
	},
	{
		h: 'Цена и качество: наш приоритет',
		p: 'Мы понимаем, как важно получить высококачественные материалы по доступным ценам. ГК Металлинвест предоставляет конкурентоспособные цены на нержавеющую сталь, профильные трубы и другие изделия. Наша продукция соответствует высоким стандартам качества.',
		icon: 'scale',
	},
];

/** Финальный CTA для блока «О продукте» — отдельный баннер */
export const longDescriptionCta = {
	h: 'Заказывайте прямо сейчас',
	p: 'Покупая нержавеющую сталь, профильные трубы или другие металлопрокатные изделия у ГК Металлинвест, вы получаете надёжного партнёра для вашего бизнеса. Мы готовы выполнить заказы разных объёмов и сложности, обеспечивая своевременную доставку и профессиональное обслуживание.',
	tagline: 'Сделайте правильный выбор — выбирайте ГК Металлинвест!',
	cta: { href: '/zapros-kp/', label: 'Запросить расчёт' },
};

/** Партнёры — логотипы поставщиков и заводов */
export const partnerLogos: Array<{ name: string; logo: string | null }> = [
	{ name: 'Партнёр 1', logo: '/img/partners/partner-01.svg' },
	{ name: 'Партнёр 2', logo: '/img/partners/partner-02.svg' },
	{ name: 'Партнёр 3', logo: '/img/partners/partner-03.svg' },
	{ name: 'Партнёр 4', logo: '/img/partners/partner-04.svg' },
	{ name: 'Партнёр 5', logo: '/img/partners/partner-05.svg' },
	{ name: 'Партнёр 6', logo: '/img/partners/partner-06.svg' },
	{ name: 'Партнёр 7', logo: '/img/partners/partner-07.svg' },
	{ name: 'Электросталь', logo: '/img/partners/partner-08.svg' },
	{ name: 'Партнёр 9', logo: '/img/partners/partner-09.svg' },
	{ name: 'Партнёр 10', logo: '/img/partners/partner-10.png' },
	{ name: 'AMET', logo: '/img/partners/partner-11.png' },
];

/** Главный CTA-баннер с фото */
export const mainCtaBanner = {
	eyebrow: 'Заявка',
	title: 'Заявка на нержавейку — под задачу',
	text: 'Подбираем по марке, формату, объёму и срокам. Цены меняются ежедневно — отправьте смету и получите актуальный расчёт.',
	cta: { href: '/zapros-kp/', label: 'Оставить заявку' },
	image: '/img/cta/cta-banner.webp' as string | null,
};

/** Pricing strip перед футером */
export const pricingStrip = {
	title: 'Цены меняются ежедневно',
	text: 'Оставьте заявку — менеджер подтвердит наличие и пришлёт актуальный прайс в течение 30 минут.',
	phone: '+7 (831) 281-26-60',
};
