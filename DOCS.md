# 📖 AI Skin Lab — Техническая документация

Полное описание дизайна, функционала и структуры проекта.
Компаньон к [`README.md`](./README.md) (в README — быстрый старт и запуск,
здесь — детали реализации и дизайн-система).

---

## 1. О проекте

**AI Skin Lab** — веб-каталог премиальной косметики и парфумерии с тремя
опорными возможностями:

1. **Автоматическая синхронизация данных** из локального Excel-файла
   (`price.xlsx`) — правка таблицы мгновенно отражается в каталоге без
   перезапуска сервера.
2. **AI-консультант (RAG)** — чат-виджет, который подбирает 1–3 товара под
   описание потребности клиента на основе векторного поиска по каталогу и LLM.
3. **Деплой через Docker + туннелирование** — `docker compose up -d` и
   публикация через Cloudflare Tunnel / Ngrok.

Интерфейс сейчас однолокализованный (`uk`, файл `frontend/src/messages/uk.json`).
Словари `ru` / `en` подключаются добавлением JSON-файла и правкой
`frontend/src/i18n/config.ts` — код к этому готов (см. §5).

| Слой | Технологии |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS, Framer Motion, Swiper, three.js (Hero) |
| Backend | Python 3.11, FastAPI, pandas + openpyxl, watchdog, OpenAI SDK, numpy |
| AI | RAG: `text-embedding-3-small` (векторы) + `gpt-4o-mini` (генерация), fallback без ключа |
| Инфра | Docker Compose, Cloudflare Tunnel / Ngrok |
| Качество | `tsc --noEmit`, `next lint` (eslint-config-next), `node check-i18n.js` |

---

## 2. Дизайн-система

### 2.1. Концепция

Эстетика **premium beauty / niche perfumery**: минимализм, много «воздуха»,
тёплая нейтральная палитра с кофейными акцентами и одним ярким ягодным цветом,
который зарезервирован **исключительно под выгоду и скидки** — взгляд всегда
первым цепляется за цену со скидкой. Типографика — контраст «элегантная
антиква для заголовков + чистый гротеск для интерфейса».

### 2.2. Палитра (токены в `frontend/src/app/globals.css`, классы — в `tailwind.config.ts`)

| Токен | HEX (светлая тема) | Роль | Где применяется |
|---|---|---|---|
| `cream` | `#faf7f2` | фон приложения | `body`, светлые секции |
| `sand` | `#efe7dd` | фон-подложка | изображения товаров, пузыри чата, тени секций |
| `mocha` | `#b08968` | бренд-акцент | надзаголовки, ссылки в hover, фокус-кольца, логотип |
| `espresso` | `#4a3728` | основной текст | заголовки, кнопки, шапка чата |
| `berry` | `#b3235c` | **акцент выгоды** | новая цена, бейдж Sale, % скидки |
| `gold` | `#c9a227` | премиум-акцент | primary-градиент, glow, marquee-разделители |

Тёмная тема переключается атрибутом `[data-theme="dark"]` на `<html>` и
переопределяет те же CSS-переменные (`--bg`, `--ink`, `--sale`, …).

Правило контраста: старая цена — `opacity .45` + зачёркивание (`.price-old`),
новая цена — `--sale` жирным (`.price-new`). Никогда не использовать `berry`
в декоративных целях, иначе акцент выгоды обесценится.

### 2.3. Типографика

| Роль | Шрифт | Токен |
|---|---|---|
| Заголовки, цены-эмоции | **Cormorant Garamond** (антиква) | `font-serif` / `--font-serif` / `--font-disp` |
| Интерфейс, тексты | **Inter** | `font-sans` / `--font-sans` |

Шкала: H1 в `Hero` (`text-4xl → 7xl`), H2 секций `.section-title`
(`text-3xl → 5xl`), надзаголовки `.section-label` (12px, uppercase, трекинг
`0.25em`, цвет `--azure`), тело — 14–16px с `leading-relaxed`.

### 2.4. Сетка и компоненты-примитивы (`globals.css`)

