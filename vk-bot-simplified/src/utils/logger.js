/**
 * Система логирования для VK бота с интеграцией в Cursor
 * Поддерживает различные уровни логирования и экспорт в Cursor
 */

const fs = require('fs');
const path = require('path');

class Logger {
  constructor(options = {}) {
    this.logLevel = options.logLevel || 'info';
    this.logToFile = options.logToFile !== false;
    this.logToConsole = options.logToConsole !== false;
    this.logToCursor = options.logToCursor !== false;
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.maxFiles = options.maxFiles || 5;
    this.logDir = options.logDir || path.join(__dirname, '../../logs');
    
    // Создаем директорию для логов
    if (this.logToFile && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    
    // Уровни логирования
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4
    };
    
    // Цвета для консоли
    this.colors = {
      error: '\x1b[31m', // красный
      warn: '\x1b[33m',  // желтый
      info: '\x1b[36m',  // голубой
      debug: '\x1b[35m', // фиолетовый
      trace: '\x1b[90m', // серый
      reset: '\x1b[0m'
    };
    
    // Статистика
    this.stats = {
      total: 0,
      byLevel: {},
      byHour: {},
      errors: []
    };
  }

  /**
   * Основной метод логирования
   */
  log(level, message, meta = {}) {
    const levelNum = this.levels[level];
    const currentLevelNum = this.levels[this.logLevel];
    
    if (levelNum > currentLevelNum) {
      return;
    }
    
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      meta,
      pid: process.pid,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    };
    
    // Обновляем статистику
    this.updateStats(level, logEntry);
    
    // Форматируем сообщение
    const formattedMessage = this.formatMessage(logEntry);
    
    // Выводим в консоль
    if (this.logToConsole) {
      console.log(formattedMessage);
    }
    
    // Записываем в файл
    if (this.logToFile) {
      this.writeToFile(logEntry);
    }
    
    // Отправляем в Cursor (если включено)
    if (this.logToCursor) {
      this.sendToCursor(logEntry);
    }
    
