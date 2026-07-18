# ТЗ для Claude Code: перенос калькуляторов и справочника ГОСТов

> **Кому.** Другой сессии Claude Code, работающей на новом Astro-проекте.
> **Что делать.** Скачать готовые файлы 11 калькуляторов и справочника 112 ГОСТов из публичного репозитория `gkmetallinvest.` и вставить в целевой проект.
> **Работает ли.** Все URL проверены `curl` 2026-07-07 — `200 OK`. Репозиторий публичный, авторизация не нужна.

---

## 0. Источник — прямые URL

**Репозиторий** (публичный, на GitHub):

```
https://github.com/moiseev1991-stack/gkmetallinvest.
```

**⚠️ ВНИМАНИЕ:** в имени репозитория **точка на конце** — это часть имени. Без неё возвращается 404.

**База raw-URL** для скачивания любого файла:

```
https://raw.githubusercontent.com/moiseev1991-stack/gkmetallinvest./main/{путь-в-репо}
```

**Проверка доступа** (запустить первым делом):

```bash
curl -sI "https://raw.githubusercontent.com/moiseev1991-stack/gkmetallinvest./main/package.json" | head -1
# Ожидаемый ответ: HTTP/2 200
```

Если 200 — всё работает, можно качать любой файл по паттерну выше. Если 404 — проверить, что точка на конце имени сохранилась (не съелась escape'ом в оболочке).

---

## 1. Что переносим — три группы

| Группа | Файлов | Обязательность |
|---|---:|---|
| **A.** Инфраструктура: layout + tokens + 2 компонента | 5 | обязательно |
| **B.** Справочник ГОСТов: 3 файла страниц + 112 PDF | 3 + 112 | если нужны ГОСТы |
| **C.** 11 калькуляторов (по 1 файлу на каждый) | 11 | сколько нужно, столько и берём |

Все три группы можно переносить независимо, но **A обязательна** — без неё Б и В не соберутся.

---

## 2. Группа A — инфраструктура (обязательная)

Скачать 5 файлов и положить по тем же путям в целевом проекте:

| Локальный путь в целевом проекте | Прямая ссылка (raw) |
|---|---|
| `src/styles/tokens.css` | https://raw.githubusercontent.com/moiseev1991-stack/gkmetallinvest./main/src/styles/tokens.css |
| `src/styles/global.css` | https://raw.githubusercontent.com/moiseev1991-stack/gkmetallinvest./main/src/styles/global.css |
| `src/layouts/BaseLayout.astro` | https://raw.githubusercontent.com/moiseev1991-stack/gkmetallinvest./main/src/layouts/BaseLayout.astro |
| `src/components/Breadcrumbs.astro` | https://raw.githubusercontent.com/moiseev1991-stack/gkmetallinvest./main/src/components/Breadcrumbs.astro |
| `src/components/CtaSection.astro` | https://raw.githubusercontent.com/moiseev1991-stack/gkmetallinvest./main/src/components/CtaSection.astro |

**Скачать всё пачкой:**

```bash
BASE="https://raw.githubusercontent.com/moiseev1991-stack/gkmetallinvest./main"
mkdir -p src/styles src/layouts src/components
curl -sf "$BASE/src/styles/tokens.css"          -o src/styles/tokens.css
curl -sf "$BASE/src/styles/global.css"          -o src/styles/global.css
curl -sf "$BASE/src/layouts/BaseLayout.astro"   -o src/layouts/BaseLayout.astro
curl -sf "$BASE/src/components/Breadcrumbs.astro" -o src/components/Breadcrumbs.astro
curl -sf "$BASE/src/components/CtaSection.astro"  -o src/components/CtaSection.astro
```

### Что править после скачивания

**`BaseLayout.astro`** — импортирует из `../data/site`:
```ts
import { siteName, siteUrl, siteNoindex, siteOgImage } from '../data/site';
```
На новом проекте либо создать `src/data/site.ts` с этими же экспортами:
```ts
export const siteName = 'Название вашего сайта';
export const siteUrl = 'https://ваш-домен.ru';
export const siteNoindex = false;  // true если сайт ещё в разработке
export const siteOgImage = '/img/og-default.png';
```
Либо заменить импорты на константы прямо в `BaseLayout.astro`.

**`Breadcrumbs.astro`** — тот же импорт `siteUrl` из `../data/site`, работает автоматически, если `site.ts` создан.

**`CtaSection.astro`, строка 18** — hardcoded телефон:
```astro
<Button href={`tel:+78312812660`} variant="secondary">Позвонить</Button>
```
Заменить `+78312812660` на телефон нового сайта.

**Внимание.** `CtaSection.astro` использует компонент `Button` из `src/components/ui/Button.astro`. Его тоже надо скачать:

```
https://raw.githubusercontent.com/moiseev1991-stack/gkmetallinvest./main/src/components/ui/Button.astro
```

---

## 3. Группа B — справочник ГОСТов

### B.1. Три файла страниц + данные

| Локальный путь | Прямая ссылка |
|---|---|
| `src/data/gosts.ts` | https://raw.githubusercontent.com/moiseev1991-stack/gkmetallinvest./main/src/data/gosts.ts |
| `src/pages/gost/index.astro` | https://raw.githubusercontent.com/moiseev1991-stack/gkmetallinvest./main/src/pages/gost/index.astro |
| `src/pages/gost/[slug].astro` | https://raw.githubusercontent.com/moiseev1991-stack/gkmetallinvest./main/src/pages/gost/%5Bslug%5D.astro |

Обрати внимание: у `[slug].astro` квадратные скобки в URL надо экранировать как `%5B` и `%5D`.

**Скачать пачкой:**

```bash
BASE="https://raw.githubusercontent.com/moiseev1991-stack/gkmetallinvest./main"
mkdir -p src/data src/pages/gost
curl -sf "$BASE/src/data/gosts.ts"                   -o src/data/gosts.ts
curl -sf "$BASE/src/pages/gost/index.astro"          -o src/pages/gost/index.astro
curl -sf "$BASE/src/pages/gost/%5Bslug%5D.astro"     -o "src/pages/gost/[slug].astro"
```

### B.2. Что править в `[slug].astro`

Строки 31–47 — словарь `HUB_LABELS` вида `'/list/': 'Лист нержавеющий'`. Он связывает `gost.hub` с человекочитаемым названием раздела каталога. Если на новом сайте другие URL хабов — поправить. Если каталога нет — заменить весь словарь на `{}`, тогда блок «В каталог» просто не отрендерится.

### B.3. PDF-файлы стандартов (112 шт)

Все PDF уже готовы в репозитории, лежат по паттерну `public/gost/pdf/{slug}.pdf`. **Скачать одной командой:**

```bash
BASE="https://raw.githubusercontent.com/moiseev1991-stack/gkmetallinvest./main/public/gost/pdf"
mkdir -p public/gost/pdf

SLUGS="103-76 1050-88 1066-90 10704-91 10705-80 10706-76 10884-94 11068-81 11069-01 1133-71 \
11474-76 1173-93 1180-91 1208-90 1209-90 1215-79 12815-80 12816-80 12820-80 12821-80 \
1320-74 13663-86 1435-99 14637-89 14918-80 14959-79 1535-91 15527-04 1577-93 1628-78 \
16523-97 17232-99 17375-2001 17380-83 18175-78 18482-79 19265-73 19281-89 19425-74 19903-74 \
19904-90 20072-74 2060-90 21488-97 21631-76 21646-03 21930-76 21931-76 2208-91 22861-93 \
24045-94 2590-88 2591-88 30136-95 30245-03 30246-94 3262-75 3640-94 3778-98 380-94 \
3836-83 4041-71 434-78 4405-75 4543-71 4784-97 494-90 495-92 5267-1-90 535-2005 \
550-75 5582-75 5632-72 5781-82 5950-2000 598-90 617-90 7350-77 7511-73 801-78 \
8239-89 8240-97 8278-83 8281-80 8509-93 8510-86 8568-77 859-01 860-75 8639-82 \
8642-68 8645-68 8731-87 8732-78 8733-74 8734-75 8944-75 8946-75 8947-75 8948-75 \
8949-75 8952-75 8956-75 8960-75 8965-75 8969-75 9045-93 931-90 9559-89 9940-81 \
9941-81 r-52544-2006"

for slug in $SLUGS; do
  curl -sf "$BASE/${slug}.pdf" -o "public/gost/pdf/${slug}.pdf" && echo "✓ $slug" || echo "✗ $slug"
done
```

**Альтернатива** (если curl-цикл нестабилен) — склонировать репозиторий целиком и взять папку:

```bash
git clone --depth 1 "https://github.com/moiseev1991-stack/gkmetallinvest..git" _src_gk
cp -r _src_gk/public/gost/pdf public/gost/pdf
rm -rf _src_gk
```

**Проверка:** после скачивания должно быть 112 PDF-файлов в `public/gost/pdf/`, ни один не должен быть 0 байт.

```bash
ls public/gost/pdf | wc -l          # → 112
find public/gost/pdf -size 0 -print # → пусто
```

### B.4. Если оригинал PDF нужен со стороннего источника

Проект качал PDF с **meganorm.ru** через `scripts/download-gost-pdfs.mjs`. Скрипт сохранён в репо для истории, но раскачивать заново обычно не нужно — файлы уже в репозитории.

Внешние источники PDF стандартов (если понадобится обновить):
- **meganorm.ru** — https://meganorm.ru/ (нужен UA-заголовок браузера, иначе 403)
- **docs.cntd.ru** — https://docs.cntd.ru/ (Техэксперт)
- **standartgost.ru** — https://standartgost.ru/
- **gostinfo.ru** — https://www.gostinfo.ru/ (ФГБУ Стандартинформ, официальный)

---

## 4. Группа C — 11 калькуляторов

Каждый калькулятор — **один самодостаточный `.astro`-файл** в папке `src/pages/kalkulyator-*/index.astro`. Внутри frontmatter + разметка + inline `<style>` + inline `<script>`. Никаких общих модулей, кроме `BaseLayout`, `Breadcrumbs`, `CtaSection`.

### Таблица «URL страницы → raw-URL файла»

| URL на сайте | Строк | Прямая ссылка (raw) |
|---|---:|---|
| `/kalkulyator-vesa/` | 1 588 | https://raw.githubusercontent.com/moiseev1991-stack/gkmetallinvest./main/src/pages/kalkulyator-vesa/index.astro |
| `/kalkulyator-armatury/` | 822 | https://raw.githubusercontent.com/moiseev1991-stack/gkmetallinvest./main/src/pages/kalkulyator-armatury/index.astro |
| `/kalkulyator-shvellera/` | 840 | https://raw.githubusercontent.com/moiseev1991-stack/gkmetallinvest./main/src/pages/kalkulyator-shvellera/index.astro |
| `/kalkulyator-balki/` | 667 | https://raw.githubusercontent.com/moiseev1991-stack/gkmetallinvest./main/src/pages/kalkulyator-balki/index.astro |
| `/kalkulyator-otvoda/` | 551 | https://raw.githubusercontent.com/moiseev1991-stack/gkmetallinvest./main/src/pages/kalkulyator-otvoda/index.astro |
| `/kalkulyator-flantsa/` | 473 | https://raw.githubusercontent.com/moiseev1991-stack/gkmetallinvest./main/src/pages/kalkulyator-flantsa/index.astro |
| `/kalkulyator-riflenogo-lista/` | 528 | https://raw.githubusercontent.com/moiseev1991-stack/gkmetallinvest./main/src/pages/kalkulyator-riflenogo-lista/index.astro |
| `/kalkulyator-pvl/` | 483 | https://raw.githubusercontent.com/moiseev1991-stack/gkmetallinvest./main/src/pages/kalkulyator-pvl/index.astro |
| `/kalkulyator-ovalnoy-truby/` | 469 | https://raw.githubusercontent.com/moiseev1991-stack/gkmetallinvest./main/src/pages/kalkulyator-ovalnoy-truby/index.astro |
| `/kalkulyator-setki/` | 528 | https://raw.githubusercontent.com/moiseev1991-stack/gkmetallinvest./main/src/pages/kalkulyator-setki/index.astro |
| `/kalkulyator-rulona/` | 487 | https://raw.githubusercontent.com/moiseev1991-stack/gkmetallinvest./main/src/pages/kalkulyator-rulona/index.astro |

**Скачать все 11 одной командой:**

```bash
BASE="https://raw.githubusercontent.com/moiseev1991-stack/gkmetallinvest./main/src/pages"

CALCS="kalkulyator-vesa kalkulyator-armatury kalkulyator-shvellera kalkulyator-balki \
kalkulyator-otvoda kalkulyator-flantsa kalkulyator-riflenogo-lista kalkulyator-pvl \
kalkulyator-ovalnoy-truby kalkulyator-setki kalkulyator-rulona"

for c in $CALCS; do
  mkdir -p "src/pages/$c"
  curl -sf "$BASE/$c/index.astro" -o "src/pages/$c/index.astro" && echo "✓ $c" || echo "✗ $c"
done
```

### Что править в каждом калькуляторе

1. **Ссылки в блоке «Перейти в каталог»** (~в середине файла) — списки вида `[{ href: '/list/', label: 'Лист' }, ...]`. Если у нового сайта другие URL — заменить.
2. **Ссылки в блоке «Специализированные калькуляторы»** — если переносишь не все 11, битые ссылки на непереехавшие калькуляторы надо убрать.
3. **CTA-кнопки** ведут на `/zapros-kp/#lead-form`. Если у нового сайта форма заявки называется иначе — сделать `sed -i "s|/zapros-kp/|/ваш-путь/|g" src/pages/kalkulyator-*/index.astro`.
4. **`kalkulyator-vesa/index.astro`** — импортирует `siteUrl`, `siteName` из `../../data/site`. Работает автоматически, если `src/data/site.ts` создан (см. раздел 2).

### Что стоит за каждым калькулятором

| Калькулятор | Логика | Источник данных |
|---|---|---|
| Вес (общий) | 9 форм проката × 4 группы марок + custom-ρ | Формулы геометрии, ρ из ГОСТ 5632 |
| Арматура | Табличный: m₁ по диаметру | ГОСТ 5781-82, таблица захаркожена в файле |
| Швеллер | Табличный: масса профилей 5П…40П | ГОСТ 8240-97 |
| Балка | Табличный: масса двутавров №10–60 | ГОСТ 8239-89 |
| Отвод | Формульный + таблица радиусов | ГОСТ 17375-2001, R=1.0D / R=1.5D |
| Фланец | Табличный | ГОСТ 12820-80 / 33259-2015 |
| Рифлёный лист | Формула + добавка на рифли | ГОСТ 8568-77 (ромб/чечевица) |
| ПВЛ | Формула с коэффициентом просечки | ГОСТ 8706-78 |
| Овальная труба | Формула плоскоовального периметра | Нет ГОСТа |
| Сетка | 2 режима: тканая (2 проволоки/ячейка) + сварная | ГОСТ 3826 / ГОСТ 23279 |
| Рулон | Формула массы намотки | Геометрия: π/4 · (D²внеш − D²вн) · b · ρ |

**Все табличные значения и константы — уже внутри файлов**, их не надо выносить в отдельные data-файлы. Разработчику ничего не нужно переписывать по формулам, если он не собирается их проверять.

---

## 5. Adaptation checklist — что править после скачивания

Одноразовые правки, которые надо сделать один раз в целевом проекте после того, как всё скачано.

- [ ] Создать `src/data/site.ts` с `siteName`, `siteUrl`, `siteNoindex`, `siteOgImage`.
- [ ] В `src/styles/tokens.css` — при желании поменять значения переменных `--color-primary`, `--color-accent`, `--font-mono` под свой брендинг. **Имена переменных не менять** — на них ссылаются все `.calc__*`, `.arm__*` стили.
- [ ] В `src/components/CtaSection.astro`, строка 18 — поменять телефон.
- [ ] В `src/pages/gost/[slug].astro`, строки 31–47 — привести словарь `HUB_LABELS` в соответствие со структурой каталога нового сайта, или заменить на `{}`.
- [ ] Глобально по калькуляторам: `sed -i "s|/zapros-kp/|/ваш-путь/|g" src/pages/kalkulyator-*/index.astro` — если форма заявки называется иначе.
- [ ] В `astro.config.mjs` целевого проекта: `site: 'https://ваш-домен.ru'`, `trailingSlash: 'always'`.
- [ ] Установить `@astrojs/sitemap` (опционально, для sitemap.xml).

---

## 6. Проверка сборки

```bash
npm install
npm run build
```

Ожидания:
- `dist/gost/index.html` — существует
- `dist/gost/{slug}/index.html` — 112 файлов (по одному на каждый ГОСТ)
- `dist/kalkulyator-*/index.html` — 11 файлов
- Ошибок в консоли Astro не должно быть

**Проверка в браузере:** запустить `npm run dev`, открыть каждую страницу, ввести значения — калькулятор должен считать. FAQ должен раскрываться. Хлебные крошки должны быть. Ссылка «Открыть PDF» на `/gost/5781-82/` должна открывать реальный PDF.

---

## 7. Если что-то не работает

**404 при `curl` файла из репозитория** — проверить, что точка на конце имени репозитория сохранилась в URL: `gkmetallinvest.` (обычно съедается shell'ом при неправильном экранировании). Обернуть URL в двойные кавычки.

**Стили калькулятора выглядят пустыми/сломанными** — не подключён `tokens.css`. Проверить, что `BaseLayout.astro` импортирует `../styles/global.css`, а `global.css` в первой строке импортирует `./tokens.css` (или добавить `@import './tokens.css';` вручную).

**Ошибка «Cannot find module `../data/site`»** — не создан `src/data/site.ts` (см. раздел 2).

**PDF-файлы отдают 404 из браузера** — проверить, что они в `public/gost/pdf/` а не в `src/`. Astro сервит только `public/*` статикой.

**Калькулятор ничего не считает при вводе** — открыть DevTools Console, поискать ошибку. Скорее всего проблема в TypeScript-скрипте: убедись, что `tsconfig.json` в целевом проекте не strict-режиме мешает inline-скриптам компилироваться (Astro сам их транспилирует).

---

## Итог

- Один shell-скрипт (все команды из разделов 2, 3, 4) полностью восстанавливает всю функциональность на новом Astro-проекте.
- Ожидаемое время работы: 5–10 минут на скачивание + 30–60 минут на правку под свой домен/брендинг.
- Всё работает как статика: никакого бэкенда, БД, API, аутентификации.
