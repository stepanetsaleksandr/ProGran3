// tests/unit/Units.test.js
// Unit тести для Units модуля

(function(global) {
  'use strict';
  
  // Додаємо тести до глобального тестера
  if (global.testRunner) {
    
    // Тест 1: Ініціалізація Units
    global.testRunner.addTest('Units ініціалізація', () => {
      if (!global.ProGran3 || !global.ProGran3.Utils || !global.ProGran3.Utils.Units) {
        throw new Error('Units модуль не завантажено');
      }
      
      if (typeof global.ProGran3.Utils.Units.changeUnit !== 'function') {
        throw new Error('changeUnit функція не доступна');
      }
      
      if (typeof global.ProGran3.Utils.Units.getCurrentUnit !== 'function') {
        throw new Error('getCurrentUnit функція не доступна');
      }
      
      if (typeof global.ProGran3.Utils.Units.convertValue !== 'function') {
        throw new Error('convertValue функція не доступна');
      }
    }, 'utils');
    
    // Тест 2: Зміна одиниць
    global.testRunner.addTest('Units зміна одиниць', () => {
      if (!global.ProGran3.Utils.Units) {
        throw new Error('Units модуль не доступний');
      }
      
      const originalUnit = global.ProGran3.Utils.Units.getCurrentUnit();
      
      // Тестуємо зміну на cm
      const result1 = global.ProGran3.Utils.Units.changeUnit('cm');
      if (!result1) {
        throw new Error('Не вдалося змінити одиницю на cm');
      }
      
      const currentUnit1 = global.ProGran3.Utils.Units.getCurrentUnit();
      if (currentUnit1 !== 'cm') {
        throw new Error(`Одиниця не змінена на cm. Поточна: ${currentUnit1}`);
      }
      
      // Тестуємо зміну на mm
      const result2 = global.ProGran3.Utils.Units.changeUnit('mm');
      if (!result2) {
        throw new Error('Не вдалося змінити одиницю на mm');
      }
      
      const currentUnit2 = global.ProGran3.Utils.Units.getCurrentUnit();
      if (currentUnit2 !== 'mm') {
        throw new Error(`Одиниця не змінена на mm. Поточна: ${currentUnit2}`);
      }
      
      // Тестуємо невалідну одиницю
      const result3 = global.ProGran3.Utils.Units.changeUnit('invalid');
      if (result3) {
        throw new Error('Невалідна одиниця була прийнята');
      }
      
      // Повертаємо оригінальну одиницю
      global.ProGran3.Utils.Units.changeUnit(originalUnit);
    }, 'utils');
    
    // Тест 3: Конвертація значень
    global.testRunner.addTest('Units конвертація значень', () => {
      if (!global.ProGran3.Utils.Units) {
        throw new Error('Units модуль не доступний');
      }
      
      // Тестуємо конвертацію mm -> cm
      const mmToCm = global.ProGran3.Utils.Units.convertValue(100, 'mm', 'cm');
      if (mmToCm !== 10) {
        throw new Error(`Неправильна конвертація mm -> cm. Очікувалось: 10, отримано: ${mmToCm}`);
      }
      
      // Тестуємо конвертацію cm -> mm
      const cmToMm = global.ProGran3.Utils.Units.convertValue(10, 'cm', 'mm');
      if (cmToMm !== 100) {
        throw new Error(`Неправильна конвертація cm -> mm. Очікувалось: 100, отримано: ${cmToMm}`);
      }
      
      // Тестуємо конвертацію в ту ж одиницю
      const sameUnit = global.ProGran3.Utils.Units.convertValue(100, 'mm', 'mm');
      if (sameUnit !== 100) {
        throw new Error(`Конвертація в ту ж одиницю змінила значення. Очікувалось: 100, отримано: ${sameUnit}`);
      }
      
      // Тестуємо невалідні одиниці
      const invalidConversion = global.ProGran3.Utils.Units.convertValue(100, 'invalid', 'mm');
      if (invalidConversion !== 100) {
        throw new Error(`Конвертація з невалідної одиниці змінила значення`);
      }
    }, 'utils');
    
    // Тест 4: Форматування значень
    global.testRunner.addTest('Units форматування значень', () => {
      if (!global.ProGran3.Utils.Units) {
        throw new Error('Units модуль не доступний');
      }
      
      // Тестуємо форматування для cm (без десяткових)
      const cmFormatted = global.ProGran3.Utils.Units.formatValue(10.5, 'cm');
      if (cmFormatted !== '11') {
        throw new Error(`Неправильне форматування для cm. Очікувалось: 11, отримано: ${cmFormatted}`);
      }
      
      // Тестуємо форматування для mm (з десятковими якщо потрібно)
      const mmFormatted1 = global.ProGran3.Utils.Units.formatValue(100, 'mm');
      if (mmFormatted1 !== '100') {
        throw new Error(`Неправильне форматування цілого числа для mm. Очікувалось: 100, отримано: ${mmFormatted1}`);
      }
      
      const mmFormatted2 = global.ProGran3.Utils.Units.formatValue(100.5, 'mm');
      if (mmFormatted2 !== '100.5') {
        throw new Error(`Неправильне форматування десяткового числа для mm. Очікувалось: 100.5, отримано: ${mmFormatted2}`);
      }
      
      // Тестуємо форматування невалідних значень
      const invalidFormatted = global.ProGran3.Utils.Units.formatValue('invalid', 'mm');
      if (invalidFormatted !== '0') {
        throw new Error(`Неправильне форматування невалідного значення. Очікувалось: 0, отримано: ${invalidFormatted}`);
      }
    }, 'utils');
    
    // Тест 5: Конвертація в мм
    global.testRunner.addTest('Units конвертація в мм', () => {
      if (!global.ProGran3.Utils.Units) {
        throw new Error('Units модуль не доступний');
      }
      
      // Тестуємо convertToMm
      const mmFromMm = global.ProGran3.Utils.Units.convertToMm(100, 'mm');
      if (mmFromMm !== 100) {
        throw new Error(`convertToMm з mm неправильний. Очікувалось: 100, отримано: ${mmFromMm}`);
      }
      
      const mmFromCm = global.ProGran3.Utils.Units.convertToMm(10, 'cm');
      if (mmFromCm !== 100) {
        throw new Error(`convertToMm з cm неправильний. Очікувалось: 100, отримано: ${mmFromCm}`);
      }
      
      // Тестуємо convertFromMm
      const cmFromMm = global.ProGran3.Utils.Units.convertFromMm(100, 'cm');
      if (cmFromMm !== 10) {
        throw new Error(`convertFromMm в cm неправильний. Очікувалось: 10, отримано: ${cmFromMm}`);
      }
      
      const mmFromMm2 = global.ProGran3.Utils.Units.convertFromMm(100, 'mm');
      if (mmFromMm2 !== 100) {
        throw new Error(`convertFromMm в mm неправильний. Очікувалось: 100, отримано: ${mmFromMm2}`);
      }
    }, 'utils');
    
    // Тест 6: Toggle одиниць
    global.testRunner.addTest('Units toggle одиниць', () => {
      if (!global.ProGran3.Utils.Units) {
        throw new Error('Units модуль не доступний');
      }
      
      const originalUnit = global.ProGran3.Utils.Units.getCurrentUnit();
      
      // Тестуємо toggle
      const toggleResult = global.ProGran3.Utils.Units.toggleUnit();
      if (!toggleResult) {
        throw new Error('Toggle одиниць не вдався');
      }
      
      const toggledUnit = global.ProGran3.Utils.Units.getCurrentUnit();
      const expectedUnit = originalUnit === 'mm' ? 'cm' : 'mm';
      
      if (toggledUnit !== expectedUnit) {
        throw new Error(`Toggle не працює правильно. Очікувалось: ${expectedUnit}, отримано: ${toggledUnit}`);
      }
      
      // Повертаємо оригінальну одиницю
      global.ProGran3.Utils.Units.changeUnit(originalUnit);
    }, 'utils');
    
    // Тест 7: Конвертація всіх значень
    global.testRunner.addTest('Units конвертація всіх значень', () => {
      if (!global.ProGran3.Utils.Units) {
        throw new Error('Units модуль не доступний');
      }
      
      const testValues = {
        foundation: {
          depth: '2000',
          width: '1000',
          height: '150'
        },
        tiles: {
          thickness: '20',
          borderWidth: '5'
        }
      };
      
      // Конвертуємо з mm в cm
      const convertedValues = global.ProGran3.Utils.Units.convertAllValues(testValues, 'mm', 'cm');
      
      if (!convertedValues || !convertedValues.foundation) {
        throw new Error('Конвертація всіх значень не повернула результат');
      }
      
      // Перевіряємо конвертацію фундаменту
      if (convertedValues.foundation.depth !== '200') {
        throw new Error(`Неправильна конвертація depth. Очікувалось: 200, отримано: ${convertedValues.foundation.depth}`);
      }
      
      if (convertedValues.foundation.width !== '100') {
        throw new Error(`Неправильна конвертація width. Очікувалось: 100, отримано: ${convertedValues.foundation.width}`);
      }
      
      if (convertedValues.foundation.height !== '15') {
        throw new Error(`Неправильна конвертація height. Очікувалось: 15, отримано: ${convertedValues.foundation.height}`);
      }
      
      // Перевіряємо конвертацію плитки
      if (convertedValues.tiles.thickness !== '2') {
        throw new Error(`Неправильна конвертація thickness. Очікувалось: 2, отримано: ${convertedValues.tiles.thickness}`);
      }
    }, 'utils');
    
    // Тест 8: Зворотна сумісність
    global.testRunner.addTest('Units зворотна сумісність', () => {
      // Перевіряємо що глобальні функції доступні
      if (typeof global.changeUnit !== 'function') {
        throw new Error('Глобальна функція changeUnit не доступна');
      }
      
      if (typeof global.getCurrentUnit !== 'function') {
        throw new Error('Глобальна функція getCurrentUnit не доступна');
      }
      
      if (typeof global.convertValue !== 'function') {
        throw new Error('Глобальна функція convertValue не доступна');
      }
      
      if (typeof global.formatValue !== 'function') {
        throw new Error('Глобальна функція formatValue не доступна');
      }
      
      // Тестуємо глобальні функції
      try {
        const originalUnit = global.getCurrentUnit();
        global.changeUnit('cm');
        const currentUnit = global.getCurrentUnit();
        if (currentUnit !== 'cm') {
          throw new Error('Глобальна функція changeUnit не працює');
        }
        global.changeUnit(originalUnit);
        
        const converted = global.convertValue(100, 'mm', 'cm');
        if (converted !== 10) {
          throw new Error('Глобальна функція convertValue не працює');
        }
        
        const formatted = global.formatValue(100, 'mm');
        if (formatted !== '100') {
          throw new Error('Глобальна функція formatValue не працює');
        }
      } catch (error) {
        throw new Error(`Помилка використання глобальних функцій: ${error.message}`);
      }
    }, 'utils');
    
  }
  
})(window);
