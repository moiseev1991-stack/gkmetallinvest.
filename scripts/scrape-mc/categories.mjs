// Mapping mc.ru category URL slug → our pricelist hub/sub + presets.
// Each entry parses ONE mc.ru category (with full pagination).
// `unit` defaults to 'т'; override for piece-goods.
// `alloy`, `roll` are written into every SKU as-is unless detected from row.

export const CATEGORIES = [
	// ────────────────────── СОРТОВОЙ (КРУГ/КВАДРАТ/ШЕСТИГРАННИК) ──────────────────────
	{
		mc: 'krug_nerzhaveyushchij_nikelsoderzhashchij',
		hub: 'krug', sub: 'nikelevyj',
		alloy: 'никелесодержащий', defaultRoll: null,
		unit: 'т',
		title: 'Круг нержавеющий никельсодержащий',
	},
	{
		mc: 'krug_nerzhaveyushchij_beznikelevyj_zharoprochnyj',
		hub: 'krug', sub: 'zharoprochnyj',
		alloy: 'без никеля', defaultRoll: null,
		unit: 'т',
		title: 'Круг нержавеющий безникелевый, жаропрочный',
	},
	{
		mc: 'kvadrat_nerzhaveyushchij_nikelsoderzhashchij',
		hub: 'krug', sub: 'kvadrat',
		alloy: 'никелесодержащий', defaultRoll: null,
		unit: 'т',
		title: 'Квадрат нержавеющий никельсодержащий',
	},
	{
		mc: 'shestigrannik_nerzhaveyushchij_nikelsoderzhashchij',
		hub: 'krug', sub: 'shestigrannik',
		alloy: 'никелесодержащий', defaultRoll: null,
		unit: 'т',
		title: 'Шестигранник нержавеющий никельсодержащий',
	},
	{
		mc: 'shestigrannik_nerzhaveyushchij_beznikelevyj_zharoprochnyj',
		hub: 'krug', sub: 'shestigrannik',
		alloy: 'без никеля', defaultRoll: null,
		unit: 'т',
		title: 'Шестигранник нержавеющий безникелевый',
	},

	// ────────────────────── ПОЛОСА / УГОЛОК / ШВЕЛЛЕР ──────────────────────
	// Под уже существующие URL-ы /polosa/ и /ugolok-shveller/
	{
		mc: 'polosa_nerzhaveyushchaya_nikelsoderzhashchaya',
		hub: 'polosa', sub: 'nikelesod',
		alloy: 'никелесодержащий', defaultRoll: null,
		unit: 'т',
		title: 'Полоса нержавеющая никельсодержащая',
	},
	{
		mc: 'ugolok_nerzhaveyushchij_nikelsoderzhashchij',
		hub: 'ugolok-shveller', sub: 'ugolok-ravnopolochnyy',
		alloy: 'никелесодержащий', defaultRoll: null,
		unit: 'т',
		title: 'Уголок нержавеющий никельсодержащий',
	},
	{
		mc: 'sveller_nerzhaveyushchaya_nikelsoderzhashchaya',
		hub: 'ugolok-shveller', sub: 'shveller-gnutyy',
		alloy: 'никелесодержащий', defaultRoll: null,
		unit: 'т',
		title: 'Швеллер нержавеющий никельсодержащий',
	},

	// ────────────────────── ТРУБЫ ──────────────────────
	{
		mc: 'truby_nerzhaveyushchie_besshovnye',
		hub: 'truba', sub: 'besshovnaya',
		alloy: null, defaultRoll: null,
		unit: 'т',
		title: 'Трубы нержавеющие бесшовные',
	},
	{
		mc: 'truby_nerzhaveyushchie_ehlektrosvarnye_aisi',
		hub: 'truba', sub: 'elsvarnaya',
		alloy: null, defaultRoll: null,
		unit: 'т',
		title: 'Трубы нержавеющие электросварные AISI',
	},
	{
		mc: 'truby_nerzhaveyushchie_ehlektrosvarnye_aisi_kvadratnye',
		hub: 'truba', sub: 'elsvarnaya-kvadrat',
		alloy: null, defaultRoll: null,
		unit: 'т',
		title: 'Трубы нержавеющие электросварные квадратные',
	},
	{
		mc: 'truby_nerzhaveyushchie_ehlektrosvarnye_aisi_pryamougolnye',
		hub: 'truba', sub: 'elsvarnaya-pryamougolnaya',
		alloy: null, defaultRoll: null,
		unit: 'т',
		title: 'Трубы нержавеющие электросварные прямоугольные',
	},
	{
		mc: 'truby_nerzhaveyushchie_perforirovannye',
		hub: 'truba', sub: 'perforirovannaya',
		alloy: null, defaultRoll: null,
		unit: 'т',
		title: 'Трубы нержавеющие перфорированные',
	},

	// ────────────────────── ЛИСТ ──────────────────────
	{
		mc: 'stal_listovaya_nerzhaveyushchaya_nikelsoderzhashchaya',
		hub: 'list', sub: 'nikelesod',
		alloy: 'никелесодержащий', defaultRoll: null,
		unit: 'т',
		title: 'Сталь листовая нержавеющая никельсодержащая',
	},
	{
		mc: 'stal_listovaya_nerzhaveyushchaya_bez_nikelya',
		hub: 'list', sub: 'beznikelya',
		alloy: 'без никеля', defaultRoll: null,
		unit: 'т',
		title: 'Сталь листовая нержавеющая без никеля',
	},
	{
		mc: 'stal_listovaya_duplex',
		hub: 'list', sub: 'duplex',
		alloy: 'дуплекс', defaultRoll: null,
		unit: 'т',
		title: 'Сталь листовая Duplex',
	},
	{
		mc: 'profnastil_nerzhavejka',
		hub: 'list', sub: 'profnastil',
		alloy: null, defaultRoll: null,
		unit: 'м²',
		title: 'Профнастил нержавеющий',
		acceptNoPrice: true, // mc.ru shows profnastil without prices — keep SKUs as "по запросу"
	},

	// ────────────────────── ПРОВОЛОКА + МЕТИЗЫ ──────────────────────
	{
		mc: 'provoloka_nerzhaveyushchaya',
		hub: 'provoloka', sub: 'osnovnaya',
		alloy: null, defaultRoll: null,
		unit: 'т',
		title: 'Проволока нержавеющая',
	},
	{
		mc: 'nerzhaveyuschie_metizy/group/krepyozh_iz_nerzhaveyushchej_stali',
		hub: 'provoloka', sub: 'krepyozh',
		alloy: null, defaultRoll: null,
		unit: 'шт',
		title: 'Крепёж из нержавеющей стали',
	},

	// ────────────────────── ДЕТАЛИ ТРУБОПРОВОДА ──────────────────────
	// На mc.ru каждая подгруппа — отдельный URL, hub-страница detali_truboprovoda пустая.
	{
		mc: 'otvody_nerzhaveyushchie',
		hub: 'detali-truboprovoda', sub: 'otvod',
		alloy: null, defaultRoll: null,
		unit: 'шт',
		title: 'Отводы нержавеющие',
	},
	{
		mc: 'perehody_nerzhaveyushchie',
		hub: 'detali-truboprovoda', sub: 'perehod',
		alloy: null, defaultRoll: null,
		unit: 'шт',
		title: 'Переходы нержавеющие',
	},
	{
		mc: 'troyniki_nerzhaveyushchie',
		hub: 'detali-truboprovoda', sub: 'troynik',
		alloy: null, defaultRoll: null,
		unit: 'шт',
		title: 'Тройники нержавеющие',
	},
	{
		mc: 'flancy_nerzhaveyushie_ploskie',
		hub: 'detali-truboprovoda', sub: 'flanec-ploskiy',
		alloy: null, defaultRoll: null,
		unit: 'шт',
		title: 'Фланцы нержавеющие плоские',
	},
	{
		mc: 'flancy_nerzhaveyushie_vorotnikovye',
		hub: 'detali-truboprovoda', sub: 'flanec-vorotnikovyy',
		alloy: null, defaultRoll: null,
		unit: 'шт',
		title: 'Фланцы нержавеющие воротниковые',
	},
	{
		mc: 'zadvizhki_nerzav',
		hub: 'detali-truboprovoda', sub: 'zadvizhka',
		alloy: null, defaultRoll: null,
		unit: 'шт',
		title: 'Задвижки нержавеющие',
	},
	{
		mc: 'klapany_zatvory_nerz',
		hub: 'detali-truboprovoda', sub: 'klapan',
		alloy: null, defaultRoll: null,
		unit: 'шт',
		title: 'Клапаны и затворы нержавеющие',
	},
	{
		mc: 'kompl_lest_ogr',
		hub: 'detali-truboprovoda', sub: 'lestnichnye',
		alloy: null, defaultRoll: null,
		unit: 'шт',
		title: 'Комплектующие лестничных ограждений',
	},
	// ── Лестничные ограждения — 10 подкатегорий найдены через Claude Chrome 2026-05-12
	{
		mc: 'lestnichnye_ograzhdeniya',
		hub: 'detali-truboprovoda', sub: 'lestn-osnovnye',
		alloy: null, defaultRoll: null,
		unit: 'шт',
		title: 'Комплектующие для лестниц',
	},
	{
		mc: 'pristennye_krepleniya',
		hub: 'detali-truboprovoda', sub: 'pristennye',
		alloy: null, defaultRoll: null,
		unit: 'шт',
		title: 'Пристенные крепления',
	},
	{
		mc: 'nakonechniki__soedineniya_poruchnya_so_stoykoy',
		hub: 'detali-truboprovoda', sub: 'nakonechniki',
		alloy: null, defaultRoll: null,
		unit: 'шт',
		title: 'Наконечники, соединения поручня со стойкой',
	},
	{
		mc: 'derzhatel_rigelya',
		hub: 'detali-truboprovoda', sub: 'derzhatel-rigelya',
		alloy: null, defaultRoll: null,
		unit: 'шт',
		title: 'Держатель ригеля',
	},
	{
		mc: 'dekorativnyy_niz_stoyki',
		hub: 'detali-truboprovoda', sub: 'dekorativnyy-niz',
		alloy: null, defaultRoll: null,
		unit: 'шт',
		title: 'Декоративный низ стойки',
	},
	{
		mc: 'zaglushki',
		hub: 'detali-truboprovoda', sub: 'zaglushka',
		alloy: null, defaultRoll: null,
		unit: 'шт',
		title: 'Заглушки',
	},
	{
		mc: 'povoroty_i_soediniteli_trub',
		hub: 'detali-truboprovoda', sub: 'povoroty',
		alloy: null, defaultRoll: null,
		unit: 'шт',
		title: 'Повороты и соединители труб',
	},
	{
		mc: 'flancy_nastennye',
		hub: 'detali-truboprovoda', sub: 'flanec-nastennyy',
		alloy: null, defaultRoll: null,
		unit: 'шт',
		title: 'Фланцы настенные',
	},
	{
		mc: 'stekloderzhateli',
		hub: 'detali-truboprovoda', sub: 'stekloderzhateli',
		alloy: null, defaultRoll: null,
		unit: 'шт',
		title: 'Стеклодержатели',
	},
	{
		mc: 'krepleniya_stoek',
		hub: 'detali-truboprovoda', sub: 'krepleniya-stoek',
		alloy: null, defaultRoll: null,
		unit: 'шт',
		title: 'Крепления стоек',
	},

	// ────────────────────── РУЛОН / ПВЛ / ЭЛЕКТРОДЫ ──────────────────────
	{
		mc: 'rulony_nerzhaveyushchie',
		hub: 'rulon', sub: 'nikelesod',
		alloy: 'никелесодержащий', defaultRoll: null,
		unit: 'т',
		title: 'Рулоны нержавеющие',
	},
	{
		mc: 'stal_listovaya_nerzhaveyushchaya_pvl',
		hub: 'list', sub: 'pvl',
		alloy: null, defaultRoll: null,
		unit: 'т',
		title: 'Просечно-вытяжной лист (ПВЛ) нержавеющий',
	},
	{
		mc: 'ehlektrody_nerzhaveyushchie',
		hub: 'elektrody', sub: 'osnovnaya',
		alloy: null, defaultRoll: null,
		unit: 'кг',
		title: 'Электроды нержавеющие',
	},

	// ────────────────────── ПОДШИПНИКИ ──────────────────────
	// Новый хаб (отдельная страница). Сейчас данные собираем; UI добавим позже.
	{
		mc: 'promyshlennye_komponenty/group/podshipniki',
		hub: 'podshipniki', sub: 'osnovnaya',
		alloy: null, defaultRoll: null,
		unit: 'шт',
		title: 'Подшипники промышленные',
		// 703 SKUs total — filter to stainless only by keyword in name/description
		filterKeyword: 'нержав|inox|stainless|aisi\\s?304|aisi\\s?316',
	},
];