| Класс | Назначение |
|---|---|
| `.container-page` | центрированный контейнер `max-w-8xl` с адаптивными отступами |
| `.glass` / `.tile` | стеклянная панель: градиент + `backdrop-filter: blur(22px)` + блик сверху |
| `.btn` / `.btn-primary` / `.btn-ghost` | кнопки-«пилюли» (`rounded-full`), дл. перехода 300ms |
| `.chip-f` | чип-фильтр (морды в Hero, фильтры каталога, подсказки чата) |
| `.card` | карточка товара: стеклянный фон, `rounded-1.5rem`, мягкая тень |
| `.input` / `.select` | поля ввода/фильтров с кольцом фокуса |
| `.price-old` / `.price-new` | ценовые акценты (см. палитру) |
| `.pearl-edge::before` | анимированная «перламутровая» рамка (градиент `gold → berry → mocha`) |

### 2.5. Анимации

| Эффект | Реализация | Где |
|---|---|---|
| Появление карточек | Framer Motion `whileInView`: `opacity 0→1`, `y 24→0`, каскад `0.06s` | сетки каталога, похожие товары |
| Hover-подъём карточки | Framer Motion `whileHover={{ y: -6 }}` + масштаб картинки `1.05` | `ProductCard` |
| Пульсация Sale | Tailwind `animate-pulse` на ядовито-ярком бейдже | карточки, страница товара |
| Бегущая строка | CSS `@keyframes marquee` 36s linear | `Marquee` под Hero |
| Hero-секция | каскад `stagger`: бейдж → H1 по словам → подзаголовок → кнопки → стата | `Hero` |
| 3D-сцена | three.js: `MeshTransmissionMaterial`, `Float`, `Sparkles`, демпфирование указателя | `HeroScene` / `HeroVisual` |
| Открытие чата | spring (`stiffness 260 / damping 24`), scale+fade | `ChatWidget` |
| Печать ответа | посимвольный вывод по 2 символа каждые 18 мс, курсор `animate-pulse` | `ChatBubble` |
| Счётчики | `CountUp` с easing, запуск при попадании во viewport | Hero-статистика |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` отключает все анимации | `globals.css` |

### 2.6. Структура главной страницы

```
Header (sticky: логотип, 3 ссылки навигации, переключатель темы)
└── main
    ├── Hero        — плиточная сетка (grid-template-areas):
    │                 copy   : H1 (пословная анимация), лид, 2 CTA
    │                 stage  : 3D-стеклянная сцена (fallback — CSS-градиент)
    │                 mood   : «Оберіть категорію» → ссылки на /catalog?q=…
    │                 stats  : товары / бренды / знижки (CountUp)
    ├── Marquee      — бегущая строка УТП (бесплатная доставка, AI-підбір, …)
    └── SaleSection  — горизонтальная Swiper-карусель акционных товаров
