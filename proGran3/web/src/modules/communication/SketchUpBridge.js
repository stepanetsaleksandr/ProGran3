// proGran3/web/src/modules/communication/SketchUpBridge.js
// Модуль комунікації з SketchUp для ProGran3

import { Logger } from '../utils/Logger.js';

export class SketchUpBridge {
  constructor() {
    this.isConnected = false;
    this.connectionRetries = 0;
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.callbackQueue = [];
    this.responseHandlers = new Map();
  }

  // Ініціалізація з'єднання з SketchUp
  initialize() {
    Logger.debug('🔗 Ініціалізація з\'єднання з SketchUp', 'info');
    
    try {
      // Перевіряємо наявність об'єкта SketchUp
      if (typeof window.sketchup === 'undefined') {
        Logger.debug('⚠️ Об\'єкт window.sketchup не знайдено', 'warning');
        this.scheduleRetry();
        return false;
      }

      // Перевіряємо основні методи
      const requiredMethods = [
        'get_models',
        'add_foundation',
        'add_blind_area_uniform',
        'add_blind_area_custom',
        'add_tiling_uniform',
        'add_tiling_custom',
        'add_cladding_uniform',
        'add_cladding_custom',
        'add_stand',
        'add_stele',
        'add_flowerbed'
      ];

      const missingMethods = requiredMethods.filter(method => 
        typeof window.sketchup[method] !== 'function'
      );

      if (missingMethods.length > 0) {
        Logger.debug(`⚠️ Відсутні методи SketchUp: ${missingMethods.join(', ')}`, 'warning');
        this.scheduleRetry();
        return false;
      }

      this.isConnected = true;
      this.connectionRetries = 0;
      
             Logger.debug('✅ З\'єднання з SketchUp встановлено', 'success');
       this.processCallbackQueue();
      
      return true;
      
    } catch (error) {
      Logger.debug(`❌ Помилка ініціалізації SketchUp: ${error.message}`, 'error');
      this.scheduleRetry();
      return false;
    }
  }

  // Планування повторної спроби підключення
  scheduleRetry() {
    if (this.connectionRetries < this.maxRetries) {
      this.connectionRetries++;
      Logger.debug(`🔄 Спроба підключення ${this.connectionRetries}/${this.maxRetries} через ${this.retryDelay}мс`, 'info');
      
      setTimeout(() => {
        this.initialize();
      }, this.retryDelay);
    } else {
      Logger.debug('❌ Досягнуто максимальну кількість спроб підключення', 'error');
    }
  }

  // Перевірка з'єднання
  isBridgeConnected() {
    return this.isConnected && typeof window.sketchup !== 'undefined';
  }

  // Безпечний виклик методу SketchUp
  callSketchUpMethod(methodName, ...args) {
    Logger.debug(`📞 Виклик SketchUp: ${methodName}(${args.join(', ')})`, 'info');
    
    if (!this.isBridgeConnected()) {
      Logger.debug(`❌ SketchUp не підключений для виклику ${methodName}`, 'error');
      return Promise.reject(new Error('SketchUp не підключений'));
    }

    try {
      const method = window.sketchup[methodName];
      if (typeof method !== 'function') {
        Logger.debug(`❌ Метод ${methodName} не знайдено в SketchUp`, 'error');
        return Promise.reject(new Error(`Метод ${methodName} не знайдено`));
      }

      const result = method.apply(window.sketchup, args);
      Logger.debug(`✅ SketchUp ${methodName} виконано успішно`, 'success');
      
      return Promise.resolve(result);
      
    } catch (error) {
      Logger.debug(`❌ Помилка виклику SketchUp ${methodName}: ${error.message}`, 'error');
      return Promise.reject(error);
    }
  }

  // Отримання моделей з SketchUp
  getModels(modelType) {
    return this.callSketchUpMethod('get_models', modelType)
      .then(models => {
        Logger.debug(`📦 Отримано ${models?.length || 0} моделей типу ${modelType}`, 'success');
        return models || [];
      })
      .catch(error => {
        Logger.debug(`❌ Помилка отримання моделей ${modelType}: ${error.message}`, 'error');
        return [];
      });
  }

