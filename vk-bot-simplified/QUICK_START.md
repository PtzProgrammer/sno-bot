# 🚀 Быстрый старт: Система логирования VK бота

## ✅ Что уже готово

Система логирования полностью настроена и готова к работе! 🎉

### 📁 Созданные файлы:
- ✅ `src/utils/logger.js` - основной модуль логирования
- ✅ `src/utils/cursorIntegration.js` - интеграция с Cursor
- ✅ `src/routes/logRoutes.js` - API маршруты
- ✅ `test-logging.js` - тестовый файл
- ✅ `LOGGING_GUIDE.md` - подробная документация

### 🔧 Интеграция в бот:
- ✅ Логирование добавлено в `index.js`
- ✅ Все `console.log` заменены на `logger`
- ✅ Добавлены API эндпоинты
- ✅ Настроена интеграция с Cursor

## 🎯 Как использовать

### 1. Запуск тестирования
```bash
cd vk-bot-simplified
node test-logging.js
```

### 2. Просмотр логов в Cursor
1. Откройте папку `cursor-logs/` в Cursor
2. Файлы обновляются автоматически каждые 3 секунды
3. Используйте `Ctrl+Shift+P` → "Developer: Reload Window" для обновления

### 3. API эндпоинты
```bash
# Статистика
GET /logs/stats

# Просмотр логов
GET /logs?level=error&limit=50

# Экспорт логов
GET /logs/export?format=json

# Ошибки
GET /logs/errors

# Производительность
GET /logs/performance
```

## 📊 Что логируется

### Автоматически:
- ✅ Все входящие VK сообщения
- ✅ Все исходящие ответы
- ✅ Ошибки VK API
- ✅ AI запросы и ответы
- ✅ Производительность операций
- ✅ Статистика работы

### Вручную:
```javascript
logger.info('Пользователь зашел в меню', { userId: 12345 });
logger.error('Ошибка подключения к БД', { error: error.message });
logger.performance('Отправка сообщения', duration, { userId });
```

## 🔄 Автообновление в Cursor

Файлы в `cursor-logs/` обновляются каждые 3 секунды:

- **live-logs.md** - живые логи в реальном времени
- **bot-stats.json** - статистика в JSON формате  
- **recent-errors.md** - последние ошибки
- **performance.md** - метрики производительности

## 🎨 Уровни логирования

```javascript
logger.error('Критическая ошибка');    // 🔴
logger.warn('Предупреждение');         // 🟡  
logger.info('Информация');             // 🔵
logger.debug('Отладка');               // 🟣
logger.trace('Детали');                // ⚪
```

## ⚙️ Настройка

### Переменные окружения:
```bash
LOG_LEVEL=info          # Уровень логирования
LOG_TO_FILE=true        # Запись в файл
LOG_TO_CONSOLE=true     # Вывод в консоль
LOG_TO_CURSOR=true      # Интеграция с Cursor
```

### В коде:
```javascript
// Изменение уровня логирования
logger.setLevel('debug');

// Настройка интеграции с Cursor
const cursorIntegration = new CursorIntegration({
  updateInterval: 5000,    // 5 секунд
  maxLogsInFile: 1000      // 1000 логов
});
```

## 🧪 Тестирование

Запустите тест для проверки всех функций:
```bash
node test-logging.js
```

Тест проверит:
- ✅ Базовое логирование
- ✅ VK специфичные логи
- ✅ AI запросы
- ✅ Производительность
- ✅ Статистику
- ✅ Экспорт
- ✅ Очистку логов

## 📈 Мониторинг

### В реальном времени:
1. Откройте `cursor-logs/live-logs.md`
2. Файл обновляется автоматически
3. Видите все события в реальном времени

### Через API:
```bash
# Проверка здоровья
curl https://your-bot-url/health

# Статистика
curl https://your-bot-url/logs/stats

# Последние ошибки  
curl https://your-bot-url/logs/errors
```

## 🚨 Устранение неполадок

### Логи не создаются:
1. Проверьте права на запись в папку
2. Убедитесь, что `LOG_TO_FILE=true`
3. Проверьте переменные окружения

### Cursor не обновляется:
1. Перезагрузите окно: `Ctrl+Shift+P` → "Developer: Reload Window"
2. Проверьте, что интеграция запущена
3. Убедитесь, что `LOG_TO_CURSOR=true`

### Большой размер логов:
1. Настройте ротацию файлов
2. Используйте `logger.cleanup()` для очистки
3. Уменьшите `maxLogsInFile`

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
