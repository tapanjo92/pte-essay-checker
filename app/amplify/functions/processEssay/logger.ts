import * as AWSXRay from 'aws-xray-sdk-core';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export interface LogContext {
  essayId?: string;
  userId?: string;
  operation?: string;
  duration?: number;
  [key: string]: any;
}

class StructuredLogger {
  private serviceName: string;
  private environment: string;

  constructor() {
    this.serviceName = 'pte-essay-processor';
    this.environment = process.env.ENVIRONMENT || 'development';
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      environment: this.environment,
      message,
      ...context,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      })
    };

    // Output as JSON for CloudWatch Insights
    console.log(JSON.stringify(logEntry));

    // Add to X-Ray if available
    const segment = AWSXRay.getSegment();
    if (segment) {
      segment.addMetadata('log', logEntry);
      if (error) {
        segment.addError(error);
      }
    }
  }

  debug(message: string, context?: LogContext) {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error: Error, context?: LogContext) {
    this.log(LogLevel.ERROR, message, context, error);
  }

  // Performance logging
  startTimer(operation: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.info(`Operation completed: ${operation}`, { operation, duration });
    };
  }
}

export const logger = new StructuredLogger();