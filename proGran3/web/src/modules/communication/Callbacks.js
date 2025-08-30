// proGran3/web/src/modules/communication/Callbacks.js
// Модуль обробки зворотних викликів для ProGran3

import { Logger } from '../utils/Logger.js';

export class CallbackManager {
  constructor() {
    this.callbacks = new Map();
    this.eventListeners = new Map();
    this.asyncCallbacks = new Map();
    this.callbackHistory = [];
    this.maxHistorySize = 100;
  }

  // Реєстрація зворотного виклику
  registerCallback(callbackName, callbackFunction) {
    Logger.debug(`📝 Реєстрація зворотного виклику: ${callbackName}`, 'info');
    
    if (typeof callbackFunction !== 'function') {
      Logger.debug(`❌ Невірний тип зворотного виклику для ${callbackName}`, 'error');
      return false;
    }

    this.callbacks.set(callbackName, callbackFunction);
    Logger.debug(`✅ Зворотний виклик ${callbackName} зареєстровано`, 'success');
    return true;
  }

  // Виклик зворотного виклику
  invokeCallback(callbackName, ...args) {
    Logger.debug(`🔄 Виклик зворотного виклику: ${callbackName}(${args.join(', ')})`, 'info');
    
    const callback = this.callbacks.get(callbackName);
    if (!callback) {
      Logger.debug(`❌ Зворотний виклик ${callbackName} не знайдено`, 'error');
      return false;
    }

    try {
      const result = callback.apply(null, args);
      this.logCallbackExecution(callbackName, args, result);
      Logger.debug(`✅ Зворотний виклик ${callbackName} виконано успішно`, 'success');
      return result;
    } catch (error) {
      Logger.debug(`❌ Помилка виконання зворотного виклику ${callbackName}: ${error.message}`, 'error');
      this.logCallbackError(callbackName, args, error);
      return false;
    }
  }

  // Асинхронний зворотний виклик
  async invokeAsyncCallback(callbackName, ...args) {
    Logger.debug(`⏳ Асинхронний виклик: ${callbackName}(${args.join(', ')})`, 'info');
    
    const callback = this.callbacks.get(callbackName);
    if (!callback) {
      Logger.debug(`❌ Асинхронний зворотний виклик ${callbackName} не знайдено`, 'error');
      return false;
    }

    try {
      const result = await callback.apply(null, args);
      this.logCallbackExecution(callbackName, args, result);
      Logger.debug(`✅ Асинхронний зворотний виклик ${callbackName} виконано успішно`, 'success');
      return result;
    } catch (error) {
      Logger.debug(`❌ Помилка асинхронного зворотного виклику ${callbackName}: ${error.message}`, 'error');
      this.logCallbackError(callbackName, args, error);
      return false;
    }
  }

  // Видалення зворотного виклику
  unregisterCallback(callbackName) {
    Logger.debug(`🗑️ Видалення зворотного виклику: ${callbackName}`, 'info');
    
    const removed = this.callbacks.delete(callbackName);
    if (removed) {
      Logger.debug(`✅ Зворотний виклик ${callbackName} видалено`, 'success');
    } else {
      Logger.debug(`⚠️ Зворотний виклик ${callbackName} не знайдено для видалення`, 'warning');
    }
    
    return removed;
  }

  // Перевірка наявності зворотного виклику
  hasCallback(callbackName) {
    return this.callbacks.has(callbackName);
  }

  // Отримання зворотного виклику
  getCallback(callbackName) {
    return this.callbacks.get(callbackName);
  }

  // Реєстрація обробника подій
  addEventListener(eventName, handler) {
    Logger.debug(`👂 Реєстрація обробника події: ${eventName}`, 'info');
    
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    
    this.eventListeners.get(eventName).push(handler);
    Logger.debug(`✅ Обробник події ${eventName} додано`, 'success');
  }

