# -*- coding: utf-8 -*-
"""Собирает src/data/lenta.ts из import/lenta-export.json (zel) + lenta-export2.json (sin).

Разделение РФ / Импорт (решение клиента 2026-07-27):
- zel -> origin='import': импортная лента. Поверхности в родной системе AISI/EN:
  2B (полуматовая), BA (зеркальная), 4N (шлифованная). Марка выводится «AISI (кир.)».
  ГОСТ не проставляем — импорт под ГОСТ 4986 не поставляют.
- sin -> origin='rf': российская лента. Поверхности русскими терминами: «Обычная»
  (матовая), «Блестящая» (зеркальная). Марка выводится «кир. (AISI)». ГОСТ 4986-79.

Правила очистки (клиент 2026-07-27):
- 2BA объединяем с BA (тот же светлый отжиг).
- PE — это не поверхность, а защитная плёнка: surface='', film=true, помечаем
  в названии «(с плёнкой)». Базовая отделка под плёнкой в источнике не указана.

Цена: руб/кг ×1000 = ₽/т. Импорт добирает цену из sin для того же SKU
(Обычная↔2B, Блестящая↔BA), где у zel цены нет. РФ — своя цена sin.
"""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
zel = json.load(open(os.path.join(ROOT, 'import', 'lenta-export.json'), encoding='utf-8'))
sin = json.load(open(os.path.join(ROOT, 'import', 'lenta-export2.json'), encoding='utf-8'))

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
    for ch in s or '':
        low = ch.lower()
        if ch in TR:
            out.append(TR[ch])
        elif low in TR:
            out.append(TR[low])
        elif ch.isdigit() or ('a' <= low <= 'z'):
            out.append(low)
    return ''.join(out)


def aisi_slug(a):
    if not a:
        return ''
    a = a.replace('≈', '').strip()
    return ''.join(c.lower() if c.isalnum() else '-' for c in a).strip('-').replace('--', '-')


def clean_aisi(a):
    return a.replace('≈', '').strip() if a else None


# Каноничный AISI на кириллическую марку (первый непустой) — из обоих каталогов.
CANON_AISI = {}
for _x in zel + sin:
    _a = clean_aisi(_x.get('gradeAisi'))
    if _a and _x['grade'] not in CANON_AISI:
        CANON_AISI[_x['grade']] = _a


def has_nickel(cyr):
    return bool(re.search(r'Н\d', cyr))


def th_str(t):
    return ('%g' % t).replace('.', ',')


def th_slug(t):
    return ('%g' % t).replace('.', '-')


# индекс цен sin по SKU (для добора цены импорта). sin-поверхности приводим к
# импортным кодам ТОЛЬКО для сопоставления цены: Обычная≈2B, Блестящая≈BA.
SIN_TO_IMPORT_SURF = {'Обычная': '2B', 'Блестящая': 'BA'}
sin_price = {}
for _x in sin:
    _p = _x.get('price')
    if isinstance(_p, (int, float)):
        _k = (_x['grade'], SIN_TO_IMPORT_SURF.get(_x['surface'], _x['surface']),
              float(_x['thickness']), int(_x['width']))
        sin_price.setdefault(_k, _p)


rows = {}   # dedup-ключ -> строка; при коллизии предпочитаем строку с ценой
slugs = set()


def uniq_slug(base):
    slug = base
    i = 2
    while slug in slugs:
        slug = f'{base}-{i}'
        i += 1
    slugs.add(slug)
    return slug


