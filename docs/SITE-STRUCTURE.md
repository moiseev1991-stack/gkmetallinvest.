# URL-структура сайта ГК Металлинвест

Документ описывает все маршруты, их назначение и точки внутренней перелинковки.
Обновляется вручную — при добавлении новых разделов отметь здесь.

> Текущее состояние: **3270 страниц** в билде (Astro SSG).
> Live preview: https://gkmetallinvest.vercel.app/
> Production: пока на Tilda (gkmetallinvest.ru), переключение DNS — отдельно.

---

## Корневые

| URL | Файл | Назначение |
|---|---|---|
| `/` | `src/pages/index.astro` | главная |
| `/404/` | `src/pages/404.astro` | страница «не найдено» |
| `/robots.txt` | `src/pages/robots.txt.ts` | генерируется из `siteNoindex` в `src/data/site.ts` |
| `/sitemap-index.xml` | автогенерация | sitemap-плагин Astro |

---

## Каталог — 8 хабов с прайсом

Структура у каждого хаба одинаковая:

```
/<hub>/                              ← хаб (прайс + текст + FAQ + плашки марок/городов)
/<hub>/<sku-slug>/                   ← карточка товара
/<hub>/<mark-slug>/                  ← марочная посадочная (aisi-304, aisi-316l и т.д.)
/<hub>/v-<city-slug>/                ← гео-страница (v-moskve, v-sankt-peterburge и т.д.)
```

Файлы у хаба:
- `src/pages/<hub>/index.astro` — хаб
- `src/pages/<hub>/[slug].astro` — единый файл для **товаров + марочных посадочных** (разделяет через `kind: 'mark' | 'product'`)
- `src/pages/<hub>/v-[city].astro` — гео-страница

| Хаб | URL хаба | Товары | Марки | Городов |
|---|---|---:|---:|---:|
| Лист нержавеющий | `/list/` | 752 | 5 | 15 |
| Труба нержавеющая | `/truba/` | 1048 | 5 | 15 |
| Круг / квадрат / шестигранник | `/krug/` | 698 | 4 | 15 |
| Рулон нержавеющий | `/rulon/` | 77 | 4 | 15 |
| Полоса нержавеющая | `/polosa/` | 38 | 3 | 15 |
| Проволока нержавеющая | `/provoloka/` | 105 | 4 | 15 |
| Детали трубопровода | `/detali-truboprovoda/` | 756 | 3 | 15 |
| Уголок и швеллер | `/ugolok-shveller/` | ~30 | 1 | 15 |

### Марочные слаги (5 марок × хабы)

| Slug | Полное имя | На каких хабах |
|---|---|---|
| `aisi-304` | AISI 304 (08Х18Н10) | list, truba, krug, rulon, polosa, provoloka, detali-truboprovoda, ugolok-shveller |
| `aisi-316l` | AISI 316L (03Х17Н14М2) | list, truba, krug, rulon, polosa, provoloka, detali-truboprovoda |
| `aisi-321` | AISI 321 / 12Х18Н10Т | list, truba, krug, rulon, polosa, provoloka, detali-truboprovoda |
| `aisi-430` | AISI 430 (08Х17) | list, truba, rulon, provoloka |
| `aisi-201` | AISI 201 (12Х15Г9НД) | list, truba, krug |

Источник данных: `src/data/marks.ts`.

### Городские слаги (15)

| Slug | Город | Срок доставки |
|---|---|---|
| `v-moskve` | Москва | 1–2 дня |
| `v-sankt-peterburge` | Санкт-Петербург | 2–3 дня |
| `v-ekaterinburge` | Екатеринбург | 3–4 дня |
| `v-kazani` | Казань | 1–2 дня |
| `v-novosibirske` | Новосибирск | 5–7 дней |
| `v-krasnodare` | Краснодар | 3–4 дня |
| `v-rostove-na-donu` | Ростов-на-Дону | 2–4 дня |
| `v-samare` | Самара | 1–2 дня |
| `v-ufe` | Уфа | 2–3 дня |
| `v-permi` | Пермь | 2–3 дня |
| `v-voronezhe` | Воронеж | 1–2 дня |
| `v-chelyabinske` | Челябинск | 3–4 дня |
| `v-volgograde` | Волгоград | 2–3 дня |
| `v-krasnoyarske` | Красноярск | 7–10 дней |
| `v-tyumeni` | Тюмень | 4–5 дней |

Источник данных: `src/data/cities.ts`.

---

## Каталог — «пустые» хабы (без прайса, исключены из sitemap)

Эти хабы — страницы-заглушки с CTA «по запросу». Исключены из sitemap-фильтра
в `astro.config.mjs`, чтобы не пушить пустые URL в индекс.

| URL | Состояние |
|---|---|
| `/dekorativnye-listy/` | заглушка с CTA |
| `/lenta/` + `/lenta/proizvodstvo/` | заглушка |
| `/folga/` | заглушка |
| `/metizy/` | заглушка |
| `/elektrody/` | заглушка |
| `/podshipniki/` | заглушка |

