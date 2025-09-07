// modules/core/Config.js
// Конфігурація ProGran3

(function(global) {
  'use strict';
  
  // Створюємо namespace
  global.ProGran3 = global.ProGran3 || {};
  global.ProGran3.Core = global.ProGran3.Core || {};
  
  // Конфігурація
  const CONFIG = {
    // Налаштування логування
    logging: {
      defaultLevel: 'info',
      maxHistorySize: 100,
      maxUIEntries: 50
    },
    
    // Налаштування каруселей
    carousel: {
      defaultItems: 10,
      maxItems: 50,
      animationDuration: 500,
      lazyLoadNeighbors: 1
    },
    
    // Налаштування UI
    ui: {
      defaultTab: 'base',
      animationDuration: 300,
      debounceDelay: 100
    },
    
    // Налаштування валідації
    validation: {
      minDimension: 1,
      maxDimension: 10000,
      minThickness: 1,
      maxThickness: 1000,
      defaultUnit: 'mm'
    },
    
    // Налаштування SketchUp
    sketchup: {
      previewSize: 256,
      maxPreviewSize: 512,
      minPreviewSize: 64,
      timeout: 30000
    },
    
    // Налаштування одиниць
    units: {
      supported: ['mm', 'cm'],
      default: 'mm',
      conversion: {
        mm: 1,
        cm: 10
      }
    },
    
    // Налаштування категорій
    categories: {
      stands: { maxCount: 1, required: false },
      steles: { maxCount: 1, required: false },
      flowerbeds: { maxCount: 1, required: false },
      gravestones: { maxCount: 1, required: false },
      fence_decor: { maxCount: 1, required: false },
      foundation: { maxCount: 1, required: true },
      tiling: { maxCount: 1, required: false },
      cladding: { maxCount: 1, required: false },
      blindArea: { maxCount: 1, required: false }
    }
  };
  
  // Приватні функції
  function validateConfigKey(key) {
    return typeof key === 'string' && key.length > 0;
  }
  
  function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }
  
  function setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);
    target[lastKey] = value;
  }
  
  // Публічні функції
  function get(key) {
    if (!validateConfigKey(key)) {
      return undefined;
    }
    return getNestedValue(CONFIG, key);
  }
  
  function set(key, value) {
    if (!validateConfigKey(key)) {
      return false;
    }
    setNestedValue(CONFIG, key, value);
    return true;
  }
  
  function getAll() {
    return JSON.parse(JSON.stringify(CONFIG)); // Глибока копія
  }
  
  function reset() {
    // Скидаємо до значень за замовчуванням
    Object.keys(CONFIG).forEach(section => {
      if (typeof CONFIG[section] === 'object') {
        Object.keys(CONFIG[section]).forEach(key => {
          // Тут можна додати логіку скидання до значень за замовчуванням
        });
      }
    });
  }
  
  function validateConfig() {
    const errors = [];
    
    // Перевіряємо основні секції
    const requiredSections = ['logging', 'carousel', 'ui', 'validation', 'sketchup', 'units', 'categories'];
    requiredSections.forEach(section => {
      if (!CONFIG[section]) {
        errors.push(`Відсутня секція конфігурації: ${section}`);
      }
    });
    
    // Перевіряємо логування
    if (CONFIG.logging) {
      if (!CONFIG.logging.defaultLevel || typeof CONFIG.logging.defaultLevel !== 'string') {
        errors.push('Невірний defaultLevel в секції logging');
      }
      if (!CONFIG.logging.maxHistorySize || typeof CONFIG.logging.maxHistorySize !== 'number') {
        errors.push('Невірний maxHistorySize в секції logging');
      }
    }
    
    // Перевіряємо одиниці
    if (CONFIG.units) {
      if (!Array.isArray(CONFIG.units.supported)) {
        errors.push('supported units має бути масивом');
      }
      if (!CONFIG.units.default || !CONFIG.units.supported.includes(CONFIG.units.default)) {
        errors.push('default unit не підтримується');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
  
  function getCategoryConfig(category) {
    return CONFIG.categories[category] || null;
  }
  
  function isCategoryRequired(category) {
    const config = getCategoryConfig(category);
    return config ? config.required : false;
  }
  
  function getCategoryMaxCount(category) {
    const config = getCategoryConfig(category);
    return config ? config.maxCount : 1;
  }
  
  // Експорт публічного API
  global.ProGran3.Core.Config = {
    get: get,
    set: set,
    getAll: getAll,
    reset: reset,
    validateConfig: validateConfig,
    getCategoryConfig: getCategoryConfig,
    isCategoryRequired: isCategoryRequired,
    getCategoryMaxCount: getCategoryMaxCount
  };
  
  // Ініціалізація
  const validation = validateConfig();
  if (!validation.isValid) {
    console.error('Помилки в конфігурації:', validation.errors);
  }
  
  if (global.ProGran3.Core.Logger) {
    global.ProGran3.Core.Logger.debugLog('Config модуль завантажено', 'info', 'Config');
  }
  
})(window);
