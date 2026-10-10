# AI Skin Lab — Полная документация сайта (для анализа агентом)

> Последнее обновление: 2026-10-09. Файл покрывает: обзор, стек, роутинг, дизайн-систему,
> все компоненты, логику данных (каталог/вирізки), API, AI-консультанта **с полным промтом**,
> конфигурацию, тесты и подводные камни.

---

## 1. Обзор

**AI Skin Lab** — интернет-магазин премиальной косметики и парфумерии с AI-консультантом.
Локальный проект под Windows, запускается через Docker Compose.

| Параметр | Значение |
|---|---|
| Локали | только `uk` (без переключателя) |
| Тема | тёмная по умолчанию (`defaultTheme="dark"`), есть переключатель; **тёмную тему не трогать** |
| Бренды | `Smart4Derma`, `Cef Lab`, `Anna Logon` (данные из Excel, могут меняться) |
| Товары | ~159 (данные живые, пользователь регулярно дополняет price.xlsx) |
| Категории | `Крем`, `Сироватка`, `Догляд за обличчям`, `Догляд за тілом`, `Інше` (угадываются автоматически из названия/описания) |

---

## 2. Стек и запуск

```
Frontend: Next.js 14 (App Router, output: standalone) — порт 3000
Backend:  FastAPI + pandas + watchdog + rembg — порт 8000
AI:       Groq API (openai/gpt-oss-120b → fallback openai/gpt-oss-20b)
БД:       нет — источник истины Excel price.xlsx, каталог in-memory
```

**Структура репозитория:**
```
AI Skin Lab/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI: lifespan, mounts /images и /cutouts, /api/health, /api/cutouts, /admin/*
│   │   ├── config.py          # Settings (pydantic-settings, env_file=корневой .env)
│   │   ├── store.py           # CatalogStore + watchdog/mtime-watcher (reload по изменению price.xlsx)
│   │   ├── catalog_loader.py  # Excel → Product[] (pandas, alias-и колонок, угадывание категории)
│   │   ├── models.py          # Pydantic: Product, CatalogResponse, ChatRequest/Response...
│   │   ├── cutouts.py         # АВТОгенерация вырезок rembg при reload каталога (фоновый поток)
│   │   ├── ai_assistant.py    # vector_index (embedding-поиск, используется роутером)
│   │   └── routers/           # catalog.py, chat.py (проксируют /api/chat на Groq? нет — см. §8)
│   ├── scripts/               # make_cutouts.py (ручной бэкоффл), translator.py
│   ├── requirements.txt       # fastapi, uvicorn, pandas, watchdog, rembg[cpu]==2.0.69...
│   └── Dockerfile             # python:3.11-slim, запечённая модель u2net
├── frontend/
│   ├── src/
│   │   ├── app/               # страницы + api/chat/route.ts
│   │   ├── components/        # см. §5
│   │   ├── lib/               # api.ts, cutouts.ts, chatStorage.ts, chatClient.ts, types.ts, format.ts
│   │   ├── i18n/              # request.ts, navigation.tsx (PLAIN <a>! см. §12)
│   │   ├── messages/uk.json   # все тексты UI
│   │   └── app/globals.css    # дизайн-система
│   ├── next.config.js         # rewrites: /api/*, /images/*, /cutouts/* → backend
│   └── Dockerfile / .dockerignore  # .env* исключены из образа
├── data/
│   ├── price.xlsx             # источник каталога (sheet «Зручна таблиця») — volume-mount
│   ├── images/                # фото товаров (исходники)
│   └── cutouts/               # вырезки .webp (АВТОгенерируются бэкендом)
├── docker-compose.yml         # backend + frontend, healthcheck, GROQ_API_KEY из корневого .env
├── README.md                  # EN+UK
├── AI_CONSULTANT_PROMPT.md    # промт и статус моделей
└── DESIGN_AND_AI_DOCS.md      # этот файл
```

**Рабочий цикл деплоя:**
```powershell
# frontend
cd frontend; npm.cmd run build          # валидация TS
cd ..; docker compose build frontend; docker compose up -d frontend
# backend (после изменений кода/requirements)
docker compose build backend; docker compose up -d backend
```
Docker Desktop лежит в `C:\Users\Arthur\AppData\Local\Programs\DockerDesktop\Docker Desktop.exe`
(иногда падает — перезапустить; после падения у backend **теряется Docker-сеть** →
`docker compose up -d --force-recreate backend`).

---

## 3. Роутинг и страницы

