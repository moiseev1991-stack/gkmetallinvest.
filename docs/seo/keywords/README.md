# Семантика — мастер-список ключей

Сгенерировано `scripts/generate-keywords.mjs`. Всего **5622** уникальных ключей.

Файл `master.txt` — плоский список по 1 ключу на строку, заточен под Ahrefs Keywords Explorer / Batch Analysis.

## Workflow

1. Загрузить `master.txt` в Ahrefs → Keywords Explorer → выбрать локацию **Russian Federation**.
2. Экспортировать csv со столбцами: keyword, volume, kd, cpc, traffic_potential, intents, top_serp_url.
3. Положить экспорт в `docs/seo/keywords/ahrefs-ru-export.csv` (или сообщить путь Claude'у).
4. Claude кластеризует по URL-структуре сайта и составит keyword map.

## Кластеры в сборке

| Кластер | Что внутри | Кол-во |
|---|---|---:|
| `00-generic` | Общая лексика (нержавейка / металлопрокат) | 60 |
| `10-hubs/detali` | Базовые названия хабов → detali | 11 |
| `10-hubs/elektrody` | Базовые названия хабов → elektrody | 4 |
| `10-hubs/folga` | Базовые названия хабов → folga | 3 |
| `10-hubs/krug` | Базовые названия хабов → krug | 7 |
| `10-hubs/kvadrat` | Базовые названия хабов → kvadrat | 3 |
| `10-hubs/lenta` | Базовые названия хабов → lenta | 6 |
| `10-hubs/lestnicy` | Базовые названия хабов → lestnicy | 5 |
| `10-hubs/list` | Базовые названия хабов → list | 7 |
| `10-hubs/listdeco` | Базовые названия хабов → listdeco | 4 |
| `10-hubs/metizy` | Базовые названия хабов → metizy | 11 |
| `10-hubs/podshipniki` | Базовые названия хабов → podshipniki | 4 |
| `10-hubs/polosa` | Базовые названия хабов → polosa | 6 |
| `10-hubs/provoloka` | Базовые названия хабов → provoloka | 7 |
| `10-hubs/rulon` | Базовые названия хабов → rulon | 6 |
| `10-hubs/shestigrannik` | Базовые названия хабов → shestigrannik | 3 |
| `10-hubs/shveller` | Базовые названия хабов → shveller | 4 |
| `10-hubs/truba` | Базовые названия хабов → truba | 8 |
| `10-hubs/truba-pryam` | Базовые названия хабов → truba-pryam | 5 |
| `10-hubs/ugolok` | Базовые названия хабов → ugolok | 6 |
| `20-hub-commerce/detali` | Хаб + купить/цена/прайс/опт → detali | 48 |
| `20-hub-commerce/elektrody` | Хаб + купить/цена/прайс/опт → elektrody | 48 |
| `20-hub-commerce/folga` | Хаб + купить/цена/прайс/опт → folga | 48 |
| `20-hub-commerce/krug` | Хаб + купить/цена/прайс/опт → krug | 48 |
| `20-hub-commerce/kvadrat` | Хаб + купить/цена/прайс/опт → kvadrat | 48 |
| `20-hub-commerce/lenta` | Хаб + купить/цена/прайс/опт → lenta | 48 |
| `20-hub-commerce/lestnicy` | Хаб + купить/цена/прайс/опт → lestnicy | 48 |
| `20-hub-commerce/list` | Хаб + купить/цена/прайс/опт → list | 48 |
| `20-hub-commerce/listdeco` | Хаб + купить/цена/прайс/опт → listdeco | 48 |
| `20-hub-commerce/metizy` | Хаб + купить/цена/прайс/опт → metizy | 48 |
| `20-hub-commerce/podshipniki` | Хаб + купить/цена/прайс/опт → podshipniki | 48 |
| `20-hub-commerce/polosa` | Хаб + купить/цена/прайс/опт → polosa | 48 |
| `20-hub-commerce/provoloka` | Хаб + купить/цена/прайс/опт → provoloka | 48 |
| `20-hub-commerce/rulon` | Хаб + купить/цена/прайс/опт → rulon | 48 |
| `20-hub-commerce/shestigrannik` | Хаб + купить/цена/прайс/опт → shestigrannik | 48 |
| `20-hub-commerce/shveller` | Хаб + купить/цена/прайс/опт → shveller | 48 |
| `20-hub-commerce/truba` | Хаб + купить/цена/прайс/опт → truba | 48 |
| `20-hub-commerce/truba-pryam` | Хаб + купить/цена/прайс/опт → truba-pryam | 48 |
| `20-hub-commerce/ugolok` | Хаб + купить/цена/прайс/опт → ugolok | 48 |
| `30-hub-mark/detali` | Хаб + марка (AISI / ГОСТ) → detali | 96 |
| `30-hub-mark/krug` | Хаб + марка (AISI / ГОСТ) → krug | 96 |
| `30-hub-mark/list` | Хаб + марка (AISI / ГОСТ) → list | 96 |
| `30-hub-mark/polosa` | Хаб + марка (AISI / ГОСТ) → polosa | 96 |
| `30-hub-mark/provoloka` | Хаб + марка (AISI / ГОСТ) → provoloka | 96 |
| `30-hub-mark/rulon` | Хаб + марка (AISI / ГОСТ) → rulon | 96 |
| `30-hub-mark/truba` | Хаб + марка (AISI / ГОСТ) → truba | 96 |
| `35-mark-commerce` | Марка отдельно + коммерция | 598 |
| `40-hub-city/detali` | Хаб + город (15 регионов) → detali | 198 |
| `40-hub-city/krug` | Хаб + город (15 регионов) → krug | 198 |
| `40-hub-city/list` | Хаб + город (15 регионов) → list | 198 |
| `40-hub-city/polosa` | Хаб + город (15 регионов) → polosa | 198 |
| `40-hub-city/provoloka` | Хаб + город (15 регионов) → provoloka | 198 |
| `40-hub-city/rulon` | Хаб + город (15 регионов) → rulon | 198 |
| `40-hub-city/truba` | Хаб + город (15 регионов) → truba | 198 |
| `40-hub-city/ugolok` | Хаб + город (15 регионов) → ugolok | 198 |
| `45-mark-city` | Марка + город (топ-5 марок) | 960 |
| `50-sizes/krug` | Размерные хвосты (лист/круг/труба/проф.труба) → krug | 114 |
| `50-sizes/list` | Размерные хвосты (лист/круг/труба/проф.труба) → list | 138 |
| `50-sizes/truba` | Размерные хвосты (лист/круг/труба/проф.труба) → truba | 168 |
| `50-sizes/truba-pryam` | Размерные хвосты (лист/круг/труба/проф.труба) → truba-pryam | 52 |
| `55-surfaces` | Поверхности (шлиф / 2B / BA / зеркальный) | 85 |
| `60-services` | Услуги (резка / полировка / перфорация) | 100 |
| `70-info` | Информационные (вес / плотность / ГОСТ / расшифровка) | 59 |
| `80-applications` | Применение (пищевая / медицинская / морская) | 19 |

## Источник сидов

- **Хабы** (8 основных + 11 второстепенных): list, truba, krug, rulon, polosa, provoloka, ugolok, shveller, shestigrannik, kvadrat, truba-pryam, lenta, folga, metizy, podshipniki, elektrody, detali (отводы/фланцы/тройники/переходы/заглушки), listdeco, lestnicy.
- **Марки**: AISI 304/304L/316/316L/316Ti/321/430/201/310S/309S/904L/420/440/410 + ГОСТ (08Х18Н10, 12Х18Н10Т, 03Х17Н14М2, 08Х17, 12Х13, 20Х13, 30Х13, 40Х13, 20Х23Н18, 06ХН28МДТ) + дуплекс/супердуплекс.
- **Города**: 15 регионов из `src/data/cities.ts` + Нижний Новгород (база), для каждого 2-5 словоформ.
- **Размеры**: типовые из прайса (лист 0,4-50 мм, круг 4-150 мм, труба круглая 12х1 ... 219х6, труба профильная 20х20 ... 100х100).
- **Услуги**: 6 из `/uslugi/*` × модификаторы цена/заказать/в москве/стоимость.
- **Информационные**: вокруг калькулятора, ГОСТов, расшифровок марок, свойств, сравнений.
- **Применение**: пищёвка / медицина / декор / агрессивные среды / морская / жаропрочные / печи / котлы.

