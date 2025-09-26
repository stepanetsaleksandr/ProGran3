// Безпечне логування - приховуємо sensitive дані
export class SecureLogger {
  private static readonly SENSITIVE_FIELDS = [
    'license_key',
    'password',
    'token',
    'secret',
    'key',
    'authorization',
    'cookie',
    'session',
    'api_key',
    'private_key',
    'access_token',
    'refresh_token'
  ];

  private static readonly SENSITIVE_PATTERNS = [
    /password/i,
    /secret/i,
    /token/i,
    /key/i,
    /auth/i,
    /credential/i,
    /private/i
  ];

  /**
   * Безпечно логує об'єкт, приховуючи sensitive дані
   */
  static log(data: any, context: string = 'APP'): void {
    const sanitizedData = this.sanitizeData(data);
    console.log(`[${context}] ${JSON.stringify(sanitizedData, null, 2)}`);
  }

  /**
   * Безпечно логує помилку
   */
  static error(error: Error | any, context: string = 'ERROR'): void {
    const sanitizedError = this.sanitizeError(error);
    console.error(`[${context}] ${JSON.stringify(sanitizedError, null, 2)}`);
  }

  /**
   * Безпечно логує попередження
   */
  static warn(message: string, data?: any, context: string = 'WARN'): void {
    const sanitizedData = data ? this.sanitizeData(data) : undefined;
    console.warn(`[${context}] ${message}`, sanitizedData ? JSON.stringify(sanitizedData, null, 2) : '');
  }

  /**
   * Безпечно логує інформацію
   */
  static info(message: string, data?: any, context: string = 'INFO'): void {
    const sanitizedData = data ? this.sanitizeData(data) : undefined;
    console.info(`[${context}] ${message}`, sanitizedData ? JSON.stringify(sanitizedData, null, 2) : '');
  }

  /**
   * Очищає sensitive дані з об'єкта
   */
  private static sanitizeData(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data === 'string') {
      return this.sanitizeString(data);
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }

    if (typeof data === 'object') {
      const sanitized: any = {};
      
      for (const [key, value] of Object.entries(data)) {
        if (this.isSensitiveField(key)) {
          sanitized[key] = this.maskSensitiveValue(value);
        } else {
          sanitized[key] = this.sanitizeData(value);
        }
      }
      
      return sanitized;
    }

    return data;
  }

  /**
   * Очищає sensitive дані з помилки
   */
  private static sanitizeError(error: any): any {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: this.sanitizeString(error.message),
        stack: process.env.NODE_ENV === 'development' ? error.stack : '[HIDDEN]'
      };
    }

    return this.sanitizeData(error);
  }

  /**
   * Очищає sensitive дані з рядка
   */
  private static sanitizeString(str: string): string {
    if (!str || typeof str !== 'string') {
      return str;
    }

    // Маскуємо license keys (формат: ABCD-EFGH-IJKL-MNOP)
    str = str.replace(/\b[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}\b/g, '****-****-****-****');
    
    // Маскуємо email адреси
    str = str.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '***@***.***');
    
    // Маскуємо IP адреси
    str = str.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '***.***.***.***');
    
    // Маскуємо MAC адреси
    str = str.replace(/\b([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})\b/g, '**:**:**:**:**:**');
    
    return str;
  }

  /**
   * Перевіряє чи поле є sensitive
   */
  private static isSensitiveField(fieldName: string): boolean {
    const lowerFieldName = fieldName.toLowerCase();
    
    // Перевіряємо точні збіги
    if (this.SENSITIVE_FIELDS.includes(lowerFieldName)) {
      return true;
    }
    
    // Перевіряємо паттерни
    return this.SENSITIVE_PATTERNS.some(pattern => pattern.test(fieldName));
  }

  /**
   * Маскує sensitive значення
   */
  private static maskSensitiveValue(value: any): string {
    if (value === null || value === undefined) {
      return '[NULL]';
    }

    if (typeof value === 'string') {
      if (value.length <= 4) {
        return '*'.repeat(value.length);
      }
      
      // Для license keys показуємо перші 4 символи
      if (/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(value)) {
        return value.substring(0, 4) + '-****-****-****';
      }
      
      // Для інших рядків показуємо перші 2 символи
      return value.substring(0, 2) + '*'.repeat(Math.max(4, value.length - 2));
    }

    if (typeof value === 'number') {
      return '[NUMBER]';
    }

    if (typeof value === 'boolean') {
      return '[BOOLEAN]';
    }

    if (Array.isArray(value)) {
      return `[ARRAY:${value.length}]`;
    }

    if (typeof value === 'object') {
      return '[OBJECT]';
    }

    return '[MASKED]';
  }

  /**
   * Логує heartbeat без sensitive даних
   */
  static logHeartbeat(data: any): void {
    const sanitized = {
      plugin_id: data.plugin_id,
      plugin_name: data.plugin_name,
      version: data.version,
      user_id: this.sanitizeString(data.user_id),
      computer_name: this.sanitizeString(data.computer_name),
      timestamp: data.timestamp,
      action: data.action,
      has_license_info: !!data.license_info,
      license_info: data.license_info ? {
        email: this.sanitizeString(data.license_info.email),
        license_key: this.maskSensitiveValue(data.license_info.license_key),
        hardware_id: this.sanitizeString(data.license_info.hardware_id)
      } : null
    };
    
    this.log(sanitized, 'HEARTBEAT');
  }

  /**
   * Логує реєстрацію ліцензії без sensitive даних
   */
  static logLicenseRegistration(data: any): void {
    const sanitized = {
      email: this.sanitizeString(data.email),
      license_key: this.maskSensitiveValue(data.license_key),
      hardware_id: this.sanitizeString(data.hardware_id),
      timestamp: new Date().toISOString()
    };
    
    this.log(sanitized, 'LICENSE_REGISTRATION');
  }
}