Все страницы `export const dynamic = "force-dynamic"` (SSR на каждый запрос, данные не кешируются надолго).

| Роут | Файл | Что делает |
|---|---|---|
| `/` | `app/page.tsx` | Главная: Hero (3 вырезки), Marquee, Категории-плитки, Горячие предложения, Бренды, AI-секция, Footer |
| `/catalog` | `app/catalog/page.tsx` | `getCatalog()` с 3 ретраями; `?q=`, `?category=`, `?sale=1` из URL; состояние ошибки с кнопкой reload |
| `/catalog?sale=1` | то же | раздел «Знижки» из хедера |
| `/product/[id]` | `app/product/[id]/page.tsx` | `getProduct(id)` + до 4 похожих (та же категория/бренд); `notFound()` если нет |
| `/api/chat` | `app/api/chat/route.ts` | **роут-хендлер**, перебивает rewrite `/api/*` (проверяется заголовком `x-ai-skin-lab-source: next-route`) |

**Главная (`page.tsx`) логика:**
- `Promise.all([getCatalog(), getSaleProducts(10), getCutoutIds()])`
- Hero: ранжирование (сначала со скидкой, потом по % скидки), первые 3 с наличием вырезки, иначе fillers
- Плитки категорий: для каждой категории ищется товар с вырезкой (уголок плитки), иначе `sample.image`/placeholder
- Бренды: топ-3 товара на бренд (по скидке), общее количество
- Любой сбой сети → пустой state, страница не падает
- `getCutoutIds()` при ошибке возвращает пустой Set (не роняет страницу)

**Навигация:** `i18n/navigation.tsx` экспортирует `Link` как **обычный `<a>`** и
`useRouter.push` как `window.location.href` → **каждый переход = полная перезагрузка**.
Это причина, по которой состояние чата приходилось персистить в localStorage (§9).

---

## 4. Дизайн-система (`frontend/src/app/globals.css`)

### 4.1 Токены (CSS custom properties)

```css
:root {  /* light */
  --cream: #faf7f2; --sand: #f1e9dd; --champagne: #e8d5b0;
  --gold: #c9a55c;  --gold-deep: #a9843e; --espresso: #3a2a1e;
  --ink: #3a2a1e;   /* основной текст */
  --muted: rgba(58,42,30,.72);
  --gl: rgba(201,165,92,.32);   /* границы */
  --azure: #d3a87c;             /* акцент, user-пузырь чата, активные ссылки */
  --aqua: #e3c46a; --label: #c9a55c;
  --sale: #e57ba4;              /* sale-бейджи */
  --pic: rgba(211,168,124,.12); /* подложка картинок */
  --noir: #1a140f;              /* тёмный фон */
}
[data-theme="dark"] {
  --ink: #f7f0e6;
  --muted: rgba(247,240,230,.72);
  --ga: rgba(255,255,255,.07);  /* градиенты стекла */
  --gb: rgba(255,255,255,.03);
  --gl: rgba(201,165,92,.32);
  --sh: 0 24px 60px rgba(0,0,0,.45);
  background: var(--noir); color: #f7f0e6;
}
```

### 4.2 Ключевые классы

| Класс | Назначение |
|---|---|
| `.container-page` | центрированный контейнер с паддингами |
| `.tile` | карточка/панель: `linear-gradient(135deg,var(--ga),var(--gb))` + border `--gl` + radius 1.5rem + shadow `--sh` |
| `.glass` | стекло: `rgba(255,255,255,.04)` + `backdrop-filter: blur(12px)` — пузыри чата, чипы |
| `.input` | поле ввода: radius 9999, градиент, placeholder `--muted`, фокус — золото |
| `.select` | кастомный `<select>`: `appearance:none` + SVG-стрелка (gold stroke), padding-right 2.5rem, ховер/фокус — рамка `--azure` + тень `0 0 0 3px rgba(201,165,92,.25)`, опции: light → cream/ink, dark → espresso/cream |
| `.chip-f`, `.chip` | chip-кнопки фильтров/подсказок |
| `.btn`, `.btn-primary`, `.btn-ghost` | кнопки (pill, gold gradient primary) |
| `.price-new` / `.price-old` | промо-цена / зачёркнутая старая |
| `.section-title` | `text-2xl font-semibold tracking-tight` |
| `.section-noir` | тёмная полоса-секция, переопределяет токены внутри (в light теме — champagne-градиент) |
| `.header-pill`, `.header-progress` | плавающий хедер-пилюля + прогресс-бар скролла |
| `.typing-dot` | анимация «печатает…» в чате |
| `.chat-scroll` | скролл-контейнер чата, кастомный скроллбар 6px (`--pic`) |

