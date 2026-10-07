# 🌿 AI Skin Lab

Преміальний веб‑каталог парфумерії та косметики з автоматичною синхронізацією з локального Excel‑файлу, вбудованим AI‑консультантом (RAG) та розгортанням через Docker + тунелювання.

---

## 📦 Структура проєкту

```
AI Skin Lab/
├── price.xlsx              # Джерело правди (корень проєкту, редагується вручну)
├── data/                   # Монтується в Docker (price.xlsx + images/)
│   ├── price.xlsx          # ← синхронізується зі скриптом запуску
│   └── images/             # зображення товарів: <Артикул>.jpg або з колонки Фото
├── backend/                # FastAPI (Python)
│   ├── app/
│   │   ├── main.py         # Точка входу, CORS, /api/health, /admin/*
│   │   ├── config.py       # Налаштування з .env / змінних середовища
│   │   ├── catalog_loader.py  # Парсинг Excel (pandas + openpyxl), маппінг колонок
│   │   ├── store.py        # In‑memory кеш + watchdog + mtime‑полінг
│   │   ├── ai_assistant.py # RAG: векторний індекс + LLM‑промпт консультанта
│   │   ├── models.py       # Pydantic‑схеми
│   │   └── routers/        # /api/catalog, /api/chat
│   ├── scripts/            # translator.py (автопереклад ru/en в Excel)
│   └── Dockerfile
├── frontend/               # Next.js 14 (App Router) + Tailwind + ESLint
│   ├── src/
│   │   ├── app/            # / (головна), /catalog, /product/[id]
│   │   ├── components/     # Hero, ProductCard, Swiper‑карусель, ChatWidget, фільтри
│   │   ├── messages/       # Словник uk.json
│   │   └── i18n/           # request.ts (useTranslations) + navigation.tsx
│   ├── check-i18n.js       # перевірка ключів перекладів
│   └── Dockerfile          # Multi‑stage (standalone output)
├── docker-compose.yml
├── start.ps1 / start.sh    # Синхронізація Excel + docker compose + тунель
└── .env.example
```

---

## 🗂 Схема даних (аркуш **«Зручна таблиця»** у `price.xlsx`)

| Колонка                | Обов’язкова | Опис                                                            |
|------------------------|-------------|-----------------------------------------------------------------|
| Артикул                | ✅          | Унікальний ID товару                                            |
| Назва товару           | ✅          | Назва (UA)                                                      |
| Бренд                  |             | Використовується в фільтрах та AI‑промпті                       |
| Ціна, грн              | ✅          | Стара ціна                                                      |
| Промо ціна, грн        |             | Якщо менша за стару — товар потрапляє у «Sale»                  |
| Знижка, %              |             | Якщо порожньо — розраховується автоматично                     |
| Залишок, шт            |             | > 0 → «В наявності»                                            |
| Об’єм, Країна‑виробник |             | Характеристики в картці товару                                  |
| Короткий опис (ноти)   |             | Опис + семантика для AI‑пошуку                                  |
| Фото / Image_Name      |             | Ім’я файлу з `data/images/` (не вбудовувати зображення в Excel) |

### Опціональні колонки для багатомовності та категорій
Додайте їх у Excel – backend підхопить їх без змін коду:

```
Назва (ru), Назва (en), Категорія, Опис (uk), Опис (ru), Опис (en), Image_Name
```

Якщо колонок немає: назви/описи RU/EN беруться з UA‑полів, категорія визначається за ключовими словами, зображення шукається як `data/images/<Фото>`, потім `data/images/<Артикул>.jpg/.png` (з урахуванням ведучих нулів: артикул `2` → `002.png`), інакше — елегантний placeholder з логотипом.

---

## 🔐 Адмін‑ендпоінти

`GET /admin/reload` (перечитати Excel) та `GET /admin/translate` (заповнити
порожні `Опис (ru/en)` / `Назва (ru/en)`) вимагають заголовок
`X-Admin-Token`, значення якого задається в `.env`:

```
ADMIN_TOKEN=будь‑який_секрет
```

Якщо `ADMIN_TOKEN` порожній — обидва ендпоінти повертають `404` і повністю
вимкнені (типова поведінка деплою).

