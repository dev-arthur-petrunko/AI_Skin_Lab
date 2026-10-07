# AI Skin Lab

Премиальный каталог косметики и парфюмерии с AI-консультантом, живым фоном и современным UX.

![Next.js](https://img.shields.io/badge/Next.js-14.2-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-11-0055FF?style=for-the-badge&logo=framer&logoColor=white)
![Lenis](https://img.shields.io/badge/Lenis-1-FF6B6B?style=for-the-badge&logo=scrollreveal&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.14-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-1.44-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)

---

## ✨ Особенности

- **Живой фон** — анимированные градиенты, частицы, beam-эффект, курсорное свечение, затемнение на тёмных секциях
- **Hero с реальными вырезками** — 12 товаров с прозрачным фоном (rembg), параллакс и плавание
- **Категории с 3D-наклоном** — hover-tilt до 8°, счетчики товаров, ссылки на каталог
- **Секция «Горячие предложения»** — Swiper free-mode, count-up анимация «до −28%»
- **Бренды с clip-path reveal** — анимация появления через CSS clip-path
- **AI-консультант** — демо-чат с печатанием 26 мс/символ, поддержка `prefers-reduced-motion`
- **Плавный скролл** — Lenis (duration 1.1, easing exp)
- **Тёмная/светлая тема** — next-themes, localStorage, system preference
- **Docker-ready** — standalone Next.js образ, healthchecks

---

## 🛠 Технологический стек

### Frontend
| Технология | Версия | Назначение |
|------------|--------|------------|
| ![Next.js](https://img.shields.io/badge/Next.js-14.2-000000?style=flat-square&logo=next.js) | 14.2 | App Router, SSR, standalone output |
| ![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react) | 18 | UI библиотека |
| ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript) | 5 | Типизация |
| ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat-square&logo=tailwindcss) | 3 | Утилитарные стили, дизайн-токены |
| ![Framer Motion](https://img.shields.io/badge/Framer_Motion-11-0055FF?style=flat-square&logo=framer) | 11 | Анимации, scroll-reveal, gesture |
| ![Lenis](https://img.shields.io/badge/Lenis-1-FF6B6B?style=flat-square&logo=scrollreveal) | 1 | Плавный скролл |
| ![Swiper](https://img.shields.io/badge/Swiper-11-6332F6?style=flat-square&logo=swiper) | 11 | Карусель «Знижки» (free-mode) |
| ![next-themes](https://img.shields.io/badge/next--themes-0.3-000000?style=flat-square&logo=vercel) | 0.3 | Переключение темы |

### Backend / Инфраструктура
| Технология | Версия | Назначение |
|------------|--------|------------|
| ![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=flat-square&logo=fastapi) | 0.110 | REST API каталога |
| ![Uvicorn](https://img.shields.io/badge/Uvicorn-0.30-000000?style=flat-square) | 0.30 | ASGI сервер |
| ![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker) | 24 | Контейнеризация |
| ![Docker Compose](https://img.shields.io/badge/Docker_Compose-2.24-2496ED?style=flat-square&logo=docker) | 2.24 | Оркестрация |

### Качество кода / CI
| Инструмент | Назначение |
|------------|------------|
| ![ESLint](https://img.shields.io/badge/ESLint-8-4B32C3?style=flat-square&logo=eslint) | Линтинг |
| ![Prettier](https://img.shields.io/badge/Prettier-3-F7B93E?style=flat-square&logo=prettier) | Форматирование |
| ![Playwright](https://img.shields.io/badge/Playwright-1.44-2EAD33?style=flat-square&logo=playwright) | E2E скриншоты (375/768/1440 × light/dark) |
| ![rembg](https://img.shields.io/badge/rembg-2.0-3776AB?style=flat-square&logo=python) | Удаление фона у товаров (u2net) |

---

## 📸 Скриншоты

| Главная (Light) | Главная (Dark) | Каталог | Товар |
|:---:|:---:|:---:|:---:|
| ![Home Light](shots/home-1440-light.png) | ![Home Dark](shots/home-1440-dark.png) | ![Catalog](shots/catalog-1440-light.png) | ![Product](shots/product-1440-light.png) |

> Автоматические скриншоты генерируются Playwright при каждом билде: `python shoot.py`

---

## 🚀 Быстрый старт

### Локально (без Docker)
```bash
# Frontend
cd frontend
npm install
npm run dev          # http://localhost:3000

# Backend (отдельный терминал)
cd ../backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Docker (production-like)
```bash
docker compose up -d --build
# Frontend: http://localhost:3000
# Backend:  http://localhost:8000/docs
```

### Переменные окружения
```env
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 📁 Структура проекта

```
AI-Skin-Lab/
├── backend/                 # FastAPI
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/
│   │   └── schemas.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                # Next.js 14
│   ├── src/
│   │   ├── app/            # App Router страницы
│   │   ├── components/     # UI компоненты
│   │   │   ├── Hero.tsx
│   │   │   ├── HeroProducts.tsx
│   │   │   ├── LivingBackground.tsx
│   │   │   ├── CategoriesSection.tsx
│   │   │   ├── SaleSection.tsx
│   │   │   ├── BrandsSection.tsx
│   │   │   ├── AiSection.tsx
│   │   │   ├── ProductDetailView.tsx
│   │   │   └── ...
│   │   ├── lib/            # API, типы, форматирование
│   │   ├── messages/       # i18n (uk.json)
│   │   └── i18n/           # Роутинг с локалью
│   ├── public/cutouts/     # WebP вырезки товаров (rembg)
│   ├── Dockerfile
│   └── next.config.js
├── docker-compose.yml
├── shoot.py                # Playwright скриншоты
└── README.md
```

---

## 🎨 Дизайн-система

### Палитра (CSS токены в `globals.css`)
```css
:root {
  --cream:       #faf7f2;
  --sand:        #f1e9dd;
  --champagne:   #e8d5b0;
  --gold:        #c9a55c;
  --gold-deep:   #a9843e;
  --espresso:    #3a2a1e;
  --noir:        #17110d;
  --blush:       #f3dddd;
  --berry:       #b3235c;
}
```

### Ключевые компоненты
- `.btn-primary` — золотой градиент + анимированный блик
- `.glass` / `.tile` — стеклянные карточки с backdrop-filter
- `.section-noir` — тёмная полоса с золотами (в light теме — warm gradient)
- `.pic` — `mix-blend-mode: multiply` для фото на тёплом фоне
- `.cat-tile` — 3D-наклон (`transform-style: preserve-3d`)

---

## ♿ Доступность

- `prefers-reduced-motion` — отключает все анимации
- Семантическая HTML-разметка
- Фокус-стили для клавиатурной навигации
- Контрастные цвета (WCAG AA)
- `aria-label` / `aria-pressed` на интерактивных элементах

---

## 📦 Деплой

```bash
# Сборка образов
docker compose build

# Запуск в продакшене
docker compose up -d

# Логи
docker compose logs -f frontend
docker compose logs -f backend
```

> Frontend использует `output: standalone` — образ ~150 MB, запускается за <2 сек.

---

## 📄 Лицензия

MIT — свободно используйте, модифицируйте и распространяйте.

---

<p align="center">
  Made with ☕ by <a href="https://github.com/ArthurPetrunko">Arthur Petrunko</a>
</p>