### 4.3 Типографика и адаптив
- Шрифт: **Inter** (variable, self-hosted); логотип/заголовки — `font-serif`
- Брейкпоинты: `sm ≥640`, `lg ≥1024`, `xl ≥1280` (mobile-first)
- Сетка каталога: 2 / 3 / 4 / 5 колонок (`grid-cols-2 sm:3 lg:4 xl:5`)

### 4.4 Анимации
- **Framer Motion**: входы секций (`opacity/y`), `whileHover/whileTap` на кнопках, `AnimatePresence` пузырей/карточек
- **Living Background** (`LivingBackground.tsx`): CSS-градиенты + частицы + beam + свечение курсора, затемнение на тёмных секциях; `prefers-reduced-motion` уважается
- **Lenis** (`LenisProvider.tsx`) — плавный скролл
- **IntersectionObserver + clip-path** — reveal-анимации (грабли: clip-path на ребёнке, IO на родителе!)
- **CountUp** — счётчики цифр; **Marquee** — бегущая строка брендов
- Печать ответа в чате: 2 символа / 18 мс (ChatBubble)

---

## 5. Компоненты

### Layout (`app/layout.tsx`)
`ThemeProvider → LenisProvider → LivingBackground + Header + main + Footer + ChatWidget`.
ChatWidget лежит в root layout (но state всё равно теряется из-за full-reload навигации — §9).

### Header (`components/Header.tsx`)
- Sticky-пилюля `top-3`, ужимается при скролле (`is-compact` > 24px), прогресс-бар чтения
- Ссылки: Главная, Каталог, Знижки (`/catalog?sale=1`); логотип `/logo.png` в стеклянном кольце
- `ThemeToggle` + бургер (моб.), активная ссылка — `--azure`

### Главная
- **Hero/HeroProducts**: крупный заголовок, 3 парящих товара-вырезки с ценами/скидками, кнопки «Перейти в каталог» / «Запитати AI» (диспатчит `ai:open` c предзаполненным текстом), статистика (159 товарів · 9 брендів · знижки до −34%)
- **Marquee**: бегущая строка названий брендов
- **CategoriesSection**: плитки категорий с 3D-tilt (до 8°), счётчиками, вырезкой в углу; ведут на `/catalog?category=`
- **SaleSection**: рельса «Гарячі пропозиції» (Swiper-free / SaleRail), badge SALE, `-XX%`
- **BrandsSection**: по группе на каждый бренд — топ-3 карточки + «Усі товари бренду»; бренды берутся из `initial.brands` (**автоматически появляются новые** при наличии товаров)
- **AiSection**: демо-диалог с автопечатью (скрипт из uk.json, циклично, уважает reduced-motion) + кнопка открытия виджета
- **Footer**: копирайт, ссылки

### Каталог (`catalog/CatalogClient.tsx`)
- Sticky-панель фильтров: поиск (инпут), **3 селекта** (бренд / категория / сортировка — стилизованы `.select`), чип «Зі знижкою», сброс ✕
- Все фильтры комбинируются: `q` (name/brand/category/description), brand, category, onSale, sort (`price_asc|price_desc|discount|name`)
- Счётчик результатов + «оновлено …»; пагинация «Показати ще» (PAGE_SIZE=12)
- URL-синхронизация: `q/category/sale` из `useSearchParams` ( эффект при смене)
- `initial === null` → ошибка загрузки + кнопка reload; пусто → «Нічого не знайдено»

### Продукт (`product/ProductDetailView.tsx`)
- Крупная картинка: **cutout → оригинал → placeholder** (probe через `new Image()` при монтировании)
- Бренд, название, цены (промо/старая/скидка), объём/страна/остаток, описание (uk)
- Для наборов (`is_set`): бейдж «🎁 Подарунковий набір» (слева, SALE — справа) и блок
  **«Склад набору»** — список компонентов (thumb + название + цена, ссылки на `/product/{id}`);
  компоненты резолвятся в `product/[id]/page.tsx` по `set_items` через `getCatalog()`
- Похожие товары снизу (до 4)

### ProductCard
- Обёртка `<Link href=/product/{id}>`, cutout с 3-ступенчатым fallback, цена
- Бейджи: SALE — **справа сверху**, «🎁 Подарунковий набір» (если `is_set`) — **слева сверху**
  (`.glass` + `--gold`, чтобы не конфликтовать с SALE)

