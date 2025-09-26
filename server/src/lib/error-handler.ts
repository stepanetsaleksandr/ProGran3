import { NextResponse } from 'next/server';
import { SecureLogger } from './secure-logger';

// Типи помилок
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  LICENSE_ERROR = 'LICENSE_ERROR',
  PLUGIN_ERROR = 'PLUGIN_ERROR'
}

// Коди помилок
export enum ErrorCode {
  MISSING_FIELD = 'MISSING_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  LICENSE_NOT_FOUND = 'LICENSE_NOT_FOUND',
  LICENSE_EXPIRED = 'LICENSE_EXPIRED',
  LICENSE_BLOCKED = 'LICENSE_BLOCKED',
  MAX_ACTIVATIONS_EXCEEDED = 'MAX_ACTIVATIONS_EXCEEDED',
  PLUGIN_BLOCKED = 'PLUGIN_BLOCKED',
  DATABASE_CONNECTION_FAILED = 'DATABASE_CONNECTION_FAILED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'
}

// Інтерфейс помилки
export interface AppError {
  type: ErrorType;
  code: ErrorCode;
  message: string;
  details?: any;
  timestamp: string;
  requestId?: string;
}

// Клас для обробки помилок
export class ErrorHandler {
  private static requestId = 0;

  /**
   * Створює унікальний ID запиту
   */
  private static generateRequestId(): string {
    return `req_${++this.requestId}_${Date.now()}`;
  }

  /**
   * Обробляє помилку та повертає відповідь
   */
  static handle(error: any, context: string = 'UNKNOWN'): NextResponse {
    const requestId = this.generateRequestId();
    const timestamp = new Date().toISOString();
    
    // Логуємо помилку
    SecureLogger.error({
      error: error.message || error,
      context,
      requestId,
      timestamp,
      stack: error.stack
    }, 'ERROR_HANDLER');

    // Визначаємо тип помилки
    const appError = this.classifyError(error);
    appError.requestId = requestId;
    appError.timestamp = timestamp;

    // Повертаємо відповідь
    return this.createErrorResponse(appError);
  }

