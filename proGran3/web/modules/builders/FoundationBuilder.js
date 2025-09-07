// modules/builders/FoundationBuilder.js
// Будівельник фундаменту для ProGran3

(function(global) {
  'use strict';
  
  // Створюємо namespace
  global.ProGran3 = global.ProGran3 || {};
  global.ProGran3.Builders = global.ProGran3.Builders || {};
  
  // Приватні змінні
  let foundationData = {
    depth: 2000,
    width: 1000,
    height: 150,
    unit: 'mm'
  };
  
  // Приватні функції
  function logFoundationAction(message, type = 'info') {
    if (global.ProGran3.Core.Logger) {
      global.ProGran3.Core.Logger.debugLog(message, type, 'FoundationBuilder');
    }
  }
  
  function validateFoundationData(data) {
    if (!global.ProGran3.Utils.Validation) {
      logFoundationAction('Validation модуль не доступний', 'error');
      return { isValid: false, errors: ['Validation модуль не доступний'] };
    }
    
    return global.ProGran3.Utils.Validation.validateFoundationData(data);
  }
  
  function getFoundationInputs() {
    return {
      depth: document.getElementById('foundation-depth')?.value || '0',
      width: document.getElementById('foundation-width')?.value || '0',
      height: document.getElementById('foundation-height')?.value || '0'
    };
  }
  
  function updateFoundationDisplay() {
    const depthDisplay = document.getElementById('foundation-dimensions-display');
    if (depthDisplay && global.ProGran3.Utils.Units) {
      const currentUnit = global.ProGran3.Utils.Units.getCurrentUnit();
      const depth = global.ProGran3.Utils.Units.convertValue(foundationData.depth, 'mm', currentUnit);
      const width = global.ProGran3.Utils.Units.convertValue(foundationData.width, 'mm', currentUnit);
      const height = global.ProGran3.Utils.Units.convertValue(foundationData.height, 'mm', currentUnit);
      
      depthDisplay.textContent = `${global.ProGran3.Utils.Units.formatValue(depth)}×${global.ProGran3.Utils.Units.formatValue(width)}×${global.ProGran3.Utils.Units.formatValue(height)} ${currentUnit}`;
    }
  }
  
  function callSketchUpMethod(methodName, ...params) {
    if (window.sketchup && window.sketchup[methodName]) {
      try {
        logFoundationAction(`Виклик SketchUp методу: ${methodName}`, 'info');
        return window.sketchup[methodName](...params);
      } catch (error) {
        logFoundationAction(`Помилка виклику SketchUp методу ${methodName}: ${error.message}`, 'error');
        return false;
      }
    } else {
      logFoundationAction(`SketchUp метод не доступний: ${methodName}`, 'error');
      return false;
    }
  }
  
  // Публічні функції
  function addFoundation() {
    logFoundationAction('Початок створення фундаменту', 'info');
    
    // Отримуємо дані з форми
    const inputs = getFoundationInputs();
    
    // Валідуємо дані
    const validation = validateFoundationData(inputs);
    if (!validation.isValid) {
      logFoundationAction(`Помилки валідації: ${validation.errors.join(', ')}`, 'error');
      showError(`Помилки валідації: ${validation.errors.join(', ')}`);
      return false;
    }
    
    // Оновлюємо внутрішні дані
    foundationData = {
      depth: validation.data.depth,
      width: validation.data.width,
      height: validation.data.height,
      unit: global.ProGran3.Utils.Units ? global.ProGran3.Utils.Units.getCurrentUnit() : 'mm'
    };
    
    logFoundationAction(`Дані фундаменту: ${foundationData.depth}×${foundationData.width}×${foundationData.height} ${foundationData.unit}`, 'info');
    
    // Викликаємо SketchUp метод
    const success = callSketchUpMethod('add_foundation', foundationData.depth, foundationData.width, foundationData.height);
    
    if (success) {
      // Оновлюємо стан
      if (global.ProGran3.Core.StateManager) {
        global.ProGran3.Core.StateManager.setAddedElement('foundation', true);
      }
      
      // Оновлюємо відображення
      updateFoundationDisplay();
      
      logFoundationAction('Фундамент успішно створено', 'success');
      showSuccess('Фундамент успішно створено');
      
      // Переходимо до наступної панелі
      if (global.ProGran3.UI.Panels) {
        const currentButton = document.querySelector('#foundation-panel button[onclick*="addFoundation"]');
        if (currentButton) {
          global.ProGran3.UI.Panels.advanceToNextPanel(currentButton);
        }
      }
      
      return true;
    } else {
      logFoundationAction('Не вдалося створити фундамент', 'error');
      showError('Не вдалося створити фундамент');
      return false;
    }
  }
  
  function getFoundationDimensions() {
    return { ...foundationData };
  }
  
  function setFoundationDimensions(dimensions) {
    if (!dimensions || typeof dimensions !== 'object') {
      logFoundationAction('Невірні дані для встановлення розмірів фундаменту', 'error');
      return false;
    }
    
    const validation = validateFoundationData(dimensions);
    if (!validation.isValid) {
      logFoundationAction(`Помилки валідації розмірів: ${validation.errors.join(', ')}`, 'error');
      return false;
    }
    
    foundationData = {
      depth: validation.data.depth,
      width: validation.data.width,
      height: validation.data.height,
      unit: global.ProGran3.Utils.Units ? global.ProGran3.Utils.Units.getCurrentUnit() : 'mm'
    };
    
    // Оновлюємо поля форми
    const depthInput = document.getElementById('foundation-depth');
    const widthInput = document.getElementById('foundation-width');
    const heightInput = document.getElementById('foundation-height');
    
    if (depthInput) depthInput.value = foundationData.depth;
    if (widthInput) widthInput.value = foundationData.width;
    if (heightInput) heightInput.value = foundationData.height;
    
    // Оновлюємо відображення
    updateFoundationDisplay();
    
    logFoundationAction(`Розміри фундаменту оновлено: ${foundationData.depth}×${foundationData.width}×${foundationData.height}`, 'info');
    return true;
  }
  
  function isFoundationAdded() {
    if (global.ProGran3.Core.StateManager) {
      const addedElements = global.ProGran3.Core.StateManager.getAddedElements();
      return addedElements.foundation || false;
    }
    return false;
  }
  
  function resetFoundation() {
    foundationData = {
      depth: 2000,
      width: 1000,
      height: 150,
      unit: 'mm'
    };
    
    // Скидаємо поля форми
    const depthInput = document.getElementById('foundation-depth');
    const widthInput = document.getElementById('foundation-width');
    const heightInput = document.getElementById('foundation-height');
    
    if (depthInput) depthInput.value = foundationData.depth;
    if (widthInput) widthInput.value = foundationData.width;
    if (heightInput) heightInput.value = foundationData.height;
    
    // Оновлюємо стан
    if (global.ProGran3.Core.StateManager) {
      global.ProGran3.Core.StateManager.setAddedElement('foundation', false);
    }
    
    // Оновлюємо відображення
    updateFoundationDisplay();
    
    logFoundationAction('Фундамент скинуто до значень за замовчуванням', 'info');
  }
  
  function getFoundationInfo() {
    return {
      data: getFoundationDimensions(),
      isAdded: isFoundationAdded(),
      timestamp: new Date().toISOString()
    };
  }
  
  function showError(message) {
    // Простий показ помилки (можна розширити)
    if (global.ProGran3.Core.Logger) {
      global.ProGran3.Core.Logger.debugLog(`Помилка: ${message}`, 'error', 'FoundationBuilder');
    }
    console.error('FoundationBuilder Error:', message);
  }
  
  function showSuccess(message) {
    // Простий показ успіху (можна розширити)
    if (global.ProGran3.Core.Logger) {
      global.ProGran3.Core.Logger.debugLog(`Успіх: ${message}`, 'info', 'FoundationBuilder');
    }
    console.log('FoundationBuilder Success:', message);
  }
  
  // Експорт публічного API
  global.ProGran3.Builders.FoundationBuilder = {
    addFoundation: addFoundation,
    getFoundationDimensions: getFoundationDimensions,
    setFoundationDimensions: setFoundationDimensions,
    isFoundationAdded: isFoundationAdded,
    resetFoundation: resetFoundation,
    getFoundationInfo: getFoundationInfo
  };
  
  // Зворотна сумісність - функції доступні глобально
  global.addFoundation = addFoundation;
  
  // Ініціалізація
  if (global.ProGran3.Core.Logger) {
    global.ProGran3.Core.Logger.debugLog('FoundationBuilder модуль завантажено', 'info', 'FoundationBuilder');
  }
  
})(window);