def add(x, origin):
    cyr = x['grade']
    raw_surf = x['surface']
    th = float(x['thickness'])
    w = int(x['width'])
    film = False

    if origin == 'import':
        if raw_surf == '2BA':
            surf = 'BA'                    # светлый отжиг — объединяем с BA
        elif raw_surf == 'PE':
            surf = ''                      # плёнка, не поверхность
            film = True
        else:
            surf = raw_surf
    else:
        surf = raw_surf                    # РФ: «Обычная» / «Блестящая» как есть

    dedup = (origin, cyr, surf, film, th, w)

    aisi = CANON_AISI.get(cyr) or clean_aisi(x.get('gradeAisi'))
    if origin == 'import':
        grade = f'{aisi} ({cyr})' if aisi else cyr
    else:
        grade = f'{cyr} ({aisi})' if aisi else cyr
    sub = 'nikelesod' if has_nickel(cyr) else 'beznikelya'

    # цена
    price_kg = x.get('price')
    if price_kg is None and origin == 'import' and not film:
        price_kg = sin_price.get((cyr, surf, th, w))
    price = int(round(price_kg * 1000)) if isinstance(price_kg, (int, float)) else None

    # slug
    aslug = aisi_slug(aisi) or translit(cyr)
    surf_tok = 'plenka' if film else (translit(surf) if surf else 'nd')
    prefix = 'lenta' if origin == 'import' else 'lenta-rf'
    base = f'{prefix}-{aslug}-{translit(cyr)}-{surf_tok}-{th_slug(th)}x{w}'

    # имя
    thn = '%g' % th
    if film:
        name = f'Лента нержавеющая х/к {thn}×{w} {cyr} (с плёнкой)'
    else:
        name = f'Лента нержавеющая х/к {thn}×{w} {surf} {cyr}'

    gost = '' if origin == 'import' else (x.get('gost') or 'ГОСТ 4986-79')

    row = {
        'hub': 'lenta',
        'origin': origin,
        'sub': sub,
        'grade': grade,
        'roll': None,
        'alloy': 'нержавеющая',
        'surface': surf,
        'film': film,
        'size': th_str(th),
        'width': w,
        'thickness': th,
        'format': str(w),
        'unit': 'т',
        'price': price,
        'priceUnit': price,
        'slug': base,   # финализируем ниже, после разрешения дедупа
        'dlina': None,
        'fact': None,
        'ostatok': None,
        'gost': gost,
        'name': name,
    }

    prev = rows.get(dedup)
    if prev is None:
        rows[dedup] = row
    elif prev['price'] is None and row['price'] is not None:
        rows[dedup] = row   # заменяем беспрайсовую на прайсовую


for x in zel:
    add(x, 'import')
for x in sin:
    add(x, 'rf')

out = list(rows.values())

# финальные slug'и с разрешением коллизий
for r in out:
    r['slug'] = uniq_slug(r['slug'])


def sort_key(r):
    return (0 if r['origin'] == 'import' else 1, r['grade'], r['thickness'], r['width'], r['surface'])


out.sort(key=sort_key)

imp = sum(1 for r in out if r['origin'] == 'import')
rf = sum(1 for r in out if r['origin'] == 'rf')
grades = sorted({r['grade'] for r in out})
print('rows:', len(out), '| импорт:', imp, '| РФ:', rf, '| марок:', len(grades))
assert len(slugs) == len(out), 'slug collision!'


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
lines.append(' * Собрана из двух каталогов (import/lenta-export*.json) с разделением по')
lines.append(" * происхождению — origin='import' (zel) и origin='rf' (sin):")
lines.append(' * • Импорт — поверхности AISI/EN: 2B (полуматовая), BA (зеркальная),')
lines.append(' *   4N (шлифованная); 2BA объединён с BA; PE вынесен в флаг film. Марка')
lines.append(' *   «AISI (кир.)», ГОСТ не проставляем (импорт не под ГОСТ 4986).')
lines.append(' * • РФ — поверхности русскими терминами: «Обычная» (матовая),')
lines.append(' *   «Блестящая» (зеркальная). Марка «кир. (AISI)», ГОСТ 4986-79.')
lines.append(' *')
lines.append(' * Цена (руб/кг ×1000 = ₽/т): импорт добирает цену из sin для того же SKU,')
lines.append(' * РФ — своя цена sin. film=true (бывш. PE) — surface пустой, «(с плёнкой)».')
lines.append(' *')
lines.append(f' * Сгенерировано scripts/_lenta_build.py. Позиций: {len(out)} (импорт {imp}, РФ {rf}), марок: {len(grades)}.')
lines.append(' */')
lines.append('')
lines.append('export interface LentaSku {')
lines.append("\thub: 'lenta';")
lines.append("\t/** Происхождение: импортная (AISI-поверхности) или российская лента. */")
lines.append("\torigin: 'import' | 'rf';")
lines.append('\tsub: string;')
lines.append('\tgrade: string;')
lines.append('\troll: string | null;')
lines.append('\talloy: string | null;')
lines.append('\tsurface: string;')
lines.append("\t/** Защитная плёнка (бывш. поверхность PE) — базовая отделка не указана. */")
lines.append('\tfilm: boolean;')
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
order = ['hub', 'origin', 'sub', 'grade', 'roll', 'alloy', 'surface', 'film',
         'size', 'width', 'thickness', 'format', 'unit', 'price', 'priceUnit',
         'slug', 'dlina', 'fact', 'ostatok', 'gost', 'name']
for r in out:
    parts = ', '.join(f'{k}: {js(r[k])}' for k in order)
    lines.append('\t{ ' + parts + ' },')
lines.append('];')
lines.append('')

with open(os.path.join(ROOT, 'src', 'data', 'lenta.ts'), 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))
print('wrote src/data/lenta.ts')
