// modules/utils/Validation.js
// Система валідації для ProGran3

(function(global) {
  'use strict';
  
  // Створюємо namespace
  global.ProGran3 = global.ProGran3 || {};
  global.ProGran3.Utils = global.ProGran3.Utils || {};
  
  // Приватні змінні
  let validationRules = {
    dimension: {
      min: 1,
      max: 10000,
      required: true
    },
    thickness: {
      min: 1,
      max: 1000,
      required: true
    },
    filename: {
      pattern: /^[a-zA-Z0-9._-]+\.skp$/,
      required: true
    },
    category: {
      allowed: ['stands', 'steles', 'flowerbeds', 'gravestones', 'fence_decor', 'foundation', 'tiling', 'cladding', 'blindArea', 'blind_area', 'tiles', 'pavement_tiles'],
      required: true
    }
  };
  
  // Приватні функції
  function logValidation(message, type = 'info') {
    if (global.ProGran3.Core.Logger) {
      global.ProGran3.Core.Logger.debugLog(message, type, 'Validation');
    }
  }
  
  function sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/[<>\"'&]/g, function(match) {
      const escape = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return escape[match];
    });
  }
  
  // Публічні функції валідації
  function validateDimension(value, fieldName = 'dimension') {
    const result = {
      isValid: false,
      value: null,
      error: null
    };
    
    if (value === null || value === undefined || value === '') {
      result.error = `${fieldName} є обов'язковим`;
      return result;
    }
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      result.error = `${fieldName} має бути числом`;
      return result;
    }
    
    if (numValue < validationRules.dimension.min) {
      result.error = `${fieldName} не може бути менше ${validationRules.dimension.min}`;
      return result;
    }
    
    if (numValue > validationRules.dimension.max) {
      result.error = `${fieldName} не може бути більше ${validationRules.dimension.max}`;
      return result;
    }
    
    result.isValid = true;
    result.value = numValue;
    return result;
  }
  
  function validateThickness(value, fieldName = 'thickness') {
    const result = {
      isValid: false,
      value: null,
      error: null
    };
    
    if (value === null || value === undefined || value === '') {
      result.error = `${fieldName} є обов'язковим`;
      return result;
    }
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      result.error = `${fieldName} має бути числом`;
      return result;
    }
    
    if (numValue < validationRules.thickness.min) {
      result.error = `${fieldName} не може бути менше ${validationRules.thickness.min}`;
      return result;
    }
    
    if (numValue > validationRules.thickness.max) {
      result.error = `${fieldName} не може бути більше ${validationRules.thickness.max}`;
      return result;
    }
    
    result.isValid = true;
    result.value = numValue;
    return result;
  }
  
  function validateFilename(filename) {
    const result = {
      isValid: false,
      value: null,
      error: null
    };
    
    if (!filename || typeof filename !== 'string') {
      result.error = 'Назва файлу є обов'язковою';
      return result;
    }
    
    const sanitized = sanitizeString(filename);
    if (!validationRules.filename.pattern.test(sanitized)) {
      result.error = 'Невірний формат назви файлу (має закінчуватися на .skp)';
      return result;
    }
    
    result.isValid = true;
    result.value = sanitized;
    return result;
  }
  
  function validateCategory(category) {
    const result = {
      isValid: false,
      value: null,
      error: null
    };
    
    if (!category || typeof category !== 'string') {
      result.error = 'Категорія є обов'язковою';
      return result;
    }
    
    const sanitized = sanitizeString(category);
    if (!validationRules.category.allowed.includes(sanitized)) {
      result.error = `Невірна категорія. Дозволені: ${validationRules.category.allowed.join(', ')}`;
      return result;
    }
    
    result.isValid = true;
    result.value = sanitized;
    return result;
  }
  
  function validateUnit(unit) {
    const result = {
      isValid: false,
      value: null,
      error: null
    };
    
    if (!unit || typeof unit !== 'string') {
      result.error = 'Одиниця вимірювання є обов'язковою';
      return result;
    }
    
    const sanitized = sanitizeString(unit);
    if (sanitized !== 'mm' && sanitized !== 'cm') {
      result.error = 'Одиниця вимірювання має бути mm або cm';
      return result;
    }
    
    result.isValid = true;
    result.value = sanitized;
    return result;
  }
  
  function validateFoundationData(data) {
    const result = {
      isValid: false,
      data: null,
      errors: []
    };
    
    if (!data || typeof data !== 'object') {
      result.errors.push('Дані фундаменту є обов'язковими');
      return result;
    }
    
    const depth = validateDimension(data.depth, 'Глибина');
    if (!depth.isValid) result.errors.push(depth.error);
    
    const width = validateDimension(data.width, 'Ширина');
    if (!width.isValid) result.errors.push(width.error);
    
    const height = validateDimension(data.height, 'Висота');
    if (!height.isValid) result.errors.push(height.error);
    
    if (result.errors.length === 0) {
      result.isValid = true;
      result.data = {
        depth: depth.value,
        width: width.value,
        height: height.value
      };
    }
    
    return result;
  }
  
  function validateTilingData(data) {
    const result = {
      isValid: false,
      data: null,
      errors: []
    };
    
    if (!data || typeof data !== 'object') {
      result.errors.push('Дані плитки є обов'язковими');
      return result;
    }
    
    const thickness = validateThickness(data.thickness, 'Товщина');
    if (!thickness.isValid) result.errors.push(thickness.error);
    
    if (data.borderWidth !== undefined) {
      const borderWidth = validateDimension(data.borderWidth, 'Ширина рамки');
      if (!borderWidth.isValid) result.errors.push(borderWidth.error);
    }
    
    if (data.overhang !== undefined) {
      const overhang = validateDimension(data.overhang, 'Виступ');
      if (!overhang.isValid) result.errors.push(overhang.error);
    }
    
    if (result.errors.length === 0) {
      result.isValid = true;
      result.data = {
        thickness: thickness.value,
        borderWidth: data.borderWidth ? parseFloat(data.borderWidth) : undefined,
        overhang: data.overhang ? parseFloat(data.overhang) : undefined
      };
    }
    
    return result;
  }
  
  function sanitizeInput(input) {
    if (typeof input === 'string') {
      return sanitizeString(input);
    } else if (typeof input === 'number') {
      return isNaN(input) ? 0 : input;
    } else if (typeof input === 'boolean') {
      return input;
    } else if (Array.isArray(input)) {
      return input.map(item => sanitizeInput(item));
    } else if (typeof input === 'object' && input !== null) {
      const sanitized = {};
      Object.keys(input).forEach(key => {
        sanitized[sanitizeString(key)] = sanitizeInput(input[key]);
      });
      return sanitized;
    }
    return input;
  }
  
  function setValidationRule(ruleName, rule) {
    if (validationRules.hasOwnProperty(ruleName)) {
      validationRules[ruleName] = { ...validationRules[ruleName], ...rule };
      logValidation(`Правило валідації оновлено: ${ruleName}`, 'info');
      return true;
    }
    return false;
  }
  
  function getValidationRules() {
    return JSON.parse(JSON.stringify(validationRules));
  }
  
  // Експорт публічного API
  global.ProGran3.Utils.Validation = {
    validateDimension: validateDimension,
    validateThickness: validateThickness,
    validateFilename: validateFilename,
    validateCategory: validateCategory,
    validateUnit: validateUnit,
    validateFoundationData: validateFoundationData,
    validateTilingData: validateTilingData,
    sanitizeInput: sanitizeInput,
    setValidationRule: setValidationRule,
    getValidationRules: getValidationRules
  };
  
  // Ініціалізація
  if (global.ProGran3.Core.Logger) {
    global.ProGran3.Core.Logger.debugLog('Validation модуль завантажено', 'info', 'Validation');
  }
  
})(window);