---

## Услуги

| URL | Контент |
|---|---|
| `/uslugi/` | хаб со всеми услугами |
| `/uslugi/rezka-rulonov/` | продольная и поперечная резка рулонов |
| `/uslugi/perforaciya-listov/` | перфорация лазером и КПП |
| `/uslugi/polirovka/` | полировка до зеркала |
| `/uslugi/shlifovanie/` | шлифование |
| `/uslugi/nanesenie-plenki/` | защитная плёнка PE/PVC |
| `/uslugi/podbor-metalla/` | подбор марки по ТЗ |

Каждая страница услуги: ~800 слов + Service JSON-LD + FAQPage JSON-LD.
Шаблон: `src/components/ServicePage.astro`.

---

## Информационные

| URL | Контент |
|---|---|
| `/o-kompanii/` | страница компании, реквизиты |
| `/dostavka-i-oplata/` | условия доставки и оплаты |
| `/kontakty/` | контакты, Яндекс.Карта, LocalBusiness JSON-LD + geo + hasMap |
| `/karta-sayta/` | HTML sitemap |
| `/sertifikaty/` | сертификаты (пока заглушка) |
| `/kalkulyator-vesa/` | онлайн-калькулятор веса 9 видов проката + HowTo + FAQ JSON-LD |
| `/postavka-nerzhaveyushchego-metalloprokata/` | сводный каталог |

---

## Правовые

| URL | Контент |
|---|---|
| `/politika-konfidencialnosti/` | политика |
| `/publichnaya-oferta/` | оферта |

---

## Конверсионные

| URL | Контент |
|---|---|
| `/zapros-kp/` | форма запроса коммерческого предложения |
| `/zapros-kp/?sku=<slug>` | форма с pre-fill SKU из карточки товара |
| `/zapros-kp/?shape=<x>&qty=<y>&weight_kg=<z>` | pre-fill из калькулятора веса |

---

## Внутренняя перелинковка

```
Главная (/)
 ├─ Hero/CTA → /zapros-kp/
 ├─ Categories cards → /list/, /truba/, /krug/, …
 ├─ Services cards → /uslugi/<service>/
 ├─ CTA banner → /zapros-kp/
 └─ Pre-footer → /kontakty/, /zapros-kp/

Шапка (везде)
 ├─ Мегаменю «Каталог» → 4 группы × 16 категорий
 ├─ Мегаменю «Услуги» → 5 пунктов (вкл. /kalkulyator-vesa/)
 ├─ /o-kompanii/, /dostavka-i-oplata/, /kontakty/
 └─ CTA «Заявка / Запросить цену» → /zapros-kp/

Хаб (/list/)
 ├─ PriceTable → ссылки на /list/<sku>/
 ├─ HubExtras: плашки марок → /list/aisi-304/ и т.д.
 ├─ HubExtras: плашки городов → /list/v-moskve/ и т.д.
 ├─ CtaSection → /zapros-kp/
 └─ Тексты с inline-ссылками на /uslugi/<svc>/, /rulon/

Марочная (/list/aisi-304/)
 ├─ PriceTable отфильтрованная по марке → /list/<sku>/
 ├─ Cross-link «та же марка в других форматах»
 │     → /truba/aisi-304/, /krug/aisi-304/, /rulon/aisi-304/, …
 ├─ CityBlock → /list/v-<city>/
 └─ CTA → /zapros-kp/

Карточка (/list/<sku>/)
 ├─ Хлебные крошки → / → /list/
 ├─ CTA / Калькулятор объёма → /zapros-kp/?sku=<slug>
 ├─ Quick-services chips → /uslugi/<svc>/
 ├─ Другие толщины этой марки → /list/<related-sku>/
 ├─ Похожие позиции → /list/<related-sku>/
 ├─ Доставка в города → /list/v-<city>/
 └─ FAQ

Гео-страница (/list/v-moskve/)
 ├─ Уникальный текст про доставку в город
 ├─ PriceTable полная → /list/<sku>/
 └─ CTA → /zapros-kp/

Калькулятор (/kalkulyator-vesa/)
 ├─ Реактивный расчёт → /zapros-kp/?shape=&qty=&weight_kg=
 └─ Ссылки на все 8 хабов

Футер (везде)
 ├─ Каталог: 16 категорий
 ├─ Услуги: 5 пунктов
 ├─ Информация: о компании / доставка / контакты / КП / калькулятор / карта сайта
 └─ Правовые: политика / оферта / сертификаты / карта
```

---

## Где править данные

