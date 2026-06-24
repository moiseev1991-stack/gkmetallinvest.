// One-shot: добавить «ГОСТ » перед номером стандарта в sku.name, где он
// потерялся. На /detali-truboprovoda/ 233 SKU писали «...17378-2001», а
// 22 — «...ГОСТ 17378-2001»; в одной таблице это выглядело как разные
// записи (репорт клиента 24.06.2026). Все номера в данных — российские
// ГОСТы (17375 — отводы, 17376 — тройники, 17378 — переходы, 17380 —
// фитинги Ду, 12820/12821 — фланцы, 17379 — заглушки, 33259 — фланцы).

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const FILE = resolve(here, '../src/data/pricelist.json');

const data = JSON.parse(await readFile(FILE, 'utf8'));
let touched = 0;

for (const hub of Object.keys(data.hubs || {})) {
	for (const sku of data.hubs[hub]) {
		const n = String(sku.name || '');
		if (!n) continue;
		/* Захватываем номер NNNN-YY[YY] вместе с опциональным префиксом
		   стандарта слева. Если префикс есть — отдаём как было; если нет —
		   ставим «ГОСТ ». Граница справа — \b (не цифра/буква), чтобы не
		   разрывать длинные коды артикулов. */
		const out = n.replace(/(^|\s)((?:ГОСТ|ISO|DIN|ОСТ|EN|ТУ)\s+)?(\d{4,5}-\d{2,4})\b/g,
			(_m, lead, prefix, num) => `${lead}${prefix || 'ГОСТ '}${num}`);
		if (out !== n) {
			sku.name = out;
			touched++;
		}
	}
}

await writeFile(FILE, JSON.stringify(data, null, '\t') + '\n', 'utf8');
console.log('normalized:', touched, 'SKU names');