### Футер/мелочи
`Footer.tsx` (+ Instagram-блок `@ai_skin_lab` в первой колонке — hardcoded-цвета футера,
не токены темы!), `CountUp.tsx`, `SaleRail.tsx`, `ThemeProvider.tsx` (localStorage + `data-theme` на `<html>`)

---

## 6. Логика данных: каталог

### Пайплайн
```
data/price.xlsx (sheet «Зручна таблиця» + опц. sheet «sets»)
  → catalog_loader.load_catalog()   [pandas + openpyxl]
  → Product[] (Pydantic, in-memory)
  → CatalogStore (RLock) + on_reload коллбэки:
        1) vector_index.build()      (embedding-индекс для ai_assistant)
        2) schedule_generate()       (автогенерация вырезок, фоновый поток)
  → триггеры reload:
        - старт (lifespan → start_watcher)
        - watchdog-событие на файле price.xlsx (дебаунс 1с + sleep 0.3с)
        - mtime-poll каждые 3с (fallback для Docker Desktop file share)
        - GET /admin/reload (нужен ADMIN_TOKEN, без него — 404)
```
⚠️ Важно: watcher следит только за **конкретным файлом** price.xlsx (фильтр по пути) —
запись файлов в `data/cutouts/` не вызывает reload (цикла нет).

### Колонки Excel (alias-и в `COLUMN_ALIASES`)
`Артикул|SKU|ID`, `Назва товару|Назва|Name`, `Бренд|Brand`, `Ціна, грн|Ціна`, `Промо ціна, грн`,
`Знижка, %`, `Залишок, шт`, `Об'єм`, `Країна-виробник`, `Короткий опис (ноти)|Опис`,
`Фото|Image_Name|Image`, опционально `Назва (ru)/(en)`, `Категорія`, `Опис (uk/ru/en)`.

- Категория: из колонки `Категорія`, иначе `_guess_category()` по ключевым словам названия+описания
  (крем/сироватка/обличч/тіло/парфум…), иначе `Інше`
- Цены: promo берётся если `< price`; скидка = `(1-promo/price)*100` если не указана
- Дубликаты SKU → id с суффиксом `-2`, `-3`…
- Изображение: `_resolve_image(sku, image_value)` ищет файл в `data/images/` по кандидатам
  (значение ячейки, sku, sku.zfill(3)) × расширения ("" | .jpg | .jpeg | .png | .webp);
  не найдено → `/images/placeholder.svg`, `has_image=false`

### Наборы (опциональный лист `sets`)
- `load_sets(excel_path, by_sku)` читает лист **`sets`** (нет листа → молча `[]`);
  колонки (alias-и `SET_COLUMN_ALIASES`): `Назва набору`, `Склад (артикули через кому)`,
  `Ціна набору, грн`, `Знижка, %`, `Фото`, `Опис`
- Одна строка = один набор из **существующих SKU** основного листа (через `,`/`;`);
  строки с неизвестными sku пропускаются
- Дефолты: цена = сумма цен компонентов (ячейка цены → `promo_price`, если < суммы;
  иначе — скидка из колонки `Знижка, %` переводится в цену); скидка пересчитывается если не указана;
  остаток = `min` по компонентам; фото = первая картинка компонента (или из колонки `Фото`);
  бренд = бренд первого компонента; категория — фиксированная **«Набори»**
- `id`/`sku` = `set-<санитизированные skus>` (например `set-700-703-706`),
  `is_set=true`, `set_items=[id компонентов]`
- Описание автоматически дополняется: `«Подарунковий набір: Назва1 + Назва2.»` (+ текст из `Опис`) —
  по нему AI цитирует состав (в context отдаётся `is_set`, но не список имён)
- Теги: из названия/описания + «набір»
- ⚠️ В `data/price.xlsx` пользовательские строки-«наборы» (sku вида `700\703\706\708\711`) —
  обычные товары, это НЕ лист `sets`; `is_set` они получают только через `load_sets`

### API бэкенда
| Endpoint | Описание |
|---|---|
| `GET /api/catalog` | `{items, total, brands[], categories[], last_updated}` (brands/categories — отсортированные уникалы) |
| `GET /api/catalog/{id}` | один товар или 404 |
| `GET /api/catalog/sale?limit=N` | со скидкой |
| `GET /api/cutouts` | `{ids: [...]}` — id товаров, у которых есть вырезка |
| `GET /images/*` | статика исходников |
| `GET /cutouts/*` | статика вырезок (StaticFiles, mime webp добавлен вручную!) |
| `GET /api/health` | `{status, products, last_updated}` (healthcheck) |
| `GET /admin/reload`, `/admin/translate` | под `X-Admin-Token` (если ADMIN_TOKEN не задан — 404) |

