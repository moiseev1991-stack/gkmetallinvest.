import type { APIRoute } from 'astro';
import { siteNoindex, siteUrl } from '../data/site';

const base = siteUrl.replace(/\/$/, '');

const body = siteNoindex
	? `User-agent: *\nDisallow: /\n`
	: `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap-index.xml\n`;

export const GET: APIRoute = () =>
	new Response(body, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
