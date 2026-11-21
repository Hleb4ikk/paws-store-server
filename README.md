# Paws Store — Backend API

REST API для интернет-магазина товаров для питомцев **Paws Store**.

Стек: **Express 5 + TypeScript**, **PostgreSQL + Prisma 8**, **Redis** (кэш каталога), **Cloudflare R2** (изображения товаров), **JWT + bcrypt** (аутентификация), **Docker** (multi-stage build).

## Функциональность

- **Аутентификация (JWT):** регистрация и логин с хешированием паролей (bcrypt), токен передаётся через `Authorization: Bearer <token>`.
- **RBAC:** роли `CUSTOMER` (каталог, корзина, промокод) и `ADMIN` (управление товарами).
- **Каталог:** поиск по подстроке (ILIKE), фильтры по цене и рейтингу, сортировка по цене/названию, пагинация — всё на уровне БД.
- **Кэширование:** страницы каталога кэшируются в Redis (ключ — query-строка, TTL настраивается), кэш инвалидируется при любом изменении каталога.
- **Корзина:** CRUD позиций + применение промокода (`SAVE10` — скидка 10%).
- **Медиа:** загрузка изображений товаров в Cloudflare R2 (admin only).

## Быстрый старт (Docker)

```bash
cp .env.example .env   # при необходимости поменять значения
docker compose up --build
```

При старте контейнер приложения автоматически применяет миграции (`prisma db migrate`).

Засеять БД тестовыми данными (товары, промокод `SAVE10`, админ `admin@paws.store` / `admin123`):

```bash
docker compose exec app node dist/seed.js
# или локально:
npm run seed
```

API поднимается на `http://localhost:3000`:

- Healthcheck: `GET /api/health`
- **Swagger / OpenAPI:** `http://localhost:3000/api/docs`

## Локальная разработка

```bash
npm install
docker compose up postgres redis -d   # только инфраструктура
npm run db:migrate
npm run dev
```

## Environment Variables

| Переменная | Описание | Пример |
| --- | --- | --- |
| `APP_PORT` | Порт HTTP-сервера | `3000` |
| `APP_HOST` | Хост HTTP-сервера | `0.0.0.0` |
| `DATABASE_URL` | Строка подключения PostgreSQL (>= 15) | `postgresql://user:pass@localhost:5432/paws-store-db` |
| `JWT_SECRET` | Секрет для подписи JWT | `super-secret-change-me` |
| `JWT_EXPIRES_IN` | Время жизни JWT | `7d` |
| `REDIS_URL` | Строка подключения Redis | `redis://localhost:6379` |
| `CACHE_TTL_SECONDS` | TTL кэша каталога (60–120 с) | `90` |
| `CORS_ORIGIN` | Разрешённые origins (через запятую) или `*` | `https://paws-store.vercel.app` |
| `R2_ACCOUNT_ID` | Cloudflare account id | `<account-id>` |
| `R2_ACCESS_KEY_ID` | R2 access key | `<key>` |
| `R2_SECRET_ACCESS_KEY` | R2 secret key | `<secret>` |
| `R2_BUCKET_NAME` | Имя бакета R2 | `paws-store-images` |
| `R2_PUBLIC_URL` | Публичный базовый URL бакета | `https://images.example.com` |
| `SEED_ADMIN_EMAIL` | Email админа для сид-скрипта | `admin@paws.store` |
| `SEED_ADMIN_PASSWORD` | Пароль админа для сид-скрипта | `admin123` |

## Эндпоинты

| Метод | Путь | Доступ | Описание |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | публично | Регистрация |
| `POST` | `/api/auth/login` | публично | Логин, выдача JWT |
| `GET` | `/api/products` | публично | Каталог: `page`, `limit`, `search`, `min_price`, `max_price`, `min_rating`, `sort_by`, `order` |
| `GET` | `/api/products/:id` | публично | Товар с изображениями |
| `POST` | `/api/products` | admin | Создать товар |
| `PATCH` | `/api/products/:id` | admin | Обновить товар |
| `DELETE` | `/api/products/:id` | admin | Удалить товар (+ инвалидация кэша) |
| `POST` | `/api/products/:id/images` | admin | Загрузить изображение в R2 |
| `GET` | `/api/cart` | customer | Корзина пользователя |
| `POST` | `/api/cart/items` | customer | Добавить товар в корзину |
| `PATCH` | `/api/cart/items/:id` | customer | Изменить количество |
| `DELETE` | `/api/cart/items/:id` | customer | Удалить позицию |
| `POST` | `/api/cart/apply-promo` | customer | Применить промокод (`SAVE10`) |

Формат ответа каталога:

```json
{
  "items": [],
  "meta": { "total_items": 42, "total_pages": 4, "current_page": 1, "limit": 12 }
}
```

## Деплой

- **База данных:** PostgreSQL в [Neon](https://neon.tech) / [Supabase](https://supabase.com).
- **Медиафайлы:** Cloudflare R2.
- **Бэкенд:** деплоится из `Dockerfile` на [Render](https://render.com) или [Koyeb](https://koyeb.com).
- **Фронтенд:** [paws-store](https://github.com/Hleb4ikk/paws-store) — CORS настраивается переменной `CORS_ORIGIN`.
- **Документация API:** `/api/docs` (Swagger UI) на задеплоенном инстансе.

## Git Flow

- `main` — стабильная ветка.
- `develop` — основная ветка разработки.
- Фичи — через ветки `feature/*` (`feature/auth`, `feature/products-cache`, `feature/cart`) с мерджем в `develop`.
- Коммиты — по [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`.