---

## 🔄 Синхронізація Excel
`watchdog` моніторить `data/price.xlsx`. При будь‑якому збереженні каталог перечитається автоматично — без перезапуску сервера (Docker‑volume робить те саме). Перевірити: `GET /api/health` → оновиться поле `last_updated`.

---

## 🤖 AI‑консультант (RAG)
1. При завантаженні/пересинхронізації каталогу будується векторний індекс (OpenAI `text-embedding-3-small`, косинусна схожість на NumPy — без окремої БД; при рості можна перейти на ChromaDB/FAISS).
2. Запит користувача → топ‑5 товарів → системний промпт «Ти консультант…» + список товарів з Excel → GPT‑4o‑mini → природна відповідь + міні‑картки товарів у чаті.
3. UI: плаваючий віджет праворуч внизу, анімація друку, швидкі підказки, емодзі.

**Без `OPENAI_API_KEY`** усе працює у fallback‑режимі: ключові слова замість ембеддингів та заготовлені відповіді з картками товарів (доступно для демо/офлайн).

---

## ▶️ Локальний запуск (без Docker)

Конфіг backend‑а автоматично читає `.env` з **кореня проєкту**, тому
копіювати його в `backend/` не потрібно.

```bash
# Backend (порт 8000)
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000

# Frontend (порт 3000)
cd frontend
npm install
npm run dev
```

Перевірка якості змін:

```bash
cd frontend
node check-i18n.js     # ключі перекладів
npx tsc --noEmit       # типи
npm run lint           # ESLint (next/core-web-vitals)
npm run build          # production-збірка
```

---

## 🐳 Docker + туннелювання

### Windows (PowerShell)
```powershell
.\start.ps1                    # docker compose up -d --build
.\start.ps1 -Tunnel my-tunnel  # + cloudflared tunnel run my-tunnel
```

### Linux / macOS
```bash
./start.sh                 # docker compose up -d --build
./start.sh my-tunnel-name  # + cloudflared tunnel run
```

**Ручний варіант**
```bash
docker-compose up -d && cloudflared tunnel run <tunnel-name>
# або для швидкого тесту:
ngrok http 3000
```

Перед запуском додайте ключ у `.env` (див. `.env.example`):
```
OPENAI_API_KEY=sk-...
```

---

## 🌐 Публічні URL (після запуску)

| Сервіс               | URL                                                      |
|----------------------|----------------------------------------------------------|
| Frontend             | `http://localhost:3000`                                   |
| Backend health       | `http://localhost:8000/api/health`                       |
| API через Next.js rewrite | `http://localhost:3000/api/catalog`                    |
| Каталог              | `http://localhost:3000/catalog` (`?q=` — пошуковий запит) |
| Адмін‑reload         | `GET http://localhost:8000/admin/reload` + `X-Admin-Token` |

---

## 📦 Ключові залежності

- **Backend:** FastAPI, pandas + openpyxl, watchdog, openai, numpy, deep-translator
- **Frontend:** Next.js 14, Tailwind CSS, framer-motion, swiper, three.js, ESLint (next/core-web-vitals)
- **Інфраструктура:** Docker Compose, cloudflared / ngrok

---

## ✅ Чек‑лист контенту

1. Зображення покладіть у `data/images/` у форматі `<Артикул>.jpg` (або вкажи ім’я в колонці `Фото`).
2. Для перекладів описів додай колонки `Опис (ru)` / `Опис (en)` у `price.xlsx` (або виклич `GET /admin/translate`).
3. Словник UI: `frontend/src/messages/uk.json` (перевірка: `node check-i18n.js`).
4. Після правки `price.xlsx` у корені — синхронізуй копію: `Copy-Item .\price.xlsx .\data\price.xlsx -Force` (робить `start.ps1` / `start.sh`).

---

> **AI Skin Lab** — це не просто каталог, це інтелектуальний помічник, який допомагає знайти ідеальний аромат або засіб догляду, враховуючи твої уподобania, бюджет та настрій. Ласкаво просимо до світу преміальної парфумерії та косметики з штучним інтелектом!  
> 
> — Arthur Petrunko <arthurpetrunko@gmail.com>
