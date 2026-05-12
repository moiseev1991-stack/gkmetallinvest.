# Сбор ссылок на нерж. подкатегории mc.ru

## Контекст

Я владелец сайта **gkmetallinvest.ru** (нержавеющий металлопрокат) и наполняю каталог. Я уже спарсил основные категории (круг, лист, труба, проволока, детали трубопровода) Node-скриптом напрямую с mc.ru. Осталось **5 разделов**, у которых hub-страницы mc.ru пустые — данных в их `catalogTable` нет, но в **левом боковом меню** при их открытии должен раскрываться список подкатегорий.

Моя задача — получить эти URL'ы подкатегорий, чтобы скормить их моему Node-парсеру.

## Что нужно сделать

Пройти по 5 hub-страницам ниже. С каждой собрать:

1. **URL подкатегорий** из левого бокового меню (тот раздел, который раскрыт под текущей страницей)
2. **Для подшипников** дополнительно: если на странице есть таблица `table.razmertable`, забрать оттуда **только нержавеющие SKU** (имя/описание содержит «нержав», «нерж», «AISI 304/316», «inox», «stainless»)

## Список страниц

| Раздел | URL |
|---|---|
| Метизы целиком | https://mc.ru/metalloprokat/nerzhaveyuschie_metizy |
| Электроды | https://mc.ru/metalloprokat/ehlektrody_nerzhaveyushchie |
| Лестничные ограждения | https://mc.ru/metalloprokat/kompl_lest_ogr |
| Крепёж | https://mc.ru/metalloprokat/nerzhaveyuschie_metizy/group/krepyozh_iz_nerzhaveyushchej_stali |
| Подшипники | https://mc.ru/metalloprokat/promyshlennye_komponenty/group/podshipniki |

## Алгоритм для каждой страницы

1. Открой её.
2. В левом боковом меню (панель навигации слева, под фильтрами региона) найди активный/раскрытый раздел — там подсвечена текущая категория и развёрнут список её подкатегорий.
3. Извлеки из этого списка только ссылки вида `https://mc.ru/metalloprokat/<slug>`, **без**:
   - `/PageN/<n>` (пагинация)
   - `/mark/<x>` (фильтр по марке)
   - `/r1/<x>` (фильтр по размеру)
   - `/group/<x>` (вложенная группа — кроме случая, когда сама подкатегория именно так и устроена)
4. **Не углубляйся** — нужны только URL первого уровня вложенности, мой парсер дальше пойдёт сам.
5. Если левое меню не показывает структуру конкретно этого раздела — поставь `"no subcategories visible": true` в ответе для этой страницы.

## Что не нужно делать

- **Не парси сами товары** из подкатегорий — это сделает Node-скрипт
- Не углубляйся дальше первого уровня подкатегорий
- Не открывай детальные страницы SKU
- **Исключение** — подшипники: для них из `razmertable` нужны нержавеющие SKU (см. ниже)

## Между запросами

Держи паузу 1-2 секунды на каждой странице, не нагружай mc.ru.

## Формат ответа

В конце один JSON-блок в тройных кавычках с тегом `json`:

````json
{
  "nerzhaveyuschie_metizy": {
    "subcategories": [
      { "url": "https://mc.ru/metalloprokat/<slug>", "title": "Полное название" }
    ],
    "no_subcategories_visible": false
  },
  "ehlektrody_nerzhaveyushchie": {
    "subcategories": [],
    "no_subcategories_visible": false
  },
  "kompl_lest_ogr": {
    "subcategories": [],
    "no_subcategories_visible": false
  },
  "krepyozh_iz_nerzhaveyushchej_stali": {
    "subcategories": [],
    "no_subcategories_visible": false
  },
  "podshipniki": {
    "subcategories": [],
    "razmertable_skus": [
      { "name": "...", "marking": "...", "sku": "...", "description": "...", "price_rub": 0 }
    ],
    "no_subcategories_visible": false
  }
}
````

После выдачи JSON остановись. Никакого дополнительного текста после JSON-блока — только сам JSON.