### Вырезки (cutouts) — автоматика
- `backend/app/cutouts.py`: при каждом reload каталога фоновый поток ищет товары **без** файла
  `data/cutouts/<sanitized_id>.webp` → `rembg` (u2net) → обрезка по альфа-боксу (>8) → max 900px →
  WebP q86, атомарная запись через `.tmp`. Сессия rembg ленивая (грузится только при реальной работе),
  лок на потоки. Пропуск: svg/отсутствующие исходники (placeholder).
- Модель u2net **запечена в Docker-образ** на этапе build.
- Имя файла: id санитизируется `[\\/:*?"<>|] → _` (например `700\703\706\708\711` → `700_703_706_708_711`).
- Frontend: `lib/cutouts.ts` — `cutoutName(id)`, `cutoutSrc(id)` = `/cutouts/<имя>.webp`
  (URL тот же, что раньше был в `public/` → rewrite в next.config проксирует на backend).
- Fallback-цепочка везде: **cutout → product.image → /images/placeholder.svg** (onError, 2 ступени).
- `rembg[cpu]==2.0.69` (не 2.0.85! — с 2.0.70 requires `numpy>=2.3`, конфликт с пином `numpy==1.26.4`).
- Ручной бэкоффл: `python backend/scripts/make_cutouts.py [--limit N]` (пишет в `data/cutouts`).

---

## 7. Frontend API-слой (`lib/api.ts`, server-only)

```typescript
fetchJson<T>(url, revalidate)   // Next.js fetch с ISR-кешем
getCatalog()        → /api/catalog            revalidate 30
getProduct(id)      → /api/catalog/{id}       revalidate 60
getSaleProducts(10) → /api/catalog/sale       revalidate 30
getCutoutIds()      → /api/cutouts            revalidate 60, ошибка → пустой Set
BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"
```
`next.config.js` rewrites (внутри контейнера frontend → `http://backend:8000`):
`/api/:path*`, `/images/:path*`, `/cutouts/:path*`.
Картинки `next/image` в standalone ругаются на отсутствие `sharp` — это известный безвредный warning.

---

## 8. AI-консультант — архитектура

### 8.1 Поток данных
```
ChatWidget (state в layout, persist §9)
  → POST /api/chat {message (≤1000), lang, history (последние 6, каждый ≤500 символов)}
    → loadCatalog() (кеш 60с, только stock>0 участвуют в выдаче)
    → retrieve(products, message, lang, 15)        # серверный ретривал, §8.2
    → system = SYSTEM_PROMPT(бренды подставляются динамически: {{BRANDS}} → уникальные brand из каталога)
      + «context.products …» + JSON топ-15 кандидатов (+ is_set)
    → messages = [system, ...history, user]
    → callGroq(): модель из GROQ_MODEL (по умолчанию "openai/gpt-oss-120b,openai/gpt-oss-20b"),
      temperature 0.3, max_tokens 2048, response_format json_object, timeout 30с,
      перебор моделей по очереди при ошибке
    → parseReply(): срез ```json, JSON.parse, валидация id по живому каталогу
      (stock>0, без дублей, максимум 3, reason ≤300 символов),
      цены/картинки БЕРУТСЯ ИЗ КАТАЛОГА, не от модели;
      follow_up_questions (макс 2) дописываются в reply как «• …»
    → ensureThree(): если модель вернула 1-2 карточки (но не 0) — добивка кандидатами
      (reason = первое предложение описания)
    → withInstagram(): если в reply нет "instagram" — дописывается строка
      «Не знайшли потрібне? Напишіть нам в Instagram 👉 @ai_skin_lab» (per-lang)
    → ответ {reply, products[{id,name,brand,price,promo_price,image,discount_percent,reason}]}
  Ответ при ошибке ключа/сети/JSON → fallbackResponse(): локализованная отбивка
  + retrieve(топ-3) + reason = первое предложение описания (или «категория · бренд») + Instagram-строка
  Ответ когда каталог недоступен → CATALOG_UNAVAILABLE + Instagram-строка (products: [])
  Заголовок ответа: x-ai-skin-lab-source: next-route (маркер что сработал роут-хендлер)
