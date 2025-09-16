# 📊 Система логирования VK бота с интеграцией в Cursor

## 🚀 Обзор

Система логирования предоставляет полный мониторинг работы VK бота с удобным просмотром логов прямо в Cursor IDE.

## ✨ Возможности

- 📝 **Структурированное логирование** - JSON формат с метаданными
- 🎨 **Цветной вывод** в консоль
- 📁 **Автоматическая ротация** лог файлов
- 🔄 **Живое обновление** в Cursor
- 📊 **Статистика** и метрики
- 🌐 **REST API** для просмотра логов
- 📤 **Экспорт** в JSON/CSV форматах

## 🛠️ Установка и настройка

### 1. Зависимости
Система использует только встроенные модули Node.js:
- `fs` - работа с файлами
- `path` - работа с путями
- `console` - вывод в консоль

### 2. Переменные окружения
```bash
# Уровень логирования (error, warn, info, debug, trace)
LOG_LEVEL=info

# Включить/выключить запись в файл
LOG_TO_FILE=true

# Включить/выключить вывод в консоль
LOG_TO_CONSOLE=true

# Включить/выключить интеграцию с Cursor
LOG_TO_CURSOR=true
```

## 📁 Структура файлов

```
vk-bot-simplified/
├── src/
│   ├── utils/
│   │   ├── logger.js              # Основной модуль логирования
│   │   └── cursorIntegration.js   # Интеграция с Cursor
│   └── routes/
│       └── logRoutes.js           # API маршруты для логов
├── logs/                          # Лог файлы (создается автоматически)
│   ├── bot.log                    # Основной лог файл
│   ├── bot.log.1                  # Ротированные файлы
│   └── cursor-logs.jsonl          # Логи для Cursor
├── cursor-logs/                   # Файлы для Cursor (создается автоматически)
│   ├── README.md                  # Документация
│   ├── live-logs.md               # Живые логи
│   ├── bot-stats.json             # Статистика
│   ├── recent-errors.md           # Ошибки
│   └── performance.md             # Производительность
└── test-logging.js                # Тестовый файл
```

## 🎯 Использование

### Базовое логирование
```javascript
const logger = require('./src/utils/logger');

// Разные уровни логирования
logger.error('Критическая ошибка', { userId: 12345 });
logger.warn('Предупреждение', { operation: 'sendMessage' });
logger.info('Информационное сообщение', { status: 'success' });
logger.debug('Отладочная информация', { data: {...} });
logger.trace('Детальная трассировка', { step: 'validation' });
```

### VK специфичные методы
```javascript
// Логирование VK сообщений
logger.vkMessage(userId, message, 'received');
logger.vkMessage(userId, response, 'sent');

// Логирование VK ошибок
logger.vkError(error, { userId, operation: 'sendMessage' });

// Логирование AI запросов
logger.aiRequest(userId, request, response);

// Логирование производительности
logger.performance('Operation Name', duration, { userId });
```

### Получение статистики
```javascript
const stats = logger.getStats();
console.log('Всего логов:', stats.total);
console.log('Ошибки:', stats.byLevel.error);
console.log('Время работы:', stats.uptime);
```

## 🌐 API эндпоинты

### GET /logs
Просмотр логов с фильтрацией
```bash
# Базовый запрос
GET /logs

# С параметрами
GET /logs?level=error&limit=50&since=2024-01-01T00:00:00Z
```

**Параметры:**
- `level` - уровень логирования (error, warn, info, debug, trace)
- `limit` - количество логов (по умолчанию 100)
- `since` - фильтр по времени (ISO формат)
- `includeMeta` - включать метаданные (true/false)

### GET /logs/stats
Статистика работы бота
```bash
GET /logs/stats
```

### GET /logs/export
Экспорт логов
```bash
# JSON формат
GET /logs/export?format=json&limit=1000

# CSV формат
GET /logs/export?format=csv&level=error
```

### GET /logs/errors
Последние ошибки
```bash
GET /logs/errors?limit=20
```

### GET /logs/performance
Метрики производительности
```bash
GET /logs/performance
```

### POST /logs/cleanup
Очистка старых логов
```bash
POST /logs/cleanup?days=7
```

## 🔄 Интеграция с Cursor

### Автоматическое обновление
Файлы в папке `cursor-logs/` обновляются каждые 3 секунды:

- **live-logs.md** - живые логи в реальном времени
- **bot-stats.json** - статистика в JSON формате
- **recent-errors.md** - последние ошибки
- **performance.md** - метрики производительности

### Просмотр в Cursor
1. Откройте папку `cursor-logs/` в Cursor
2. Файлы будут автоматически обновляться
3. Используйте `Ctrl+Shift+P` → "Developer: Reload Window" для обновления

## 🧪 Тестирование

Запустите тестовый файл:
```bash
node test-logging.js
```