  // Видалення обробника подій
  removeEventListener(eventName, handler) {
    Logger.debug(`👂 Видалення обробника події: ${eventName}`, 'info');
    
    const handlers = this.eventListeners.get(eventName);
    if (!handlers) {
      Logger.debug(`⚠️ Обробники події ${eventName} не знайдено`, 'warning');
      return false;
    }
    
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
      Logger.debug(`✅ Обробник події ${eventName} видалено`, 'success');
      return true;
    }
    
    Logger.debug(`⚠️ Обробник події ${eventName} не знайдено`, 'warning');
    return false;
  }

  // Виклик події
  dispatchEvent(eventName, eventData = {}) {
    Logger.debug(`📢 Виклик події: ${eventName}`, 'info');
    
    const handlers = this.eventListeners.get(eventName);
    if (!handlers || handlers.length === 0) {
      Logger.debug(`⚠️ Обробники події ${eventName} не знайдено`, 'warning');
      return false;
    }
    
    let successCount = 0;
    handlers.forEach((handler, index) => {
      try {
        handler(eventData);
        successCount++;
      } catch (error) {
        Logger.debug(`❌ Помилка обробника події ${eventName}[${index}]: ${error.message}`, 'error');
      }
    });
    
    Logger.debug(`✅ Подія ${eventName} оброблена (${successCount}/${handlers.length} успішно)`, 'success');
    return successCount > 0;
  }

  // Реєстрація асинхронного зворотного виклику
  registerAsyncCallback(callbackName, asyncFunction) {
    Logger.debug(`⏳ Реєстрація асинхронного зворотного виклику: ${callbackName}`, 'info');
    
    if (typeof asyncFunction !== 'function') {
      Logger.debug(`❌ Невірний тип асинхронного зворотного виклику для ${callbackName}`, 'error');
      return false;
    }

    this.asyncCallbacks.set(callbackName, asyncFunction);
    Logger.debug(`✅ Асинхронний зворотний виклик ${callbackName} зареєстровано`, 'success');
    return true;
  }

  // Виклик асинхронного зворотного виклику
  async invokeAsyncCallbackByName(callbackName, ...args) {
    Logger.debug(`⏳ Виклик асинхронного зворотного виклику: ${callbackName}`, 'info');
    
    const callback = this.asyncCallbacks.get(callbackName);
    if (!callback) {
      Logger.debug(`❌ Асинхронний зворотний виклик ${callbackName} не знайдено`, 'error');
      return false;
    }

    try {
      const result = await callback.apply(null, args);
      this.logCallbackExecution(callbackName, args, result);
      Logger.debug(`✅ Асинхронний зворотний виклик ${callbackName} виконано успішно`, 'success');
      return result;
    } catch (error) {
      Logger.debug(`❌ Помилка асинхронного зворотного виклику ${callbackName}: ${error.message}`, 'error');
      this.logCallbackError(callbackName, args, error);
      return false;
    }
  }

  // Логування виконання зворотного виклику
  logCallbackExecution(callbackName, args, result) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      callbackName,
      args,
      result,
      type: 'success'
    };
    
    this.callbackHistory.push(logEntry);
    this.trimHistory();
  }

  // Логування помилки зворотного виклику
  logCallbackError(callbackName, args, error) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      callbackName,
      args,
      error: error.message,
      type: 'error'
    };
    
    this.callbackHistory.push(logEntry);
    this.trimHistory();
  }

  // Обрізання історії до максимального розміру
  trimHistory() {
    if (this.callbackHistory.length > this.maxHistorySize) {
      this.callbackHistory = this.callbackHistory.slice(-this.maxHistorySize);
    }
  }

  // Отримання історії зворотних викликів
  getCallbackHistory(limit = 10) {
    return this.callbackHistory.slice(-limit);
  }

  // Очищення історії
  clearCallbackHistory() {
    this.callbackHistory = [];
    Logger.debug('🗑️ Історія зворотних викликів очищена', 'info');
  }

  // Отримання статистики
  getCallbackStats() {
    return {
      totalCallbacks: this.callbacks.size,
      totalAsyncCallbacks: this.asyncCallbacks.size,
      totalEventListeners: Array.from(this.eventListeners.values()).reduce((sum, handlers) => sum + handlers.length, 0),
      historySize: this.callbackHistory.length,
      registeredEvents: Array.from(this.eventListeners.keys())
    };
  }

  // Отримання списку всіх зворотних викликів
  getAllCallbacks() {
    return Array.from(this.callbacks.keys());
  }

  // Отримання списку всіх асинхронних зворотних викликів
  getAllAsyncCallbacks() {
    return Array.from(this.asyncCallbacks.keys());
  }

  // Отримання списку всіх подій
  getAllEvents() {
    return Array.from(this.eventListeners.keys());
  }

  // Масове виконання зворотних викликів
  invokeMultipleCallbacks(callbackNames, ...args) {
    Logger.debug(`🔄 Масовий виклик зворотних викликів: ${callbackNames.join(', ')}`, 'info');
    
    const results = {};
    let successCount = 0;
    
    callbackNames.forEach(callbackName => {
      try {
        const result = this.invokeCallback(callbackName, ...args);
        results[callbackName] = result;
        if (result !== false) successCount++;
      } catch (error) {
        results[callbackName] = false;
        Logger.debug(`❌ Помилка масового виклику ${callbackName}: ${error.message}`, 'error');
      }
    });
    
    Logger.debug(`✅ Масовий виклик завершено (${successCount}/${callbackNames.length} успішно)`, 'success');
    return results;
  }

  // Скидання всіх зворотних викликів
  reset() {
    this.callbacks.clear();
    this.asyncCallbacks.clear();
    this.eventListeners.clear();
    this.callbackHistory = [];
    Logger.debug('🔄 Всі зворотні виклики скинуто', 'info');
  }
}

