// tests/unit/Validation.test.js
// Unit тести для Validation модуля

(function(global) {
  'use strict';
  
  // Додаємо тести до глобального тестера
  if (global.testRunner) {
    
    // Тест 1: Ініціалізація Validation
    global.testRunner.addTest('Validation ініціалізація', () => {
      if (!global.ProGran3 || !global.ProGran3.Utils || !global.ProGran3.Utils.Validation) {
        throw new Error('Validation модуль не завантажено');
      }
      
      if (typeof global.ProGran3.Utils.Validation.validateDimension !== 'function') {
        throw new Error('validateDimension функція не доступна');
      }
      
      if (typeof global.ProGran3.Utils.Validation.validateThickness !== 'function') {
        throw new Error('validateThickness функція не доступна');
      }
      
      if (typeof global.ProGran3.Utils.Validation.validateFilename !== 'function') {
        throw new Error('validateFilename функція не доступна');
      }
    }, 'utils');
    
    // Тест 2: Валідація розмірів
    global.testRunner.addTest('Validation валідація розмірів', () => {
      if (!global.ProGran3.Utils.Validation) {
        throw new Error('Validation модуль не доступний');
      }
      
      // Тестуємо валідні значення
      const validValues = ['100', '100.5', '1000', '1'];
      validValues.forEach(value => {
        const result = global.ProGran3.Utils.Validation.validateDimension(value);
        if (!result.isValid) {
          throw new Error(`Валідне значення ${value} не пройшло валідацію: ${result.error}`);
        }
        if (typeof result.value !== 'number') {
          throw new Error(`Значення не конвертовано в число для ${value}`);
        }
      });
      
      // Тестуємо невалідні значення
      const invalidValues = ['', null, undefined, 'abc', '-10', '0', '10001'];
      invalidValues.forEach(value => {
        const result = global.ProGran3.Utils.Validation.validateDimension(value);
        if (result.isValid) {
          throw new Error(`Невалідне значення ${value} пройшло валідацію`);
        }
        if (!result.error) {
          throw new Error(`Помилка не повернута для невалідного значення ${value}`);
        }
      });
    }, 'utils');
    
    // Тест 3: Валідація товщини
    global.testRunner.addTest('Validation валідація товщини', () => {
      if (!global.ProGran3.Utils.Validation) {
        throw new Error('Validation модуль не доступний');
      }
      
      // Тестуємо валідні значення товщини
      const validThickness = ['10', '25.5', '100', '1'];
      validThickness.forEach(value => {
        const result = global.ProGran3.Utils.Validation.validateThickness(value);
        if (!result.isValid) {
          throw new Error(`Валідна товщина ${value} не пройшла валідацію: ${result.error}`);
        }
      });
      
      // Тестуємо невалідні значення товщини
      const invalidThickness = ['', '0', '-5', '1001', 'abc'];
      invalidThickness.forEach(value => {
        const result = global.ProGran3.Utils.Validation.validateThickness(value);
        if (result.isValid) {
          throw new Error(`Невалідна товщина ${value} пройшла валідацію`);
        }
      });
    }, 'utils');
    
    // Тест 4: Валідація назв файлів
    global.testRunner.addTest('Validation валідація назв файлів', () => {
      if (!global.ProGran3.Utils.Validation) {
        throw new Error('Validation модуль не доступний');
      }
      
      // Тестуємо валідні назви файлів
      const validFilenames = ['model.skp', 'test-model.skp', 'model_123.skp', 'model-123.skp'];
      validFilenames.forEach(filename => {
        const result = global.ProGran3.Utils.Validation.validateFilename(filename);
        if (!result.isValid) {
          throw new Error(`Валідна назва файлу ${filename} не пройшла валідацію: ${result.error}`);
        }
      });
      
      // Тестуємо невалідні назви файлів
      const invalidFilenames = ['', 'model.txt', 'model', 'model.skp.exe', 'model with spaces.skp'];
      invalidFilenames.forEach(filename => {
        const result = global.ProGran3.Utils.Validation.validateFilename(filename);
        if (result.isValid) {
          throw new Error(`Невалідна назва файлу ${filename} пройшла валідацію`);
        }
      });
    }, 'utils');
    
    // Тест 5: Валідація категорій
    global.testRunner.addTest('Validation валідація категорій', () => {
      if (!global.ProGran3.Utils.Validation) {
        throw new Error('Validation модуль не доступний');
      }
      
      // Тестуємо валідні категорії
      const validCategories = ['stands', 'steles', 'flowerbeds', 'gravestones', 'fence_decor'];
      validCategories.forEach(category => {
        const result = global.ProGran3.Utils.Validation.validateCategory(category);
        if (!result.isValid) {
          throw new Error(`Валідна категорія ${category} не пройшла валідацію: ${result.error}`);
        }
      });
      
      // Тестуємо невалідні категорії
      const invalidCategories = ['', 'invalid', 'stand', 'stele', 'unknown'];
      invalidCategories.forEach(category => {
        const result = global.ProGran3.Utils.Validation.validateCategory(category);
        if (result.isValid) {
          throw new Error(`Невалідна категорія ${category} пройшла валідацію`);
        }
      });
    }, 'utils');
    
    // Тест 6: Валідація одиниць
    global.testRunner.addTest('Validation валідація одиниць', () => {
      if (!global.ProGran3.Utils.Validation) {
        throw new Error('Validation модуль не доступний');
      }
      
      // Тестуємо валідні одиниці
      const validUnits = ['mm', 'cm'];
      validUnits.forEach(unit => {
        const result = global.ProGran3.Utils.Validation.validateUnit(unit);
        if (!result.isValid) {
          throw new Error(`Валідна одиниця ${unit} не пройшла валідацію: ${result.error}`);
        }
      });
      
      // Тестуємо невалідні одиниці
      const invalidUnits = ['', 'm', 'inch', 'px', 'invalid'];
      invalidUnits.forEach(unit => {
        const result = global.ProGran3.Utils.Validation.validateUnit(unit);
        if (result.isValid) {
          throw new Error(`Невалідна одиниця ${unit} пройшла валідацію`);
        }
      });
    }, 'utils');
    
    // Тест 7: Валідація даних фундаменту
    global.testRunner.addTest('Validation валідація даних фундаменту', () => {
      if (!global.ProGran3.Utils.Validation) {
        throw new Error('Validation модуль не доступний');
      }
      
      // Тестуємо валідні дані фундаменту
      const validFoundationData = {
        depth: '2000',
        width: '1000',
        height: '150'
      };
      
      const result = global.ProGran3.Utils.Validation.validateFoundationData(validFoundationData);
      if (!result.isValid) {
        throw new Error(`Валідні дані фундаменту не пройшли валідацію: ${result.errors.join(', ')}`);
      }
      
      if (!result.data || !result.data.depth || !result.data.width || !result.data.height) {
        throw new Error('Дані фундаменту не повернуто правильно');
      }
      
      // Тестуємо невалідні дані фундаменту
      const invalidFoundationData = {
        depth: '0',
        width: 'abc',
        height: '10001'
      };
      
      const invalidResult = global.ProGran3.Utils.Validation.validateFoundationData(invalidFoundationData);
      if (invalidResult.isValid) {
        throw new Error('Невалідні дані фундаменту пройшли валідацію');
      }
      
      if (!invalidResult.errors || invalidResult.errors.length === 0) {
        throw new Error('Помилки валідації не повернуто для невалідних даних');
      }
    }, 'utils');
    
    // Тест 8: Валідація даних плитки
    global.testRunner.addTest('Validation валідація даних плитки', () => {
      if (!global.ProGran3.Utils.Validation) {
        throw new Error('Validation модуль не доступний');
      }
      
      // Тестуємо валідні дані плитки
      const validTilingData = {
        thickness: '20',
        borderWidth: '5',
        overhang: '10'
      };
      
      const result = global.ProGran3.Utils.Validation.validateTilingData(validTilingData);
      if (!result.isValid) {
        throw new Error(`Валідні дані плитки не пройшли валідацію: ${result.errors.join(', ')}`);
      }
      
      if (!result.data || !result.data.thickness) {
        throw new Error('Дані плитки не повернуто правильно');
      }
      
      // Тестуємо невалідні дані плитки
      const invalidTilingData = {
        thickness: '0',
        borderWidth: 'abc',
        overhang: '10001'
      };
      
      const invalidResult = global.ProGran3.Utils.Validation.validateTilingData(invalidTilingData);
      if (invalidResult.isValid) {
        throw new Error('Невалідні дані плитки пройшли валідацію');
      }
    }, 'utils');
    
    // Тест 9: Sanitization
    global.testRunner.addTest('Validation sanitization', () => {
      if (!global.ProGran3.Utils.Validation) {
        throw new Error('Validation модуль не доступний');
      }
      
      // Тестуємо sanitization рядків
      const testString = '<script>alert("test")</script>';
      const sanitized = global.ProGran3.Utils.Validation.sanitizeInput(testString);
      
      if (sanitized.includes('<script>') || sanitized.includes('</script>')) {
        throw new Error('Sanitization не видалив небезпечні теги');
      }
      
      // Тестуємо sanitization чисел
      const testNumber = 123.45;
      const sanitizedNumber = global.ProGran3.Utils.Validation.sanitizeInput(testNumber);
      
      if (sanitizedNumber !== testNumber) {
        throw new Error('Sanitization змінив валідне число');
      }
      
      // Тестуємо sanitization об'єктів
      const testObject = {
        name: '<script>alert("test")</script>',
        value: 123
      };
      const sanitizedObject = global.ProGran3.Utils.Validation.sanitizeInput(testObject);
      
      if (sanitizedObject.name.includes('<script>')) {
        throw new Error('Sanitization не очистив об\'єкт правильно');
      }
      
      if (sanitizedObject.value !== 123) {
        throw new Error('Sanitization змінив числове значення в об\'єкті');
      }
    }, 'utils');
    
  }
  
})(window);
