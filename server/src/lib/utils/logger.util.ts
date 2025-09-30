// Структуроване логування
export class Logger {
  static info(message: string, context?: any) {
    console.log(JSON.stringify({
      level: 'info',
      message,
      context,
      timestamp: new Date().toISOString(),
      service: 'progran3-tracking-server'
    }));
  }
  
  static error(message: string, error?: Error, context?: any) {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error?.stack,
      context,
      timestamp: new Date().toISOString(),
      service: 'progran3-tracking-server'
    }));
  }
  
  static warn(message: string, context?: any) {
    console.warn(JSON.stringify({
      level: 'warn',
      message,
      context,
      timestamp: new Date().toISOString(),
      service: 'progran3-tracking-server'
    }));
  }
  
  static debug(message: string, context?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(JSON.stringify({
        level: 'debug',
        message,
        context,
        timestamp: new Date().toISOString(),
        service: 'progran3-tracking-server'
      }));
    }
  }
}
