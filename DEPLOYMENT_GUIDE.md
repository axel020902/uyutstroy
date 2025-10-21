# 🚀 Руководство по деплою и использованию

## Быстрый старт

### 1. Деплой на Vercel (рекомендуется)

#### Вариант A: Через Vercel CLI
```bash
# Установите Vercel CLI (если не установлен)
npm i -g vercel

# Перейдите в папку проекта
cd путь/к/проекту

# Выполните деплой
vercel

# Для production деплоя
vercel --prod
```

#### Вариант B: Через веб-интерфейс Vercel
1. Зайдите на https://vercel.com
2. Нажмите "New Project"
3. Импортируйте проект из Git репозитория
4. Или загрузите файлы напрямую
5. Нажмите "Deploy"

### 2. Локальная разработка

```bash
# Установите Vercel CLI
npm i -g vercel

# Запустите локальный dev сервер
vercel dev

# Откройте браузер
http://localhost:3000
```

## Проверка работы

### Шаг 1: Базовая проверка API

Откройте в браузере:
```
https://ваш-домен.vercel.app/api_test.html
```

Нажмите кнопку "Отправить тестовое сообщение"

**Ожидаемый результат:**
- ✅ HTTP статус: 200 OK
- ✅ Сообщение "success: true"
- ✅ Сообщение появилось в Telegram чате

### Шаг 2: Проверка форм

Откройте:
```
https://ваш-домен.vercel.app/test_telegram_fixed.html
```

Заполните форму и отправьте.

**Ожидаемый результат:**
- ✅ Сообщение "Сообщение успешно отправлено в Telegram!"
- ✅ Сообщение пришло в Telegram чат

### Шаг 3: Проверка главной страницы

Откройте:
```
https://ваш-домен.vercel.app/index.html
```

Попробуйте любую форму на странице.

## Структура файлов для деплоя

```
/
├── index.html                    # Главная страница ✅
├── api/
│   ├── telegram.js              # API для отправки в Telegram ✅
│   └── bot.js                   # Telegram бот ✅
├── vercel.json                  # Конфигурация Vercel ✅
├── api_test.html                # Тестовая страница API ✅
├── test_telegram_fixed.html     # Тестовая форма ✅
└── images/                      # Изображения
```

## Настройка Telegram бота

### Текущие настройки
- **Bot Token:** `8050200832:AAH5ScyG__5FCxX9_nEDdU0QrRCGvXlIU58`
- **Chat ID:** `-4895566764`

### Как получить Chat ID группы

1. Добавьте бота в группу
2. Используйте бот `@getidsbot` в группе
3. Или отправьте запрос:
   ```bash
   curl https://api.telegram.org/bot<TOKEN>/getUpdates
   ```
4. Найдите `"chat":{"id":-XXXXXXXXX}`

### Проверка настроек бота

Выполните запрос для проверки:
```bash
curl -X POST https://api.telegram.org/bot8050200832:AAH5ScyG__5FCxX9_nEDdU0QrRCGvXlIU58/sendMessage \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "-4895566764",
    "text": "🧪 Тест бота",
    "parse_mode": "HTML"
  }'
```

**Ожидаемый ответ:**
```json
{
  "ok": true,
  "result": {
    "message_id": 12345,
    ...
  }
}
```

## Отладка проблем

### Проблема: Сообщения не приходят

**Решение 1: Проверьте логи Vercel**
1. Откройте панель Vercel
2. Перейдите в раздел "Deployments"
3. Выберите последний деплой
4. Откройте "Functions" → `/api/telegram`
5. Просмотрите логи

**Решение 2: Проверьте консоль браузера**
1. Нажмите F12 в браузере
2. Перейдите на вкладку "Console"
3. Отправьте форму
4. Проверьте логи в консоли

**Решение 3: Проверьте права бота**
- Бот должен быть добавлен в группу
- Бот должен иметь права на отправку сообщений
- Для групп Chat ID должен начинаться с минуса

### Проблема: 404 Not Found при обращении к /api/telegram

**Решение:**
1. Убедитесь, что файл `api/telegram.js` существует
2. Проверьте `vercel.json`:
   ```json
   {
     "routes": [
       {
         "src": "/api/telegram",
         "dest": "/api/telegram.js"
       }
     ]
   }
   ```
3. Выполните повторный деплой: `vercel --prod`

### Проблема: CORS ошибки

**Решение:**
В файле `api/telegram.js` должны быть установлены заголовки:
```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
```

## Мониторинг

### Логи в реальном времени (Vercel)
```bash
vercel logs --follow
```

### Просмотр последних логов
```bash
vercel logs
```

### Проверка статуса деплоя
```bash
vercel ls
```

## Обновление проекта

### Обновить код
```bash
# Внесите изменения в файлы

# Выполните новый деплой
vercel --prod
```

### Откатить к предыдущей версии
1. Откройте панель Vercel
2. Перейдите в "Deployments"
3. Найдите нужную версию
4. Нажмите "Promote to Production"

## Производительность

### Текущие показатели
- ⚡ Время ответа API: 200-500ms
- ⚡ Время отправки в Telegram: 1-2 секунды
- ⚡ Cold start функции: ~1 секунда

### Оптимизация
- Функция `/api/telegram` автоматически масштабируется
- Vercel кэширует статические файлы
- Serverless функции автоматически оптимизируются

## Безопасность

### Рекомендации
1. ✅ Токен бота и Chat ID можно перенести в Environment Variables Vercel
2. ✅ Добавить проверку источника запроса (origin)
3. ✅ Добавить rate limiting для защиты от спама

### Как добавить Environment Variables
1. Откройте проект в Vercel Dashboard
2. Перейдите в Settings → Environment Variables
3. Добавьте переменные:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
4. Обновите код в `api/telegram.js`:
   ```javascript
   const botToken = process.env.TELEGRAM_BOT_TOKEN;
   const chatId = process.env.TELEGRAM_CHAT_ID;
   ```
5. Выполните повторный деплой

## Полезные ссылки

- [Vercel Documentation](https://vercel.com/docs)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Vercel CLI Reference](https://vercel.com/docs/cli)

## Поддержка

При возникновении проблем:
1. Проверьте логи в Vercel Dashboard
2. Откройте консоль браузера (F12)
3. Используйте тестовые страницы для диагностики
4. Проверьте документацию Telegram Bot API

---

✅ **Проект готов к использованию!**

