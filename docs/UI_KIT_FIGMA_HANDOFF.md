# UI kit: передача в Figma

Реализация в коде: [`src/styles/tokens.css`](../src/styles/tokens.css) и компоненты в [`src/components/ui/`](../src/components/ui/).

## Цвета (светлая индустриальная база)

| Токен | Значение | Назначение |
|-------|----------|------------|
| `--color-bg` | `#f6f7f9` | Фон страницы |
| `--color-surface` | `#ffffff` | Карточки, шапка |
| `--color-text` | `#1a1d21` | Основной текст |
| `--color-muted` | `#5c6470` | Подписи |
| `--color-border` | `#e2e5ea` | Границы |
| `--color-accent` | `#1e5a8e` | Акцент, ссылки, primary CTA |
| `--color-accent-hover` | `#174a75` | Hover кнопок |

## Типографика

- **UI / body:** системный стек: `system-ui, "Segoe UI", Roboto, sans-serif`
- **Заголовки:** `font-weight: 600–700`, `line-height` 1.2–1.25
- **H1:** `clamp(1.75rem, 4vw, 2.25rem)`
- **Базовый кегль:** `1rem`, межстрочный 1.55–1.65 для длинных B2B-текстов

## Компоненты (есть в Astro)

| Компонент | Файл |
|-----------|------|
| Кнопка primary / secondary / ghost | `ui/Button.astro` |
| Карточка категории / услуги | `ui/Card.astro` |
| Поле формы, label | `ui/Field.astro` |
| Аккордеон FAQ | `ui/Accordion.astro` |
| Хлебные крошки | `Breadcrumbs.astro` |
| Блок городов РФ | `CityBlock.astro` |
| CTA-блок | `CtaSection.astro` |
| Липкая панель mobile | `MobileStickyBar.astro` |
| Шапка / мегаменю | `SiteHeader.astro` |
| Подвал | `SiteFooter.astro` |

В Figma: собрать **Auto layout** карточек с радиусом `--radius-lg` (12px), тень `--shadow-sm` для приподнятых панелей.

## Сетка

- Контейнер: `max-width: 1160px`, горизонтальные отступы `1.25rem` (mobile) / `1.5rem` (desktop).
- Карточки каталога: минимум `280px` в grid `repeat(auto-fill, minmax(280px, 1fr))`.