```

### 8.2 Ретривал (`retrieve`)
1. **`expandQuery()`**: группы синонимов (`SKIN_SYNONYMS`) — если запрос содержит любое слово
   группы (жирн/олійн/себо/матув…; сух/влажн/зневодн…; чутлив/подразн…; акне/вугр…;
   зморшк/антивіков… і т.д.), все стемы группы добавляются к запросу — чтобы «жирна шкіра»
   матчилась по «себо/матув/олійн» в тегах/описаниях
2. Токенизация запроса (кириллица/латиница/цифры/дефис), стоп-слова (`і,та,для,мені,порадьте,що…`),
   слова <3 символов пропускаются
3. **Бюджет**: числа 50…100000 из запроса («до 500 грн») → `budget = min(чисел)`;
   товары с эффективной ценой `promo_price ?? price ≤ budget` получают **+5** к скору —
   дешёвые позиции гарантированно попадают в топ-15, даже если не матчатся по словам
4. **Скидка**: запрос содержит знижк/акці/дешев/sale/discount → `is_on_sale` даёт **+2**
5. Скоринг по каждому товару (stock>0) по haystack = name+brand+category+tags+description (lowercase):
   точное вхождение слова: `+3` если слово ≥5 символов, иначе `+2`; префикс (первые 5 символов)
   длинного слова: `+1`
6. Топ-N по скору; если мало — добивка товарами с максимальной скидкой (до limit)
Зачем: **лимит Groq TPM = 8000 токенов/мин** — полный каталог (~15.6k) даёт 413, поэтому контекст
ограничен топ-15 кандидатами (~3.5k).

### 8.3 Модели и ограничения
- `GROQ_API_KEY` — из корневого `.env` → env frontend-контейнера (`${GROQ_API_KEY:-}`); без ключа — только fallback
- `GROQ_MODEL` — override через env (перечень через запятую)
- Доступны только `openai/gpt-oss-120b` и `openai/gpt-oss-20b`
  (llama-* → 404 model_not_found, deepseek → 400 decommissioned)
- **TPM 8000** — не превышать; Python urllib к Groq блокируется Cloudflare 403 (code 1010) —
  тестировать только через браузер/node
- Ключ: `gsk_` + 56 символов; **никогда не коммитить** (`.env` в .gitignore, проверять `git diff --cached`)

### 8.4 UX чата
- FAB (fixed bottom-right, ✨) → панель `h-[70vh] max-h-[640px]`, стеклянные пузыри
- Печать ответа: typewriter 2 символа/18мс; скролл следует за каждым шагом (`onGrow` → `scrollToBottom("auto")`);
  при окончании печати скроллится до карточек товаров; при открытии панели — в конец истории
- Карточки: cutout 48px + бренд + название + 💡reason + цены; клик → `/product/{id}` (полная перезагрузка)
- Suggestions-чипы видны только пока в истории ≤1 сообщение
- Состояния: «Підбираю для вас ідеальні варіанти…» (typing-dots) во время запроса; ошибка → локализованный текст

---

## 9. Персистентность чата (`lib/chatStorage.ts`)

- Ключ `localStorage`: **`ai-skinlab.chat.v1`**, формат `{at: number, messages: Message[]}`
- **Скользящее окно 20 минут**: `at` обновляется при каждом изменении истории
- Проверка TTL: при загрузке (`loadChat`) + фоновый интервал 30с в ChatWidget —
  если простояло >20 мин и сообщений >1 → сброс к приветствию + `clearChat()`
- Восстановление: при маунте ChatWidget (после SSR-рендера с пустым списком — без hydration mismatch),
  `idRef` продолжает нумерацию от max id
- Сохранение не роняет чат при недоступности storage (try/catch)
- Видимая история — **полная**; в Groq уходит только `slice(-6)` (TPM)

---

## 10. ПОЛНЫЙ ПРОМТ AI-консультанта

Файл: `frontend/src/app/api/chat/route.ts`, константа `SYSTEM_PROMPT` (verbatim, украинский):

```
Ти — «AI Skin Lab Consultant», експерт-консультант магазину преміальної косметики та парфумерії AI Skin Lab. Ти спілкуєшся з клієнтом у чаті на сайті магазину.