    return logEntry;
  }

  /**
   * Форматирование сообщения для вывода
   */
  formatMessage(logEntry) {
    const { timestamp, level, message, meta } = logEntry;
    const color = this.colors[level] || this.colors.reset;
    const reset = this.colors.reset;
    
    let formatted = `${color}[${timestamp}] ${level.toUpperCase()}: ${message}${reset}`;
    
    if (Object.keys(meta).length > 0) {
      formatted += `\n${color}  Meta: ${JSON.stringify(meta, null, 2)}${reset}`;
    }
    
    return formatted;
  }

  /**
   * Запись в файл с ротацией
   */
  writeToFile(logEntry) {
    try {
      const logFile = path.join(this.logDir, 'bot.log');
      const logLine = JSON.stringify(logEntry) + '\n';
      
      // Проверяем размер файла
      if (fs.existsSync(logFile)) {
        const stats = fs.statSync(logFile);
        if (stats.size > this.maxFileSize) {
          this.rotateLogFile(logFile);
        }
      }
      
      fs.appendFileSync(logFile, logLine);
    } catch (error) {
      console.error('Ошибка записи в лог файл:', error);
    }
  }

  /**
   * Ротация лог файлов
   */
  rotateLogFile(logFile) {
    try {
      // Переименовываем существующие файлы
      for (let i = this.maxFiles - 1; i > 0; i--) {
        const oldFile = `${logFile}.${i}`;
        const newFile = `${logFile}.${i + 1}`;
        
        if (fs.existsSync(oldFile)) {
          if (i === this.maxFiles - 1) {
            fs.unlinkSync(oldFile); // Удаляем самый старый
          } else {
            fs.renameSync(oldFile, newFile);
          }
        }
      }
      
      // Переименовываем текущий файл
      if (fs.existsSync(logFile)) {
        fs.renameSync(logFile, `${logFile}.1`);
      }
    } catch (error) {
      console.error('Ошибка ротации лог файлов:', error);
    }
  }

  /**
   * Отправка логов в Cursor (через файл для интеграции)
   */
  sendToCursor(logEntry) {
    try {
      const cursorLogFile = path.join(this.logDir, 'cursor-logs.jsonl');
      const cursorEntry = {
        ...logEntry,
        source: 'vk-bot',
        cursor_timestamp: Date.now()
      };
      
      fs.appendFileSync(cursorLogFile, JSON.stringify(cursorEntry) + '\n');
    } catch (error) {
      console.error('Ошибка отправки в Cursor:', error);
    }
  }

  /**
   * Обновление статистики
   */
  updateStats(level, logEntry) {
    this.stats.total++;
    this.stats.byLevel[level] = (this.stats.byLevel[level] || 0) + 1;
    
    const hour = new Date(logEntry.timestamp).getHours();
    this.stats.byHour[hour] = (this.stats.byHour[hour] || 0) + 1;
    
    if (level === 'error') {
      this.stats.errors.push({
        timestamp: logEntry.timestamp,
        message: logEntry.message,
        meta: logEntry.meta
      });
      
      // Ограничиваем количество ошибок в памяти
      if (this.stats.errors.length > 100) {
        this.stats.errors = this.stats.errors.slice(-50);
      }
    }
  }

  /**
   * Методы для разных уровней логирования
   */
  error(message, meta = {}) {
    return this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    return this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    return this.log('info', message, meta);
  }

  debug(message, meta = {}) {
    return this.log('debug', message, meta);
  }

  trace(message, meta = {}) {
    return this.log('trace', message, meta);
  }

  /**
   * Специальные методы для VK бота
   */
  vkMessage(userId, message, type = 'received') {
    return this.info(`VK Message ${type}`, {
      userId,
      message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      type
    });
  }

  vkError(error, context = {}) {
    return this.error('VK API Error', {
      error: error.message || error,
      context
    });
  }

  aiRequest(userId, request, response = null) {
    return this.info('AI Request', {
      userId,
      request: request.substring(0, 200) + (request.length > 200 ? '...' : ''),
      responseLength: response ? response.length : 0,
      hasResponse: !!response
    });
  }

  performance(operation, duration, meta = {}) {
    return this.debug(`Performance: ${operation}`, {
      duration: `${duration}ms`,
      ...meta
    });
  }

  /**
   * Получение статистики
   */
  getStats() {
    return {
      ...this.stats,
      logLevel: this.logLevel,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
  }

  /**
   * Экспорт логов для Cursor
   */
  exportForCursor(options = {}) {
    const {
      level = 'info',
      limit = 100,
      since = null,
      includeMeta = true
    } = options;
    
    try {
      const logFile = path.join(this.logDir, 'bot.log');
      if (!fs.existsSync(logFile)) {
        return [];
      }
      
      const logs = [];
      const lines = fs.readFileSync(logFile, 'utf8').split('\n').filter(line => line.trim());
      
      for (const line of lines.slice(-limit)) {
        try {
          const logEntry = JSON.parse(line);
          
          // Фильтруем по уровню
          if (this.levels[logEntry.level] > this.levels[level]) {
            continue;
          }
          
          // Фильтруем по времени
          if (since && new Date(logEntry.timestamp) < new Date(since)) {
            continue;
          }
          
          // Формируем запись для Cursor
          const cursorEntry = {
            timestamp: logEntry.timestamp,
            level: logEntry.level,
            message: logEntry.message
          };
          
          if (includeMeta && logEntry.meta) {
            cursorEntry.meta = logEntry.meta;
          }
          
          logs.push(cursorEntry);
        } catch (parseError) {
          // Пропускаем некорректные строки
          continue;
        }
      }
      
      return logs;
    } catch (error) {
      this.error('Ошибка экспорта логов для Cursor', { error: error.message });
      return [];
    }
  }

  /**
   * Очистка старых логов
   */
  cleanup(daysToKeep = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const files = fs.readdirSync(this.logDir);
      let deletedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
      
      this.info(`Очистка логов завершена`, {
        deletedFiles: deletedCount,
        cutoffDate: cutoffDate.toISOString()
      });
      
      return deletedCount;
    } catch (error) {
      this.error('Ошибка очистки логов', { error: error.message });
      return 0;
    }
  }
}

// Создаем глобальный экземпляр логгера
const logger = new Logger({
  logLevel: process.env.LOG_LEVEL || 'info',
  logToFile: process.env.LOG_TO_FILE !== 'false',
  logToConsole: process.env.LOG_TO_CONSOLE !== 'false',
  logToCursor: process.env.LOG_TO_CURSOR !== 'false'
});

module.exports = logger;
