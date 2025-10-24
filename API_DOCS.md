# 📡 API Документация - Система отзывов

## Endpoints

### GET `/api/reviews`
Получить все отзывы

**Request:**
```http
GET /api/reviews HTTP/1.1
Content-Type: application/json
```

**Response (Success):**
```json
{
  "success": true,
  "reviews": [
    {
      "id": "demo_1",
      "name": "Александр Петров",
      "project": "Уют",
      "rating": 5,
      "text": "Отличная компания!...",
      "date": "2025-10-09T12:00:00.000Z",
      "approved": true
    }
  ],
  "count": 4
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Ошибка получения отзывов"
}
```

---

### POST `/api/reviews`
Добавить новый отзыв

**Request:**
```http
POST /api/reviews HTTP/1.1
Content-Type: application/json

{
  "name": "Иван Иванов",
  "project": "Гармония",
  "rating": 5,
  "text": "Очень довольны результатом!"
}
```

**Validation Rules:**
- `name`: строка, 2-100 символов, обязательное
- `project`: строка, 0-100 символов, опционально
- `rating`: число, 1-5, обязательное
- `text`: строка, 10-1000 символов, обязательное

**Response (Success):**
```json
{
  "success": true,
  "message": "Отзыв успешно добавлен",
  "review": {
    "id": "review_1729766400000_abc123",
    "name": "Иван Иванов",
    "project": "Гармония",
    "rating": 5,
    "text": "Очень довольны результатом!",
    "date": "2025-10-24T12:00:00.000Z",
    "approved": true
  }
}
```

**Response (Validation Error):**
```json
{
  "success": false,
  "error": "Текст отзыва должен содержать минимум 10 символов"
}
```

**Response (Server Error):**
```json
{
  "success": false,
  "error": "Ошибка добавления отзыва"
}
```

---

## Структура отзыва

```typescript
interface Review {
  id: string;           // Уникальный ID (генерируется автоматически)
  name: string;         // Имя клиента
  project: string;      // Название проекта (опционально)
  rating: number;       // Оценка от 1 до 5
  text: string;         // Текст отзыва
  date: string;         // ISO 8601 дата создания
  approved: boolean;    // Статус модерации
}
```

---

## Безопасность

### XSS Protection
Все входные данные проходят sanitization:
- HTML теги экранируются
- Специальные символы заменяются на HTML entities

### Валидация
- Проверка типов данных
- Ограничение длины полей
- Проверка диапазона значений

### CORS
API поддерживает CORS для работы с фронтендом.

---

## Примеры использования

### JavaScript (Fetch)

```javascript
// Получить отзывы
async function getReviews() {
  const response = await fetch('/api/reviews');
  const data = await response.json();
  return data.reviews;
}

// Добавить отзыв
async function addReview(review) {
  const response = await fetch('/api/reviews', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(review)
  });
  return await response.json();
}
```

### cURL

```bash
# Получить отзывы
curl https://your-site.vercel.app/api/reviews

# Добавить отзыв
curl -X POST https://your-site.vercel.app/api/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Тест",
    "project": "Уют",
    "rating": 5,
    "text": "Отличный дом!"
  }'
```

---

## Хранилище данных

### Вариант 1: In-Memory (по умолчанию)
- Отзывы хранятся в памяти функции
- Быстро и просто
- Могут быть потеряны при cold start

### Вариант 2: Vercel KV (рекомендуется)
- Постоянное хранилище Redis
- Надежно и быстро
- Требует настройки (см. DEPLOYMENT.md)

---

## Демо-отзывы

API возвращает 4 демонстрационных отзыва по умолчанию:
- Александр Петров (Уют) ⭐⭐⭐⭐⭐
- Мария Соколова (Гармония) ⭐⭐⭐⭐⭐
- Дмитрий Иванов (Симфония) ⭐⭐⭐⭐⭐
- Елена Морозова (Премиум) ⭐⭐⭐⭐⭐

Они всегда видны и не могут быть удалены.

---

## Rate Limits

### Vercel Free Plan:
- 1,000 requests/day per function
- 100 GB-Hours compute/month

Для сайта с отзывами этого более чем достаточно!

---

## Troubleshooting

### 404 Not Found
Проверьте, что:
- Файл `api/reviews.js` существует
- `vercel.json` настроен правильно
- Проект задеплоен

### 500 Internal Server Error
Смотрите логи:
```bash
vercel logs
```

### CORS Error
API уже настроен с CORS headers. Если ошибка - проверьте домен.

---

## Расширение API

### Добавить удаление отзыва:
```javascript
// В api/reviews.js
if (req.method === 'DELETE') {
  const { id } = req.body;
  // ... логика удаления
}
```

### Добавить модерацию:
```javascript
// В api/reviews.js при создании отзыва
approved: false  // Вместо true
```

Затем создайте админ-панель для одобрения отзывов.

---

## Мониторинг

В панели Vercel доступны:
- Логи в реальном времени
- Метрики запросов
- Статистика ошибок
- Производительность функций