ЖОРСТКІ ПРАВИЛА:
1. Рекомендуй ТІЛЬКИ товари з наданого списку context.products. Заборонено вигадувати товари, бренди чи ціни.
2. Завжди давай РОВНО 3 товари, якщо серед кандидатів є щонайменше 3 наявні (stock>0); якщо менше — стільки, скільки є.
3. Відповідай виключно мовою запиту користувача (uk — українською, ru — російською, en — англійською).
4. Ціни та знижки — лише ті, що в context.products. Якщо is_on_sale=true, згадай promo_price та відсоток знижки.
5. Не давай медичних порад; за серйозних проблем зі шкірою (розацеа, екзема, сильне акне) ввічливо порадь звернутись до дерматолога і запропонуй м'який догляд.
6. Ми працюємо лише з брендами {{BRANDS}} — якщо клієнт питає інший бренд, запропонуй схоже з нашого асортименту.
7. Якщо товар має is_set=true — це подарунковий набір: коротко зазнач його склад (є в description) і рекомендуй його, коли клієнт шукає подарунок або готовий комплект.
8. Не пропонуй товари з stock<=0 та не радь чекати на постачання.
9. Наприкінці відповіді одним рядком додай Instagram-контакт: «Не знайшли потрібне? Напишіть нам в Instagram 👉 @ai_skin_lab».
10. ТОН: теплий, як уважний консультант бутику; конкретний (інгредієнти, ціни); без агресивних продажів; можна використовувати емодзі.

ФОРМАТ ВІДПОВІДІ — ТІЛЬКИ ВАЛІДНИЙ JSON (без markdown, без тексту до або після):
{
  "reply": "2-4 речення: коротко перекажи потребу клієнта і що ти підібрав",
  "products": [
    { "id": "id з context.products", "reason": "1 речення: чому саме цей товар підходить" }
  ],
  "follow_up_questions": ["1-2 уточнювальних питання"],
  "confidence": "high | medium | low"
}

ПРАВИЛЯ ПОЛІВ:
- products[].id має точно відповідати id товару з context.products.
- reason — мовою відповіді, з конкретикою (інгредієнт, тип шкіри, текстура, бюджет, знижка).
- products[] НЕ має бути порожнім, якщо в кандидатах є наявні товари: візьми найближчі за запитом (ціна, тип, знижка) і поясни в reason, чому це компроміс. Порожній products — лише якщо кандидатів немає взагалі, і тоді додай follow_up_questions.
- Якщо confidence не "high" — обов'язково додай follow_up_questions.
```

После промта в system-сообщение дописывается:
```
context.products — це відібрані за запитом кандидати (JSON). Обери з них 1-3 найкращі:
[{"id","name","brand","category","price","promo_price","discount_percent","is_on_sale","is_set","volume","description"(≤130 символов)} …]
```

`{{BRANDS}}` подставляется динамически: `Array.from(new Set(products.map(p=>p.brand))).join(", ")`
(сейчас «Anna Logon, Cef Lab, Smart4Derma»; при пустом каталоге — заглушка «CEF Lab, Smart4Derma»).

Гарантии уровня кода (не полагаемся только на модель):
- `ensureThree` — если модель вернула 1-2 карточки (но не 0), добивает кандидатами из retrieve
  (reason = первое предложение описания или «категория · бренд»)
- `withInstagram` — если в reply нет подстроки "instagram", дописывается локализованная строка
  `INSTAGRAM_LINE` с @ai_skin_lab (работает и для fallback/catalog-down)

Локализованные fallback-тексты (нет ключа / ошибка Groq / битый JSON):
- uk: «На жаль, AI-сервіс зараз недоступний, але я підібрав варіанти з нашого каталогу під ваш запит 👇 Під кожним — чому саме він підходить. Уточніть тип шкіри та бюджет, і я звужу добірку.» + топ-3 по ретривалу
- ru/en — эквиваленты; каталог недоступен → «Каталог зараз недоступний… 🙏»

Instagram-ссылки в UI (https://www.instagram.com/ai_skin_lab — в href футера и чата полный URL
с qr-параметрами `?exln=…&utm_source=qr`):
- футер: блок «Консультація та замовлення» (`footer.instagram_label`) в первой колонке
- чат: строка над формой ввода (`chat.instagram_hint`)

Тексты UI (включая приветствие чата, suggestions, демо AiSection) — в `frontend/src/messages/uk.json`;
ключи `chat.*`, `ai_section.*`, `catalog.*`, `card.set_badge`, `product.set_badge`,
`product.set_contents`, `footer.instagram_label`.

---

## 11. Конфигурация и переменные окружения

**Корневой `.env` (gitignored)** — передаётся в контейнеры через docker-compose:
```env
GROQ_API_KEY=gsk_...        # frontend (обязателен для AI-чата)
GROQ_MODEL=                 # опциональный override списка моделей
OPENAI_API_KEY=, OPENAI_BASE_URL=, CHAT_MODEL=, EMBEDDING_MODEL=  # backend (ai_assistant)
ADMIN_TOKEN=                # без него /admin/* → 404
```
**docker-compose:** backend — `EXCEL_PATH=/app/data/price.xlsx`, `IMAGES_DIR=/app/data/images`,
volume `./data:/app/data`, healthcheck `/api/health` (15с);
frontend — `BACKEND_URL=http://backend:8000`, `depends_on: backend (service_healthy)`.
`cutouts_dir` в config.py пустой → вычисляется как `<parent images_dir>/cutouts` = `/app/data/cutouts`.
`.dockerexclude` frontend исключает `.env*` из образа.

