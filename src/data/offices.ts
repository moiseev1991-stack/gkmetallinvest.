/**
 * Офисы и склады ГК Металлинвест по городам.
 *
 * Головной офис (isHead) — Нижний Новгород, его адрес и реквизиты дублируются
 * в data/site.ts (contacts.address, orgAddress) для JSON-LD организации.
 *
 * Телефон/email у филиалов пока пустые — заказчик пришлёт по каждому городу.
 * Пустые поля не рендерятся: карточка показывает общий телефон из site.ts.
 *
 * Фото офиса: положить файл в public/img/offices/<slug>.jpg (или .webp) и
 * прописать путь в поле `photo`. Пока поле пустое — на месте фото плейсхолдер.
 */

export interface Office {
	/** slug — для якоря на странице и имени файла фото */
	slug: string;
	/** Город (для заголовка карточки) */
	city: string;
	/** Регион — показываем, если город не самоочевиден (напр. Пушкино → Московская обл.) */
	region?: string;
	/** Улица + дом + офис — то, что видит пользователь */
	street: string;
	/** Почтовый индекс */
	zip: string;
	/** Запрос для геокодера Яндекс.Карт (город + улица + дом, без индекса и офиса) */
	mapQuery: string;
	/** Телефон филиала. Пусто → используется общий из site.ts */
	phone?: string;
	/** Телефон в формате tel: (только цифры и +) */
	phoneTel?: string;
	/** Email филиала. Пусто → используется общий из site.ts */
	email?: string;
	/** Головной офис (Нижний Новгород) — показываем первым, с пометкой */
	isHead?: boolean;
	/** Путь к фото офиса от корня сайта. Пусто → плейсхолдер */
	photo?: string;
}

export const offices: Office[] = [
	{
		slug: 'nizhny-novgorod',
		city: 'Нижний Новгород',
		region: 'Нижегородская область',
		street: 'ул. Варварская, д. 32, помещение П7, офис 518',
		zip: '603006',
		mapQuery: 'Нижний Новгород, улица Варварская, 32',
		isHead: true,
	},
	{
		slug: 'moskva-pushkino',
		city: 'Пушкино',
		region: 'Московская область',
		street: 'мкр Междуречье, ул. Славянская, 2',
		zip: '141201',
		mapQuery: 'Московская область, Пушкино, Славянская улица, 2',
	},
	{
		slug: 'sankt-peterburg',
		city: 'Санкт-Петербург',
		street: 'Глухоозёрское шоссе, д. 4',
		zip: '192019',
		mapQuery: 'Санкт-Петербург, Глухоозёрское шоссе, 4',
	},
	{
		slug: 'ekaterinburg',
		city: 'Екатеринбург',
		street: 'ул. Бахчиванджи, 2А/21',
		zip: '620025',
		mapQuery: 'Екатеринбург, улица Бахчиванджи, 2А',
	},
	{
		slug: 'novosibirsk',
		city: 'Новосибирск',
		street: '2-я Станционная улица, 40Е',
		zip: '630041',
		mapQuery: 'Новосибирск, 2-я Станционная улица, 40',
	},
	{
		slug: 'rostov-na-donu',
		city: 'Ростов-на-Дону',
		street: '1-я Луговая улица, 12, микрорайон Заречная',
		zip: '344002',
		mapQuery: 'Ростов-на-Дону, 1-я Луговая улица, 12',
	},
	{
		slug: 'krasnodar',
		city: 'Краснодар',
		street: 'Уральская улица, 83А',
		zip: '350059',
		mapQuery: 'Краснодар, Уральская улица, 83А',
	},
];

/** URL iframe-виджета Яндекс.Карт по текстовому запросу офиса. */
export function officeMapSrc(office: Office): string {
	return (
		'https://yandex.ru/map-widget/v1/?text=' +
		encodeURIComponent(office.mapQuery) +
		'&z=16'
	);
}

/** Полный адрес одной строкой: индекс + город + улица. */
export function officeFullAddress(office: Office): string {
	return `${office.zip}, ${office.city}, ${office.street}`;
}
