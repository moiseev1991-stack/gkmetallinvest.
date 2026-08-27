/** Единый источник соответствия «ключ хаба в прайсе → слаг в URL».
 *
 * Ключ `hub` (list, truba, krug…) остаётся внутренним идентификатором логики и
 * данных (sku.hub, пути к картинкам, ключи дублей). А вот URL-слаг раздела —
 * человекочитаемый под основной ключ Wordstat: /list-nerzhaveyushchiy/,
 * /truba-nerzhaveyushchaya/ и т.д. Везде, где ссылка строится из ключа хаба
 * (`/${hub}/...`), берём путь отсюда, чтобы слаги не разъезжались. */
export const hubUrlPath: Record<string, string> = {
	list: 'list-nerzhaveyushchiy',
	krug: 'krug-nerzhaveyushchiy',
	truba: 'truba-nerzhaveyushchaya',
	provoloka: 'provoloka-nerzhaveyushchaya',
	rulon: 'rulon-nerzhaveyushchiy',
	polosa: 'polosa-nerzhaveyushchaya',
	'ugolok-shveller': 'ugolok-shveller-nerzhaveyushchiy',
	lenta: 'lenta-nerzhaveyushchaya',
	folga: 'lenta-nerzhaveyushchaya',
	'dekorativnye-listy': 'dekorativnye-listy',
	'detali-truboprovoda': 'detali-truboprovoda',
};

/** URL-слаг раздела по ключу хаба; если маппинга нет — сам ключ. */
export const toHubPath = (hub: string): string => hubUrlPath[hub] ?? hub;
