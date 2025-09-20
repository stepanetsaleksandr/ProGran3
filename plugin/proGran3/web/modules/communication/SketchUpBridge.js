// modules/communication/SketchUpBridge.js
// Міст для комунікації з SketchUp

(function(global) {
  'use strict';
  
  // Створюємо namespace
  global.ProGran3 = global.ProGran3 || {};
  global.ProGran3.Communication = global.ProGran3.Communication || {};
  
  // Приватні змінні
  let isConnected = false;
  let availableMethods = [];
  let pendingPreviews = {};
  
  // Приватні функції
  function logBridgeAction(message, type = 'info') {
    if (global.ProGran3.Core.Logger) {
      global.ProGran3.Core.Logger.debugLog(message, type, 'SketchUpBridge');
    }
  }
  
  function checkConnection() {
    const wasConnected = isConnected;
    isConnected = !!(window.sketchup && typeof window.sketchup === 'object');
    
    if (isConnected !== wasConnected) {
      logBridgeAction(`З\'єднання з SketchUp: ${isConnected ? 'встановлено' : 'втрачено'}`, isConnected ? 'success' : 'error');
    }
    
    return isConnected;
  }
  
  function updateAvailableMethods() {
    if (!isConnected) {
      availableMethods = [];
      return;
    }
    
    const methods = [
      'add_foundation',
      'add_tiles',
      'add_side_cladding',
      'add_blind_area_uniform',
      'add_blind_area_custom',
      'add_model',
      'add_fence_decor',
      'add_fence_corner',
      'add_fence_perimeter',
      'add_lamp',
      'generate_web_preview',
      'get_stands_list',
      'ready'
    ];
    
    availableMethods = methods.filter(method => {
      return window.sketchup && typeof window.sketchup[method] === 'function';
    });
    
    logBridgeAction(`Доступні методи SketchUp: ${availableMethods.join(', ')}`, 'info');
  }
  
  // Публічні функції
  function initializeSketchUpBridge() {
    logBridgeAction('Ініціалізація SketchUp Bridge', 'info');
    
    checkConnection();
    updateAvailableMethods();
    
    // Встановлюємо глобальні обробники
    window.receiveWebPreview = receiveWebPreview;
    window.handlePreviewError = handlePreviewError;
    
    logBridgeAction('SketchUp Bridge ініціалізовано', 'success');
  }
  
  function isSketchUpConnected() {
    return checkConnection();
  }
  
  function callSketchUpMethod(methodName, ...params) {
    if (!checkConnection()) {
      logBridgeAction(`SketchUp не підключено для виклику методу: ${methodName}`, 'error');
      return false;
    }
    
    if (!availableMethods.includes(methodName)) {
      logBridgeAction(`Метод не доступний: ${methodName}`, 'error');
      return false;
    }
    
    try {
      logBridgeAction(`Виклик SketchUp методу: ${methodName} з параметрами: ${JSON.stringify(params)}`, 'info');
      const result = window.sketchup[methodName](...params);
      logBridgeAction(`SketchUp метод ${methodName} виконано успішно`, 'success');
      return result;
    } catch (error) {
      logBridgeAction(`Помилка виклику SketchUp методу ${methodName}: ${error.message}`, 'error');
      return false;
    }
  }
  
  function getModels(modelType) {
    if (!checkConnection()) {
      logBridgeAction(`SketchUp не підключено для отримання моделей: ${modelType}`, 'error');
      return [];
    }
    
    try {
      const models = callSketchUpMethod('get_models', modelType);
      logBridgeAction(`Отримано ${models ? models.length : 0} моделей типу: ${modelType}`, 'info');
      return models || [];
    } catch (error) {
      logBridgeAction(`Помилка отримання моделей ${modelType}: ${error.message}`, 'error');
      return [];
    }
  }
  
  function createFoundation(depth, width, height) {
    return callSketchUpMethod('add_foundation', depth, width, height);
  }
  
  function createUniformBlindArea(thickness, width) {
    return callSketchUpMethod('add_blind_area_uniform', thickness, width);
  }
  
  function createCustomBlindArea(thickness, north, south, east, west) {
    return callSketchUpMethod('add_blind_area_custom', thickness, north, south, east, west);
  }
  
  function createUniformTiling(thickness, borderWidth, overhang) {
    return callSketchUpMethod('add_tiles', 'uniform', thickness, borderWidth, overhang);
  }
  
  function createCustomTiling(thickness, modularThickness, modularSeam, modularOverhang) {
    return callSketchUpMethod('add_tiles', 'custom', thickness, modularThickness, modularSeam, modularOverhang);
  }
  
  function createUniformCladding(thickness) {
    return callSketchUpMethod('add_side_cladding', thickness);
  }
  
  function createCustomCladding(thickness) {
    return callSketchUpMethod('add_side_cladding', thickness);
  }
  
  function addStand(category, filename) {
    return callSketchUpMethod('add_model', category, filename);
  }
  
  function addStele(category, filename) {
    return callSketchUpMethod('add_model', category, filename);
  }
  
  function addFlowerbed(category, filename) {
    return callSketchUpMethod('add_model', category, filename);
  }
  
  function addGravestone(category, filename) {
    return callSketchUpMethod('add_model', category, filename);
  }
  
  function addFenceDecor(filename) {
    return callSketchUpMethod('add_fence_decor', filename);
  }
  
  function addFenceCorner(postHeight, postWidth, postDepth, sideHeight, sideLength, sideThickness, decorativeSize) {
    return callSketchUpMethod('add_fence_corner', postHeight, postWidth, postDepth, sideHeight, sideLength, sideThickness, decorativeSize);
  }
  
  function addFencePerimeter(postHeight, postWidth, postDepth, northCount, southCount, eastWestCount, decorativeHeight, decorativeThickness) {
    return callSketchUpMethod('add_fence_perimeter', postHeight, postWidth, postDepth, northCount, southCount, eastWestCount, decorativeHeight, decorativeThickness);
  }
  
  function addLamp(category, filename, position) {
    return callSketchUpMethod('add_lamp', category, filename, position);
  }
  
  function generateWebPreview(componentPath) {
    if (!checkConnection()) {
      logBridgeAction(`SketchUp не підключено для генерації превью: ${componentPath}`, 'error');
      return false;
    }
    
    try {
      logBridgeAction(`Запуск генерації превью для: ${componentPath}`, 'info');
      const result = callSketchUpMethod('generate_web_preview', componentPath);
      
      if (result) {
        logBridgeAction(`Превью запрошено для: ${componentPath}`, 'success');
      } else {
        logBridgeAction(`Не вдалося запросити превью для: ${componentPath}`, 'error');
      }
      
      return result;
    } catch (error) {
      logBridgeAction(`Помилка генерації превью ${componentPath}: ${error.message}`, 'error');
      return false;
    }
  }
  
  function receiveWebPreview(componentPath, base64Data) {
    logBridgeAction(`Отримано превью для: ${componentPath}`, 'info');
    logBridgeAction(`Розмір base64 даних: ${base64Data ? base64Data.length : 0} символів`, 'info');
    
    if (!base64Data) {
      logBridgeAction(`Порожні base64 дані для: ${componentPath}`, 'error');
      return;
    }
    
    const pendingData = pendingPreviews[componentPath];
    if (!pendingData) {
      logBridgeAction(`Не знайдено pending дані для: ${componentPath}`, 'error');
      logBridgeAction(`Доступні pending: ${Object.keys(pendingPreviews).join(', ')}`, 'error');
      return;
    }
    
    const { filename, source, item, loadingDiv } = pendingData;
    logBridgeAction(`Знайдено pending дані для: ${filename} (${source})`, 'success');
    
    try {
      // Створюємо зображення
      const img = new Image();
      img.onload = function() {
        // Видаляємо loading indicator
        if (loadingDiv && loadingDiv.parentNode) {
          loadingDiv.parentNode.removeChild(loadingDiv);
          logBridgeAction(`Видалено loading indicator для: ${filename}`, 'info');
        }
        
        // Додаємо зображення
        if (item) {
          item.appendChild(img);
          item.dataset.status = 'loaded';
          logBridgeAction(`Зображення додано для: ${filename}`, 'success');
        }
      };
      
      img.onerror = function() {
        logBridgeAction(`Помилка: base64 дані не є валідним зображенням для: ${filename}`, 'error');
        
        // Показуємо повідомлення про помилку
        if (loadingDiv) {
          loadingDiv.textContent = `Помилка завантаження\n${filename}`;
          loadingDiv.className = 'loading-indicator error';
        }
        
        // Очищуємо pending
        delete pendingPreviews[componentPath];
      };
      
      // Перевіряємо чи base64 дані вже містять префікс
      let imageSrc;
      if (base64Data.startsWith('data:image/')) {
        imageSrc = base64Data;
      } else {
        // Додаємо префікс та перевіряємо чи це валідний base64
        const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
        if (base64Pattern.test(base64Data)) {
          imageSrc = `data:image/png;base64,${base64Data}`;
        } else {
          logBridgeAction(`Невалідний base64 формат для: ${filename}`, 'error');
          throw new Error('Invalid base64 format');
        }
      }
      
      img.src = imageSrc;
      img.className = 'carousel-preview';
      
    } catch (error) {
      logBridgeAction(`Помилка обробки превью для ${filename}: ${error.message}`, 'error');
    }
    
    // Очищуємо pending
    delete pendingPreviews[componentPath];
    logBridgeAction(`Очищено pending для: ${componentPath}`, 'info');
  }
  
  function handlePreviewError(componentPath, errorMessage) {
    logBridgeAction(`Помилка превью для ${componentPath}: ${errorMessage}`, 'error');
    
    const pendingData = pendingPreviews[componentPath];
    if (pendingData) {
      const { filename, item, loadingDiv } = pendingData;
      
      // Показуємо повідомлення про помилку
      if (loadingDiv) {
        loadingDiv.textContent = `Помилка: ${errorMessage}`;
        loadingDiv.className = 'loading-indicator error';
      }
      
      // Очищуємо pending
      delete pendingPreviews[componentPath];
    }
  }
  
  function addPendingPreview(componentPath, filename, source, item, loadingDiv) {
    pendingPreviews[componentPath] = {
      filename: filename,
      source: source,
      item: item,
      loadingDiv: loadingDiv,
      timestamp: new Date().toISOString()
    };
    
    logBridgeAction(`Додано до pending: ${componentPath} (${source})`, 'info');
    logBridgeAction(`Загальна кількість pending: ${Object.keys(pendingPreviews).length}`, 'info');
  }
  
  function getConnectionStatus() {
    return {
      isConnected: isConnected,
      availableMethods: [...availableMethods],
      pendingPreviews: Object.keys(pendingPreviews).length
    };
  }
  
  function cleanupOldPendingPreviews() {
    const now = new Date();
    const maxAge = 5 * 60 * 1000; // 5 хвилин
    
    let cleanedCount = 0;
    for (const [path, data] of Object.entries(pendingPreviews)) {
      const age = now - new Date(data.timestamp);
      if (age > maxAge) {
        delete pendingPreviews[path];
        cleanedCount++;
        logBridgeAction(`Очищено старий pending: ${path} (вік: ${Math.round(age/1000)}с)`, 'info');
      }
    }
    
    if (cleanedCount > 0) {
      logBridgeAction(`Очищено ${cleanedCount} старих pending записів`, 'info');
    }
  }
  
  function resetSketchUpBridge() {
    isConnected = false;
    availableMethods = [];
    pendingPreviews = {};
    
    logBridgeAction('SketchUp Bridge скинуто', 'info');
  }
  
  function isMethodAvailable(methodName) {
    return availableMethods.includes(methodName);
  }
  
  function getAvailableMethods() {
    return [...availableMethods];
  }
  
  // Експорт публічного API
  global.ProGran3.Communication.SketchUpBridge = {
    initializeSketchUpBridge: initializeSketchUpBridge,
    isSketchUpConnected: isSketchUpConnected,
    callSketchUpMethod: callSketchUpMethod,
    getModels: getModels,
    createFoundation: createFoundation,
    createUniformBlindArea: createUniformBlindArea,
    createCustomBlindArea: createCustomBlindArea,
    createUniformTiling: createUniformTiling,
    createCustomTiling: createCustomTiling,
    createUniformCladding: createUniformCladding,
    createCustomCladding: createCustomCladding,
    addStand: addStand,
    addStele: addStele,
    addFlowerbed: addFlowerbed,
    addGravestone: addGravestone,
    addFenceDecor: addFenceDecor,
    addFenceCorner: addFenceCorner,
    addFencePerimeter: addFencePerimeter,
    addLamp: addLamp,
    generateWebPreview: generateWebPreview,
    receiveWebPreview: receiveWebPreview,
    handlePreviewError: handlePreviewError,
    addPendingPreview: addPendingPreview,
    getConnectionStatus: getConnectionStatus,
    resetSketchUpBridge: resetSketchUpBridge,
    cleanupOldPendingPreviews: cleanupOldPendingPreviews,
    isMethodAvailable: isMethodAvailable,
    getAvailableMethods: getAvailableMethods
  };
  
  // Зворотна сумісність - функції доступні глобально
  global.receiveWebPreview = receiveWebPreview;
  global.handlePreviewError = handlePreviewError;
  
  // Ініціалізація
  if (global.ProGran3.Core.Logger) {
    global.ProGran3.Core.Logger.debugLog('SketchUpBridge модуль завантажено', 'info', 'SketchUpBridge');
  }
  
  // Очищуємо старі pending записи при завантаженні
  cleanupOldPendingPreviews();
  
})(window);
