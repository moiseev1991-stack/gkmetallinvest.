/** Резолвер картинки каталога с каскадом запасных вариантов.
 *
 * Модуль на чистом JS (не .ts) специально: его импортируют и компоненты
 * (`ProductDetail.astro`), и скрипт-аудитор `scripts/audit-images.mjs`. Иначе
 * «какую картинку показывает карточка» и «что проверяет аудит» разъезжаются.
 *
 * Предыстория. Карточка собирала путь жёстко — `/img/catalog/<hub>/<sub>.webp`.
 * Файла нет → `onerror` прячет <img>, остаётся заглушка. На 2026-08-02 так
 * молча пустовали 832 карточки из 4197 (20 %), причём не из-за отсутствия фото:
 * скрапер mc.ru кладёт файл под именем `sub` из categories.mjs, а постобработка
 * прайса эти `sub` переименовывает (`flanec` → `flanec-ploskiy` /
 * `flanec-vorotnikovyy`, `ugolok` → `ugolok-ravnopolochnyy`). Имена разъехались —
 * карточки опустели. Имена в источниках починены, но сам класс ошибки
 * повторяется при каждом перепарсе, поэтому здесь — каскад:
 *
 *   1. /img/catalog/<hub>/<sub>.webp   — точное фото подкатегории
 *   2. /img/catalog/<hub>/cover.webp   — обложка раздела
 *   3. /img/catalog/<hub>.{jpg,png,webp,avif} — картинка хаба (та же, что на главной)
 *   4. null                            — рисуем SVG-заглушку в разметке
 *
 * Список файлов читается с диска один раз за сборку: в SSG это дешевле, чем
 * держать руками написанный реестр, который снова разъедется с реальностью.
 */

import { readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/* Путь к папке картинок ищем по нескольким кандидатам. Один `import.meta.url`
   ненадёжен: при сборке Astro этот модуль попадает в чанк Vite, лежащий в
   другом каталоге, и относительный путь промахивается — а промах здесь тихий,
   он рисует заглушку на всех 4 тыс. карточек. Поэтому пробуем и cwd (в билде и
   в npm-скриптах это корень проекта), а если не нашли — падаем с внятным
   сообщением, вместо того чтобы молча собрать сайт без фотографий. */
function resolveImgDir() {
	const candidates = [
		fileURLToPath(new URL('../../public/img/catalog', import.meta.url)),
		join(process.cwd(), 'public/img/catalog'),
	];
	const found = candidates.find((p) => existsSync(p));
	if (!found) {
		throw new Error(
			`catalog-images: не найдена папка public/img/catalog. Пробовал:\n  ${candidates.join('\n  ')}`,
		);
	}
	return found;
}

/** Набор существующих файлов: 'hub/sub.webp' и 'hub.jpg' (обложки хабов). */
let filesCache = null;
function files() {
	if (filesCache) return filesCache;
	const dir = resolveImgDir();
	const set = new Set();
	for (const entry of readdirSync(dir)) {
		const p = join(dir, entry);
		if (statSync(p).isDirectory()) {
			for (const file of readdirSync(p)) {
				if (statSync(join(p, file)).isFile()) set.add(`${entry}/${file}`);
			}
		} else {
			set.add(entry);
		}
	}
	filesCache = set;
	return set;
}

/** Расширения обложки хаба — исторически разные: list.jpg, truba.png,
 *  dekorativnye.webp, folga.avif. */
const HUB_COVER_EXT = ['jpg', 'png', 'webp', 'avif'];

/** Хабы, чья обложка лежит под именем, не совпадающим с ключом хаба. */
const HUB_COVER_ALIAS = {
	'dekorativnye-listy': 'dekorativnye',
};

/**
 * Путь к картинке карточки. Возвращает первый существующий вариант каскада
 * или null, если у раздела нет вообще ни одного изображения.
 *
 * @param {string} hub — ключ хаба, например 'lenta'
 * @param {string} sub — подкатегория из прайса, например 'nikelesod'
 * @returns {string|null} абсолютный путь от корня сайта либо null
 */
export function catalogImage(hub, sub) {
	if (!hub) return null;
	const all = files();

	if (sub && all.has(`${hub}/${sub}.webp`)) return `/img/catalog/${hub}/${sub}.webp`;
	if (all.has(`${hub}/cover.webp`)) return `/img/catalog/${hub}/cover.webp`;

	const base = HUB_COVER_ALIAS[hub] || hub;
	for (const ext of HUB_COVER_EXT) {
		if (all.has(`${base}.${ext}`)) return `/img/catalog/${base}.${ext}`;
	}
	return null;
}

/**
 * Насколько «родная» картинка досталась паре hub/sub. Нужно аудиту, чтобы
 * отличать «фото своей подкатегории» от «подставилась обложка раздела».
 *
 * @returns {'exact'|'cover'|'hub'|'none'}
 */
export function catalogImageLevel(hub, sub) {
	const all = files();
	if (sub && all.has(`${hub}/${sub}.webp`)) return 'exact';
	if (all.has(`${hub}/cover.webp`)) return 'cover';
	const base = HUB_COVER_ALIAS[hub] || hub;
	if (HUB_COVER_EXT.some((ext) => all.has(`${base}.${ext}`))) return 'hub';
	return 'none';
}

/** Все файлы каталога — аудиту, чтобы находить картинки без товаров. */
export function catalogImageFiles() {
	return [...files()];
}
