import type { APIRoute } from 'astro';
import { siteNoindex, siteUrl } from '../data/site';

const base = siteUrl.replace(/\/$/, '');

const host = base.replace(/^https?:\/\//, '');

const openBody = [
	'User-agent: *',
	'Allow: /',
	'',
	'# служебные страницы — не для индекса',
	'Disallow: /404',
	'',
	'# склейка рекламных меток, чтобы не плодить дубли (директива Яндекса)',
	'Clean-param: utm_source&utm_medium&utm_campaign&utm_term&utm_content&yclid&gclid&_openstat&from&roistat',
	'',
	`Host: ${host}`,
	`Sitemap: ${base}/sitemap-index.xml`,
	'',
].join('\n');

const body = siteNoindex ? `User-agent: *\nDisallow: /\n` : openBody;

export const GET: APIRoute = () =>
	new Response(body, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