  /**
   * Класифікує помилку
   */
  private static classifyError(error: any): AppError {
    // Валідаційні помилки
    if (error.message?.includes('Missing required field') || 
        error.message?.includes('Invalid format') ||
        error.message?.includes('validation')) {
      return {
        type: ErrorType.VALIDATION_ERROR,
        code: ErrorCode.MISSING_FIELD,
        message: error.message || 'Validation error',
        details: error.details,
        timestamp: new Date().toISOString()
      };
    }

    // Помилки ліцензії
    if (error.message?.includes('license') || 
        error.message?.includes('License')) {
      if (error.message.includes('not found')) {
        return {
          type: ErrorType.LICENSE_ERROR,
          code: ErrorCode.LICENSE_NOT_FOUND,
          message: 'License not found or inactive',
          details: error.details,
          timestamp: new Date().toISOString()
        };
      }
      if (error.message.includes('expired')) {
        return {
          type: ErrorType.LICENSE_ERROR,
          code: ErrorCode.LICENSE_EXPIRED,
          message: 'License has expired',
          details: error.details,
          timestamp: new Date().toISOString()
        };
      }
      if (error.message.includes('blocked')) {
        return {
          type: ErrorType.LICENSE_ERROR,
          code: ErrorCode.LICENSE_BLOCKED,
          message: 'License is blocked',
          details: error.details,
          timestamp: new Date().toISOString()
        };
      }
      if (error.message.includes('activations')) {
        return {
          type: ErrorType.LICENSE_ERROR,
          code: ErrorCode.MAX_ACTIVATIONS_EXCEEDED,
          message: 'Maximum activations exceeded',
          details: error.details,
          timestamp: new Date().toISOString()
        };
      }
    }

    // Помилки плагіна
    if (error.message?.includes('plugin') || 
        error.message?.includes('Plugin')) {
      return {
        type: ErrorType.PLUGIN_ERROR,
        code: ErrorCode.PLUGIN_BLOCKED,
        message: 'Plugin is blocked',
        details: error.details,
        timestamp: new Date().toISOString()
      };
    }

    // Помилки бази даних
    if (error.message?.includes('database') || 
        error.message?.includes('Database') ||
        error.message?.includes('connection')) {
      return {
        type: ErrorType.DATABASE_ERROR,
        code: ErrorCode.DATABASE_CONNECTION_FAILED,
        message: 'Database connection failed',
        details: error.details,
        timestamp: new Date().toISOString()
      };
    }

    // Rate limiting
    if (error.message?.includes('Too Many Requests') ||
        error.message?.includes('rate limit')) {
      return {
        type: ErrorType.RATE_LIMIT_ERROR,
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
        message: 'Too many requests',
        details: error.details,
        timestamp: new Date().toISOString()
      };
    }

    // За замовчуванням - внутрішня помилка
    return {
      type: ErrorType.INTERNAL_ERROR,
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: process.env.NODE_ENV === 'development' 
        ? error.message || 'Internal server error'
        : 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.details : undefined,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Створює відповідь з помилкою
   */
  private static createErrorResponse(appError: AppError): NextResponse {
    const statusCode = this.getStatusCode(appError.type);
    
    const response = NextResponse.json({
      success: false,
      error: appError.message,
      code: appError.code,
      type: appError.type,
      requestId: appError.requestId,
      timestamp: appError.timestamp,
      ...(appError.details && { details: appError.details })
    }, { status: statusCode });

    // Додаємо заголовки
    response.headers.set('X-Request-ID', appError.requestId || '');
    response.headers.set('X-Error-Type', appError.type);
    response.headers.set('X-Error-Code', appError.code);

    return response;
  }

  /**
   * Визначає HTTP статус код за типом помилки
   */
  private static getStatusCode(errorType: ErrorType): number {
    switch (errorType) {
      case ErrorType.VALIDATION_ERROR:
        return 400;
      case ErrorType.AUTHENTICATION_ERROR:
        return 401;
      case ErrorType.AUTHORIZATION_ERROR:
        return 403;
      case ErrorType.RATE_LIMIT_ERROR:
        return 429;
      case ErrorType.LICENSE_ERROR:
        return 400;
      case ErrorType.PLUGIN_ERROR:
        return 403;
      case ErrorType.DATABASE_ERROR:
        return 503;
      case ErrorType.NETWORK_ERROR:
        return 502;
      case ErrorType.INTERNAL_ERROR:
      default:
        return 500;
    }
  }

  /**
   * Валідує обов'язкові поля
   */
  static validateRequiredFields(data: any, requiredFields: string[]): void {
    const missingFields: string[] = [];
    
    for (const field of requiredFields) {
      if (!data[field] || String(data[field]).trim() === '') {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Валідує формат plugin_id
   */
  static validatePluginId(pluginId: string): void {
    if (!pluginId.match(/^progran3-[a-z0-9-]+$/)) {
      throw new Error('Invalid plugin_id format. Must be: progran3-{hostname}-{username}');
    }
  }

  /**
   * Валідує email
   */
  static validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
  }

  /**
   * Валідує license key
   */
  static validateLicenseKey(licenseKey: string): void {
    const licenseKeyRegex = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    if (!licenseKeyRegex.test(licenseKey)) {
      throw new Error('Invalid license key format. Must be: ABCD-EFGH-IJKL-MNOP');
    }
  }

  /**
   * Валідує timestamp
   */
  static validateTimestamp(timestamp: string): void {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid timestamp format. Must be ISO 8601');
    }
  }

  /**
   * Безпечно обробляє async функції
   */
  static async safeExecute<T>(
    fn: () => Promise<T>,
    context: string = 'UNKNOWN'
  ): Promise<{ success: boolean; data?: T; error?: AppError }> {
    try {
      const data = await fn();
      return { success: true, data };
    } catch (error) {
      const appError = this.classifyError(error);
      SecureLogger.error({ error, context }, 'SAFE_EXECUTE');
      return { success: false, error: appError };
    }
  }
}
