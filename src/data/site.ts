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

/** Координаты офиса на ул. Варварской, 32 — нужны для GeoCoordinates
 *  в LocalBusiness JSON-LD и для Яндекс/Google Maps hasMap. */
export const orgGeo = {
	latitude: 56.32849,
	longitude: 44.00465,
};

/** Ссылка на Яндекс.Карты с офисом — для hasMap в schema.org. */
export const orgMapUrl =
	'https://yandex.ru/maps/?text=' +
	encodeURIComponent('Нижний Новгород, ул. Варварская, 32') +
	`&ll=${orgGeo.longitude},${orgGeo.latitude}&z=17`;

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
