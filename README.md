# DashTracker — Telegram Mini App

Персональний щоденний трекер звичок, цілей і журналу.

## Стек
- React 18 + Vite 5
- Tailwind CSS (dark mode: `class`)
- @twa-dev/sdk — Telegram WebApp API
- @supabase/supabase-js — база даних
- @dnd-kit/core + @dnd-kit/sortable — drag-and-drop
- Recharts — графіки

## Структура

```
src/
  lib/
    supabase.js       — Supabase клієнт
    telegram.js       — Telegram WebApp helpers
    utils.js          — утиліти (дати, streak, debounce)
  hooks/
    useAuth.js        — ініціалізація, color scheme
    useHabits.js      — CRUD звичок + toggle
    useGoals.js       — CRUD цілей
    useJournal.js     — журнал + автозбереження
    useStats.js       — статистика, heatmap
  components/
    BottomNav.jsx     — нижня навігація
    Modal.jsx         — sheet modal
    ConfirmDialog.jsx — діалог підтвердження
    ErrorState.jsx    — помилка + retry
    EmptyState.jsx    — порожній стан
    SkeletonLoader.jsx — skeleton placeholder
    LoadingSpinner.jsx — спінер
  screens/
    Today.jsx         — звички на сьогодні + drag-and-drop
    Goals.jsx         — цілі з дедлайнами
    Journal.jsx       — щоденник з автозбереженням
    Stats.jsx         — heatmap + bar chart
    ManageHabits.jsx  — управління звичками
supabase/
  functions/
    verify-telegram/  — Edge Function HMAC верифікація
  migrations/
    001_rls_policies.sql — Row Level Security
```

## Запуск

```bash
npm install
npm run dev
```

## Збірка

```bash
npm run build
```

## Supabase Edge Function

Деплой функції верифікації Telegram:

```bash
supabase functions deploy verify-telegram
supabase secrets set BOT_TOKEN=<ваш токен>
```

## Змінні середовища

Файл `.env`:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_BOT_TOKEN=...
```

## Особливості

- Темна тема автоматично через `window.Telegram.WebApp.colorScheme`
- Optimistic updates для чекбоксів звичок
- Drag-and-drop порядок звичок (зберігається в `order_index`)
- Debounce 1 сек для автозбереження журналу
- Back Button через Telegram WebApp API
- Skeleton loaders + empty states + error states
- Чекбокси скидаються о 00:00 (через фільтрацію по даті)
