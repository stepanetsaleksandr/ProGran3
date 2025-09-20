// tests/unit/FoundationBuilder.test.js
// Unit тести для FoundationBuilder модуля

(function(global) {
  'use strict';
  
  // Додаємо тести до глобального тестера
  if (global.testRunner) {
    
    // Тест 1: Ініціалізація FoundationBuilder
    global.testRunner.addTest('FoundationBuilder ініціалізація', () => {
      if (!global.ProGran3 || !global.ProGran3.Builders || !global.ProGran3.Builders.FoundationBuilder) {
        throw new Error('FoundationBuilder модуль не завантажено');
      }
      
      if (typeof global.ProGran3.Builders.FoundationBuilder.addFoundation !== 'function') {
        throw new Error('addFoundation функція не доступна');
      }
      
      if (typeof global.ProGran3.Builders.FoundationBuilder.getFoundationDimensions !== 'function') {
        throw new Error('getFoundationDimensions функція не доступна');
      }
      
      if (typeof global.ProGran3.Builders.FoundationBuilder.setFoundationDimensions !== 'function') {
        throw new Error('setFoundationDimensions функція не доступна');
      }
    }, 'builder');
    
    // Тест 2: Отримання розмірів фундаменту
    global.testRunner.addTest('FoundationBuilder отримання розмірів', () => {
      if (!global.ProGran3.Builders.FoundationBuilder) {
        throw new Error('FoundationBuilder модуль не доступний');
      }
      
      const dimensions = global.ProGran3.Builders.FoundationBuilder.getFoundationDimensions();
      
      if (!dimensions || typeof dimensions !== 'object') {
        throw new Error('Розміри фундаменту не повернуто правильно');
      }
      
      if (typeof dimensions.depth !== 'number') {
        throw new Error('Depth не є числом');
      }
      
      if (typeof dimensions.width !== 'number') {
        throw new Error('Width не є числом');
      }
      
      if (typeof dimensions.height !== 'number') {
        throw new Error('Height не є числом');
      }
      
      if (typeof dimensions.unit !== 'string') {
        throw new Error('Unit не є рядком');
      }
    }, 'builder');
    
    // Тест 3: Встановлення розмірів фундаменту
    global.testRunner.addTest('FoundationBuilder встановлення розмірів', () => {
      if (!global.ProGran3.Builders.FoundationBuilder) {
        throw new Error('FoundationBuilder модуль не доступний');
      }
      
      const testDimensions = {
        depth: 2500,
        width: 1200,
        height: 200
      };
      
      const result = global.ProGran3.Builders.FoundationBuilder.setFoundationDimensions(testDimensions);
      
      if (!result) {
        throw new Error('Не вдалося встановити розміри фундаменту');
      }
      
      const retrievedDimensions = global.ProGran3.Builders.FoundationBuilder.getFoundationDimensions();
      
      if (retrievedDimensions.depth !== 2500) {
        throw new Error(`Depth не встановлено правильно. Очікувалось: 2500, отримано: ${retrievedDimensions.depth}`);
      }
      
      if (retrievedDimensions.width !== 1200) {
        throw new Error(`Width не встановлено правильно. Очікувалось: 1200, отримано: ${retrievedDimensions.width}`);
      }
      
      if (retrievedDimensions.height !== 200) {
        throw new Error(`Height не встановлено правильно. Очікувалось: 200, отримано: ${retrievedDimensions.height}`);
      }
    }, 'builder');
    
    // Тест 4: Валідація розмірів фундаменту
    global.testRunner.addTest('FoundationBuilder валідація розмірів', () => {
      if (!global.ProGran3.Builders.FoundationBuilder) {
        throw new Error('FoundationBuilder модуль не доступний');
      }
      
      // Тестуємо валідні розміри
      const validDimensions = {
        depth: 2000,
        width: 1000,
        height: 150
      };
      
      const result1 = global.ProGran3.Builders.FoundationBuilder.setFoundationDimensions(validDimensions);
      if (!result1) {
        throw new Error('Валідні розміри не прийнято');
      }
      
      // Тестуємо невалідні розміри
      const invalidDimensions = {
        depth: 0, // Невалідне значення
        width: 1000,
        height: 150
      };
      
      const result2 = global.ProGran3.Builders.FoundationBuilder.setFoundationDimensions(invalidDimensions);
      if (result2) {
        throw new Error('Невалідні розміри були прийняті');
      }
      
      // Тестуємо порожні дані
      const result3 = global.ProGran3.Builders.FoundationBuilder.setFoundationDimensions(null);
      if (result3) {
        throw new Error('Порожні дані були прийняті');
      }
    }, 'builder');
    
    // Тест 5: Скидання фундаменту
    global.testRunner.addTest('FoundationBuilder скидання фундаменту', () => {
      if (!global.ProGran3.Builders.FoundationBuilder) {
        throw new Error('FoundationBuilder модуль не доступний');
      }
      
      // Встановлюємо тестові розміри
      global.ProGran3.Builders.FoundationBuilder.setFoundationDimensions({
        depth: 3000,
        width: 1500,
        height: 250
      });
      
      // Скидаємо фундамент
      global.ProGran3.Builders.FoundationBuilder.resetFoundation();
      
      // Перевіряємо що розміри скинуто до значень за замовчуванням
      const dimensions = global.ProGran3.Builders.FoundationBuilder.getFoundationDimensions();
      
      if (dimensions.depth !== 2000) {
        throw new Error(`Depth не скинуто до значення за замовчуванням. Очікувалось: 2000, отримано: ${dimensions.depth}`);
      }
      
      if (dimensions.width !== 1000) {
        throw new Error(`Width не скинуто до значення за замовчуванням. Очікувалось: 1000, отримано: ${dimensions.width}`);
      }
      
      if (dimensions.height !== 150) {
        throw new Error(`Height не скинуто до значення за замовчуванням. Очікувалось: 150, отримано: ${dimensions.height}`);
      }
    }, 'builder');
    
    // Тест 6: Перевірка статусу додавання
    global.testRunner.addTest('FoundationBuilder перевірка статусу додавання', () => {
      if (!global.ProGran3.Builders.FoundationBuilder) {
        throw new Error('FoundationBuilder модуль не доступний');
      }
      
      const isAdded = global.ProGran3.Builders.FoundationBuilder.isFoundationAdded();
      
      if (typeof isAdded !== 'boolean') {
        throw new Error('isFoundationAdded не повертає boolean значення');
      }
    }, 'builder');
    
    // Тест 7: Отримання інформації про фундамент
    global.testRunner.addTest('FoundationBuilder отримання інформації', () => {
      if (!global.ProGran3.Builders.FoundationBuilder) {
        throw new Error('FoundationBuilder модуль не доступний');
      }
      
      const info = global.ProGran3.Builders.FoundationBuilder.getFoundationInfo();
      
      if (!info || typeof info !== 'object') {
        throw new Error('Інформація про фундамент не повернута правильно');
      }
      
      if (!info.data || typeof info.data !== 'object') {
        throw new Error('Дані фундаменту не повернуто в інформації');
      }
      
      if (typeof info.isAdded !== 'boolean') {
        throw new Error('Статус додавання не повернуто в інформації');
      }
      
      if (!info.timestamp || typeof info.timestamp !== 'string') {
        throw new Error('Timestamp не повернуто в інформації');
      }
    }, 'builder');
    
    // Тест 8: Зворотна сумісність
    global.testRunner.addTest('FoundationBuilder зворотна сумісність', () => {
      // Перевіряємо що глобальна функція доступна
      if (typeof global.addFoundation !== 'function') {
        throw new Error('Глобальна функція addFoundation не доступна');
      }
      
      // Тестуємо глобальну функцію (без виклику SketchUp)
      try {
        // Мокаємо window.sketchup для тестування
        const originalSketchup = window.sketchup;
        window.sketchup = {
          add_foundation: function() { return true; }
        };
        
        // Тестуємо що функція не падає
        // (не викликаємо реально, бо потрібні DOM елементи)
        
        // Відновлюємо оригінальний sketchup
        window.sketchup = originalSketchup;
      } catch (error) {
        throw new Error(`Помилка тестування глобальної функції: ${error.message}`);
      }
    }, 'builder');
    
  }
  
})(window);
