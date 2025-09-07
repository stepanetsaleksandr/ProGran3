// tests/unit/Logger.test.js
// Unit тести для Logger модуля

(function(global) {
  'use strict';
  
  // Додаємо тести до глобального тестера
  if (global.testRunner) {
    
    // Тест 1: Ініціалізація Logger
    global.testRunner.addTest('Logger ініціалізація', () => {
      if (!global.ProGran3 || !global.ProGran3.Core || !global.ProGran3.Core.Logger) {
        throw new Error('Logger модуль не завантажено');
      }
      
      if (typeof global.ProGran3.Core.Logger.debugLog !== 'function') {
        throw new Error('debugLog функція не доступна');
      }
      
      if (typeof global.ProGran3.Core.Logger.clearDebugLog !== 'function') {
        throw new Error('clearDebugLog функція не доступна');
      }
      
      if (typeof global.ProGran3.Core.Logger.setLogLevel !== 'function') {
        throw new Error('setLogLevel функція не доступна');
      }
    }, 'core');
    
    // Тест 2: Логування повідомлень
    global.testRunner.addTest('Logger логування повідомлень', () => {
      if (!global.ProGran3.Core.Logger) {
        throw new Error('Logger модуль не доступний');
      }
      
      // Тестуємо різні рівні логування
      const levels = ['debug', 'info', 'warn', 'error', 'fatal'];
      
      levels.forEach(level => {
        try {
          global.ProGran3.Core.Logger.debugLog(`Тестове повідомлення ${level}`, level);
        } catch (error) {
          throw new Error(`Помилка логування рівня ${level}: ${error.message}`);
        }
      });
    }, 'core');
    
    // Тест 3: Зміна рівня логування
    global.testRunner.addTest('Logger зміна рівня логування', () => {
      if (!global.ProGran3.Core.Logger) {
        throw new Error('Logger модуль не доступний');
      }
      
      const originalLevel = global.ProGran3.Core.Logger.getLogLevel();
      
      // Тестуємо встановлення різних рівнів
      const testLevels = ['debug', 'info', 'warn', 'error'];
      
      testLevels.forEach(level => {
        global.ProGran3.Core.Logger.setLogLevel(level);
        const currentLevel = global.ProGran3.Core.Logger.getLogLevel();
        
        if (currentLevel !== level) {
          throw new Error(`Рівень логування не встановлено правильно. Очікувався: ${level}, отримано: ${currentLevel}`);
        }
      });
      
      // Повертаємо оригінальний рівень
      global.ProGran3.Core.Logger.setLogLevel(originalLevel);
    }, 'core');
    
    // Тест 4: Очищення логу
    global.testRunner.addTest('Logger очищення логу', () => {
      if (!global.ProGran3.Core.Logger) {
        throw new Error('Logger модуль не доступний');
      }
      
      // Додаємо кілька повідомлень
      global.ProGran3.Core.Logger.debugLog('Тестове повідомлення 1', 'info');
      global.ProGran3.Core.Logger.debugLog('Тестове повідомлення 2', 'info');
      
      // Очищуємо лог
      global.ProGran3.Core.Logger.clearDebugLog();
      
      // Перевіряємо що лог очищено
      const history = global.ProGran3.Core.Logger.getLogHistory();
      if (history.length > 0) {
        throw new Error('Лог не очищено повністю');
      }
    }, 'core');
    
    // Тест 5: Статистика логу
    global.testRunner.addTest('Logger статистика логу', () => {
      if (!global.ProGran3.Core.Logger) {
        throw new Error('Logger модуль не доступний');
      }
      
      // Очищуємо лог
      global.ProGran3.Core.Logger.clearDebugLog();
      
      // Додаємо тестові повідомлення
      global.ProGran3.Core.Logger.debugLog('Debug повідомлення', 'debug');
      global.ProGran3.Core.Logger.debugLog('Info повідомлення', 'info');
      global.ProGran3.Core.Logger.debugLog('Error повідомлення', 'error');
      
      // Отримуємо статистику
      const stats = global.ProGran3.Core.Logger.getLogStats();
      
      if (!stats || typeof stats.total !== 'number') {
        throw new Error('Статистика логу не повернута правильно');
      }
      
      if (stats.total < 3) {
        throw new Error(`Очікувалося мінімум 3 записи, отримано: ${stats.total}`);
      }
      
      if (!stats.byLevel || typeof stats.byLevel !== 'object') {
        throw new Error('Статистика по рівнях не повернута правильно');
      }
    }, 'core');
    
    // Тест 6: Зворотна сумісність
    global.testRunner.addTest('Logger зворотна сумісність', () => {
      // Перевіряємо що глобальні функції доступні
      if (typeof global.debugLog !== 'function') {
        throw new Error('Глобальна функція debugLog не доступна');
      }
      
      if (typeof global.clearDebugLog !== 'function') {
        throw new Error('Глобальна функція clearDebugLog не доступна');
      }
      
      // Тестуємо глобальні функції
      try {
        global.debugLog('Тест глобальної функції', 'info');
        global.clearDebugLog();
      } catch (error) {
        throw new Error(`Помилка використання глобальних функцій: ${error.message}`);
      }
    }, 'core');
    
  }
  
})(window);
