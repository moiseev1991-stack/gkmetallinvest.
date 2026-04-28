/** Главное меню и мегаменю */
export const navCatalog = [
	{
		title: 'Лист нержавеющий',
		href: '/list/',
		children: [
			{ label: 'Лист нержавеющий', href: '/list/' },
			{ label: 'Холоднокатаный лист', href: '/list/' },
			{ label: 'Горячекатаный лист', href: '/list/' },
			{ label: 'Рифленый лист', href: '/list/' },
			{ label: 'Декоративные листы', href: '/dekorativnye-listy/' },
			{ label: 'Перфорированный лист', href: '/uslugi/perforaciya-listov/' },
			{ label: 'Рулон нержавеющий (отдельно)', href: '/rulon/' },
		],
	},
	{
		title: 'Труба нержавеющая',
		href: '/truba/',
		children: [
			{ label: 'Труба нержавеющая', href: '/truba/' },
			{ label: 'Круглая бесшовная', href: '/truba/' },
			{ label: 'Электросварная', href: '/truba/' },
			{ label: 'Прямоугольная', href: '/truba/' },
			{ label: 'Квадратная', href: '/truba/' },
		],
	},
	{
		title: 'Лента нержавеющая',
		href: '/lenta/',
		children: [
			{ label: 'По маркам', href: '/lenta/' },
			{ label: 'По толщинам', href: '/lenta/' },
			{ label: 'По ширинам (шаг 5 мм)', href: '/lenta/' },
			{ label: 'Производство ленты / штрипса', href: '/lenta/proizvodstvo/' },
		],
	},
	{
		title: 'Круг / Квадрат / Шестигранник',
		href: '/krug/',
		children: [{ label: 'По маркам', href: '/krug/' }],
	},
	{
		title: 'Полоса нержавеющая',
		href: '/polosa/',
		children: [{ label: 'По маркам', href: '/polosa/' }],
	},
	{
		title: 'Уголок / Швеллер',
		href: '/ugolok-shveller/',
		children: [{ label: 'По маркам', href: '/ugolok-shveller/' }],
	},
	{
		title: 'Рулон нержавеющий',
		href: '/rulon/',
		children: [{ label: 'Отдельная категория', href: '/rulon/' }],
	},
	{
		title: 'Фольга нержавеющая',
		href: '/folga/',
		children: [{ label: 'По маркам и толщинам', href: '/folga/' }],
	},
	{
		title: 'Детали трубопровода',
		href: '/detali-truboprovoda/',
		children: [
			{ label: 'Фланцы', href: '/detali-truboprovoda/' },
			{ label: 'Переходы', href: '/detali-truboprovoda/' },
			{ label: 'Отводы', href: '/detali-truboprovoda/' },
			{ label: 'Тройники', href: '/detali-truboprovoda/' },
		],
	},
	{
		title: 'Проволока нержавеющая',
		href: '/provoloka/',
		children: [{ label: 'Отдельная категория', href: '/provoloka/' }],
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