  // Створення фундаменту
  createFoundation(depth, width, height) {
    return this.callSketchUpMethod('add_foundation', depth, width, height)
      .then(result => {
        Logger.debug('🏗️ Фундамент створено успішно', 'success');
        return result;
      });
  }

  // Створення відмостки з однаковою шириною
  createUniformBlindArea(width, thickness) {
    return this.callSketchUpMethod('add_blind_area_uniform', width, thickness)
      .then(result => {
        Logger.debug('🏗️ Відмостка з однаковою шириною створена', 'success');
        return result;
      });
  }

  // Створення відмостки з різною шириною
  createCustomBlindArea(north, south, east, west, thickness) {
    return this.callSketchUpMethod('add_blind_area_custom', north, south, east, west, thickness)
      .then(result => {
        Logger.debug('🏗️ Відмостка з різною шириною створена', 'success');
        return result;
      });
  }

  // Створення плитки з однаковою шириною
  createUniformTiling(width, thickness) {
    return this.callSketchUpMethod('add_tiling_uniform', width, thickness)
      .then(result => {
        Logger.debug('🏗️ Плитка з однаковою шириною створена', 'success');
        return result;
      });
  }

  // Створення плитки з різною шириною
  createCustomTiling(north, south, east, west, thickness) {
    return this.callSketchUpMethod('add_tiling_custom', north, south, east, west, thickness)
      .then(result => {
        Logger.debug('🏗️ Плитка з різною шириною створена', 'success');
        return result;
      });
  }

  // Створення облицювання з однаковою шириною
  createUniformCladding(width, thickness, height) {
    return this.callSketchUpMethod('add_cladding_uniform', width, thickness, height)
      .then(result => {
        Logger.debug('🏗️ Облицювання з однаковою шириною створено', 'success');
        return result;
      });
  }

  // Створення облицювання з різною шириною
  createCustomCladding(north, south, east, west, thickness, height) {
    return this.callSketchUpMethod('add_cladding_custom', north, south, east, west, thickness, height)
      .then(result => {
        Logger.debug('🏗️ Облицювання з різною шириною створено', 'success');
        return result;
      });
  }

  // Додавання стелажу
  addStand(modelIndex) {
    return this.callSketchUpMethod('add_stand', modelIndex)
      .then(result => {
        Logger.debug(`🏗️ Стелаж ${modelIndex} додано`, 'success');
        return result;
      });
  }

  // Додавання стели
  addStele(modelIndex) {
    return this.callSketchUpMethod('add_stele', modelIndex)
      .then(result => {
        Logger.debug(`🏗️ Стела ${modelIndex} додана`, 'success');
        return result;
      });
  }

  // Додавання клумби
  addFlowerbed(modelIndex) {
    return this.callSketchUpMethod('add_flowerbed', modelIndex)
      .then(result => {
        Logger.debug(`🏗️ Клумба ${modelIndex} додана`, 'success');
        return result;
      });
  }

  // Обробка черги викликів
  processCallbackQueue() {
    if (this.callbackQueue.length === 0) return;
    
    Logger.debug(`📋 Обробка черги викликів (${this.callbackQueue.length} елементів)`, 'info');
    
    while (this.callbackQueue.length > 0) {
      const callback = this.callbackQueue.shift();
      try {
        callback();
      } catch (error) {
        Logger.debug(`❌ Помилка обробки виклику з черги: ${error.message}`, 'error');
      }
    }
  }

  // Додавання виклику до черги
  queueCallback(callback) {
    this.callbackQueue.push(callback);
    Logger.debug('📋 Виклик додано до черги', 'info');
  }

  // Реєстрація обробника відповідей
  registerResponseHandler(requestId, handler) {
    this.responseHandlers.set(requestId, handler);
    Logger.debug(`📝 Зареєстровано обробник відповіді: ${requestId}`, 'info');
  }

