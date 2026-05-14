export const siteName = 'ГК Металлинвест';
export const siteTagline = 'Нержавеющий металлопрокат';
export const siteUrl = 'https://gkmetallinvest.ru';

/**
 * Глобальный «закрыть от индексации» рубильник.
 * Когда сайт готов выйти в индекс:
 *   1) поставить здесь false;
 *   2) убрать блок "headers" с X-Robots-Tag из vercel.json.
 * Этого достаточно — robots.txt и meta-теги переключатся автоматически.
 */
export const siteNoindex = true;

/** Default Open Graph image — путь от корня сайта. */
export const siteOgImage = '/img/logo.png';

export const contacts = {
	phone: '+7 (831) 281-26-60',
	phoneTel: '+78312812660',
	email: 'zakaz@gkmetallinvest.ru',
	address:
		'603006, Нижегородская область, г. Нижний Новгород, ул. Варварская, д. 32, помещ. П5, офис 417',
	company: 'ООО «МЕТАЛЛИНВЕСТ»',
	inn: '5262332690',
};

/** Структурированные данные об организации — для JSON-LD. */
export const orgAddress = {
	streetAddress: 'ул. Варварская, д. 32, помещ. П5, офис 417',
	addressLocality: 'Нижний Новгород',
	addressRegion: 'Нижегородская область',
	postalCode: '603006',
	addressCountry: 'RU',
};

export const citiesRf = [
	'Москва',
	'Санкт-Петербург',
	'Екатеринбург',
	'Новосибирск',
	'Казань',
	'Нижний Новгород',
	'Челябинск',
	'Самара',
	'Омск',
	'Ростов-на-Дону',
	'Уфа',
	'Краснодар',
	'Пермь',
	'Воронеж',
	'Волгоград',
];

/** P1: ведут на хаб листа; посадочные по маркам — фаза P2 */
export const marksAisi = [
	{ label: 'AISI 304', href: '/list/' },
	{ label: 'AISI 430', href: '/list/' },
	{ label: 'AISI 321 / 12Х18Н10Т', href: '/list/' },
	{ label: 'AISI 316L', href: '/list/' },
	{ label: 'AISI 201', href: '/list/' },
];