Тест проверит:
- ✅ Базовое логирование
- ✅ VK специфичные логи
- ✅ AI запросы
- ✅ Производительность
- ✅ Массовое логирование
- ✅ Обработку ошибок
- ✅ Статистику
- ✅ Экспорт для Cursor
- ✅ Очистку логов
- ✅ Создание дампов

## 📊 Мониторинг

### В реальном времени
- Откройте `cursor-logs/live-logs.md` в Cursor
- Файл обновляется каждые 3 секунды
- Видите все события в реальном времени

### Статистика
- `cursor-logs/bot-stats.json` - JSON статистика
- `cursor-logs/performance.md` - метрики производительности
- `cursor-logs/recent-errors.md` - последние ошибки

### API мониторинг
```bash
# Проверка здоровья
curl https://your-bot-url/health

# Статистика
curl https://your-bot-url/logs/stats

# Последние ошибки
curl https://your-bot-url/logs/errors
```

## ⚙️ Настройка

### Уровни логирования
```javascript
// В коде
logger.setLevel('debug');

// Через переменную окружения
process.env.LOG_LEVEL = 'debug';
```

### Ротация логов
```javascript
// Настройка в logger.js
const logger = new Logger({
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,                   // 5 файлов
  logDir: './custom-logs'        // Кастомная папка
});
```

### Интеграция с Cursor
```javascript
// Настройка обновления
const cursorIntegration = new CursorIntegration({
  updateInterval: 5000,    // 5 секунд
  maxLogsInFile: 1000,     // 1000 логов
  outputDir: './cursor'    // Кастомная папка
});
```

## 🚨 Устранение неполадок

### Логи не создаются
1. Проверьте права на запись в папку
2. Убедитесь, что `LOG_TO_FILE=true`
3. Проверьте переменные окружения

### Cursor не обновляется
1. Перезагрузите окно: `Ctrl+Shift+P` → "Developer: Reload Window"
2. Проверьте, что интеграция запущена
3. Убедитесь, что `LOG_TO_CURSOR=true`

### Большой размер логов
1. Настройте ротацию файлов
2. Используйте `logger.cleanup()` для очистки
3. Уменьшите `maxLogsInFile`

### Медленная работа
1. Увеличьте `updateInterval`
2. Уменьшите `maxLogsInFile`
3. Отключите `LOG_TO_CURSOR` в продакшене

## 📈 Производительность

### Рекомендации
- В продакшене используйте `LOG_LEVEL=info` или `warn`
- Отключите `LOG_TO_CURSOR` в продакшене
- Настройте автоматическую очистку логов
- Мониторьте размер лог файлов

### Метрики
- Время записи лога: ~1-2ms
- Размер лога: ~200-500 байт
- Обновление Cursor: каждые 3 секунды
- Ротация: при достижении 10MB

## 🔒 Безопасность

### Конфиденциальные данные
```javascript
// НЕ логируйте пароли и токены
logger.info('User login', { 
  userId: 12345,
  // password: 'secret' // ❌ НЕ ДЕЛАЙТЕ ТАК
});

// Логируйте только безопасные данные
logger.info('User login', { 
  userId: 12345,
  timestamp: new Date().toISOString() // ✅ Безопасно
});
```

### Маскирование данных
```javascript
// Автоматическое маскирование в logger.js
const sensitiveFields = ['password', 'token', 'secret', 'key'];
// Эти поля будут автоматически замаскированы
```

## 📚 Примеры использования

### В VK боте
```javascript
// Обработка сообщения
async function processMessage(message) {
  const userId = message.from_id;
  const text = message.text;
  
  logger.vkMessage(userId, text, 'received');
  
  try {
    const response = await handleMessage(text);
    await sendMessage(userId, response);
    logger.vkMessage(userId, response, 'sent');
  } catch (error) {
    logger.vkError(error, { userId, text });
  }
}
```

### В AI помощнике
```javascript
async function handleAIRequest(userId, request) {
  const startTime = Date.now();
  
  logger.aiRequest(userId, request);
  
  try {
    const response = await getAIResponse(request);
    logger.aiRequest(userId, request, response);
    return response;
  } catch (error) {
    logger.error('AI request failed', { userId, request, error: error.message });
    throw error;
  } finally {
    const duration = Date.now() - startTime;
    logger.performance('AI Request', duration, { userId });
  }
}
```

---

## 🎉 Готово!

Теперь у тебя есть полноценная система логирования с интеграцией в Cursor! 

**Что дальше:**
1. 🧪 Запусти `node test-logging.js` для тестирования
2. 📁 Открой папку `cursor-logs/` в Cursor
3. 🌐 Используй API эндпоинты для мониторинга
4. 📊 Настрой автоматическую очистку логов

**Полезные команды:**
```bash
# Тестирование
node test-logging.js

# Просмотр логов
tail -f logs/bot.log

# Статистика
curl localhost:3000/logs/stats

# Экспорт
curl localhost:3000/logs/export?format=json > logs.json
```

Удачи с мониторингом твоего VK бота! 🚀
