/**
 * /llms.txt — краткая карта сайта для нейросетей (формат llmstxt.org):
 * кто мы, где офисы, как заказать и ссылки на главные разделы с описаниями.
 *
 * Собирается из тех же данных, что и сайт: каталог и калькуляторы — из
 * navigation.ts, статьи — из blog-posts.ts, услуги — из исходников страниц
 * (h1 и description в пропсах ServicePage). Новая страница услуги или статья
 * попадает сюда сама.
 */
import type { APIRoute } from 'astro';
import { siteName, siteUrl, contacts } from '../data/site';
import { offices, officesLocList } from '../data/offices';
import { navGroups, navServices, navCalculators } from '../data/navigation';
import { blogPosts } from '../data/blog-posts';

const base = siteUrl.replace(/\/$/, '');

const serviceSources = import.meta.glob<string>(
	['./uslugi/*/index.astro', './uslugi/galvanicheskie-pokrytiya/*/index.astro'],
	{ query: '?raw', import: 'default', eager: true },
);

type Link = { title: string; href: string; note?: string };

/** ./uslugi/lazernaya-rezka/index.astro → { href: /uslugi/lazernaya-rezka/, h1, description } */
const services: Link[] = Object.entries(serviceSources).flatMap(([file, src]) => {
	const h1 = src.match(/\bh1="([^"]+)"/)?.[1];
	if (!h1) return [];
	return [{
		title: h1,
		href: file.replace(/^\.\//, '/').replace(/index\.astro$/, ''),
		note: src.match(/\bdescription="([^"]+)"/)?.[1],
	}];
});

const GALV = '/uslugi/galvanicheskie-pokrytiya/';
const navOrder = navServices.map((s) => s.href);
const byNav = (a: Link, b: Link) => {
	const ia = navOrder.indexOf(a.href);
	const ib = navOrder.indexOf(b.href);
	return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.title.localeCompare(b.title, 'ru');
};
const metalServices = services.filter((s) => !s.href.startsWith(GALV) || s.href === GALV).sort(byNav);
const galvanic = services.filter((s) => s.href.startsWith(GALV) && s.href !== GALV).sort(byNav);

const catalog: Link[] = navGroups.flatMap((g) =>
	g.items.filter((i) => !i.empty).map((i) => ({ title: i.title, href: i.href, note: i.meta })),
);

const line = (l: Link) => `- [${l.title}](${base}${l.href})${l.note ? `: ${l.note}` : ''}`;
const section = (title: string, links: Link[]) => [`## ${title}`, '', ...links.map(line), ''];

const body = [
	`# ${siteName}`,
	'',
	`> Поставщик нержавеющего металлопроката — лист, рулон, лента, труба, круг, полоса, уголок, проволока, детали трубопровода — и услуги металлообработки и гальванических покрытий. Головной офис — Нижний Новгород, офисы в ${offices.length} городах, доставка по всей России.`,
	'',
	`- Компания: ${contacts.company}, ИНН ${contacts.inn}`,
	`- Офисы — в ${officesLocList()}. Отправляем по всей России.`,
	`- Телефон: ${contacts.phone}, e-mail: ${contacts.email}`,
	'- Металлообработку и гальванические покрытия выполняем в собственном цехе; стоимость считаем по чертежу или фото деталей. Цинкование — от 39 ₽ за килограмм деталей.',
	`- Запрос коммерческого предложения и расчёт: ${base}/zapros-kp/`,
	'',
	...section('Каталог нержавеющего металлопроката', catalog),
	...section('Услуги металлообработки', metalServices),
	...section('Гальванические покрытия', galvanic),
	...section('Калькуляторы', navCalculators.map((c) => ({ title: c.label, href: c.href }))),
	...section('Статьи', blogPosts.map((p) => ({ title: p.title, href: `/blog/${p.slug}/`, note: p.lead }))),
	...section('Компания', [
		{ title: 'О компании', href: '/o-kompanii/' },
		{ title: 'Доставка и оплата', href: '/dostavka-i-oplata/' },
		{ title: 'Поставка нержавеющего металлопроката', href: '/postavka-nerzhaveyushchego-metalloprokata/' },
		{ title: 'Справочник по нержавеющей стали', href: '/spravochnik/' },
		{ title: 'Справочник ГОСТов', href: '/gost/' },
		{ title: 'Контакты и адреса офисов', href: '/kontakty/' },
	]),
].join('\n');

export const GET: APIRoute = () =>
	new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
