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
	/** Подпись в выпадающих списках-переключателях, если нужна шире города
	 *  (напр. «Москва (Московская обл., Пушкино)»). Пусто → используется city. */
	menuCity?: string;
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
	/** Координаты для метки-пина на карте. Пусто → карта по текстовому запросу без точки */
	coords?: { lat: number; lon: number };
}

export const offices: Office[] = [
	{
		slug: 'nizhny-novgorod',
		city: 'Нижний Новгород',
		region: 'Нижегородская область',
		street: 'ул. Варварская, д. 32, помещение П7, офис 518',
		zip: '603006',
		mapQuery: 'Нижний Новгород, улица Варварская, 32',
		coords: { lat: 56.32849, lon: 44.00465 },
		photo: '/img/offices/nizhny-novgorod.webp',
		isHead: true,
	},
	{
		slug: 'moskva-pushkino',
		city: 'Пушкино',
		menuCity: 'Москва (Московская обл., Пушкино)',
		region: 'Московская область',
		street: 'Акуловское шоссе, 50а',
		zip: '141206',
		mapQuery: 'Московская область, Пушкино, Акуловское шоссе, 50а',
		coords: { lat: 56.0134823, lon: 37.8178207 },
		photo: '/img/offices/moskva-pushkino.webp',
	},
	{
		slug: 'sankt-peterburg',
		city: 'Санкт-Петербург',
		street: 'Глухоозёрское шоссе, д. 4',
		zip: '192019',
		mapQuery: 'Санкт-Петербург, Глухоозёрское шоссе, 4',
		coords: { lat: 59.9106347, lon: 30.3760344 },
		photo: '/img/offices/sankt-peterburg.webp',
	},
	{
		slug: 'ekaterinburg',
		city: 'Екатеринбург',
		street: 'ул. Бахчиванджи, 2А/21',
		zip: '620025',
		mapQuery: 'Екатеринбург, улица Бахчиванджи, 2А',
		coords: { lat: 56.7579598, lon: 60.7956856 },
		photo: '/img/offices/ekaterinburg.webp',
	},
	{
		slug: 'novosibirsk',
		city: 'Новосибирск',
		street: '2-я Станционная улица, 40Е',
		zip: '630041',
		mapQuery: 'Новосибирск, 2-я Станционная улица, 40',
		coords: { lat: 54.6509745, lon: 83.2909576 },
		photo: '/img/offices/novosibirsk.webp',
	},
	{
		slug: 'rostov-na-donu',
		city: 'Ростов-на-Дону',
		street: '1-я Луговая улица, 12, микрорайон Заречная',
		zip: '344002',
		mapQuery: 'Ростов-на-Дону, 1-я Луговая улица, 12',
		coords: { lat: 47.1997164, lon: 39.6990391 },
		photo: '/img/offices/rostov-na-donu.webp',
	},
	{
		slug: 'krasnodar',
		city: 'Краснодар',
		street: 'Уральская улица, 83А',
		zip: '350059',
		mapQuery: 'Краснодар, Уральская улица, 83А',
		coords: { lat: 45.0354689, lon: 39.0600371 },
		photo: '/img/offices/krasnodar.webp',
	},
];

/** URL iframe-виджета Яндекс.Карт.
 *  Если у офиса заданы coords — ставим метку-пин (pt=lon,lat) и центрируем по ней.
 *  Иначе — карта по текстовому запросу (без точки, как запасной вариант). */
export function officeMapSrc(office: Office): string {
	if (office.coords) {
		const { lat, lon } = office.coords;
		return (
			`https://yandex.ru/map-widget/v1/?ll=${lon},${lat}&z=17` +
			`&pt=${lon},${lat},pm2rdm`
		);
	}
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