| Что | Файл |
|---|---|
| Топ-навигация и мегаменю | `src/data/navigation.ts` |
| Городские лендинги (slug, расстояние, сроки) | `src/data/cities.ts` |
| Марочные посадочные | `src/data/marks.ts` |
| Контакты, реквизиты, координаты офиса | `src/data/site.ts` |
| Прайс (генерируется парсером из старого сайта) | `src/data/pricelist.json` |
| Контент главной | `src/data/homepage.ts` |

## Шаблоны компонентов

| Компонент | Файл | Где используется |
|---|---|---|
| Базовый layout | `src/layouts/BaseLayout.astro` | все страницы |
| Хаб каталога | `src/components/CatalogHubTemplate.astro` | `/<hub>/index.astro` |
| Доп. блоки хаба (марки + города) | `src/components/HubExtras.astro` | в `<slot>` хаба |
| Марочная посадочная | `src/components/MarkLanding.astro` | через `[slug].astro` при `kind=mark` |
| Карточка товара | `src/components/ProductDetail.astro` | через `[slug].astro` при `kind=product` |
| Гео-страница | `src/components/CatalogCityHub.astro` | `v-[city].astro` |
| Страница услуги | `src/components/ServicePage.astro` | `/uslugi/<service>/index.astro` |
| Прайс-таблица | `src/components/PriceTable.astro` | хабы и марочные |
| Шапка / футер | `src/components/SiteHeader.astro` / `SiteFooter.astro` | `BaseLayout` |

---

## История изменений

> Хронология что менялось. При следующих правках — добавлять сюда блок с датой.

### 2026-05-20 — Большая SEO + UX-итерация

**SEO**
- Расширил `cities.ts` с 5 до 15 городов.
- Создал `marks.ts` с 5 топ-марками (AISI 304, 316L, 321/12Х18Н10Т, 430, 201) и их алиасами для фильтрации прайса.
- Сделал компонент `MarkLanding.astro` — посадочные `/list/aisi-304/`, `/truba/aisi-321/` и т.д. (всего 29 страниц). С Cross-link «та же марка в других форматах», PriceTable с предфильтром, CollectionPage + FAQPage JSON-LD.
- `[slug].astro` во всех 8 хабах теперь различает марочные слаги и товарные через `kind: 'mark' | 'product'`.
- `PriceTable` принимает `initialGrade` prop для предфильтра.
- `CityBlock` превращён в сетку ссылок на `v-[city]` — был плоский список названий.
- Шаблон хаба `CatalogHubTemplate` принимает `faq` prop → рендерит FAQ + FAQPage JSON-LD на всех 8 хабах.
- Расписаны 6 страниц услуг через `ServicePage.astro` (~800 слов + Service + FAQPage JSON-LD).
- `ProductDetail`: убран некорректный `mpn`, добавлен `fetchpriority="high"` на главное фото, блок «Доставка в ваш город» с 15 ссылками.
- `LocalBusiness`: `geo` + `hasMap` на главной и `/kontakty/`. Координаты вынесены в `site.ts` как `orgGeo`, `orgMapUrl`.
- `WebSite` теперь содержит `SearchAction` (потенциальный sitelink search).
- Фильтр sitemap (`astro.config.mjs`): добавил `dekorativnye-listy` в исключения.
- Создан `/kalkulyator-vesa/` — 9 видов проката, 4 группы плотности, HowTo + FAQPage JSON-LD, pre-fill ссылка на форму запроса КП.

**Технические фиксы**
- `html/body { overflow-x: clip }` в `global.css` — горизонтальный скролл на мобиле побеждён.
- Hero на главной: убран `<br>` в H1, добавлен `<span class="hero__h1-sub">`, шкалируемый `clamp` шрифт, на узких экранах CTA-кнопки в столбик.
- `h1/h2/h3 { overflow-wrap: break-word }` — длинные «AISI/металлопрокат» переносятся.
- PriceTable mobile: `td` → grid 2-колонки с переносом, плиточный вид → 1 колонка, длинные SKU больше не уезжают.
- **Drawer мобильного меню** переписан как fixed-overlay справа 86vw / max 360px. Затемнённый backdrop с blur слева, клик закрывает.
- **Удалён `backdrop-filter` со шапки** — он по спецификации CSS создавал containing block для `position: fixed` детей, из-за этого drawer прилипал к шапке вместо viewport.
- Self-hosted Inter (cyrillic + latin × 4 веса) + `<link rel="preload">` для Regular/SemiBold. Google Fonts убран.

**Багфиксы роутинга**
- Добавлены `[slug].astro` для `rulon/`, `polosa/`, `ugolok-shveller/` — раньше товары этих хабов вели на 404 (страниц карточек не было).

**Карточка товара — заполнен hero**
- В `product__title-wrap` добавлен лид-абзац с маркой и применением.
- Key-facts grid: вес 1 м² / 1 пог. м, аналог марки, единица, длина.
- Quick-services chip-ссылки в hero (резка/перфорация/полировка) рядом с заголовком.

**Push**: 4 коммита, итого ~50 файлов изменено, ~3500 строк добавлено.
