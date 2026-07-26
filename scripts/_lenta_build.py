# -*- coding: utf-8 -*-
"""Собирает src/data/lenta.ts из import/lenta-export.json (zel) + lenta-export2.json (sin).

Правила слияния (см. анализ 2026-07-26, ценовое решение уточнено 2026-07-26):
- База — zel: 558 позиций, 17 марок.
- sin по толщинам/ширинам — подмножество zel; добавляем только 3 уникальные
  марки (10Х17Н13М3Т, 12Х18Н9, 12Х18Н9СМР) с их собственной ценой sin.
- Цена: берём ту, что есть. Приоритет — zel; если у zel-позиции цены нет,
  подставляем цену sin для того же SKU (марка+поверхность+толщина+ширина).
  «По запросу» (price=null) остаётся только там, где нет цены ни у кого.
- Цена руб/кг -> ₽/т (×1000), как в остальном pricelist.
"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
zel = json.load(open(os.path.join(ROOT, 'import', 'lenta-export.json'), encoding='utf-8'))
sin = json.load(open(os.path.join(ROOT, 'import', 'lenta-export2.json'), encoding='utf-8'))

UNIQ_SIN = {'10Х17Н13М3Т', '12Х18Н9', '12Х18Н9СМР'}

# индекс цен sin по SKU (для добора цены там, где у zel её нет)
def _norm_surf(s):
    return {'Обычная': '2B', 'Блестящая': 'BA'}.get(s, s)

# --- нормализация поверхности ---
SURF_MAP = {
    'Обычная': '2B',
    'Блестящая': 'BA',
    '2B': '2B', 'BA': 'BA', '2BA': '2BA', '4N': '4N', 'PE': 'PE',
}

# --- транслитерация кириллицы для slug ---
TR = {
    'А': 'a', 'Б': 'b', 'В': 'v', 'Г': 'g', 'Д': 'd', 'Е': 'e', 'Ж': 'zh',
    'З': 'z', 'И': 'i', 'Й': 'y', 'К': 'k', 'Л': 'l', 'М': 'm', 'Н': 'n',
    'О': 'o', 'П': 'p', 'Р': 'r', 'С': 's', 'Т': 't', 'У': 'u', 'Ф': 'f',
    'Х': 'h', 'Ц': 'c', 'Ч': 'ch', 'Ш': 'sh', 'Щ': 'sch', 'Ы': 'y',
    'Э': 'e', 'Ю': 'yu', 'Я': 'ya', 'Ь': '', 'Ъ': '',
}


def translit(s):
    out = []
    for ch in s:
        if ch in TR:
            out.append(TR[ch])
        elif ch.isdigit() or ('a' <= ch.lower() <= 'z'):
            out.append(ch.lower())
    return ''.join(out)


def aisi_slug(a):
    if not a:
        return ''
    a = a.replace('≈', '').strip()
    return ''.join(c.lower() if (c.isalnum()) else '-' for c in a).strip('-').replace('--', '-')


def clean_aisi(a):
    return a.replace('≈', '').strip() if a else None


# Каноничный AISI на кириллическую марку: в zel 08Х17Т размечен и как AISI 439,
# и как AISI 441 (одна марка -> два имени расщепляли марочный ряд). Фиксируем
# первый встреченный непустой AISI на марку.
CANON_AISI = {}
for _x in zel + sin:
    _cyr = _x['grade']
    _a = clean_aisi(_x.get('gradeAisi'))
    if _a and _cyr not in CANON_AISI:
        CANON_AISI[_cyr] = _a


def has_nickel(cyr):
    # кириллическая Н, за которой идёт цифра — признак никелевой (аустенитной) стали
    import re
    return bool(re.search(r'Н\d', cyr))


def th_str(t):
    # число толщины как строка с запятой, без хвостовых нулей: 0.2 -> "0,2"
    s = ('%g' % t)
    return s.replace('.', ',')


def th_slug(t):
    return ('%g' % t).replace('.', '-')


rows = []
seen = set()  # (cyr, surf, thickness, width) — дедуп
slugs = set()

# индекс цен sin по SKU: добираем цену туда, где у zel её нет
sin_price = {}
for _x in sin:
    _p = _x.get('price')
    if isinstance(_p, (int, float)):
        _k = (_x['grade'], SURF_MAP.get(_x['surface'], _x['surface']),
              float(_x['thickness']), int(_x['width']))
        sin_price.setdefault(_k, _p)


def add(x):
    cyr = x['grade']
    surf = SURF_MAP.get(x['surface'], x['surface'])
    th = float(x['thickness'])
    w = int(x['width'])
    dedup = (cyr, surf, th, w)
    if dedup in seen:
        return
    seen.add(dedup)

    aisi = CANON_AISI.get(cyr) or clean_aisi(x.get('gradeAisi'))
    grade = f'{aisi} ({cyr})' if aisi else cyr
    sub = 'nikelesod' if has_nickel(cyr) else 'beznikelya'

    # цена: своя, иначе — из sin для того же SKU, иначе «по запросу»
    price_kg = x.get('price')
    if price_kg is None:
        price_kg = sin_price.get((cyr, surf, th, w))
    price = int(round(price_kg * 1000)) if isinstance(price_kg, (int, float)) else None

    aslug = aisi_slug(aisi) or translit(cyr)
    slug = f'lenta-{aslug}-{translit(cyr)}-{surf.lower()}-{th_slug(th)}x{w}'
    base = slug
    i = 2
    while slug in slugs:
        slug = f'{base}-{i}'
        i += 1
    slugs.add(slug)

    name = f'Лента нержавеющая х/к {("%g" % th)}×{w} {surf} {cyr}'

    rows.append({
        'hub': 'lenta',
        'sub': sub,
        'grade': grade,
        'roll': None,
        'alloy': 'нержавеющая',
        'surface': surf,
        'size': th_str(th),
        'width': w,
        'thickness': th,
        'format': str(w),
        'unit': 'т',
        'price': price,
        'priceUnit': price,
        'slug': slug,
        'dlina': None,
        'fact': None,
        'ostatok': None,
        'gost': x.get('gost') or 'ГОСТ 4986-79',
        'name': name,
    })


# zel — всё
for x in zel:
    add(x)
# sin — только уникальные марки, со своей ценой sin
for x in sin:
    if x['grade'] in UNIQ_SIN:
        add(x)

# сортировка: марка (по кириллице внутри скобок), толщина, ширина
def sort_key(r):
    return (r['grade'], r['thickness'], r['width'], r['surface'])

rows.sort(key=sort_key)

grades = sorted({r['grade'] for r in rows})
print('rows:', len(rows), 'grades:', len(grades))
assert len(slugs) == len(rows), 'slug collision!'

# --- запись TS ---
def js(v):
    if v is None:
        return 'null'
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if isinstance(v, (int, float)):
        return repr(v) if isinstance(v, float) else str(v)
    return json.dumps(v, ensure_ascii=False)

lines = []
lines.append('/** Нержавеющая лента (штрипс х/к) — отдельный источник данных.')
lines.append(' *')
lines.append(' * Собрана из выгрузок двух каталогов (import/lenta-export*.json), а не из')
lines.append(' * pricelist.json: тот правится вручную/парсером, а лента пришла отдельным')
lines.append(' * импортом. Условия отбора клиента: толщина 0,15-0,8 мм, ширина только 200')
lines.append(' * и 400 мм, максимум марок стали (< 0,15 мм — фольга, > 0,8 мм не берём).')
lines.append(' *')
lines.append(' * Цены (руб/кг ×1000 = ₽/т): берём ту, что есть. Приоритет — «zel»; где у')
lines.append(' * zel цены нет, подставляем «sin» для того же SKU. Три марки из «sin»')
lines.append(' * (10Х17Н13М3Т, 12Х18Н9, 12Х18Н9СМР) — со своей ценой sin. «По запросу»')
lines.append(' * (null) остаётся только там, где цены нет ни в одном каталоге.')
lines.append(' *')
lines.append(f' * Сгенерировано scripts/_lenta_build.py. Позиций: {len(rows)}, марок: {len(grades)}.')
lines.append(' */')
lines.append('')
lines.append('export interface LentaSku {')
lines.append("\thub: 'lenta';")
lines.append('\tsub: string;')
lines.append('\tgrade: string;')
lines.append('\troll: string | null;')
lines.append('\talloy: string | null;')
lines.append('\tsurface: string;')
lines.append('\t/** Толщина, мм — строка с запятой (единообразно с pricelist). */')
lines.append('\tsize: string;')
lines.append('\t/** Ширина, мм (200 | 400). */')
lines.append('\twidth: number;')
lines.append('\t/** Толщина, мм — число (для фильтра/карточки). */')
lines.append('\tthickness: number;')
lines.append("\t/** Ширина как строка — читается PriceTable через поле format ('Ширина'). */")
lines.append('\tformat: string;')
lines.append('\tunit: string;')
lines.append('\tprice: number | null;')
lines.append('\tpriceUnit: number | null;')
lines.append('\tslug: string;')
lines.append('\tdlina: string | null;')
lines.append('\tfact: string | null;')
lines.append('\tostatok: number | null;')
lines.append('\tgost: string;')
lines.append('\tname: string;')
lines.append('}')
lines.append('')
lines.append('export const lentaSkus: LentaSku[] = [')
order = ['hub', 'sub', 'grade', 'roll', 'alloy', 'surface', 'size', 'width',
         'thickness', 'format', 'unit', 'price', 'priceUnit', 'slug', 'dlina',
         'fact', 'ostatok', 'gost', 'name']
for r in rows:
    parts = ', '.join(f'{k}: {js(r[k])}' for k in order)
    lines.append('\t{ ' + parts + ' },')
lines.append('];')
lines.append('')

with open(os.path.join(ROOT, 'src', 'data', 'lenta.ts'), 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))
print('wrote src/data/lenta.ts')
