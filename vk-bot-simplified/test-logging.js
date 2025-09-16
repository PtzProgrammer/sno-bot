/**
 * Тестирование системы логирования VK бота
 * Запуск: node test-logging.js
 */

const logger = require('./src/utils/logger');
const CursorIntegration = require('./src/utils/cursorIntegration');

// Инициализация интеграции с Cursor
const cursorIntegration = new CursorIntegration({
  updateInterval: 2000, // Обновление каждые 2 секунды
  maxLogsInFile: 100
});

// Запускаем интеграцию
cursorIntegration.start();

console.log('🚀 Запуск тестирования системы логирования...\n');

// Тест 1: Базовое логирование
console.log('📝 Тест 1: Базовое логирование');
logger.info('Тестовое информационное сообщение', { test: 'basic' });
logger.warn('Тестовое предупреждение', { test: 'warning' });
logger.error('Тестовая ошибка', { test: 'error' });
logger.debug('Отладочное сообщение', { test: 'debug' });

// Тест 2: VK специфичные логи
console.log('\n📱 Тест 2: VK специфичные логи');
logger.vkMessage(12345, 'Привет, бот!', 'received');
logger.vkMessage(12345, 'Добро пожаловать!', 'sent');
logger.vkError(new Error('VK API недоступен'), { userId: 12345 });

// Тест 3: AI запросы
console.log('\n🧠 Тест 3: AI запросы');
logger.aiRequest(12345, 'Как написать научную статью?', 'Вот подробное руководство...');
logger.aiRequest(67890, 'Расскажи про СНК', null);

// Тест 4: Производительность
console.log('\n⚡ Тест 4: Производительность');
const startTime = Date.now();
setTimeout(() => {
  const duration = Date.now() - startTime;
  logger.performance('Тестовая операция', duration, { test: 'performance' });
}, 100);

// Тест 5: Массовое логирование
console.log('\n📊 Тест 5: Массовое логирование');
for (let i = 0; i < 20; i++) {
  logger.info(`Массовое сообщение ${i + 1}`, { iteration: i + 1 });
}

// Тест 6: Ошибки
console.log('\n❌ Тест 6: Ошибки');
try {
  throw new Error('Тестовая ошибка для логирования');
} catch (error) {
  logger.error('Поймана тестовая ошибка', { 
    error: error.message, 
    stack: error.stack,
    test: 'exception' 
  });
}

// Тест 7: Статистика
console.log('\n📈 Тест 7: Статистика');
setTimeout(() => {
  const stats = logger.getStats();
  console.log('Статистика логов:', JSON.stringify(stats, null, 2));
}, 2000);

// Тест 8: Экспорт для Cursor
console.log('\n📤 Тест 8: Экспорт для Cursor');
setTimeout(() => {
  const exportedLogs = logger.exportForCursor({
    level: 'info',
    limit: 10,
    includeMeta: true
  });
  console.log(`Экспортировано ${exportedLogs.length} логов для Cursor`);
}, 3000);

// Тест 9: Очистка логов
console.log('\n🧹 Тест 9: Очистка логов');
setTimeout(() => {
  const deletedCount = logger.cleanup(0); // Удаляем все файлы старше 0 дней (только для теста)
  console.log(`Удалено ${deletedCount} старых лог файлов`);
}, 4000);

// Тест 10: Создание дампа
console.log('\n💾 Тест 10: Создание дампа логов');
setTimeout(() => {
  const dumpFile = cursorIntegration.createLogDump();
  console.log(`Создан дамп логов: ${dumpFile}`);
}, 5000);

// Завершение тестирования
setTimeout(() => {
  console.log('\n✅ Тестирование завершено!');
  console.log('\n📁 Проверьте файлы в папке cursor-logs/:');
  console.log('   - README.md - документация');
  console.log('   - live-logs.md - живые логи');
  console.log('   - bot-stats.json - статистика');
  console.log('   - recent-errors.md - ошибки');
  console.log('   - performance.md - производительность');
  console.log('\n🌐 API эндпоинты:');
  console.log('   - GET /logs - просмотр логов');
  console.log('   - GET /logs/stats - статистика');
  console.log('   - GET /logs/export - экспорт');
  console.log('   - GET /logs/errors - ошибки');
  console.log('   - GET /logs/performance - производительность');
  console.log('   - POST /logs/cleanup - очистка');
  
  // Останавливаем интеграцию
  cursorIntegration.stop();
  process.exit(0);
}, 6000);

// Обработка завершения процесса
process.on('SIGINT', () => {
  console.log('\n🛑 Получен сигнал завершения...');
  cursorIntegration.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Получен сигнал завершения...');
  cursorIntegration.stop();
  process.exit(0);
});