Footer  — 3 колонки: контакт, каталог, информация
ChatWidget — фиксированная кнопка справа внизу + панель диалога
```

### 2.7. Страницы

| Роут | Файл | Рендер | Содержимое |
|---|---|---|---|
| `/` | `src/app/page.tsx` | SSR (`force-dynamic`) | Hero + Marquee + SaleSection, топ-10 скидок |
| `/catalog` | `src/app/catalog/page.tsx` | SSR | фильтры/поиск/сортировка (`CatalogClient`), 12 на страницу |
| `/product/[id]` | `src/app/product/[id]/page.tsx` | SSR | карточка товара, характеристики, до 4 похожих, `404` если нет |
| `/404` | `next` built-in | — | `notFound()` |

Бэкенд отвечает за канонические фильтры (`search`, `brand`, `category`,
`on_sale`, `min_price`, `max_price`, `sort`); UI каталога дублирует логику на
клиенте, чтобы фильтровать мгновенно без сетевого запроса.

---

## 3. Backend

### 3.1. Эндпоинты

| Метод | Путь | Назначение |
|---|---|---|
| `GET` | `/api/catalog` | список + фильтры + `brands` / `categories` / `last_updated` |
| `GET` | `/api/catalog/sale` | акционные товары, сортировка по % скидки (`limit`) |
| `GET` | `/api/catalog/{id}` | один товар, `404` если нет |
| `POST` | `/api/chat` | RAG-чат: `{message, lang, history[]}` → `{reply, products[]}` |
| `GET` | `/api/health` | `{status, products, last_updated}` — healthcheck в compose |
| `GET` | `/admin/reload` | принудительная перезагрузка каталога |
| `GET` | `/admin/translate` | `?to=ru,en&dry_run=&sku=` — заполняет пустые ru/en-ячейки в Excel |
| `GET` | `/images/*` | статика из `data/images/` |

**Безопасность `/admin/*`:** оба эндпоинта требуют заголовок
`X-Admin-Token`, значение которого задаётся в `.env` (`ADMIN_TOKEN=`).
Если токен не задан — эндпоинты возвращают `404` и полностью выключены,
поэтому деплой по умолчанию не открывает запись в Excel извне.

### 3.2. Синхронизация каталога

`backend/app/store.py` держит каталог в памяти под `RLock` и запускает
два наблюдателя:

1. `watchdog.Observer` на каталог `data/` (дебаунс 1 с);
2. поток опроса `mtime` каждые 3 с — страховка для Docker Desktop на Windows,
   где inotify не прокидывается в контейнер.

Каталог перечитывается автоматически, `on_reload`-колбэк пересобирает
векторный индекс AI. Проверка: `GET /api/health` → поле `last_updated`.

### 3.3. Разбор Excel

`backend/app/catalog_loader.py`:
* таблица псевдонимов колонок (`Артикул`/`SKU`/`ID`, `Ціна, грн`/`Price`, …);
* нормализация чисел/текста, расчёт скидки, если `%` не заполнен;
* категория — из колонки `Категорія`, иначе по ключевым словам
  (`CATEGORY_KEYWORDS`), иначе «Інше»;
* теги (`_extract_tags`) — для поиска и промпта AI;
* изображение — колонка `Фото` (код без расширения дополняется
  `.jpg/.png/.webp`), затем `<Артикул>`, затем `<Артикул>` с ведущими нулями
  (`2 → 002.png`), иначе `placeholder.svg`;
* дубликаты артикулов получают суффикс (`2-2`, `2-3`), а не теряются.

### 3.4. AI-консультант (RAG)

1. При загрузке каталога `VectorIndex.build()` эмбеддит «название + бренд +
   категория + описание + теги» через `text-embedding-3-small`.
2. Запит → cosine similarity (NumPy, top-5) → системный промпт с товарами →
   `gpt-4o-mini` (`temperature 0.6`, `max_tokens 500`) → текст + ≤3 карточки.
3. Без `OPENAI_API_KEY` (или при ошибке API) — keyword-поиск и заготовленный
   ответ на языке запроса: функциональность не падает, карточки товаров
   всё равно подбираются.

---

## 4. Конфигурация

`backend/app/config.py` — `pydantic-settings`, читает `.env` **из корня
проекта** (и, как запасной вариант, из рабочей директории), все неизвестные
ключи игнорируются.

| Переменная | Назначение | По умолчанию |
|---|---|---|
| `EXCEL_PATH` | путь к `price.xlsx` | `<корень>/data/price.xlsx` |
| `IMAGES_DIR` | каталог изображений | `<корень>/data/images` |
| `OPENAI_API_KEY` | ключ OpenAI (пусто = fallback-режим) | `""` |
| `OPENAI_BASE_URL` | базовый URL API | `https://api.openai.com/v1` |
| `CHAT_MODEL` / `EMBEDDING_MODEL` | модели | `gpt-4o-mini` / `text-embedding-3-small` |
| `ALLOWED_ORIGINS` | CORS, через запятую | `http://localhost:3000,http://localhost:8000` |
| `AUTO_TRANSLATE` | авто-перевод ru/en при перезагрузке каталога | `0` |
| `ADMIN_TOKEN` | ключ `/admin/*` (пусто = эндпоинты выключены) | `""` |
| `SHEET_NAME` | лист Excel | `Зручна таблиця` |
| `CURRENCY` | единица цены в UI/AI-промпте | `грн` |

`docker-compose.yml` задаёт контейнерные пути сам (`/app/data/...`),
поэтому `.env` можно не дополнять для Docker-запуска.

---

## 5. Локализация

* Единственный активный язык — **украинский**: `frontend/src/messages/uk.json`,
  `frontend/src/i18n/config.ts` → `locales = ["uk"]`, `defaultLocale = "uk"`.
* `frontend/src/i18n/request.ts` — тонкая обёртка `useTranslations(namespace)`
  поверх JSON (после отказа от `next-intl` ради упрощения сборки);
  `frontend/src/i18n/navigation.tsx` — `Link` / `useRouter` / `redirect`.
* Проверка целостности словаря: `node check-i18n.js` — сверяет каждый
  `t("key")` с пространством имён, из которого он вызван.

---

## 6. Проверка качества

```bash
cd frontend
node check-i18n.js        # все ключи переводов существуют
npx tsc --noEmit          # типы
npm run lint              # eslint (next/core-web-vitals)
npm run build             # production-сборка

cd ../backend
python -m compileall app  # синтаксис Python
```