---

## 12. Проверки и тесты

| Проверка | Как | Ожидание |
|---|---|---|
| i18n | `node check-i18n.js` (в `frontend/`) | `All translation keys OK` |
| Сборка | `npm.cmd run build` | без TS-ошибок |
| Скриншоты | `python temp/opencode/shoot.py "http://localhost:3000" <out>` | **`errors: 0`** (375/768/1440 × light/dark) |
| Контраст light | `python temp/opencode/light_check.py` | `done` без нарушений |
| Чат | `python temp/opencode/chat_test.py` | 7/7: ответ с карточками, gap печати <80px, история после навигации, TTL-очистка |
| Наборы | `docker exec -e PYTHONPATH=/app … python /tmp/sets_test.py` | нет листа → []; из 3 sku → 1 set (цена/скидка/остаток/состав); фолбэк по скидке |
| Cutout-ы | `GET localhost:8000/api/cutouts` | ids ≈ total (минус товары с placeholder.svg) |

Скрипты лежат в `C:\Users\Arthur\AppData\Local\Temp\opencode\` (shoot.py, light_check.py,
chat_test.py, verify_cutouts.py, chip_check.py…).

---

## 13. Подводные камни (ЧИТАТЬ ПЕРЕД ПРАВКАМИ)

1. **PowerShell 5.1**: `npm.cmd` (не npm.ps1), `&&` не работает, `Get-Content` ломает UTF-8,
   инлайн-python с кавычками/`<` ломается → писать `.py` файлом в temp и запускать с
   `$env:PYTHONIOENCODING='utf-8'`; `docker exec node -e` с кавычками ломается → `docker cp`.
2. **Навигация — полные перезагрузки** (plain `<a>` в `i18n/navigation.tsx`) — любое состояние
   в компонентах теряется; персистентность только через localStorage.
3. **numpy pin 1.26.4** — rembg только ≤2.0.69 (см. §6).
4. **watchdog** фильтрует только price.xlsx — не создаст цикл от записи cutout-ей, но и
   не подхватит переименование/замещение файла иным способом.
5. **`mimetypes` в python:3.11-slim не знает .webp** — добавлено `mimetypes.add_type` в main.py.
6. **Hydration**: клиентские компоненты не читают localStorage в `useState` — только в `useEffect`.
7. **framer-motion грабли**: clip-path анимировать на ребёнке, IntersectionObserver вешать на родителя.
8. **Цены/карточки в чате** всегда из каталога, не от LLM — не упрощать валидацию `parseReply`.
9. **Пустой `products` в ответе модели** — раньше был нормой («нічого не підходить»), теперь
   запрещён правилом промта + добивается `ensureThree`/бюджетным бустом retrieve; пустой список
   допустим только если кандидатов нет вообще.
10. Не коммитить `.env*` (кроме `.env.example`), проверять `git diff --cached --name-only | Select-String "\.env"`; консоль CP1251 → коммит-сообщения через файл:
    `[IO.File]::WriteAllText($p, $msg)` (без BOM) + `git commit -F $p`; push stderr-ошибка PowerShell — не ошибка push.
11. Тёмная тема и только `uk` — по ТЗ, не менять.

---

## 14. Git

- Remote: `https://github.com/dev-arthur-petrunko/AI_Skin_Lab.git`, ветка `main`
- Автор: `Arthur Petrunko <Arthurpetrunko@gmail.com>`
- Стиль сообщений: `feat: …` / `fix: …` / `chore: …` (латиница, кратко)
- Последние коммиты: `b716527 fix: select dropdown styling…`, `3ec3076 fix: chat history kept for 20 minutes…`, `3836a77 feat: automatic cutout generation for new products`, `c0d07d0 feat: background-free photos…`, `93a95a9 feat: working AI consultant (Groq) + catalog serums fixes`
- Коммитить только по явной просьбе; не force-push, не amend опубликованного.
