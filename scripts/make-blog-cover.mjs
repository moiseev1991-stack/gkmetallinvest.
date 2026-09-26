#!/usr/bin/env node
/**
 * Обложки статей блога 1200×630 с инфографикой: PNG (og:image, Article.image) + WebP (на странице).
 * SVG-обложки соцсети и поисковики в og:image / schema.org не принимают — поэтому растр.
 *
 *   node scripts/make-blog-cover.mjs            — все обложки (блог и услуги)
 *   node scripts/make-blog-cover.mjs <slug>     — одна
 *
 * COVERS → public/img/blog/, SERVICE_COVERS → public/img/services/ (превью
 * страниц услуг: og:image и картинка в шапке, см. ServicePage.astro).
 * На обложках услуг — только то, что подтвердил клиент (свой цех, цена
 * цинкования), без характеристик оборудования.
 *
 * Слева — метка, заголовок (перенос строк «|» руками), подпись; справа — панель-инфографика.
 * Цифры в инфографике берём только из текста статьи.
 * Типы панелей: bars, rows, cols, cards, swatches, scale, colors.
 */
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { readFileSync } from 'node:fs';

const COVERS = {
	'pittingovaya-korroziya': {
		tag: 'СПРАВОЧНИК',
		title: 'Питтинговая|коррозия|нержавейки',
		sub: 'Индекс PREN и стойкие марки',
		panel: {
			type: 'bars', head: 'PREN = Cr + 3,3·Mo + 16·N', max: 50,
			items: [
				{ label: 'AISI 430', value: 16, text: '16' },
				{ label: 'AISI 304', value: 19, text: '18–20' },
				{ label: 'AISI 316L', value: 24, text: '24' },
				{ label: '2205', value: 35, text: '35' },
				{ label: '2507', value: 43, text: '43', hi: true },
			],
			mark: { value: 40, text: 'море + щели: > 40' },
		},
	},
	'teplovye-svoystva-nerzhaveyki': {
		tag: 'СПРАВОЧНИК',
		title: 'Теплопроводность|и расширение|нержавейки',
		sub: 'Таблица по маркам при 20–500 °C',
		panel: {
			type: 'bars', head: 'Теплопроводность при 20 °C, Вт/(м·К)', max: 56,
			items: [
				{ label: '304 / 316L', value: 15, text: '≈ 15', hi: true },
				{ label: '430 / 20Х13', value: 24, text: '23–25' },
				{ label: 'Углерод. сталь', value: 52, text: '≈ 52' },
			],
			foot: 'Расширение: аустенит 16–17, феррит 10 × 10⁻⁶ 1/К',
		},
	},
	'tverdost-nerzhaveyushchey-stali': {
		tag: 'СПРАВОЧНИК',
		title: 'Твёрдость|нержавеющей стали|по маркам',
		sub: 'HB в поставке и HRC после закалки',
		panel: {
			type: 'bars', head: 'В поставке, HB не более (ASTM A240)', max: 320,
			items: [
				{ label: 'AISI 430', value: 183, text: '183' },
				{ label: 'AISI 304', value: 201, text: '201' },
				{ label: '316L / 321', value: 217, text: '217' },
				{ label: '2205', value: 293, text: '293', hi: true },
			],
			foot: 'После закалки: 40Х13 ≥ 50 HRC, 95Х18 ≥ 55 HRC',
		},
	},
	'zharoprochnaya-nerzhaveyka': {
		tag: 'СПРАВОЧНИК',
		title: 'Жаропрочная|нержавейка',
		sub: '310S, 309S, 20Х23Н18 и рабочие температуры',
		panel: {
			type: 'bars', head: 'Длительно на воздухе, °C (ГОСТ 5632)', max: 1150, labelW: 178,
			items: [
				{ label: '304, 12Х18Н10Т', value: 800, text: '800' },
				{ label: '20Х23Н13', value: 1000, text: '1000' },
				{ label: '20Х23Н18', value: 1000, text: '1000' },
				{ label: '20Х25Н20С2', value: 1050, text: '1050', hi: true },
			],
			foot: 'Сернистые газы снижают предел до 200 °C',
		},
	},
	'kak-varit-nerzhaveyku': {
		tag: 'ИНСТРУКЦИЯ',
		title: 'Как варить|нержавейку',
		sub: 'Электроды, проволока и режимы сварки',
		panel: {
			type: 'rows', head: 'Марка → электрод · проволока',
			items: [
				{ k: 'AISI 304', v: 'ОЗЛ-8 · ER308L' },
				{ k: '12Х18Н10Т', v: 'ЦЛ-11 · ER347' },
				{ k: 'AISI 316L', v: 'ЭА-400/10У · ER316L' },
				{ k: '+ чёрная сталь', v: 'ОЗЛ-6 · ER309L' },
			],
			foot: 'Между проходами — не выше 150 °C',
		},
	},
	'harakteristiki-aisi-304-321-316': {
		tag: 'СПРАВОЧНИК',
		title: 'AISI 304, 321|и 316L:|характеристики',
		sub: 'Состав, свойства и аналоги ГОСТ',
		panel: {
			type: 'cols', head: 'Химический состав, % (ASTM A240)',
			items: [
				{ k: '304', g: '08Х18Н10', lines: ['Cr 17,5–19,5', 'Ni 8,0–10,5', 'C ≤ 0,07'] },
				{ k: '321', g: '12Х18Н10Т', lines: ['Cr 17–19', 'Ni 9–12', '+ Ti'] },
				{ k: '316L', g: '03Х17Н14М3', lines: ['Cr 16–18', 'Ni 10–14', 'Mo 2–3'], hi: true },
			],
			foot: 'σв ≥ 515 МПа · δ ≥ 40 % · 7,9–8,0 г/см³',
		},
	},
	'poverhnosti-nerzhaveyushchego-lista': {
		tag: 'СПРАВОЧНИК',
		title: 'Поверхности|нержавеющего|листа',
		sub: 'Что означают 2B, BA, 4N, 8K, HL',
		panel: {
			type: 'swatches', head: 'Отделка поверхности',
			items: [
				{ k: '2B', t: 'матовая', kind: 'matte' },
				{ k: 'BA', t: 'светлая', kind: 'bright' },
				{ k: '4N', t: 'шлифовка', kind: 'brushed' },
				{ k: '8K', t: 'зеркало', kind: 'mirror' },
				{ k: 'HL', t: 'штрих', kind: 'hairline' },
			],
			foot: 'Ra: 2B ≈ 0,1–0,5 мкм · BA ≈ 0,05–0,1 мкм',
		},
	},
	'mezhkristallitnaya-korroziya': {
		tag: 'СПРАВОЧНИК',
		title: 'Межкристаллитная|коррозия',
		sub: 'Зачем в 12Х18Н10Т титан, а в 316L мало углерода',
		panel: {
			type: 'scale', head: 'Опасный нагрев, °C', min: 300, max: 1000,
			band: [450, 850], peak: [600, 700],
			ticks: [300, 450, 600, 700, 850, 1000],
			foot: ['Марки L: C ≤ 0,030 %', '12Х18Н10Т: Ti от 5·C до 0,8 %'],
		},
	},
	'kak-pochistit-nerzhaveyku': {
		tag: 'ИНСТРУКЦИЯ',
		title: 'Как почистить|нержавейку',
		sub: 'Чем мыть и как убрать побежалость',
		panel: {
			type: 'colors', head: 'Цвета побежалости AISI 304, °C (BSSA)',
			items: [
				{ c: '#efe3a6', t: 290 }, { c: '#d9b95a', t: 340 }, { c: '#c79a2e', t: 370 },
				{ c: '#9a6331', t: 390 }, { c: '#7d4058', t: 420 }, { c: '#5a2f6e', t: 450 },
				{ c: '#2f5fb3', t: 540 }, { c: '#1f3a78', t: 600 },
			],
			foot: ['Можно: вода, мягкое средство, уксус', 'Нельзя: хлорка, соляная кислота, стальная вата'],
		},
	},
	'chem-rezat-nerzhaveyku': {
		tag: 'РАЗБОР',
		title: 'Чем резать|нержавейку',
		sub: 'Лазер, плазма, гидроабразив, болгарка',
		panel: {
			type: 'cards', head: 'Максимальная толщина',
			items: [
				{ v: '40 мм', t: 'лазер 12 кВт', hi: true },
				{ v: '38 мм', t: 'плазма, пробивка' },
				{ v: '≈ 230 мм', t: 'гидроабразив' },
				{ v: '−40–50 %', t: 'гильотина к паспорту' },
			],
		},
	},
	'pochemu-rzhaveet-nerzhaveyka': {
		tag: 'РАЗБОР',
		title: 'Почему ржавеет|нержавейка',
		sub: 'Причины пятен и как проверить металл',
		panel: {
			type: 'cards', head: 'Главные причины',
			items: [
				{ v: 'Fe', t: 'частицы железа', hi: true },
				{ v: 'Cl⁻', t: 'соль, хлорка' },
				{ v: '201', t: 'Ni 3,5–5,5 % вместо 8' },
				{ v: 'CuSO4', t: 'тест купоросом' },
			],
		},
	},
	'nerzhaveyka-dlya-morskoy-vody': {
		tag: 'РАЗБОР',
		title: 'Нержавейка|для морской воды|и бассейнов',
		sub: '316L, дуплекс 2205 и выше',
		panel: {
			type: 'rows', head: 'Условия → марка',
			items: [
				{ k: 'Брызги, атмосфера', v: 'AISI 316 / 316L' },
				{ k: 'Бассейн, моется', v: '1.4404, 1.4462' },
				{ k: 'Погружение, щели', v: '2507, 254 SMO', hi: true },
				{ k: 'Бассейн, не моется', v: '1.4529, 1.4565' },
			],
			foot: 'Погружение в море — только PREN > 40',
		},
	},
	'nerzhaveyka-ili-otsinkovka': {
		tag: 'РАЗБОР',
		title: 'Нержавейка|или оцинковка',
		sub: 'Что выбрать и что служит дольше',
		panel: {
			type: 'cards', head: 'Цинк в цифрах',
			items: [
				{ v: '≈ 20 мкм', t: 'рулон Z275, на сторону' },
				{ v: '45–85 мкм', t: 'горячее цинкование' },
				{ v: '0,4–2,1', t: 'мкм/год, город (C3)' },
				{ v: 'AISI 316', t: 'у моря и реагентов', hi: true },
			],
		},
	},
	'aisi-201-harakteristiki': {
		tag: 'СПРАВОЧНИК',
		title: 'AISI 201:|характеристики|и отличия от 304',
		sub: 'Состав, прочность и коррозия',
		panel: {
			type: 'cols', head: 'Химический состав, % (ASTM A240)',
			items: [
				{ k: '201', g: '1.4372', lines: ['Cr 16–18', 'Ni 3,5–5,5', 'Mn 5,5–7,5'], hi: true },
				{ k: '304', g: '08Х18Н10', lines: ['Cr 17,5–19,5', 'Ni 8,0–10,5', 'Mn ≤ 2,0'] },
				{ k: '430', g: '12Х17', lines: ['Cr 16–18', 'Ni ≤ 0,75', 'Mn ≤ 1,0'] },
			],
			foot: 'σ0,2 ≥ 260 МПа против 205 у 304',
		},
	},
	'aisi-430-harakteristiki': {
		tag: 'СПРАВОЧНИК',
		title: 'AISI 430:|характеристики|и аналог 12Х17',
		sub: 'Ферритная нержавейка без никеля',
		panel: {
			type: 'cols', head: 'Химический состав, % (три стандарта)',
			items: [
				{ k: '430', g: 'ASTM A240', lines: ['Cr 16–18', 'Ni ≤ 0,75', 'C ≤ 0,12'], hi: true },
				{ k: '12Х17', g: 'ГОСТ 5632', lines: ['Cr 16–18', 'Ni ≤ 0,60', 'C ≤ 0,12'] },
				{ k: '1.4016', g: 'EN 10088-2', lines: ['Cr 16–18', 'Mn ≤ 1,00', 'C ≤ 0,08'] },
			],
			foot: 'σв ≥ 450 МПа · 7,7 г/см³ · магнитится',
		},
	},
	'stal-12h18n10t': {
		tag: 'СПРАВОЧНИК',
		title: 'Сталь|12Х18Н10Т',
		sub: 'Состав, свойства, ГОСТ и аналог AISI 321',
		panel: {
			type: 'cols', head: 'Состав, % (Cr 17–19 у всех)',
			items: [
				{ k: 'ГОСТ', g: '12Х18Н10Т', lines: ['C ≤ 0,12', 'Ni 9–11', 'Ti 5C–0,80'], hi: true },
				{ k: 'ASTM', g: 'AISI 321', lines: ['C ≤ 0,08', 'Ni 9–12', 'Ti ≥ 5(C+N)'] },
				{ k: 'EN', g: '1.4541', lines: ['C ≤ 0,08', 'Ni 9–12', 'Ti 5C–0,70'] },
			],
			foot: '7,9 г/см³ · лист σв ≥ 530 МПа (ГОСТ 5582)',
		},
	},
	'stal-08h18n10': {
		tag: 'СПРАВОЧНИК',
		title: 'Сталь|08Х18Н10',
		sub: 'ГОСТ, состав и аналог AISI 304',
		panel: {
			type: 'cols', head: 'Состав, %: ГОСТ, ASTM, EN',
			items: [
				{ k: 'ГОСТ', g: '08Х18Н10', lines: ['C ≤ 0,08', 'Cr 17–19', 'Ni 9–11'], hi: true },
				{ k: 'ASTM', g: 'AISI 304', lines: ['C ≤ 0,07', 'Cr 17,5–19,5', 'Ni 8,0–10,5'] },
				{ k: 'EN', g: '1.4301', lines: ['C ≤ 0,07', 'Si ≤ 1,0', 'S ≤ 0,015'] },
			],
			foot: 'Лист ГОСТ 5582: σв ≥ 510 МПа · 7,9 г/см³',
		},
	},
	'austenitnaya-stal': {
		tag: 'СПРАВОЧНИК',
		title: 'Аустенитная|сталь',
		sub: 'Марки, свойства и применение',
		panel: {
			type: 'bars', head: 'Никель, % (ASTM A240)', max: 30,
			items: [
				{ label: 'AISI 201', value: 5.5, text: '3,5–5,5' },
				{ label: 'AISI 304', value: 10.5, text: '8–10,5' },
				{ label: 'AISI 316L', value: 14, text: '10–14' },
				{ label: 'AISI 310S', value: 22, text: '19–22' },
				{ label: '904L', value: 28, text: '23–28', hi: true },
			],
			foot: 'ГЦК-решётка · не закаливается · вязкая до −196 °C',
		},
	},
	'dupleksnaya-stal': {
		tag: 'СПРАВОЧНИК',
		title: 'Дуплексная|сталь|2205 и 2507',
		sub: 'Состав, свойства, где применяют',
		panel: {
			type: 'cols', head: 'Состав, % и σ0,2, МПа (ASTM A240)',
			items: [
				{ k: '316L', g: 'аустенит', lines: ['Cr 16–18', 'Mo 2–3', 'σ0,2 ≥ 170'] },
				{ k: '2205', g: 'S32205', lines: ['Cr 22–23', 'Mo 3,0–3,5', 'σ0,2 ≥ 450'], hi: true },
				{ k: '2507', g: 'S32750', lines: ['Cr 24–26', 'Mo 3–5', 'σ0,2 ≥ 550'] },
			],
			foot: 'PREN: 316L — 24 · 2205 — 35 · 2507 — 43',
		},
	},
	'ferritnaya-stal': {
		tag: 'СПРАВОЧНИК',
		title: 'Ферритная|нержавеющая|сталь',
		sub: 'Марки, свойства и где применяют',
		panel: {
			type: 'cols', head: 'Три типичные марки, % (ASTM A240)',
			items: [
				{ k: '430', g: '12Х17', lines: ['Cr 16–18', 'C ≤ 0,12', 'без Ti'] },
				{ k: '439', g: '08Х17Т', lines: ['Cr 17–19', 'C ≤ 0,03', '+ Ti'] },
				{ k: '444', g: 'EN 1.4521', lines: ['Cr 17,5–19,5', 'Mo 1,75–2,5', 'Ti + Nb'], hi: true },
			],
			foot: 'Магнитится · 7,7 г/см³ · λ 25–28 Вт/(м·К)',
		},
	},
	'stal-12h13': {
		tag: 'СПРАВОЧНИК',
		title: 'Сталь|12Х13',
		sub: 'Состав, свойства, аналог AISI 410',
		panel: {
			type: 'cols', head: 'Состав, %: ГОСТ, ASTM, EN',
			items: [
				{ k: 'ГОСТ', g: '12Х13', lines: ['C 0,09–0,15', 'Cr 12–14', 'Mn ≤ 0,80'], hi: true },
				{ k: 'ASTM', g: 'AISI 410', lines: ['C 0,08–0,15', 'Cr 11,5–13,5', 'Mn ≤ 1,00'] },
				{ k: 'EN', g: '1.4006', lines: ['C 0,08–0,15', 'Cr 11,5–13,5', 'Mn ≤ 1,50'] },
			],
			foot: 'Круг: σв ≥ 590 МПа · 7,72 г/см³ · магнитится',
		},
	},
	'stal-06hn28mdt': {
		tag: 'СПРАВОЧНИК',
		title: 'Сталь|06ХН28МДТ',
		sub: 'Кислотостойкий сплав и аналоги 904L, 825',
		panel: {
			type: 'cols', head: 'Состав, % (Ni / Mo / Cu)',
			items: [
				{ k: 'ГОСТ', g: '06ХН28МДТ', lines: ['Ni 26–29', 'Mo 2,5–3,0', 'Cu 2,5–3,5'], hi: true },
				{ k: 'ASTM', g: 'AISI 904L', lines: ['Ni 23–28', 'Mo 4,0–5,0', 'Cu 1,0–2,0'] },
				{ k: 'ASTM', g: 'Alloy 825', lines: ['Ni 38–46', 'Mo 2,5–3,5', 'Cu 1,5–3,0'] },
			],
			foot: 'Серная кислота до 80 °C (ГОСТ 5632) · 7,96 г/см³',
		},
	},
};

