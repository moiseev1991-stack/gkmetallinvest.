import pricelist from './pricelist.json';

/* Эвристика «рулон-стайл»: в названии шаблон «толщина × ширина» без третьего
   числа (длины) — поставщик отгружает позицию мотком/рулоном, а не как лист
   в размер. Например: «Лист нержавеющий х/к 0.6×1250 2B (матовый)» — это
   реально рулон, и клиент это путает с настоящим листом. См. правку
   клиента 2026-06-24. */
export function isRulonLikeName(name: string | null | undefined): boolean {
	const s = String(name ?? '').replace(/[хХX]/g, 'x');
	const m = s.match(/(\d+(?:[.,]\d+)?)x(\d+(?:[.,]\d+)?)(?:x(\d+(?:[.,]\d+)?))?/);
	if (!m) return false;
	return !m[3];
}

/* Заменяем «Лист» → «Рулон» в названиях позиций рулонного хаба. Источник
   данных (mc.ru) для рулонов выдаёт строки вида «лист нержавеющий х/к 0.4×1000»,
   что путает покупателя на странице /rulon/. Если в названии уже есть слово
   «рулон» — не трогаем, чтобы не получить «Рулон ... рулон». */
export function rulonizeName(name: string | null | undefined): string {
	const s = String(name ?? '');
	if (!s) return s;
	if (/рулон/i.test(s)) return s;
	/* `\b` в JS работает только с ASCII (`\w` = [A-Za-z0-9_]) — для кириллицы
	   границу слова делаем lookbehind/lookahead по `\p{L}` с флагом /u. */
	return s.replace(/(?<!\p{L})[Лл]ист(?!\p{L})/gu, (m) =>
		/^[А-Я]/.test(m) ? 'Рулон' : 'рулон',
	);
}

/* Единая точка чтения SKU из прайса: для /list/ выкидывает рулон-стайл,
   для /rulon/ — переименовывает «лист» в «рулон». Все потребители (PriceTable,
   страницы хабов, [slug]-роуты рулона) должны идти через неё, иначе данные
   и счётчики разойдутся. */
export function getHubSkus(hub: string): any[] {
	const raw = ((pricelist as any).hubs?.[hub] ?? []) as any[];
	if (hub === 'list') {
		return raw.filter((s) => !isRulonLikeName(s?.name));
	}
	if (hub === 'rulon') {
		return raw.map((s) => ({ ...s, name: rulonizeName(s?.name) }));
	}
	return raw;
}
