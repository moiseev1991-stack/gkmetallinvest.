#!/usr/bin/env node
/**
 * IndexNow — сообщаем Яндексу и Bing, какие страницы появились или изменились,
 * чтобы их переобошли сразу, а не когда дойдёт очередь. Bing — основной
 * источник ответов ChatGPT, Яндекс — Алисы.
 *
 * Ключ лежит в public/<KEY>.txt: поисковик скачивает его и так проверяет, что
 * запрос пришёл от владельца сайта. Ключ публичный по протоколу, не секрет.
 *
 *   node scripts/indexnow.mjs /uslugi/lazernaya-rezka/ /blog/   — указанные адреса
 *   node scripts/indexnow.mjs --git <from> <to>  — страницы, чьи файлы поменялись
 *                                                 между коммитами (шаг деплоя)
 *   node scripts/indexnow.mjs --all              — весь sitemap (разово)
 *   … --dry                                      — только показать, что ушло бы
 *
 * Отправляем только адреса из sitemap — несуществующие и закрытые от индекса
 * страницы так не уходят. Sitemap берём из dist/ после сборки, если его нет —
 * с живого сайта.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const SITE = 'https://gkmetallinvest.ru';
const HOST = 'gkmetallinvest.ru';
const KEY = '127fb6c861332bf5d50e786d65dbea75';
const ENDPOINTS = ['https://yandex.com/indexnow', 'https://www.bing.com/indexnow'];
const CHUNK = 10000; // лимит протокола на один запрос

/* Шаблоны, общие для многих страниц: поменялся шаблон — переобходим весь раздел. */
const SHARED = {
	'src/components/ServicePage.astro': '/uslugi/',
	'src/data/service-panels.json': '/uslugi/',
	'src/components/BlogArticle.astro': '/blog/',
};

function locsFromXml(xml) {
	return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

async function loadSitemap() {
	if (existsSync('dist')) {
		const files = readdirSync('dist').filter((f) => /^sitemap-\d+\.xml$/.test(f));
		if (files.length) return new Set(files.flatMap((f) => locsFromXml(readFileSync(`dist/${f}`, 'utf8'))));
	}
	const index = await (await fetch(`${SITE}/sitemap-index.xml`)).text();
	const urls = new Set();
	for (const sm of locsFromXml(index)) {
		for (const u of locsFromXml(await (await fetch(sm)).text())) urls.add(u);
	}
	return urls;
}

/** src/pages/foo/bar/index.astro → /foo/bar/; динамические [slug] и эндпоинты .ts пропускаем. */
function pageUrl(file) {
	const m = file.match(/^src\/pages\/(.*)\.astro$/);
	if (!m || m[1].includes('[')) return null;
	const route = m[1].replace(/(^|\/)index$/, '');
	return `${SITE}/${route ? `${route}/` : ''}`;
}

function changedUrls(from, to, sitemap) {
	let out;
	try {
		out = execFileSync('git', ['diff', '--name-only', '--diff-filter=AM', from, to], { encoding: 'utf8' });
	} catch {
		console.log(`IndexNow: не удалось сравнить ${from}..${to} — пропускаем`);
		return [];
	}
	const urls = new Set();
	for (const file of out.split('\n').filter(Boolean)) {
		const prefix = SHARED[file];
		if (prefix) {
			for (const u of sitemap) if (u.startsWith(`${SITE}${prefix}`)) urls.add(u);
			continue;
		}
		const u = pageUrl(file);
		if (u) urls.add(u);
	}
	return [...urls];
}

async function submit(urls) {
	let ok = 0;
	for (let i = 0; i < urls.length; i += CHUNK) {
		const urlList = urls.slice(i, i + CHUNK);
		const body = JSON.stringify({ host: HOST, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList });
		for (const endpoint of ENDPOINTS) {
			try {
				const res = await fetch(endpoint, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json; charset=utf-8' },
					body,
				});
				const text = (await res.text()).slice(0, 200);
				console.log(`IndexNow ${endpoint}: ${res.status} ${urlList.length} адресов ${text}`);
				if (res.status === 200 || res.status === 202) ok++;
			} catch (e) {
				console.log(`IndexNow ${endpoint}: ошибка ${e.message}`);
			}
		}
	}
	return ok;
}

const dry = process.argv.includes('--dry');
const args = process.argv.slice(2).filter((a) => a !== '--dry');
const sitemap = await loadSitemap();
let urls;
if (args[0] === '--all') {
	urls = [...sitemap];
} else if (args[0] === '--git') {
	urls = changedUrls(args[1], args[2], sitemap);
} else {
	urls = args.map((a) => (a.startsWith('http') ? a : `${SITE}${a.startsWith('/') ? '' : '/'}${a}`));
}

const skipped = urls.filter((u) => !sitemap.has(u));
urls = urls.filter((u) => sitemap.has(u));
if (skipped.length) console.log(`IndexNow: нет в sitemap, пропускаем: ${skipped.join(' ')}`);
if (!urls.length) {
	console.log('IndexNow: отправлять нечего');
	process.exit(0);
}
console.log(`IndexNow: отправляем ${urls.length} адресов`);
if (urls.length <= 40) console.log(urls.join('\n'));
if (dry) process.exit(0);
const ok = await submit(urls);
process.exit(ok ? 0 : 1);