// Глобальний екземпляр
const callbackManager = new CallbackManager();

// Експорт глобальних функцій для зворотної сумісності
export function registerCallback(callbackName, callbackFunction) {
  return callbackManager.registerCallback(callbackName, callbackFunction);
}

export function invokeCallback(callbackName, ...args) {
  return callbackManager.invokeCallback(callbackName, ...args);
}

export function invokeAsyncCallback(callbackName, ...args) {
  return callbackManager.invokeAsyncCallback(callbackName, ...args);
}

export function unregisterCallback(callbackName) {
  return callbackManager.unregisterCallback(callbackName);
}

export function hasCallback(callbackName) {
  return callbackManager.hasCallback(callbackName);
}

export function getCallback(callbackName) {
  return callbackManager.getCallback(callbackName);
}

export function addEventListener(eventName, handler) {
  return callbackManager.addEventListener(eventName, handler);
}

export function removeEventListener(eventName, handler) {
  return callbackManager.removeEventListener(eventName, handler);
}

export function dispatchEvent(eventName, eventData) {
  return callbackManager.dispatchEvent(eventName, eventData);
}

export function registerAsyncCallback(callbackName, asyncFunction) {
  return callbackManager.registerAsyncCallback(callbackName, asyncFunction);
}

export function invokeAsyncCallbackByName(callbackName, ...args) {
  return callbackManager.invokeAsyncCallbackByName(callbackName, ...args);
}

export function getCallbackHistory(limit) {
  return callbackManager.getCallbackHistory(limit);
}

export function clearCallbackHistory() {
  return callbackManager.clearCallbackHistory();
}

export function getCallbackStats() {
  return callbackManager.getCallbackStats();
}

export function getAllCallbacks() {
  return callbackManager.getAllCallbacks();
}

export function getAllAsyncCallbacks() {
  return callbackManager.getAllAsyncCallbacks();
}

export function getAllEvents() {
  return callbackManager.getAllEvents();
}

export function invokeMultipleCallbacks(callbackNames, ...args) {
  return callbackManager.invokeMultipleCallbacks(callbackNames, ...args);
}

export function resetCallbacks() {
  return callbackManager.reset();
}