  // Видалення обробника відповідей
  unregisterResponseHandler(requestId) {
    this.responseHandlers.delete(requestId);
    Logger.debug(`🗑️ Видалено обробник відповіді: ${requestId}`, 'info');
  }

  // Обробка відповіді від SketchUp
  handleResponse(requestId, response) {
    const handler = this.responseHandlers.get(requestId);
    if (handler) {
      try {
        handler(response);
        this.unregisterResponseHandler(requestId);
        Logger.debug(`✅ Відповідь ${requestId} оброблена`, 'success');
      } catch (error) {
        Logger.debug(`❌ Помилка обробки відповіді ${requestId}: ${error.message}`, 'error');
      }
    } else {
      Logger.debug(`⚠️ Обробник відповіді ${requestId} не знайдено`, 'warning');
    }
  }

  // Отримання статусу з'єднання
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      retries: this.connectionRetries,
      maxRetries: this.maxRetries,
      queueLength: this.callbackQueue.length,
      activeHandlers: this.responseHandlers.size
    };
  }

  // Скидання з'єднання
  reset() {
    this.isConnected = false;
    this.connectionRetries = 0;
    this.callbackQueue = [];
    this.responseHandlers.clear();
    Logger.debug('🔄 З\'єднання з SketchUp скинуто', 'info');
  }

  // Перевірка доступності методу
  isMethodAvailable(methodName) {
    return this.isBridgeConnected() && typeof window.sketchup[methodName] === 'function';
  }

  // Отримання списку доступних методів
  getAvailableMethods() {
    if (!this.isBridgeConnected()) return [];
    
    return Object.getOwnPropertyNames(window.sketchup)
      .filter(prop => typeof window.sketchup[prop] === 'function');
  }
}

// Глобальний екземпляр
const sketchUpBridge = new SketchUpBridge();

// Експорт глобальних функцій для зворотної сумісності
export function initializeSketchUpBridge() {
  return sketchUpBridge.initialize();
}

export function isSketchUpConnected() {
  return sketchUpBridge.isBridgeConnected();
}

export function callSketchUpMethod(methodName, ...args) {
  return sketchUpBridge.callSketchUpMethod(methodName, ...args);
}

export function getModels(modelType) {
  return sketchUpBridge.getModels(modelType);
}

export function createFoundation(depth, width, height) {
  return sketchUpBridge.createFoundation(depth, width, height);
}

export function createUniformBlindArea(width, thickness) {
  return sketchUpBridge.createUniformBlindArea(width, thickness);
}

export function createCustomBlindArea(north, south, east, west, thickness) {
  return sketchUpBridge.createCustomBlindArea(north, south, east, west, thickness);
}

export function createUniformTiling(width, thickness) {
  return sketchUpBridge.createUniformTiling(width, thickness);
}

export function createCustomTiling(north, south, east, west, thickness) {
  return sketchUpBridge.createCustomTiling(north, south, east, west, thickness);
}

export function createUniformCladding(width, thickness, height) {
  return sketchUpBridge.createUniformCladding(width, thickness, height);
}

export function createCustomCladding(north, south, east, west, thickness, height) {
  return sketchUpBridge.createCustomCladding(north, south, east, west, thickness, height);
}

export function addStand(modelIndex) {
  return sketchUpBridge.addStand(modelIndex);
}

export function addStele(modelIndex) {
  return sketchUpBridge.addStele(modelIndex);
}

export function addFlowerbed(modelIndex) {
  return sketchUpBridge.addFlowerbed(modelIndex);
}

export function getConnectionStatus() {
  return sketchUpBridge.getConnectionStatus();
}

export function resetSketchUpBridge() {
  return sketchUpBridge.reset();
}

export function isMethodAvailable(methodName) {
  return sketchUpBridge.isMethodAvailable(methodName);
}

export function getAvailableMethods() {
  return sketchUpBridge.getAvailableMethods();
}
