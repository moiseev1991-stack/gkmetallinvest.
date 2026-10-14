#!/usr/bin/env node
/**
 * Готовит инкрементальный деплой: сравнивает хэши файлов dist/ с манифестом прошлого
 * успешного деплоя и копирует в отдельную папку только новые и изменённые файлы.
 * Так на хостинг уходят сотни файлов вместо десятков тысяч (lftp сравнивает по времени,
 * а у свежей сборки оно у всех новее, поэтому раньше заливалось всё).
 *
 * Использование:
 *   node scripts/deploy-diff.mjs <dist> <прошлый-манифест|-> <папка-изменений> <новый-манифест>
 *
 * «-» вместо манифеста или битый/пустой манифест = полная заливка (безопасный запасной путь).
 * send-config.php (секреты) в манифест не попадает и копируется в изменения всегда.
 * Новый манифест на сервер кладёт workflow ПОСЛЕ успешной заливки: оборванный прогон
 * оставит старый манифест, и следующий деплой просто повторит недостающее.
 */
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const [distDir, prevPath, changedDir, outManifest] = process.argv.slice(2);
if (!distDir || !prevPath || !changedDir || !outManifest) {
	console.error('usage: deploy-diff.mjs <dist> <prev-manifest|-> <changed-dir> <out-manifest>');
	process.exit(2);
}
if (!existsSync(distDir)) {
	console.error('deploy-diff: нет папки ' + distDir);
	process.exit(1);
}

const ALWAYS = new Set(['send-config.php']);

function walk(dir, base = '') {
	const out = [];
	for (const name of readdirSync(dir)) {
		if (name.startsWith('.git')) continue;
		const rel = base ? base + '/' + name : name;
		const full = join(dir, name);
		if (statSync(full).isDirectory()) out.push(...walk(full, rel));
		else out.push(rel);
	}
	return out;
}

const hashOf = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

let prev = null;
if (prevPath !== '-' && existsSync(prevPath)) {
	try {
		const j = JSON.parse(readFileSync(prevPath, 'utf8'));
		if (j && j.version === 1 && j.files && typeof j.files === 'object' && Object.keys(j.files).length > 0) prev = j.files;
	} catch {
		prev = null;
	}
}

const files = walk(distDir).sort();
const current = {};
const changed = [];
for (const rel of files) {
	if (ALWAYS.has(rel)) {
		changed.push(rel);
		continue;
	}
	const h = hashOf(join(distDir, rel));
	current[rel] = h;
	if (!prev || prev[rel] !== h) changed.push(rel);
}

rmSync(changedDir, { recursive: true, force: true });
mkdirSync(changedDir, { recursive: true });
for (const rel of changed) {
	const to = join(changedDir, rel);
	mkdirSync(dirname(to), { recursive: true });
	copyFileSync(join(distDir, rel), to);
}

writeFileSync(outManifest, JSON.stringify({ version: 1, files: current }));

console.log(
	'deploy-diff: файлов в сборке ' + files.length + ', к заливке ' + changed.length +
		(prev ? ' (сравнение с прошлым деплоем)' : ' (полная заливка: прошлого манифеста нет)'),
);
for (const rel of changed.slice(0, 25)) console.log('  ' + rel);
if (changed.length > 25) console.log('  … и ещё ' + (changed.length - 25));
