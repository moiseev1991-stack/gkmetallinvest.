// Generates fallback category images for hubs without their own photos.
// Source images are picked thematically from existing /img/catalog/<hub>/<sub>.webp.
// Each variant is mildly transformed (gamma + brightness + small crop offset)
// so search engines see distinct files.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '../..');
const IMG_DIR = join(ROOT, 'public/img/catalog');

// Mapping: target hub → source webp file (relative to IMG_DIR)
const FALLBACKS = [
	{ target: 'metizy/cover.webp', source: 'provoloka/osnovnaya.webp' },
	{ target: 'elektrody/cover.webp', source: 'provoloka/osnovnaya.webp' },
	{ target: 'podshipniki/cover.webp', source: 'detali-truboprovoda/flanec.webp' },
	{ target: 'lenta/cover.webp', source: 'rulon/nikelesod.webp' },
	{ target: 'folga/cover.webp', source: 'rulon/nikelesod.webp' },
	{ target: 'dekorativnye-listy/cover.webp', source: 'list/nikelesod.webp' },
];

async function variantize(srcPath, outPath, seed) {
	const buf = await readFile(srcPath);
	// distinct parameters per file so output webps have different bytes/perceptual-hash
	const gamma = 1.0 + (seed % 7) * 0.01; // 1.00–1.06
	const brightness = 0.94 + ((seed >> 2) % 10) * 0.012; // 0.94–1.05
	const hue = ((seed * 13) % 30) - 15; // ±15° hue rotation
	const left = (seed % 4) * 8; // 0/8/16/24 px crop offset
	const top = ((seed >> 3) % 4) * 8;

	let pipe = sharp(buf);
	const meta = await pipe.metadata();
	if (meta.width && meta.height && (left > 0 || top > 0)) {
		pipe = pipe.extract({
			left,
			top,
			width: meta.width - left,
			height: meta.height - top,
		});
	}
	await pipe
		.resize({ width: 800, height: 800, fit: 'cover', position: 'centre' })
		.modulate({ brightness, hue })
		.gamma(gamma)
		.webp({ quality: 80, effort: 4 })
		.toFile(outPath);
}

async function main() {
	let i = 0;
	for (const { target, source } of FALLBACKS) {
		const srcPath = join(IMG_DIR, source);
		const outPath = join(IMG_DIR, target);
		if (!existsSync(srcPath)) {
			console.warn(`! source missing: ${srcPath}`);
			continue;
		}
		await mkdir(dirname(outPath), { recursive: true });
		await variantize(srcPath, outPath, ++i * 17 + 5);
		console.log(`✔ ${target} ← ${source}`);
	}
}

main().catch((err) => { console.error(err); process.exit(1); });
