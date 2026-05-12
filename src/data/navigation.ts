/** Главное меню и мегаменю.
 *
 * В подпунктах оставляем только ссылки с уникальным href — иначе
 * получается «меню-обманка»: разные пункты ведут на один и тот же URL.
 */
export const navCatalog = [
	{
		title: 'Лист нержавеющий',
		href: '/list/',
		children: [
			{ label: 'Декоративные листы', href: '/dekorativnye-listy/' },
			{ label: 'Перфорированный лист', href: '/uslugi/perforaciya-listov/' },
			{ label: 'Рулон нержавеющий', href: '/rulon/' },
		],
	},
	{
		title: 'Труба нержавеющая',
		href: '/truba/',
		children: [],
	},
	{
		title: 'Лента нержавеющая',
		href: '/lenta/',
		children: [
			{ label: 'Производство ленты / штрипса', href: '/lenta/proizvodstvo/' },
		],
	},
	{
		title: 'Круг / Квадрат / Шестигранник',
		href: '/krug/',
		children: [],
	},
	{
		title: 'Полоса нержавеющая',
		href: '/polosa/',
		children: [],
	},
	{
		title: 'Уголок / Швеллер',
		href: '/ugolok-shveller/',
		children: [],
	},
	{
		title: 'Рулон нержавеющий',
		href: '/rulon/',
		children: [],
	},
	{
		title: 'Фольга нержавеющая',
		href: '/folga/',
		children: [],
	},
	{
		title: 'Детали трубопровода',
		href: '/detali-truboprovoda/',
		children: [],
	},
	{
		title: 'Проволока нержавеющая',
		href: '/provoloka/',
		children: [],
	},
	{
		title: 'Метизы / Крепёж',
		href: '/metizy/',
		children: [],
	},
	{
		title: 'Электроды нержавеющие',
		href: '/elektrody/',
		children: [],
	},
	{
		title: 'Подшипники нержавеющие',
		href: '/podshipniki/',
		children: [],
	},
];

export const navTop = [
	{ label: 'О компании', href: '/o-kompanii/' },
	{ label: 'Доставка и оплата', href: '/dostavka-i-oplata/' },
	{ label: 'Контакты', href: '/kontakty/' },
];

export const navServices = [
	{ label: 'Все услуги', href: '/uslugi/' },
	{ label: 'Резка рулонов', href: '/uslugi/rezka-rulonov/' },
	{ label: 'Перфорация листов', href: '/uslugi/perforaciya-listov/' },
	{ label: 'Полировка и шлифование', href: '/uslugi/polirovka/' },
];
