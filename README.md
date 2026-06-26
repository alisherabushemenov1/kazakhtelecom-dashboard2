# Kazakhtelecom Project Dashboard

Веб-дашборд «Факт освоения БКВ» для мониторинга проектов Казахтелекома. Данные читаются из **Google Sheets** (или локального Excel), авторизация — через **MongoDB Atlas** и JWT.

## Возможности

- **5 страниц:** обзор KPI, проекты, регионы, спонсоры, детализация
- **Фильтры:** период (месяц/квартал), спонсор, менеджер, регион, тип проекта, диапазон сумм
- **Сортировка** таблиц по плану, факту, % освоения
- **Автообновление:** backend опрашивает Google Sheets в фоне; frontend проверяет изменения каждые 8 сек
- **Регистрация и вход:** ФИО, email, пароль, телефон → MongoDB
- **Два источника данных:** Google Sheets (основной) или локальный Excel

## Стек

| Часть | Технологии |
|-------|------------|
| Frontend | React 19, Vite 6, Tailwind CSS 4, Recharts, React Router |
| Backend | FastAPI, Uvicorn, Pandas, gspread |
| БД | MongoDB Atlas (Motor) |
| Auth | JWT (python-jose), bcrypt |

## Структура проекта

```
kazakhtelecom-dashboard/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI, маршруты dashboard, WebSocket
│   │   ├── auth.py          # JWT, bcrypt, get_current_user
│   │   ├── config.py        # переменные окружения
│   │   ├── database.py      # MongoDB (Motor)
│   │   ├── parser.py        # парсинг таблицы БКВ
│   │   ├── sheets.py        # загрузка Google Sheets (API / export)
│   │   ├── data_source.py   # выбор источника данных
│   │   ├── poller.py        # фоновый опрос Sheets
│   │   ├── watcher.py       # отслеживание локального Excel
│   │   └── routes/auth.py   # /api/auth/*
│   ├── scripts/
│   │   ├── explain_months.py
│   │   ├── show_periods.py
│   │   └── test_mongodb.py
│   ├── .env                 # секреты (не в git)
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/           # Overview, Projects, Regions, Sponsors, Detail
│   │   ├── components/
│   │   ├── hooks/useDashboard.js
│   │   └── context/AuthContext.jsx
│   └── vite.config.js       # proxy /api → backend
└── data/
    └── projects.xlsx        # локальная копия (режим excel)
```

## Быстрый старт

### 1. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
# отредактируйте backend/.env
python -m app.main
```

Backend по умолчанию: **http://127.0.0.1:8001**

### 2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

Сайт: **http://localhost:5173**  
Регистрация: **http://localhost:5173/register**

Vite проксирует `/api` на `http://127.0.0.1:8001` (см. `frontend/vite.config.js`).

### 3. MongoDB Atlas

1. Создайте кластер и пользователя БД.
2. В `backend/.env` укажите `MONGODB_URI` с реальным паролем.
3. **Network Access** → добавьте ваш IP (или `0.0.0.0/0` только для разработки).
4. Проверка: `python scripts/test_mongodb.py`

### 4. Google Sheets

1. Таблица должна быть в формате БКВ (см. раздел «Структура таблицы»).
2. **Вариант A — сервисный аккаунт (рекомендуется):**
   - Google Cloud → создайте сервисный аккаунт → скачайте JSON-ключ.
   - Положите файл в `backend/` и укажите путь в `GOOGLE_CREDENTIALS_PATH`.
   - Поделитесь таблицей с email сервисного аккаунта (роль «Читатель»).
3. **Вариант B — публичный export:** без JSON-ключа таблица должна быть доступна «всем по ссылке» (читатель); используется xlsx-export.

---

## Переменные окружения (`backend/.env`)

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `DATA_SOURCE` | `sheets` | `sheets` / `google` — Google Sheets; `excel` — локальный файл |
| `GOOGLE_SHEET_ID` | — | ID таблицы из URL |
| `GOOGLE_SHEET_GID` | — | ID вкладки (`gid=` в URL) |
| `GOOGLE_SHEET_NAME` | `БКВ 2026` | Отображаемое имя вкладки |
| `GOOGLE_CREDENTIALS_PATH` | `google-credentials.json` | JSON-ключ сервисного аккаунта |
| `SHEETS_POLL_INTERVAL` | `30` | Интервал фонового опроса Sheets (сек) |
| `EXCEL_PATH` | `../data/projects.xlsx` | Путь к Excel (режим `excel`) |
| `HOST` | `0.0.0.0` | Хост backend |
| `PORT` | `8001` | Порт backend |
| `MONGODB_URI` | — | Строка подключения MongoDB Atlas |
| `MONGODB_DB` | `kazakhtelecom_dashboard` | Имя базы |
| `JWT_SECRET` | — | Секрет для JWT (длинная случайная строка) |
| `JWT_EXPIRES_MINUTES` | `10080` | Срок жизни токена (7 дней) |