const SERVICE_COVERS = {
	'lazernaya-rezka': {
		tag: 'УСЛУГА',
		title: 'Лазерная резка|нержавейки|и металла',
		sub: 'Детали по чертежу',
	},
	'gidroabrazivnaya-rezka': {
		tag: 'УСЛУГА',
		title: 'Гидроабразивная|резка металла',
		sub: 'Холодный рез без нагрева кромки',
	},
	'travlenie-i-passivaciya': {
		tag: 'УСЛУГА',
		title: 'Травление|и пассивация|нержавейки',
		sub: 'После сварки и резки',
	},
	'elektrohimicheskaya-polirovka': {
		tag: 'УСЛУГА',
		title: 'Электрохимическая|полировка|нержавейки',
		sub: 'ЭХП и электроплазменная',
	},
	'ploskoe-i-krugloe-shlifovanie': {
		tag: 'УСЛУГА',
		title: 'Плоское|и круглое|шлифование',
		sub: 'Детали в размер по чертежу',
	},
	'galvanicheskie-pokrytiya': {
		tag: 'УСЛУГА',
		title: 'Гальванические|покрытия',
		sub: 'Собственный цех',
	},
	'anodirovanie': { tag: 'ГАЛЬВАНИКА', title: 'Анодирование|алюминия', sub: 'Бесцветное, чёрное, твёрдое' },
	'cinkovanie': { tag: 'ГАЛЬВАНИКА', title: 'Гальваническое|цинкование', sub: 'от 39 ₽ за килограмм' },
	'tverdoe-hromirovanie': { tag: 'ГАЛЬВАНИКА', title: 'Твёрдое|хромирование', sub: 'Штоки, валы, оси' },
	'nikelirovanie': { tag: 'ГАЛЬВАНИКА', title: 'Гальваническое|никелирование', sub: 'Блестящий никель' },
	'anodirovanie-titana': { tag: 'ГАЛЬВАНИКА', title: 'Анодирование|титана', sub: 'Аноцвет — цвет без краски' },
	'kadmirovanie': { tag: 'ГАЛЬВАНИКА', title: 'Кадмирование', sub: 'Бесцветное и хроматированное' },
	'hromatirovanie-alyuminiya': { tag: 'ГАЛЬВАНИКА', title: 'Хроматирование|алюминия', sub: 'Электропроводное оксидирование' },
	'himicheskoe-nikelirovanie': { tag: 'ГАЛЬВАНИКА', title: 'Химическое|никелирование', sub: 'Равномерный слой без тока' },
	'oksidirovanie-stali': { tag: 'ГАЛЬВАНИКА', title: 'Оксидирование|стали', sub: 'Воронение с промасливанием' },
	'fosfatirovanie': { tag: 'ГАЛЬВАНИКА', title: 'Фосфатирование', sub: 'В том числе с оксидированием' },
	'olovyanirovanie': { tag: 'ГАЛЬВАНИКА', title: 'Оловянирование|(лужение)', sub: 'Олово и олово-висмут' },
	'mednenie': { tag: 'ГАЛЬВАНИКА', title: 'Меднение', sub: 'Подслой и электропроводность' },
	'serebrenie': { tag: 'ГАЛЬВАНИКА', title: 'Серебрение', sub: 'Контакты, шины, ВЧ-детали' },
	'zolochenie': { tag: 'ГАЛЬВАНИКА', title: 'Гальваническое|золочение', sub: 'Контакты и электроника' },
};

