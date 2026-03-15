import fs from 'fs/promises';
import path from 'path';

class Logger {
  constructor(options = {}) {
    this.level = options.level || 'info';
    this.logFile = options.logFile || path.join(process.cwd(), 'logs', 'app.log');
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024;
    this.maxFiles = options.maxFiles || 5;
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };

    this.ensureLogDirectory();
  }

  async ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    try {
      await fs.mkdir(logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  shouldLog(level) {
    return this.levels[level] <= this.levels[this.level];
  }

  async writeToFile(entry) {
    try {
      await fs.appendFile(this.logFile, entry + '\n', 'utf8');
      
      const stats = await fs.stat(this.logFile).catch(() => ({ size: 0 }));
      if (stats.size > this.maxFileSize) {
        await this.rotateLogs();
      }
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  async rotateLogs() {
    for (let i = this.maxFiles - 1; i > 0; i--) {
      const oldFile = `${this.logFile}.${i}`;
      const newFile = `${this.logFile}.${i + 1}`;
      
      try {
        await fs.rename(oldFile, newFile);
      } catch (error) {
      }
    }

    try {
      await fs.rename(this.logFile, `${this.logFile}.1`);
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  formatEntry(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const requestId = meta.requestId || 'system';
    const entry = {
      timestamp,
      level: level.toUpperCase(),
      requestId,
      message,
      ...meta
    };

    return JSON.stringify(entry);
  }

  log(level, message, meta = {}) {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry = this.formatEntry(level, message, meta);
    const consoleMessage = `${entry}`;

    switch (level) {
      case 'error':
        console.error(consoleMessage);
        break;
      case 'warn':
        console.warn(consoleMessage);
        break;
      case 'info':
        console.info(consoleMessage);
        break;
      case 'debug':
        console.debug(consoleMessage);
        break;
      default:
        console.log(consoleMessage);
    }

    this.writeToFile(entry);
  }

  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  request(request, response, duration) {
    const meta = {
      requestId: request.requestId,
      method: request.method,
      url: request.url,
      statusCode: response.statusCode,
      duration,
      userAgent: request.headers['user-agent'],
      ip: request.headers['x-forwarded-for'] || request.connection.remoteAddress
    };

    let level = 'info';
    if (response.statusCode >= 500) {
      level = 'error';
    } else if (response.statusCode >= 400) {
      level = 'warn';
    }

    this.log(level, `${request.method} ${request.url} ${response.statusCode} ${duration}ms`, meta);
  }

  generationStart(projectId, design) {
    this.info('Generation started', {
      projectId,
      designDescription: design.description?.substring(0, 200),
      designName: design.name
    });
  }

  generationComplete(projectId, result) {
    this.info('Generation completed', {
      projectId,
      success: result.success,
      fileCount: result.files?.length,
      totalSize: result.totalSize
    });
  }

  generationError(projectId, error) {
    this.error('Generation failed', {
      projectId,
      error: error.message,
      stack: error.stack
    });
  }

  opencodeEvent(event, data) {
    this.debug(`OpenCode: ${event}`, data);
  }

  tempManagerEvent(event, data) {
    this.debug(`TempManager: ${event}`, data);
  }
}

const defaultLogger = new Logger({
  level: process.env.LOG_LEVEL || 'info',
  logFile: process.env.LOG_FILE || path.join(process.cwd(), 'logs', 'app.log')
});

export { Logger, defaultLogger };