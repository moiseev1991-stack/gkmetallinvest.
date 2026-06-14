/**
 * Скачивает все PDF ГОСТов с meganorm.ru в public/gost/pdf/{slug}.pdf.
 *
 * Список ГОСТов парсится из src/data/gosts.ts регулярным выражением
 * (динамический импорт TS-файла в Node без сборки не работает).
 *
 * Запуск:  node scripts/download-gost-pdfs.mjs
 *
 * Идемпотентен: если файл уже скачан и размер > 0, он пропускается.
 * Передайте --force, чтобы перекачать заново.
 */
import { readFile, mkdir, stat, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const GOSTS_TS = resolve(ROOT, 'src/data/gosts.ts');
const OUT_DIR = resolve(ROOT, 'public/gost/pdf');

const FORCE = process.argv.includes('--force');
const CONCURRENCY = 4;
const TIMEOUT_MS = 60_000;

/** Повторяет gostSlug() из src/data/gosts.ts — иначе пути разойдутся. */
function gostSlug(num) {
	return num
		.replace(/[Рр]\s*/g, 'r-')
		.replace(/\./g, '-')
		.replace(/\s+/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9-]/g, '')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}

async function parseGosts() {
	const src = await readFile(GOSTS_TS, 'utf8');
	const re = /\{\s*num:\s*'([^']+)'[^}]*?pdf:\s*'([^']+)'/g;
	const out = [];
	let m;
	while ((m = re.exec(src)) !== null) {
		out.push({ num: m[1], pdf: m[2] });
	}
	return out;
}

async function fileExists(path) {
	try {
		const s = await stat(path);
		return s.size > 0;
	} catch {
		return false;
	}
}

async function download(url, dest) {
	const ac = new AbortController();
	const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
	try {
		const res = await fetch(url, {
			signal: ac.signal,
			headers: {
				// meganorm.ru отдаёт 403 без UA — притворяемся обычным браузером
				'user-agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
				accept: 'application/pdf,*/*',
			},
			redirect: 'follow',
		});
		if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
		const buf = Buffer.from(await res.arrayBuffer());
		if (buf.length < 1024) throw new Error(`Файл подозрительно мал (${buf.length} байт) — вероятно, не PDF`);
		// Грубая проверка сигнатуры PDF
		if (buf.subarray(0, 4).toString() !== '%PDF') {
			throw new Error('Ответ не является PDF (нет сигнатуры %PDF)');
		}
		await writeFile(dest, buf);
		return buf.length;
	} finally {
		clearTimeout(timer);
	}
}

async function run() {
	await mkdir(OUT_DIR, { recursive: true });
	const items = await parseGosts();
	console.log(`Найдено ГОСТов в gosts.ts: ${items.length}`);

	const tasks = items.map((it) => ({ ...it, slug: gostSlug(it.num) }));

	let ok = 0;
	let skipped = 0;
	const errors = [];

	const queue = [...tasks];
	async function worker(workerId) {
		while (queue.length) {
			const t = queue.shift();
			const dest = resolve(OUT_DIR, `${t.slug}.pdf`);
			if (!FORCE && (await fileExists(dest))) {
				skipped++;
				console.log(`[w${workerId}] ⊝ ${t.num} — уже есть`);
				continue;
			}
			try {
				const bytes = await download(t.pdf, dest);
				ok++;
				console.log(`[w${workerId}] ✓ ${t.num} (${(bytes / 1024).toFixed(0)} KB) ← ${t.pdf}`);
			} catch (err) {
				errors.push({ num: t.num, pdf: t.pdf, msg: err.message });
				console.log(`[w${workerId}] ✗ ${t.num}: ${err.message}`);
			}
		}
	}

	await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1)));

	console.log('');
	console.log(`Скачано: ${ok}, пропущено (уже было): ${skipped}, ошибок: ${errors.length}`);
	if (errors.length) {
		console.log('\nНеудачи:');
		for (const e of errors) console.log(`  ГОСТ ${e.num} — ${e.msg}\n    ${e.pdf}`);
		process.exitCode = 1;
	}
}

run().catch((e) => {
	console.error(e);
	process.exit(1);
});
