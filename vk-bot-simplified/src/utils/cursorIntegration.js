/**
 * Интеграция с Cursor для отображения логов VK бота
 * Создает файлы в формате, удобном для просмотра в Cursor
 */

const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class CursorIntegration {
  constructor(options = {}) {
    this.outputDir = options.outputDir || path.join(__dirname, '../../cursor-logs');
    this.updateInterval = options.updateInterval || 5000; // 5 секунд
    this.maxLogsInFile = options.maxLogsInFile || 1000;
    
    // Создаем директорию для Cursor логов
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    
    this.isRunning = false;
    this.updateTimer = null;
  }

  /**
   * Запуск интеграции с Cursor
   */
  start() {
    if (this.isRunning) {
      return;
    }
    
    this.isRunning = true;
    logger.info('Запуск интеграции с Cursor', { outputDir: this.outputDir });
    
    // Создаем начальные файлы
    this.createInitialFiles();
    
    // Запускаем периодическое обновление
    this.updateTimer = setInterval(() => {
      this.updateCursorLogs();
    }, this.updateInterval);
    
    // Обновляем сразу
    this.updateCursorLogs();
  }

  /**
   * Остановка интеграции
   */
  stop() {
    if (!this.isRunning) {
      return;
    }
    
    this.isRunning = false;
    
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    
    logger.info('Интеграция с Cursor остановлена');
  }

  /**
   * Создание начальных файлов для Cursor
   */
  createInitialFiles() {
    const files = [
      {
        name: 'README.md',
        content: this.generateReadme()
      },
      {
        name: 'live-logs.md',
        content: this.generateLiveLogsTemplate()
      },
      {
        name: 'bot-stats.json',
        content: JSON.stringify(this.getInitialStats(), null, 2)
      },
      {
        name: 'recent-errors.md',
        content: this.generateErrorsTemplate()
      }
    ];
    
    for (const file of files) {
      const filePath = path.join(this.outputDir, file.name);
      fs.writeFileSync(filePath, file.content);
    }
  }

  /**
   * Генерация README для Cursor
   */
  generateReadme() {
    return `# VK Bot Logs - Cursor Integration

## 📊 Файлы логов

- **live-logs.md** - Живые логи в реальном времени
- **bot-stats.json** - Статистика работы бота
- **recent-errors.md** - Последние ошибки
- **performance.md** - Метрики производительности

## 🔄 Автообновление

Файлы обновляются каждые ${this.updateInterval / 1000} секунд.

## 📝 Уровни логирования

- **ERROR** - Критические ошибки
- **WARN** - Предупреждения
- **INFO** - Информационные сообщения
- **DEBUG** - Отладочная информация
- **TRACE** - Детальная трассировка

## 🚀 Быстрые команды

- Обновить логи: \`Ctrl+Shift+P\` → "Developer: Reload Window"
- Открыть терминал: \`Ctrl+\`\`
- Поиск в логах: \`Ctrl+F\`

---
*Последнее обновление: ${new Date().toISOString()}*
`;
  }

  /**
   * Шаблон для живых логов
   */
  generateLiveLogsTemplate() {
    return `# 🔴 Живые логи VK бота

> **Статус**: Запуск системы логирования...
> **Время**: ${new Date().toLocaleString('ru-RU')}

## 📋 Последние события

*Логи будут отображаться здесь автоматически...*

---
*Обновляется каждые ${this.updateInterval / 1000} секунд*
`;
  }

  /**
   * Шаблон для ошибок
   */
  generateErrorsTemplate() {
    return `# ❌ Последние ошибки

> **Статус**: Мониторинг ошибок активен
> **Время**: ${new Date().toLocaleString('ru-RU')}

## 🚨 Критические ошибки

*Ошибки будут отображаться здесь...*

---
*Обновляется каждые ${this.updateInterval / 1000} секунд*
`;
  }

  /**
   * Начальная статистика
   */
  getInitialStats() {
    return {
      status: 'initializing',
      startTime: new Date().toISOString(),
      totalLogs: 0,
      errors: 0,
      warnings: 0,
      info: 0,
      debug: 0,
      uptime: 0,
      memory: {
        used: 0,
        total: 0,
        percentage: 0
      },
      lastUpdate: new Date().toISOString()
    };
  }

  /**
   * Обновление логов для Cursor
   */
  updateCursorLogs() {
    try {
      // Обновляем живые логи
      this.updateLiveLogs();
      
      // Обновляем статистику
      this.updateStats();
      
      // Обновляем ошибки
      this.updateErrors();
      
      // Обновляем производительность
      this.updatePerformance();
      
    } catch (error) {
      console.error('Ошибка обновления логов для Cursor:', error);
    }
  }

  /**
   * Обновление живых логов
   */
  updateLiveLogs() {
    const logs = logger.exportForCursor({
      level: 'debug',
      limit: this.maxLogsInFile,
      includeMeta: true
    });
    
    let content = `# 🔴 Живые логи VK бота\n\n`;
    content += `> **Статус**: ✅ Активен\n`;
    content += `> **Время**: ${new Date().toLocaleString('ru-RU')}\n`;
    content += `> **Всего логов**: ${logs.length}\n\n`;
    
    if (logs.length === 0) {
      content += `*Логи пока не созданы...*\n\n`;
    } else {
      content += `## 📋 Последние события\n\n`;
      
      // Группируем логи по времени
      const groupedLogs = this.groupLogsByTime(logs);
      
      for (const [timeGroup, timeLogs] of Object.entries(groupedLogs)) {
        content += `### 🕐 ${timeGroup}\n\n`;
        
        for (const log of timeLogs.slice(-10)) { // Показываем последние 10
          const emoji = this.getLogEmoji(log.level);
          const time = new Date(log.timestamp).toLocaleTimeString('ru-RU');
          
          content += `**${emoji} ${time}** [${log.level.toUpperCase()}] ${log.message}\n`;
          
          if (log.meta && Object.keys(log.meta).length > 0) {
            content += `\`\`\`json\n${JSON.stringify(log.meta, null, 2)}\n\`\`\`\n`;
          }
          content += `\n`;
        }
      }
    }
    
    content += `---\n*Обновляется каждые ${this.updateInterval / 1000} секунд*\n`;
    
    const filePath = path.join(this.outputDir, 'live-logs.md');
    fs.writeFileSync(filePath, content);
  }

  /**
   * Обновление статистики
   */
  updateStats() {
    const stats = logger.getStats();
    const memory = process.memoryUsage();
    
    const statsData = {
      status: 'running',
      startTime: new Date(Date.now() - stats.uptime * 1000).toISOString(),
      totalLogs: stats.total,
      errors: stats.byLevel.error || 0,
      warnings: stats.byLevel.warn || 0,
      info: stats.byLevel.info || 0,
      debug: stats.byLevel.debug || 0,
      trace: stats.byLevel.trace || 0,
      uptime: Math.floor(stats.uptime),
      memory: {
        used: Math.round(memory.heapUsed / 1024 / 1024),
        total: Math.round(memory.heapTotal / 1024 / 1024),
        percentage: Math.round((memory.heapUsed / memory.heapTotal) * 100)
      },
      logLevel: stats.logLevel,
      lastUpdate: new Date().toISOString(),
      recentErrors: stats.errors.slice(-5)
    };
    
    const filePath = path.join(this.outputDir, 'bot-stats.json');
    fs.writeFileSync(filePath, JSON.stringify(statsData, null, 2));
  }

  /**
   * Обновление ошибок
   */
  updateErrors() {
    const stats = logger.getStats();
    const errors = stats.errors || [];
    
    let content = `# ❌ Последние ошибки\n\n`;
    content += `> **Статус**: ${errors.length > 0 ? '🚨 Есть ошибки' : '✅ Ошибок нет'}\n`;
    content += `> **Время**: ${new Date().toLocaleString('ru-RU')}\n`;
    content += `> **Всего ошибок**: ${errors.length}\n\n`;
    
    if (errors.length === 0) {
      content += `## ✅ Отлично! Ошибок не обнаружено\n\n`;
    } else {
      content += `## 🚨 Критические ошибки\n\n`;
      
      for (const error of errors.slice(-10)) { // Последние 10 ошибок
        const time = new Date(error.timestamp).toLocaleString('ru-RU');
        content += `### 🔴 ${time}\n\n`;
        content += `**Сообщение**: ${error.message}\n\n`;
        
        if (error.meta) {
          content += `**Детали**:\n`;
          content += `\`\`\`json\n${JSON.stringify(error.meta, null, 2)}\n\`\`\`\n\n`;
        }
      }
    }
    
    content += `---\n*Обновляется каждые ${this.updateInterval / 1000} секунд*\n`;
    
    const filePath = path.join(this.outputDir, 'recent-errors.md');
    fs.writeFileSync(filePath, content);
  }

  /**
   * Обновление метрик производительности
   */
  updatePerformance() {
    const memory = process.memoryUsage();
    const uptime = process.uptime();
    
    let content = `# 📊 Метрики производительности\n\n`;
    content += `> **Время**: ${new Date().toLocaleString('ru-RU')}\n`;
    content += `> **Время работы**: ${Math.floor(uptime / 3600)}ч ${Math.floor((uptime % 3600) / 60)}м\n\n`;
    
    content += `## 💾 Память\n\n`;
    content += `- **Использовано**: ${Math.round(memory.heapUsed / 1024 / 1024)} MB\n`;
    content += `- **Всего**: ${Math.round(memory.heapTotal / 1024 / 1024)} MB\n`;
    content += `- **Процент**: ${Math.round((memory.heapUsed / memory.heapTotal) * 100)}%\n\n`;
    
    content += `## 📈 Статистика логов\n\n`;
    const stats = logger.getStats();
    content += `- **Всего логов**: ${stats.total}\n`;
    content += `- **Ошибки**: ${stats.byLevel.error || 0}\n`;
    content += `- **Предупреждения**: ${stats.byLevel.warn || 0}\n`;
    content += `- **Информация**: ${stats.byLevel.info || 0}\n`;
    content += `- **Отладка**: ${stats.byLevel.debug || 0}\n\n`;
    
    content += `## 🕐 Активность по часам\n\n`;
    if (stats.byHour) {
      const sortedHours = Object.entries(stats.byHour)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
      
      for (const [hour, count] of sortedHours) {
        content += `- **${hour}:00** - ${count} логов\n`;
      }
    }
    
    content += `\n---\n*Обновляется каждые ${this.updateInterval / 1000} секунд*\n`;
    
    const filePath = path.join(this.outputDir, 'performance.md');
    fs.writeFileSync(filePath, content);
  }

  /**
   * Группировка логов по времени
   */
  groupLogsByTime(logs) {
    const groups = {};
    
    for (const log of logs) {
      const date = new Date(log.timestamp);
      const timeGroup = date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      if (!groups[timeGroup]) {
        groups[timeGroup] = [];
      }
      groups[timeGroup].push(log);
    }
    
    return groups;
  }

  /**
   * Получение эмодзи для уровня лога
   */
  getLogEmoji(level) {
    const emojis = {
      error: '🔴',
      warn: '🟡',
      info: '🔵',
      debug: '🟣',
      trace: '⚪'
    };
    return emojis[level] || '⚪';
  }

  /**
   * Создание дампа логов для экспорта
   */
  createLogDump() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dumpFile = path.join(this.outputDir, `log-dump-${timestamp}.json`);
    
    const dump = {
      timestamp: new Date().toISOString(),
      stats: logger.getStats(),
      logs: logger.exportForCursor({
        level: 'debug',
        limit: 5000,
        includeMeta: true
      }),
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        memory: process.memoryUsage()
      }
    };
    
    fs.writeFileSync(dumpFile, JSON.stringify(dump, null, 2));
    logger.info('Создан дамп логов', { file: dumpFile });
    
    return dumpFile;
  }
}

module.exports = CursorIntegration;
