import { Injectable, LoggerService, LogLevel } from '@nestjs/common';
import { Logger, SeverityNumber } from '@opentelemetry/api-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { LoggerProvider, SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs';

const logExporter = new OTLPLogExporter({
  url: 'http://localhost:4318/v1/logs', // Đổi endpoint nếu cần
});

@Injectable()
export class OTLPLogger implements LoggerService {
  private logger: Logger;
  private loggerProvider: LoggerProvider;

  constructor() {
    this.initializeLogger();
  }

  private initializeLogger() {
    // Create logger provider
    this.loggerProvider = new LoggerProvider({
      resource: resourceFromAttributes({
        'service.name': 'auth-service',
      }),
    });

    // Add the OTLP exporter to the logger provider
    this.loggerProvider.addLogRecordProcessor(new SimpleLogRecordProcessor(logExporter));

    // Get a logger instance
    this.logger = this.loggerProvider.getLogger('nestjs-logger', '1.0.0');
  }

  private getSeverityNumber(level: string): SeverityNumber {
    switch (level.toLowerCase()) {
      case 'error':
        return SeverityNumber.ERROR;
      case 'warn':
        return SeverityNumber.WARN;
      case 'log':
      case 'info':
        return SeverityNumber.INFO;
      case 'debug':
        return SeverityNumber.DEBUG;
      case 'verbose':
        return SeverityNumber.TRACE;
      default:
        return SeverityNumber.INFO;
    }
  }

  private emitLogRecord(level: string, message: any, context?: string, trace?: string) {
    const timestamp = Date.now();
    const body = typeof message === 'string' ? message : JSON.stringify(message);

    this.logger.emit({
      timestamp,
      severityNumber: this.getSeverityNumber(level),
      severityText: level.toUpperCase(),
      body,
      attributes: {
        'log.level': level,
        'service.context': context || 'Application',
        ...(trace && { 'log.trace': trace }),
        timestamp: new Date(timestamp).toISOString(),
      },
    });
  }

  log(message: any, context?: string) {
    this.emitLogRecord('info', message, context);
    // Also log to console for development
    console.log(`[${context || 'LOG'}] ${message}`);
  }

  error(message: any, trace?: string, context?: string) {
    this.emitLogRecord('error', message, context, trace);
    console.error(`[${context || 'ERROR'}] ${message}`, trace || '');
  }

  warn(message: any, context?: string) {
    this.emitLogRecord('warn', message, context);
    console.warn(`[${context || 'WARN'}] ${message}`);
  }

  debug(message: any, context?: string) {
    this.emitLogRecord('debug', message, context);
    console.debug(`[${context || 'DEBUG'}] ${message}`);
  }

  verbose(message: any, context?: string) {
    this.emitLogRecord('verbose', message, context);
    console.log(`[${context || 'VERBOSE'}] ${message}`);
  }

  setLogLevels(levels: LogLevel[]) {
    // Implementation for setting log levels if needed
  }

  async shutdown() {
    await this.loggerProvider.shutdown();
  }
}
