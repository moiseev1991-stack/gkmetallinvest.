/** Главное меню и мегаменю — структурированное по 4 логическим группам.
 *
 * `meta` — короткая подсказка под заголовком категории в мегапанели
 *   (например: «0,4–60 мм, AISI 304/321/430»). Помогает быстрее сориентироваться,
 *   и одновременно содержит ключевые поисковые слова рядом со ссылками.
 *
 * `empty: true` — раздел существует, но без прайса (только заявка).
 *   Меню подсветит его тоньше и поставит тег «по запросу».
 */
export interface NavLink {
	label: string;
	href: string;
	empty?: boolean;
}

export interface NavCol {
	title: string;
	href: string;
	empty?: boolean;
	meta?: string;
	children?: NavLink[];
}

export interface NavGroup {
	title: string;
	hint?: string;
	items: NavCol[];
}

export const navGroups: NavGroup[] = [
	{
		title: 'Листовой прокат',
		hint: 'Лист, рулон, лента, фольга',
		items: [
			{ title: 'Лист нержавеющий', href: '/list/', meta: '0,4–60 мм · AISI 304/321/430' },
			{ title: 'Рулон нержавеющий', href: '/rulon/', meta: '0,4–3 мм · ширина 500–1500' },
			{ title: 'Декоративные листы', href: '/dekorativnye-listy/', meta: 'BA · 4N · DECO', empty: true },
			{ title: 'Лента нержавеющая', href: '/lenta/', meta: 'штрипс, по запросу', empty: true },
			{ title: 'Фольга нержавеющая', href: '/folga/', meta: 'тонкая, под заказ', empty: true },
		],
	},
	{
		title: 'Трубный прокат',
		hint: 'Труба и фитинги',
		items: [
			{ title: 'Труба нержавеющая', href: '/truba/', meta: 'бесшовная · ЭСВ · профильная' },
			{ title: 'Детали трубопровода, задвижки', href: '/detali-truboprovoda/', meta: 'фланцы · отводы · переходы · задвижки' },
		],
	},
	{
		title: 'Сортовой прокат',
		hint: 'Круг, полоса, профиль',
		items: [
			{ title: 'Круг / Квадрат / Шестигранник', href: '/krug/', meta: 'Ø 5–250 мм' },
			{ title: 'Полоса нержавеющая', href: '/polosa/', meta: 'горяче- и холоднокатаная' },
			{ title: 'Уголок / Швеллер', href: '/ugolok-shveller/', meta: 'все размеры' },
			{ title: 'Проволока нержавеющая', href: '/provoloka/', meta: 'Ø 0,1–6 мм' },
		],
	},
	{
		title: 'Крепёж и спецпозиции',
		hint: 'По заявке',
		items: [
			{ title: 'Нержавеющие метизы', href: '/metizy/', meta: 'болты · гайки · шпильки · DIN/ГОСТ', empty: true },
			{ title: 'Комплектующие для лестничных ограждений', href: '/lestnichnye-ograzhdeniya/', meta: 'стойки · поручни · стеклодержатели', empty: true },
			{ title: 'Подшипники и промышленные компоненты', href: '/podshipniki/', meta: 'AISI 440C · 316 · промкомплектующие', empty: true },
		],
	},
];

/** Плоский список всех категорий — для footer / sitemap-консьюмеров. */
export const navCatalog: NavCol[] = navGroups.flatMap((g) => g.items);

export const navTop = [
	{ label: 'О компании', href: '/o-kompanii/' },
	{ label: 'Доставка и оплата', href: '/dostavka-i-oplata/' },
	{ label: 'Блог', href: '/blog/' },
	{ label: 'Контакты', href: '/kontakty/' },
];

export const navServices = [
	{ label: 'Все услуги', href: '/uslugi/' },
	{ label: 'Резка рулонов', href: '/uslugi/rezka-rulonov/' },
	{ label: 'Перфорация листов', href: '/uslugi/perforaciya-listov/' },
	{ label: 'Полировка и шлифование', href: '/uslugi/polirovka/' },
	{ label: 'Калькулятор веса', href: '/kalkulyator-vesa/' },
	{ label: 'Справочник ГОСТов', href: '/gost/' },
];