---

## API

Базовый URL: `http://127.0.0.1:8001`  
Документация OpenAPI: **http://127.0.0.1:8001/docs**

### Авторизация

Защищённые эндпоинты требуют заголовок:

```
Authorization: Bearer <JWT_TOKEN>
```

Токен выдаётся при регистрации и входе, хранится на frontend в `localStorage`.

---

### `GET /api/health`

Проверка состояния сервера. **Auth не требуется.**

**Ответ 200:**

```json
{
  "status": "ok",
  "database": "mongodb",
  "dataReady": true,
  "type": "google_sheets",
  "sheetId": "...",
  "sheetName": "БКВ 2026",
  "url": "https://docs.google.com/spreadsheets/d/...",
  "pollIntervalSec": 30
}
```

---

### `POST /api/auth/register`

Регистрация нового пользователя.

**Тело запроса:**

```json
{
  "fullName": "Иванов Иван",
  "email": "user@example.com",
  "password": "secret123",
  "phone": "+77001234567"
}
```

| Поле | Тип | Ограничения |
|------|-----|-------------|
| `fullName` | string | 2–120 символов |
| `email` | string | валидный email |
| `password` | string | 6–128 символов |
| `phone` | string | 5–30 символов |

**Ответ 201:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "fullName": "Иванов Иван",
    "email": "user@example.com",
    "phone": "+77001234567",
    "createdAt": "2026-05-17T12:00:00+00:00"
  }
}
```

**Ошибки:** `409` — email уже занят.

---

### `POST /api/auth/login`

**Тело запроса:**

```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

**Ответ 200:** тот же формат, что у register (`token` + `user`).

**Ошибки:** `401` — неверный email или пароль.

---

### `GET /api/auth/me`

Текущий пользователь. **Auth: Bearer.**

**Ответ 200:**

```json
{
  "user": {
    "id": "...",
    "fullName": "Иванов Иван",
    "email": "user@example.com",
    "phone": "+77001234567",
    "createdAt": "..."
  }
}
```

---

### `GET /api/dashboard`

Полный JSON дашборда (~1 MB). **Auth: Bearer.**

Заголовки ответа: `Cache-Control: no-store`

**Ответ 200:** объект дашборда (см. «Схема ответа dashboard»).

**Ошибки:**
- `503` — данные ещё загружаются из Google Sheets (первый запуск)
- `401` — нет или просрочен токен

---

### `GET /api/dashboard/sync`

Лёгкая проверка изменений для polling. **Auth: Bearer.**

**Ответ 200:**

```json
{
  "contentHash": "a1b2c3d4...",
  "updatedAt": "2026-05-17T12:00:00+00:00",
  "fetchMethod": "api",
  "planBkv2026": 1234567890,
  "totalProjects": 42
}
```

Frontend сравнивает `contentHash` с сохранённым; при отличии запрашивает полный `/api/dashboard`.

---

### `POST /api/reload`

Принудительная перезагрузка данных из источника. **Auth: Bearer.**

**Ответ 200:** полный объект дашборда (как `/api/dashboard`).

---

### `WebSocket /ws?token=<JWT>`

Push-уведомление об обновлении данных. **Auth:** JWT в query-параметре.

**События от сервера:**

| event | Описание |
|-------|----------|
| `connected` | соединение установлено |
| `ping` | keep-alive каждые 30 сек |
| `data_updated` | данные в Sheets/Excel изменились |

> Frontend сейчас использует HTTP polling (`/api/dashboard/sync` каждые 8 сек), а не WebSocket. Эндпоинт `/ws` доступен для интеграций.

---

## Схема ответа `/api/dashboard`

```json
{
  "updatedAt": "ISO-8601",
  "fileName": "БКВ 2026",
  "filePath": "https://docs.google.com/spreadsheets/d/...",
  "dataSource": "google_sheets",
  "reportTitle": "Факт освоения БКВ — май 2026",
  "contentHash": "sha256...",
  "fetchMethod": "api",
  "defaultPeriodKey": "may",
  "defaultYtdKey": "jan_may",
  "kpis": {
    "totalProjects": 0,
    "planBkv2026": 0,
    "planEquipment": 0,
    "planSmr": 0,
    "periodLabel": "Май",
    "periodPlan": 0,
    "periodFact": 0,
    "periodExecution": 0,
    "ytdLabel": "Январь–май",
    "ytdPlan": 0,
    "ytdFact": 0,
    "ytdExecution": 0,
    "strategicPlanTotal": 0
  },
  "summary": { "planTotal": {}, "strategicPlan": {}, "months": {} },
  "chartMonths": [
    { "month": "Январь", "key": "january", "plan": 0, "fact": 0, "execution": 0 }
  ],
  "projects": [],
  "groups": [],
  "sponsorStats": [],
  "regionStats": [],
  "typeStats": [],
  "filters": {
    "sponsors": [],
    "managers": [],
    "regions": [],
    "types": [{ "code": "П", "label": "Проект" }],
    "months": [],
    "allMonths": [{ "key": "may", "label": "Май" }],
    "amountRange": { "min": 0, "max": 0 }
  }
}
```