// Строки панели справа — из того же файла, что и первый экран страницы
// услуги (ServicePage.astro), чтобы превью и страница не расходились.
const PANELS = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'service-panels.json'), 'utf8'));
for (const [slug, c] of Object.entries(SERVICE_COVERS)) {
	const p = PANELS[slug];
	c.panel = { type: 'rows', head: p.head, items: p.items.map((i) => ({ k: i.k.toUpperCase(), v: i.v, hi: i.hi })) };
}

const FONT = "Arial, 'DejaVu Sans', sans-serif";
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const T = (x, y, s, size, fill, extra = '') =>
	`<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" fill="${fill}" ${extra}>${esc(s)}</text>`;

// панель справа
const PX = 650, PY = 96, PW = 480, PH = 452;
const IX = PX + 32, IW = PW - 64; // внутренняя область

function footLines(foot, y0) {
	if (!foot) return '';
	const arr = Array.isArray(foot) ? foot : [foot];
	return arr.map((f, i) => T(IX, y0 + i * 28, f, 18, '#a5b1c4')).join('');
}

const panels = {
	bars(p) {
		const top = PY + 104, labelW = p.labelW || 150, barX = IX + labelW, barW = IW - labelW - 64;
		const step = Math.min(64, (p.foot ? 250 : 300) / p.items.length);
		let s = p.items.map((it, i) => {
			const y = top + i * step, w = Math.max(8, (it.value / p.max) * barW);
			return T(IX, y + 21, it.label, 19, '#e7eef7', 'font-weight="600"') +
				`<rect x="${barX}" y="${y}" width="${barW}" height="30" rx="6" fill="#ffffff" fill-opacity=".06"/>` +
				`<rect x="${barX}" y="${y}" width="${w}" height="30" rx="6" fill="${it.hi ? 'url(#accent)' : 'url(#metal)'}"/>` +
				T(barX + w + 10, y + 22, it.text, 20, it.hi ? '#f2a25c' : '#ffffff', 'font-weight="700" stroke="#0e2743" stroke-width="6" paint-order="stroke"');
		}).join('');
		if (p.mark) {
			const mx = barX + (p.mark.value / p.max) * barW, y2 = top + (p.items.length - 1) * step + 42;
			s += `<line x1="${mx}" y1="${top - 14}" x2="${mx}" y2="${y2}" stroke="#f2a25c" stroke-width="2" stroke-dasharray="6 5"/>` +
				T(mx, y2 + 26, p.mark.text, 17, '#f2a25c', 'text-anchor="middle" font-weight="600"');
		}
		return s + footLines(p.foot, PY + PH - 34);
	},
	rows(p) {
		const top = PY + 94, step = 72;
		return p.items.map((it, i) => {
			const y = top + i * step;
			return `<rect x="${IX}" y="${y}" width="${IW}" height="62" rx="10" fill="#ffffff" fill-opacity="${it.hi ? '.12' : '.06'}" stroke="${it.hi ? '#c4651b' : '#6c7d92'}" stroke-opacity="${it.hi ? '1' : '.35'}"/>` +
				T(IX + 18, y + 25, it.k, 16, '#a5b1c4', 'font-weight="600"') +
				T(IX + 18, y + 50, it.v, 22, '#ffffff', 'font-weight="700"');
		}).join('') + footLines(p.foot, PY + PH - 34);
	},
	cols(p) {
		const top = PY + 96, gap = 14, w = (IW - gap * 2) / 3, h = 230;
		return p.items.map((it, i) => {
			const x = IX + i * (w + gap);
			return `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="12" fill="url(#plate)"/>` +
				(it.hi ? `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="12" fill="none" stroke="#c4651b" stroke-width="3"/>` : '') +
				T(x + w / 2, top + 50, it.k, 36, '#11304f', 'text-anchor="middle" font-weight="800"') +
				T(x + w / 2, top + 78, it.g, 14, '#1c4b80', 'text-anchor="middle" font-weight="700"') +
				it.lines.map((l, j) => T(x + w / 2, top + 128 + j * 32, l, 17, '#11304f', 'text-anchor="middle" font-weight="600"')).join('');
		}).join('') + footLines(p.foot, PY + PH - 34);
	},
	cards(p) {
		const top = PY + 96, gap = 16, w = (IW - gap) / 2, h = 150;
		return p.items.map((it, i) => {
			const x = IX + (i % 2) * (w + gap), y = top + Math.floor(i / 2) * (h + gap);
			return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="#ffffff" fill-opacity="${it.hi ? '.12' : '.06'}" stroke="${it.hi ? '#c4651b' : '#6c7d92'}" stroke-opacity="${it.hi ? '1' : '.35'}" stroke-width="${it.hi ? 2 : 1}"/>` +
				T(x + 20, y + 72, it.v, it.v.length > 7 ? 32 : 40, it.hi ? '#f2a25c' : '#ffffff', 'font-weight="800"') +
				T(x + 20, y + 112, it.t, 17, '#c9d6e6');
		}).join('');
	},
	swatches(p) {
		const top = PY + 100, gap = 10, w = (IW - gap * 4) / 5, h = 200;
		return p.items.map((it, i) => {
			const x = IX + i * (w + gap);
			let fx = '';
			if (it.kind === 'brushed') fx = Array.from({ length: 30 }, (_, j) => `<line x1="${x + 2}" y1="${top + 6 + j * 6.4}" x2="${x + w - 2}" y2="${top + 6 + j * 6.4}" stroke="#ffffff" stroke-opacity="${j % 3 ? .18 : .35}" stroke-width="1"/>`).join('');
			if (it.kind === 'hairline') fx = Array.from({ length: 60 }, (_, j) => `<line x1="${x + 2}" y1="${top + 4 + j * 3.2}" x2="${x + w - 2}" y2="${top + 4 + j * 3.2}" stroke="#${j % 2 ? '5d6b7c' : 'ffffff'}" stroke-opacity=".28" stroke-width="1"/>`).join('');
			return `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="10" fill="url(#sw-${it.kind})"/>` + fx +
				`<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="10" fill="none" stroke="#e7eef7" stroke-opacity=".45"/>` +
				T(x + w / 2, top + h + 40, it.k, 28, '#ffffff', 'text-anchor="middle" font-weight="800"') +
				T(x + w / 2, top + h + 66, it.t, 14, '#a5b1c4', 'text-anchor="middle"');
		}).join('') + footLines(p.foot, PY + PH - 34);
	},
	scale(p) {
		const y = PY + 190, x0 = IX + 10, W = IW - 20;
		const X = (v) => x0 + ((v - p.min) / (p.max - p.min)) * W;
		return `<rect x="${x0}" y="${y}" width="${W}" height="60" rx="10" fill="url(#heat)"/>` +
			`<rect x="${X(p.band[0])}" y="${y - 12}" width="${X(p.band[1]) - X(p.band[0])}" height="84" rx="10" fill="none" stroke="#f2a25c" stroke-width="3"/>` +
			`<rect x="${X(p.peak[0])}" y="${y}" width="${X(p.peak[1]) - X(p.peak[0])}" height="60" fill="#ffffff" fill-opacity=".35"/>` +
			T((X(p.band[0]) + X(p.band[1])) / 2, y - 26, `опасно: ${p.band[0]}–${p.band[1]} °C`, 22, '#f2a25c', 'text-anchor="middle" font-weight="700"') +
			T((X(p.peak[0]) + X(p.peak[1])) / 2, y + 128, `быстрее всего ${p.peak[0]}–${p.peak[1]} °C`, 19, '#ffffff', 'text-anchor="middle" font-weight="600"') +
			p.ticks.map((t) => `<line x1="${X(t)}" y1="${y + 60}" x2="${X(t)}" y2="${y + 70}" stroke="#a5b1c4"/>` + T(X(t), y + 92, t, 16, '#a5b1c4', 'text-anchor="middle"')).join('') +
			footLines(p.foot, PY + PH - 62);
	},
	colors(p) {
		const top = PY + 96, gap = 6, w = (IW - gap * 7) / 8, h = 150;
		return p.items.map((it, i) => {
			const x = IX + i * (w + gap);
			return `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="8" fill="${it.c}"/>` +
				`<rect x="${x}" y="${top}" width="${w}" height="${h / 2}" rx="8" fill="#ffffff" fill-opacity=".14"/>` +
				T(x + w / 2, top + h + 30, it.t, 17, '#ffffff', 'text-anchor="middle" font-weight="700"');
		}).join('') +
			footLines(p.foot, PY + PH - 62);
	},
};

function svg(c) {
	const lines = c.title.split('|');
	const longest = Math.max(...lines.map((l) => l.length));
	const size = lines.length > 2 || longest > 14 ? 50 : 56, lh = Math.round(size * 1.16);
	const tTop = 300 - ((lines.length - 1) * lh) / 2;
	const tagW = 48 + c.tag.length * 14.5;
	return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs>
 <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#1c4b80"/><stop offset=".5" stop-color="#11304f"/><stop offset="1" stop-color="#0a1f3d"/></linearGradient>
 <radialGradient id="glow" cx=".85" cy=".1" r=".6"><stop offset="0" stop-color="#c4651b" stop-opacity=".28"/><stop offset="1" stop-color="#c4651b" stop-opacity="0"/></radialGradient>
 <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M60 0H0V60" fill="none" stroke="#6c7d92" stroke-opacity=".12"/></pattern>
 <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3eaf3"/><stop offset="1" stop-color="#8196b1"/></linearGradient>
 <linearGradient id="accent" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2a25c"/><stop offset="1" stop-color="#c4651b"/></linearGradient>
 <linearGradient id="plate" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3eaf3"/><stop offset=".5" stop-color="#b3c3d8"/><stop offset="1" stop-color="#8196b1"/></linearGradient>
 <linearGradient id="heat" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a6ea5"/><stop offset=".45" stop-color="#c4651b"/><stop offset=".7" stop-color="#e0452b"/><stop offset="1" stop-color="#8a2d4a"/></linearGradient>
 <linearGradient id="sw-matte" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b9c3cf"/><stop offset="1" stop-color="#98a4b3"/></linearGradient>
 <linearGradient id="sw-bright" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3f6fa"/><stop offset=".5" stop-color="#c9d3df"/><stop offset="1" stop-color="#e8edf3"/></linearGradient>
 <linearGradient id="sw-brushed" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#a9b4c2"/><stop offset=".5" stop-color="#cfd7e1"/><stop offset="1" stop-color="#a1adbb"/></linearGradient>
 <linearGradient id="sw-mirror" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#7f8fa6"/><stop offset=".55" stop-color="#1d2a3a"/><stop offset=".75" stop-color="#9fb0c6"/><stop offset="1" stop-color="#ffffff"/></linearGradient>
 <linearGradient id="sw-hairline" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b2bcc8"/><stop offset="1" stop-color="#c3ccd7"/></linearGradient>
</defs>
<rect width="1200" height="630" fill="url(#bg)"/><rect width="1200" height="630" fill="url(#grid)"/><rect width="1200" height="630" fill="url(#glow)"/>
<rect width="1200" height="6" fill="#c4651b"/>
<g transform="translate(70 70)"><rect width="${tagW}" height="40" rx="20" fill="#ffffff" fill-opacity=".08" stroke="#6c7d92" stroke-opacity=".4"/><circle cx="22" cy="20" r="5" fill="#c4651b"/>${T(38, 26, c.tag, 16, '#a5b1c4', 'font-weight="700" letter-spacing="1.5"')}</g>
${lines.map((l, i) => T(70, Math.round(tTop + i * lh), l, size, '#ffffff', 'font-weight="800"')).join('')}
<rect x="70" y="${Math.round(tTop + (lines.length - 1) * lh + 34)}" width="72" height="5" rx="2.5" fill="#c4651b"/>
${T(70, Math.round(tTop + (lines.length - 1) * lh + 80), c.sub, 22, '#c9d6e6')}
${T(70, 568, 'ГК МЕТАЛЛИНВЕСТ · gkmetallinvest.ru', 16, '#6f86a3', 'font-weight="700" letter-spacing="1.5"')}
<rect x="${PX}" y="${PY}" width="${PW}" height="${PH}" rx="18" fill="#0a1f3d" fill-opacity=".55" stroke="#6c7d92" stroke-opacity=".45"/>
${T(IX, PY + 52, c.panel.head, 19, '#f2a25c', 'font-weight="700"')}
<line x1="${IX}" y1="${PY + 70}" x2="${IX + IW}" y2="${PY + 70}" stroke="#6c7d92" stroke-opacity=".4"/>
${panels[c.panel.type](c.panel)}
</svg>`;
}

const imgRoot = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'img');
const only = process.argv[2];
for (const [dir, set] of [['blog', COVERS], ['services', SERVICE_COVERS]]) {
	for (const [slug, c] of Object.entries(set)) {
		if (only && only !== slug) continue;
		const img = sharp(Buffer.from(svg(c)), { density: 96 }).resize(1200, 630);
		await img.clone().png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(join(imgRoot, dir, `${slug}.png`));
		await img.clone().webp({ quality: 86 }).toFile(join(imgRoot, dir, `${slug}.webp`));
		console.log(`ok: ${dir}/${slug}`);
	}
}
