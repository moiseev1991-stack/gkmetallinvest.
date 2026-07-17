/**
 * Оптимизация портретов команды: PNG 1122×1402 (~1.7 МБ) → WebP 600×750.
 * Источник — папка foto-tim/ (не в репозитории), результат — public/img/team/.
 * Запуск: node scripts/process-team-photos.mjs
 */
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const OUT = 'public/img/team';
mkdirSync(OUT, { recursive: true });

const map = [
	['foto-tim/Галанов_Антон_Олегович_Генеральный_директор.png', 'galanov-anton'],
	['foto-tim/Галанов_Андрей_Олегович_Коммерческий_Директор.png', 'galanov-andrey'],
	['foto-tim/Чистяков_Никита_Руководитель_отдела_продаж.png', 'chistyakov-nikita'],
	['foto-tim/Васильева_Елена_Ассистент_коммерческого_отдела.png', 'vasileva-elena'],
];

for (const [src, slug] of map) {
	await sharp(src)
		.resize(600, 750, { fit: 'cover', position: 'top' })
		.webp({ quality: 82 })
		.toFile(`${OUT}/${slug}.webp`);
	console.log('✓', slug + '.webp');
}
