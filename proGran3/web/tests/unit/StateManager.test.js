// tests/unit/StateManager.test.js
// Unit тести для StateManager модуля

(function(global) {
  'use strict';
  
  // Додаємо тести до глобального тестера
  if (global.testRunner) {
    
    // Тест 1: Ініціалізація StateManager
    global.testRunner.addTest('StateManager ініціалізація', () => {
      if (!global.ProGran3 || !global.ProGran3.Core || !global.ProGran3.Core.StateManager) {
        throw new Error('StateManager модуль не завантажено');
      }
      
      if (typeof global.ProGran3.Core.StateManager.getModelLists !== 'function') {
        throw new Error('getModelLists функція не доступна');
      }
      
      if (typeof global.ProGran3.Core.StateManager.setModelLists !== 'function') {
        throw new Error('setModelLists функція не доступна');
      }
      
      if (typeof global.ProGran3.Core.StateManager.getActiveTab !== 'function') {
        throw new Error('getActiveTab функція не доступна');
      }
    }, 'core');
    
    // Тест 2: Управління modelLists
    global.testRunner.addTest('StateManager управління modelLists', () => {
      if (!global.ProGran3.Core.StateManager) {
        throw new Error('StateManager модуль не доступний');
      }
      
      const testData = {
        stands: ['stand1.skp', 'stand2.skp'],
        steles: ['stele1.skp', 'stele2.skp']
      };
      
      // Встановлюємо тестові дані
      const result = global.ProGran3.Core.StateManager.setModelLists(testData);
      if (!result) {
        throw new Error('Не вдалося встановити modelLists');
      }
      
      // Отримуємо дані
      const retrievedData = global.ProGran3.Core.StateManager.getModelLists();
      if (!retrievedData || !retrievedData.stands || !retrievedData.steles) {
        throw new Error('Дані modelLists не отримані правильно');
      }
      
      if (retrievedData.stands.length !== 2 || retrievedData.steles.length !== 2) {
        throw new Error('Кількість моделей не відповідає очікуваній');
      }
    }, 'core');
    
    // Тест 3: Управління activeTab
    global.testRunner.addTest('StateManager управління activeTab', () => {
      if (!global.ProGran3.Core.StateManager) {
        throw new Error('StateManager модуль не доступний');
      }
      
      const originalTab = global.ProGran3.Core.StateManager.getActiveTab();
      
      // Тестуємо встановлення різних табів
      const testTabs = ['base', 'monument', 'gravestone', 'fence'];
      
      testTabs.forEach(tab => {
        const result = global.ProGran3.Core.StateManager.setActiveTab(tab);
        if (!result) {
          throw new Error(`Не вдалося встановити таб: ${tab}`);
        }
        
        const currentTab = global.ProGran3.Core.StateManager.getActiveTab();
        if (currentTab !== tab) {
          throw new Error(`Таб не встановлено правильно. Очікувався: ${tab}, отримано: ${currentTab}`);
        }
      });
      
      // Повертаємо оригінальний таб
      global.ProGran3.Core.StateManager.setActiveTab(originalTab);
    }, 'core');
    
    // Тест 4: Управління carouselState
    global.testRunner.addTest('StateManager управління carouselState', () => {
      if (!global.ProGran3.Core.StateManager) {
        throw new Error('StateManager модуль не доступний');
      }
      
      const testCategory = 'stands';
      const testState = { index: 5 };
      
      // Встановлюємо стан каруселі
      const result = global.ProGran3.Core.StateManager.setCarouselState(testCategory, testState);
      if (!result) {
        throw new Error('Не вдалося встановити carouselState');
      }
      
      // Отримуємо стан каруселі
      const retrievedState = global.ProGran3.Core.StateManager.getCarouselState();
      if (!retrievedState || !retrievedState[testCategory]) {
        throw new Error('Стан каруселі не отримано правильно');
      }
      
      if (retrievedState[testCategory].index !== 5) {
        throw new Error(`Індекс каруселі не відповідає очікуваному. Очікувався: 5, отримано: ${retrievedState[testCategory].index}`);
      }
    }, 'core');
    
    // Тест 5: Управління addedElements
    global.testRunner.addTest('StateManager управління addedElements', () => {
      if (!global.ProGran3.Core.StateManager) {
        throw new Error('StateManager модуль не доступний');
      }
      
      // Тестуємо встановлення елемента
      const result = global.ProGran3.Core.StateManager.setAddedElement('foundation', true);
      if (!result) {
        throw new Error('Не вдалося встановити addedElement');
      }
      
      // Отримуємо всі елементи
      const addedElements = global.ProGran3.Core.StateManager.getAddedElements();
      if (!addedElements || typeof addedElements.foundation !== 'boolean') {
        throw new Error('AddedElements не отримано правильно');
      }
      
      if (!addedElements.foundation) {
        throw new Error('Foundation елемент не встановлено як доданий');
      }
    }, 'core');
    
    // Тест 6: Управління currentUnit
    global.testRunner.addTest('StateManager управління currentUnit', () => {
      if (!global.ProGran3.Core.StateManager) {
        throw new Error('StateManager модуль не доступний');
      }
      
      const originalUnit = global.ProGran3.Core.StateManager.getCurrentUnit();
      
      // Тестуємо встановлення різних одиниць
      const testUnits = ['mm', 'cm'];
      
      testUnits.forEach(unit => {
        const result = global.ProGran3.Core.StateManager.setCurrentUnit(unit);
        if (!result) {
          throw new Error(`Не вдалося встановити одиницю: ${unit}`);
        }
        
        const currentUnit = global.ProGran3.Core.StateManager.getCurrentUnit();
        if (currentUnit !== unit) {
          throw new Error(`Одиниця не встановлена правильно. Очікувалась: ${unit}, отримана: ${currentUnit}`);
        }
      });
      
      // Повертаємо оригінальну одиницю
      global.ProGran3.Core.StateManager.setCurrentUnit(originalUnit);
    }, 'core');
    
    // Тест 7: Експорт та імпорт стану
    global.testRunner.addTest('StateManager експорт та імпорт стану', () => {
      if (!global.ProGran3.Core.StateManager) {
        throw new Error('StateManager модуль не доступний');
      }
      
      // Встановлюємо тестові дані
      global.ProGran3.Core.StateManager.setActiveTab('monument');
      global.ProGran3.Core.StateManager.setCurrentUnit('cm');
      global.ProGran3.Core.StateManager.setAddedElement('foundation', true);
      
      // Експортуємо стан
      const exportedState = global.ProGran3.Core.StateManager.exportState();
      if (!exportedState || !exportedState.timestamp) {
        throw new Error('Стан не експортовано правильно');
      }
      
      // Скидаємо стан
      global.ProGran3.Core.StateManager.resetState();
      
      // Імпортуємо стан
      const importResult = global.ProGran3.Core.StateManager.importState(exportedState);
      if (!importResult) {
        throw new Error('Стан не імпортовано правильно');
      }
      
      // Перевіряємо що стан відновлено
      const activeTab = global.ProGran3.Core.StateManager.getActiveTab();
      const currentUnit = global.ProGran3.Core.StateManager.getCurrentUnit();
      const addedElements = global.ProGran3.Core.StateManager.getAddedElements();
      
      if (activeTab !== 'monument') {
        throw new Error(`ActiveTab не відновлено. Очікувався: monument, отримано: ${activeTab}`);
      }
      
      if (currentUnit !== 'cm') {
        throw new Error(`CurrentUnit не відновлено. Очікувалась: cm, отримана: ${currentUnit}`);
      }
      
      if (!addedElements.foundation) {
        throw new Error('AddedElements не відновлено правильно');
      }
    }, 'core');
    
    // Тест 8: Зворотна сумісність
    global.testRunner.addTest('StateManager зворотна сумісність', () => {
      // Перевіряємо що глобальні змінні доступні
      if (typeof global.modelLists === 'undefined') {
        throw new Error('Глобальна змінна modelLists не доступна');
      }
      
      if (typeof global.carouselState === 'undefined') {
        throw new Error('Глобальна змінна carouselState не доступна');
      }
      
      if (typeof global.activeTab === 'undefined') {
        throw new Error('Глобальна змінна activeTab не доступна');
      }
      
      if (typeof global.addedElements === 'undefined') {
        throw new Error('Глобальна змінна addedElements не доступна');
      }
      
      if (typeof global.currentUnit === 'undefined') {
        throw new Error('Глобальна змінна currentUnit не доступна');
      }
    }, 'core');
    
  }
  
})(window);
