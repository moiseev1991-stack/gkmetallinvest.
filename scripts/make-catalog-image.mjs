// Делает карточную картинку каталога из реального фото.
//
// Карточка товара и блок «Похожие позиции» берут файл строго по пути
// /img/catalog/<hub>/<sub>.webp (см. ProductDetail.astro). Если файла нет —
// картинка прячется и остаётся заглушка. Этот скрипт кладёт фото под нужным
// именем в едином для каталога формате: квадрат 800×800, webp q82, без EXIF.
//
// Использование:
//   node scripts/make-catalog-image.mjs <исходное-фото> <hub>/<sub> [--top=N] [--left=N] [--size=N]
//
// Пример:
//   node scripts/make-catalog-image.mjs public/produkt/photo_5.jpg lenta/nikelesod
//
// --top/--left/--size — необязательный кроп исходника в пикселях ДО ресайза,
// когда центр кадра не совпадает с интересным местом.

import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '..');
const IMG_DIR = join(ROOT, 'public/img/catalog');

const positional = [];
const flags = {};
for (const a of process.argv.slice(2)) {
	const m = a.match(/^--([^=]+)(?:=(.*))?$/);
	if (m) flags[m[1]] = m[2] ?? true;
	else positional.push(a);
}

const [srcArg, targetArg] = positional;
if (!srcArg || !targetArg) {
	console.error('Использование: node scripts/make-catalog-image.mjs <фото> <hub>/<sub> [--top=N --left=N --size=N]');
	process.exit(1);
}

const srcPath = resolve(ROOT, srcArg);
if (!existsSync(srcPath)) {
	console.error(`Нет исходного файла: ${srcPath}`);
	process.exit(1);
}

const [hub, sub] = targetArg.replace(/\.webp$/, '').split('/');
if (!hub || !sub) {
	console.error('Цель указывается как <hub>/<sub>, например lenta/nikelesod');
	process.exit(1);
}

const outPath = join(IMG_DIR, hub, `${sub}.webp`);
await mkdir(dirname(outPath), { recursive: true });

let pipe = sharp(srcPath).rotate(); // rotate() без аргумента — по EXIF-ориентации
const meta = await pipe.metadata();

if (flags.size || flags.top || flags.left) {
	const size = Number(flags.size) || Math.min(meta.width, meta.height);
	const left = Number(flags.left) || 0;
	const top = Number(flags.top) || 0;
	pipe = pipe.extract({
		left,
		top,
		width: Math.min(size, meta.width - left),
		height: Math.min(size, meta.height - top),
	});
}

await pipe
	.resize({ width: 800, height: 800, fit: 'cover', position: 'centre' })
	.webp({ quality: 82, effort: 4 })
	.toFile(outPath);

console.log(`✔ /img/catalog/${hub}/${sub}.webp ← ${srcArg} (исходник ${meta.width}×${meta.height})`);