### Объект проекта (`projects[]`)

```json
{
  "id": "row-10",
  "rowIndex": 10,
  "kind": "project",
  "type": "П",
  "typeLabel": "Проект",
  "spp": "СПП-001",
  "sponsor": "ДУП",
  "manager": "ФИО",
  "name": "Название проекта",
  "region": "Алматы",
  "category": "По областям",
  "plan2026": { "total": 0, "equipment": 0, "smr": 0 },
  "months": {
    "may": {
      "label": "Май",
      "plan": { "total": 0, "equipment": 0, "smr": 0 },
      "fact": { "total": 0, "equipment": 0, "smr": 0 }
    }
  },
  "notes": "",
  "details": [],
  "detailLevel": 1
}
```

Типы строк (`kind`): `project`, `subproject`, `new`, `single`, `detail`.

---

## Структура таблицы Google Sheets

Парсер читает вкладку «БКВ 2026» построчно. Периоды **не вычисляются** — берутся из заголовков таблицы.

| Строка (1-based) | Содержимое |
|------------------|------------|
| 3 | Название периода: «Январь», «Февраль», «Март»… |
| 4 | «План» или «Факт» |
| 5 | «Всего», «Оборудование», «СМР» |
| 6+ | Данные проектов |

| Колонки (1-based) | Содержимое |
|-------------------|------------|
| B | Тип (П, ВП, Н, Е) |
| C | СПП |
| D | Спонсор |
| E | Менеджер |
| F | Название проекта |
| G–I | План 2026 (всего / оборуд / СМР) |
| J+ | Месяцы и кварталы (по 6 колонок: 3 план + 3 факт) |

Пример адресов периодов:

| Период | Ячейка заголовка | План | Факт |
|--------|------------------|------|------|
| Январь | J3 | J–L | M–O |
| Февраль | P3 | P–R | S–U |
| Март | V3 | V–X | Y–AA |
| Апрель | AH3 | AH–AJ | AK–AM |
| Май | AT3 | AT–AV | AW–AY |
| Январь–май | AZ3 | AZ–BB | BC–BE |

Чтобы найти в Google Sheets: **Ctrl+G** → `V3` (март) и прокрутить вправо.

Диагностика периодов:

```powershell
cd backend
.\.venv\Scripts\python.exe scripts\explain_months.py
```

---

## Frontend: страницы и маршруты

| URL | Страница | Описание |
|-----|----------|----------|
| `/login` | Вход | Публичная |
| `/register` | Регистрация | Публичная |
| `/` | Обзор | KPI, графики, топ проектов |
| — | Проекты | Таблица всех проектов |
| — | Регионы | Группировка по регионам |
| — | Спонсоры | Статистика по спонсорам |
| — | Детализация | Карточка проекта, все периоды |

Навигация между страницами дашборда — через шапку (без смены URL).

### Обновление данных на клиенте

1. При загрузке — `GET /api/dashboard`
2. Каждые **8 сек** — `GET /api/dashboard/sync`
3. При смене `contentHash` — повторный полный запрос
4. Кнопка обновления в шапке — `POST /api/reload`

---

## Режим локального Excel

В `.env` установите:

```env
DATA_SOURCE=excel
EXCEL_PATH=../data/projects.xlsx
```

Backend следит за файлом через `watchdog` и перезагружает данные при сохранении.

---

## Сборка для production

```powershell
# Frontend
cd frontend
npm run build
# статика в frontend/dist/

# Backend
cd backend
.\.venv\Scripts\activate
python -m app.main
# или: uvicorn app.main:app --host 0.0.0.0 --port 8001
```

Раздайте `frontend/dist` через nginx или подключите как static files к FastAPI.

---

## Устранение неполадок

| Проблема | Решение |
|----------|---------|
| `503` при загрузке дашборда | Подождите 10–30 сек — идёт первый fetch из Google Sheets |
| MongoDB SSL / timeout | Добавьте IP в Atlas Network Access; `python scripts/test_mongodb.py` |
| Порт занят | `netstat -ano \| findstr ":8001"` → `taskkill /F /PID <pid>` |
| Неверные KPI из Sheets | Убедитесь, что `GOOGLE_SHEET_NAME` / `GOOGLE_SHEET_GID` указывают на вкладку **«БКВ 2026»** |
| Credentials not found | Положите JSON сервисного аккаунта в `backend/` или сделайте таблицу публичной |
| Frontend не видит API | Backend на порту **8001**; проверьте `frontend/vite.config.js` proxy |
| Сессия истекла | Перелогиньтесь; срок токена — `JWT_EXPIRES_MINUTES` |

---

## Лицензия

Внутренний проект Kazakhtelecom. Использование по согласованию с владельцем данных.
