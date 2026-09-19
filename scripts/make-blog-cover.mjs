#!/usr/bin/env node
/**
 * Обложка статьи блога 1200×630: PNG (og:image, Article.image) + WebP (на странице).
 * SVG-обложки соцсети и поисковики в og:image / schema.org не принимают — поэтому растр.
 *
 *   node scripts/make-blog-cover.mjs <slug> "Строка 1|Строка 2|Строка 3" "Подпись"
 *
 * Строки заголовка разделяются «|» (перенос делаем руками — так надёжнее, чем
 * автоматический подбор ширины кириллицы). Пишет public/img/blog/<slug>.png и .webp.
 */
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const [slug, titleArg, subtitle = ''] = process.argv.slice(2);
if (!slug || !titleArg) {
	console.error('usage: node scripts/make-blog-cover.mjs <slug> "Строка 1|Строка 2" "Подпись"');
	process.exit(1);
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const lines = titleArg.split('|').map((s) => s.trim()).filter(Boolean);
const size = lines.length > 2 ? 58 : 66;
const lineH = Math.round(size * 1.18);
const top = 250 - ((lines.length - 1) * lineH) / 2;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#163b66"/>
      <stop offset="1" stop-color="#0d2745"/>
    </linearGradient>
    <linearGradient id="steel" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#cfd8e3" stop-opacity="0.9"/>
      <stop offset="0.5" stop-color="#ffffff" stop-opacity="0.95"/>
      <stop offset="1" stop-color="#9fb0c4" stop-opacity="0.9"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <g opacity="0.10" stroke="#ffffff" stroke-width="2">
    ${Array.from({ length: 14 }, (_, i) => `<line x1="${760 + i * 34}" y1="0" x2="${560 + i * 34}" y2="630"/>`).join('')}
  </g>
  <rect x="72" y="72" width="12" height="486" rx="6" fill="url(#steel)"/>
  <text x="110" y="112" font-family="Arial, 'DejaVu Sans', sans-serif" font-size="26" font-weight="700" fill="#d9a36b" letter-spacing="2">ГК МЕТАЛЛИНВЕСТ · БЛОГ</text>
  ${lines
		.map(
			(l, i) =>
				`<text x="110" y="${Math.round(top + i * lineH)}" font-family="Arial, 'DejaVu Sans', sans-serif" font-size="${size}" font-weight="700" fill="#ffffff">${esc(l)}</text>`,
		)
		.join('\n  ')}
  ${subtitle ? `<text x="110" y="540" font-family="Arial, 'DejaVu Sans', sans-serif" font-size="30" fill="#c9d6e6">${esc(subtitle)}</text>` : ''}
</svg>`;

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'img', 'blog');
const img = sharp(Buffer.from(svg), { density: 96 }).resize(1200, 630);
await img.clone().png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(join(out, `${slug}.png`));
await img.clone().webp({ quality: 86 }).toFile(join(out, `${slug}.webp`));
console.log(`ok: public/img/blog/${slug}.png + .webp`);
