/**
 * Маршруты для работы с логами VK бота
 * Предоставляет API для просмотра логов в Cursor
 */

const logger = require('../utils/logger');
const CursorIntegration = require('../utils/cursorIntegration');

class LogRoutes {
  constructor(cursorIntegration) {
    this.cursorIntegration = cursorIntegration;
  }

  /**
   * Обработка маршрутов логов
   */
  handleLogRoutes(event, context) {
    const { httpMethod, path } = event;
    
    // Парсим путь
    const pathParts = path.split('/').filter(part => part);
    
    // Маршрут: /logs
    if (pathParts[0] === 'logs') {
      return this.handleLogsEndpoint(event, context, pathParts);
    }
    
    // Маршрут: /logs/stats
    if (pathParts[0] === 'logs' && pathParts[1] === 'stats') {
      return this.handleStatsEndpoint(event, context);
    }
    
    // Маршрут: /logs/export
    if (pathParts[0] === 'logs' && pathParts[1] === 'export') {
      return this.handleExportEndpoint(event, context);
    }
    
    // Маршрут: /logs/errors
    if (pathParts[0] === 'logs' && pathParts[1] === 'errors') {
      return this.handleErrorsEndpoint(event, context);
    }
    
    // Маршрут: /logs/performance
    if (pathParts[0] === 'logs' && pathParts[1] === 'performance') {
      return this.handlePerformanceEndpoint(event, context);
    }
    
    // Маршрут: /logs/cleanup
    if (pathParts[0] === 'logs' && pathParts[1] === 'cleanup') {
      return this.handleCleanupEndpoint(event, context);
    }
    
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Log endpoint not found' })
    };
  }

  /**
   * Основной эндпоинт логов
   */
  handleLogsEndpoint(event, context, pathParts) {
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    try {
      const queryParams = this.parseQueryParams(event.queryStringParameters || {});
      
      const logs = logger.exportForCursor({
        level: queryParams.level || 'info',
        limit: parseInt(queryParams.limit) || 100,
        since: queryParams.since,
        includeMeta: queryParams.includeMeta !== 'false'
      });

      logger.info('Logs endpoint accessed', { 
        level: queryParams.level,
        limit: queryParams.limit,
        logsCount: logs.length 
      });

      return {
        statusCode: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: JSON.stringify({
          success: true,
          data: {
            logs,
            total: logs.length,
            level: queryParams.level,
            limit: queryParams.limit,
            timestamp: new Date().toISOString()
          }
        })
      };
    } catch (error) {
      logger.error('Error in logs endpoint', { error: error.message });
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Internal server error' })
      };
    }
  }

  /**
   * Эндпоинт статистики
   */
  handleStatsEndpoint(event, context) {
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    try {
      const stats = logger.getStats();
      
      logger.info('Stats endpoint accessed', { stats });

      return {
        statusCode: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          data: {
            stats,
            timestamp: new Date().toISOString()
          }
        })
      };
    } catch (error) {
      logger.error('Error in stats endpoint', { error: error.message });
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Internal server error' })
      };
    }
  }

  /**
   * Эндпоинт экспорта логов
   */
  handleExportEndpoint(event, context) {
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    try {
      const queryParams = this.parseQueryParams(event.queryStringParameters || {});
      const format = queryParams.format || 'json';
      
      let exportData;
      let contentType;
      
      if (format === 'json') {
        exportData = logger.exportForCursor({
          level: queryParams.level || 'debug',
          limit: parseInt(queryParams.limit) || 5000,
          since: queryParams.since,
          includeMeta: true
        });
        contentType = 'application/json';
      } else if (format === 'csv') {
        exportData = this.exportToCSV(logger.exportForCursor({
          level: queryParams.level || 'info',
          limit: parseInt(queryParams.limit) || 1000,
          since: queryParams.since,
          includeMeta: false
        }));
        contentType = 'text/csv';
      } else {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Unsupported format. Use json or csv.' })
        };
      }

      logger.info('Export endpoint accessed', { 
        format,
        level: queryParams.level,
        limit: queryParams.limit,
        dataSize: exportData.length 
      });

      return {
        statusCode: 200,
        headers: { 
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'Content-Disposition': `attachment; filename="vk-bot-logs-${new Date().toISOString().split('T')[0]}.${format}"`
        },
        body: format === 'json' ? JSON.stringify(exportData, null, 2) : exportData
      };
    } catch (error) {
      logger.error('Error in export endpoint', { error: error.message });
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Internal server error' })
      };
    }
  }

  /**
   * Эндпоинт ошибок
   */
  handleErrorsEndpoint(event, context) {
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    try {
      const stats = logger.getStats();
      const errors = stats.errors || [];
      
      const queryParams = this.parseQueryParams(event.queryStringParameters || {});
      const limit = parseInt(queryParams.limit) || 50;
      
      const recentErrors = errors.slice(-limit);

      logger.info('Errors endpoint accessed', { 
        totalErrors: errors.length,
        returnedErrors: recentErrors.length 
      });

      return {
        statusCode: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          data: {
            errors: recentErrors,
            total: errors.length,
            returned: recentErrors.length,
            timestamp: new Date().toISOString()
          }
        })
      };
    } catch (error) {
      logger.error('Error in errors endpoint', { error: error.message });
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Internal server error' })
      };
    }
  }

  /**
   * Эндпоинт производительности
   */
  handlePerformanceEndpoint(event, context) {
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    try {
      const memory = process.memoryUsage();
      const uptime = process.uptime();
      const stats = logger.getStats();
      
      const performanceData = {
        system: {
          uptime: Math.floor(uptime),
          uptimeFormatted: this.formatUptime(uptime),
          memory: {
            used: Math.round(memory.heapUsed / 1024 / 1024),
            total: Math.round(memory.heapTotal / 1024 / 1024),
            percentage: Math.round((memory.heapUsed / memory.heapTotal) * 100),
            external: Math.round(memory.external / 1024 / 1024),
            rss: Math.round(memory.rss / 1024 / 1024)
          }
        },
        logs: {
          total: stats.total,
          byLevel: stats.byLevel,
          byHour: stats.byHour,
          errors: stats.errors?.length || 0
        },
        cursor: {
          isRunning: this.cursorIntegration?.isRunning || false,
          updateInterval: this.cursorIntegration?.updateInterval || 0
        }
      };

      logger.info('Performance endpoint accessed', { performanceData });

      return {
        statusCode: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          data: {
            performance: performanceData,
            timestamp: new Date().toISOString()
          }
        })
      };
    } catch (error) {
      logger.error('Error in performance endpoint', { error: error.message });
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Internal server error' })
      };
    }
  }

  /**
   * Эндпоинт очистки логов
   */
  handleCleanupEndpoint(event, context) {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    try {
      const queryParams = this.parseQueryParams(event.queryStringParameters || {});
      const daysToKeep = parseInt(queryParams.days) || 7;
      
      const deletedCount = logger.cleanup(daysToKeep);

      logger.info('Cleanup endpoint accessed', { 
        daysToKeep,
        deletedFiles: deletedCount 
      });

      return {
        statusCode: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          data: {
            deletedFiles: deletedCount,
            daysToKeep,
            timestamp: new Date().toISOString()
          }
        })
      };
    } catch (error) {
      logger.error('Error in cleanup endpoint', { error: error.message });
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Internal server error' })
      };
    }
  }

  /**
   * Парсинг query параметров
   */
  parseQueryParams(queryStringParameters) {
    const params = {};
    
    for (const [key, value] of Object.entries(queryStringParameters)) {
      if (value === 'true') {
        params[key] = true;
      } else if (value === 'false') {
        params[key] = false;
      } else if (!isNaN(value)) {
        params[key] = parseFloat(value);
      } else {
        params[key] = value;
      }
    }
    
    return params;
  }

  /**
   * Экспорт в CSV формат
   */
  exportToCSV(logs) {
    if (logs.length === 0) {
      return 'timestamp,level,message\n';
    }
    
    const headers = ['timestamp', 'level', 'message'];
    const csvLines = [headers.join(',')];
    
    for (const log of logs) {
      const row = [
        log.timestamp,
        log.level,
        `"${log.message.replace(/"/g, '""')}"`
      ];
      csvLines.push(row.join(','));
    }
    
    return csvLines.join('\n');
  }

  /**
   * Форматирование времени работы
   */
  formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${hours}ч ${minutes}м ${secs}с`;
  }
}

module.exports = LogRoutes;
