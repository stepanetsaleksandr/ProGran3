// modules/core/StateManager.js
// Об'єднаний StateManager - управління глобальним станом ProGran3
// v3.2.1 - Об'єднано з GlobalState.js

(function(global) {
  'use strict';
  
  // Створюємо namespace
  global.ProGran3 = global.ProGran3 || {};
  global.ProGran3.Core = global.ProGran3.Core || {};
  
  // Приватні змінні (інкапсуляція) - об'єднані з обох файлів
  let modelLists = {};
  let carouselState = {
    stands: { index: 0, gaps: false }, // З GlobalState (більш повний)
    steles: { index: 0, type: 'single', distance: 200, centralDetail: false, centralDetailWidth: 200, centralDetailDepth: 50, centralDetailHeight: 1200, modelCreated: false }, // З GlobalState
    flowerbeds: { index: 0 },
    gravestones: { index: 0 },
    fence_decor: { index: 0 }
  };
  let activeTab = 'base';
  let addedElements = {
    // Об'єднані поля з обох файлів
    foundation: false,
    tiling: false,
    cladding: false,
    blindArea: false,
    fenceCorner: false, // З GlobalState
    fencePerimeter: false, // З GlobalState
    stands: false,
    steles: false,
    flowerbeds: false,
    gravestones: false,
    lamps: false, // З GlobalState
    fenceDecor: false, // З GlobalState
    fence_corner: false, // З StateManager
    fence_perimeter: false, // З StateManager
    blind_area: false, // З StateManager
    tiles: false, // З StateManager
    pavement_tiles: false // З StateManager
  };
  let currentUnit = 'mm';
  
  // Додаткові змінні з GlobalState
  let currentTheme = 'light';
  let currentAccent = 'blue';
  let currentPreviewData = null;
  let previewSettings = {
    width: 256,
    height: 256,
    quality: 0.8
  };
  let originalSteleDimensions = null;
  let currentSteleDimensions = null;
  
  // Приватні функції
  function validateState(state) {
    if (typeof state !== 'object' || state === null) {
      return false;
    }
    return true;
  }
  
  function logStateChange(operation, data) {
    if (global.ProGran3.Core.Logger) {
      global.ProGran3.Core.Logger.debugLog(
        `StateManager: ${operation}`, 
        'info', 
        'StateManager'
      );
    }
  }
  
  // Публічні функції - об'єднані з обох файлів
  function getModelLists() {
    return { ...modelLists }; // Повертаємо копію
  }
  
  function setModelLists(newModelLists) {
    if (validateState(newModelLists)) {
      modelLists = { ...newModelLists };
      logStateChange('setModelLists', Object.keys(modelLists));
      return true;
    }
    return false;
  }
  
  function getCarouselState() {
    return JSON.parse(JSON.stringify(carouselState)); // Глибока копія
  }
  
  function setCarouselState(category, state) {
    if (carouselState.hasOwnProperty(category) && validateState(state)) {
      carouselState[category] = { ...state };
      logStateChange(`setCarouselState(${category})`, state);
      return true;
    }
    return false;
  }
  
  // Додаткова функція з GlobalState
  function updateCarouselState(category, updates) {
    if (carouselState[category]) {
      carouselState[category] = { ...carouselState[category], ...updates };
      logStateChange(`updateCarouselState(${category})`, updates);
      return true;
    }
    return false;
  }
  
  function getActiveTab() {
    return activeTab;
  }
  
  function setActiveTab(tabName) {
    if (typeof tabName === 'string' && tabName.length > 0) {
      const oldTab = activeTab;
      activeTab = tabName;
      logStateChange(`setActiveTab(${oldTab} -> ${tabName})`);
      return true;
    }
    return false;
  }
  
  function getAddedElements() {
    return { ...addedElements }; // Повертаємо копію
  }
  
  function setAddedElement(element, value) {
    if (addedElements.hasOwnProperty(element) && typeof value === 'boolean') {
      addedElements[element] = value;
      logStateChange(`setAddedElement(${element}, ${value})`);
      return true;
    }
    return false;
  }
  
  // Додаткова функція з GlobalState
  function updateAddedElements(element, value) {
    if (addedElements.hasOwnProperty(element)) {
      addedElements[element] = value;
      logStateChange(`updateAddedElements(${element}, ${value})`);
      return true;
    }
    return false;
  }
  
  function getCurrentUnit() {
    return currentUnit;
  }
  
  function setCurrentUnit(unit) {
    if (unit === 'mm' || unit === 'cm') {
      const oldUnit = currentUnit;
      currentUnit = unit;
      logStateChange(`setCurrentUnit(${oldUnit} -> ${unit})`);
      return true;
    }
    return false;
  }
  
  // Додаткові функції з GlobalState
  function getCurrentTheme() {
    return currentTheme;
  }
  
  function setCurrentTheme(theme) {
    if (theme === 'light' || theme === 'dark') {
      const oldTheme = currentTheme;
      currentTheme = theme;
      logStateChange(`setCurrentTheme(${oldTheme} -> ${theme})`);
      return true;
    }
    return false;
  }
  
  function getCurrentAccent() {
    return currentAccent;
  }
  
  function setCurrentAccent(accent) {
    if (typeof accent === 'string') {
      const oldAccent = currentAccent;
      currentAccent = accent;
      logStateChange(`setCurrentAccent(${oldAccent} -> ${accent})`);
      return true;
    }
    return false;
  }
  
  function getCurrentPreviewData() {
    return currentPreviewData;
  }
  
  function setCurrentPreviewData(data) {
    currentPreviewData = data;
    logStateChange('setCurrentPreviewData', data ? 'data set' : 'data cleared');
    return true;
  }
  
  function getPreviewSettings() {
    return { ...previewSettings };
  }
  
  function setPreviewSettings(settings) {
    if (validateState(settings)) {
      previewSettings = { ...settings };
      logStateChange('setPreviewSettings', settings);
      return true;
    }
    return false;
  }
  
  function getOriginalSteleDimensions() {
    return originalSteleDimensions;
  }
  
  function setOriginalSteleDimensions(dimensions) {
    originalSteleDimensions = dimensions;
    logStateChange('setOriginalSteleDimensions', dimensions ? 'dimensions set' : 'dimensions cleared');
    return true;
  }
  
  function getCurrentSteleDimensions() {
    return currentSteleDimensions;
  }
  
  function setCurrentSteleDimensions(dimensions) {
    currentSteleDimensions = dimensions;
    logStateChange('setCurrentSteleDimensions', dimensions ? 'dimensions set' : 'dimensions cleared');
    return true;
  }
  
  // Memory cleanup function
  function cleanup() {
    logStateChange('cleanup', 'Memory cleanup initiated');
    
    // Reset all state variables to defaults
    modelLists = {};
    carouselState = {
      stands: { index: 0, gaps: false },
      steles: { index: 0, type: 'single', distance: 200, centralDetail: false, centralDetailWidth: 200, centralDetailDepth: 50, centralDetailHeight: 1200, modelCreated: false },
      flowerbeds: { index: 0 },
      gravestones: { index: 0 },
      fence_decor: { index: 0 }
    };
    activeTab = 'base';
    addedElements = {
      foundation: false,
      tiling: false,
      cladding: false,
      blindArea: false,
      fenceCorner: false,
      fencePerimeter: false,
      stands: false,
      steles: false,
      flowerbeds: false,
      gravestones: false,
      lamps: false,
      fenceDecor: false,
      fence_corner: false,
      fence_perimeter: false,
      blind_area: false,
      tiles: false,
      pavement_tiles: false
    };
    currentUnit = 'mm';
    currentTheme = 'light';
    currentAccent = 'blue';
    currentPreviewData = null;
    previewSettings = {
      width: 256,
      height: 256,
      quality: 0.8
    };
    originalSteleDimensions = null;
    currentSteleDimensions = null;
    
    logStateChange('cleanup', 'Memory cleanup completed');
  }
  
  // Memory usage monitoring
  function getMemoryUsage() {
    const stateSize = JSON.stringify({
      modelLists,
      carouselState,
      activeTab,
      addedElements,
      currentUnit,
      currentTheme,
      currentAccent,
      currentPreviewData,
      previewSettings,
      originalSteleDimensions,
      currentSteleDimensions
    }).length;
    
    return {
      stateSize: stateSize,
      modelListsCount: Object.keys(modelLists).length,
      carouselCategories: Object.keys(carouselState).length,
      addedElementsCount: Object.keys(addedElements).filter(k => addedElements[k]).length
    };
  }
  
  function resetState() {
    modelLists = {};
    carouselState = {
      stands: { index: 0, gaps: false },
      steles: { index: 0, type: 'single', distance: 200, centralDetail: false, centralDetailWidth: 200, centralDetailDepth: 50, centralDetailHeight: 1200, modelCreated: false },
      flowerbeds: { index: 0 },
      gravestones: { index: 0 },
      fence_decor: { index: 0 }
    };
    activeTab = 'base';
    addedElements = {
      foundation: false,
      tiling: false,
      cladding: false,
      blindArea: false,
      fenceCorner: false,
      fencePerimeter: false,
      stands: false,
      steles: false,
      flowerbeds: false,
      gravestones: false,
      lamps: false,
      fenceDecor: false,
      fence_corner: false,
      fence_perimeter: false,
      blind_area: false,
      tiles: false,
      pavement_tiles: false
    };
    currentUnit = 'mm';
    currentTheme = 'light';
    currentAccent = 'blue';
    currentPreviewData = null;
    previewSettings = {
      width: 256,
      height: 256,
      quality: 0.8
    };
    originalSteleDimensions = null;
    currentSteleDimensions = null;
    logStateChange('resetState');
  }
  
  function exportState() {
    return {
      modelLists: getModelLists(),
      carouselState: getCarouselState(),
      activeTab: getActiveTab(),
      addedElements: getAddedElements(),
      currentUnit: getCurrentUnit(),
      currentTheme: getCurrentTheme(),
      currentAccent: getCurrentAccent(),
      currentPreviewData: getCurrentPreviewData(),
      previewSettings: getPreviewSettings(),
      originalSteleDimensions: getOriginalSteleDimensions(),
      currentSteleDimensions: getCurrentSteleDimensions(),
      timestamp: new Date().toISOString()
    };
  }
  
  function importState(stateData) {
    if (!validateState(stateData)) {
      return false;
    }
    
    try {
      if (stateData.modelLists) setModelLists(stateData.modelLists);
      if (stateData.activeTab) setActiveTab(stateData.activeTab);
      if (stateData.addedElements) {
        Object.keys(stateData.addedElements).forEach(key => {
          setAddedElement(key, stateData.addedElements[key]);
        });
      }
      if (stateData.currentUnit) setCurrentUnit(stateData.currentUnit);
      if (stateData.carouselState) {
        Object.keys(stateData.carouselState).forEach(category => {
          setCarouselState(category, stateData.carouselState[category]);
        });
      }
      if (stateData.currentTheme) setCurrentTheme(stateData.currentTheme);
      if (stateData.currentAccent) setCurrentAccent(stateData.currentAccent);
      if (stateData.currentPreviewData) setCurrentPreviewData(stateData.currentPreviewData);
      if (stateData.previewSettings) setPreviewSettings(stateData.previewSettings);
      if (stateData.originalSteleDimensions) setOriginalSteleDimensions(stateData.originalSteleDimensions);
      if (stateData.currentSteleDimensions) setCurrentSteleDimensions(stateData.currentSteleDimensions);
      
      logStateChange('importState', { timestamp: stateData.timestamp });
      return true;
    } catch (error) {
      if (global.ProGran3.Core.Logger) {
        global.ProGran3.Core.Logger.debugLog(
          `Помилка імпорту стану: ${error.message}`, 
          'error', 
          'StateManager'
        );
      }
      return false;
    }
  }
  
  // Експорт публічного API - об'єднаний з обох файлів
  global.ProGran3.Core.StateManager = {
    // Основні функції з StateManager
    getModelLists: getModelLists,
    setModelLists: setModelLists,
    getCarouselState: getCarouselState,
    setCarouselState: setCarouselState,
    updateCarouselState: updateCarouselState, // З GlobalState
    getActiveTab: getActiveTab,
    setActiveTab: setActiveTab,
    getAddedElements: getAddedElements,
    setAddedElement: setAddedElement,
    updateAddedElements: updateAddedElements, // З GlobalState
    getCurrentUnit: getCurrentUnit,
    setCurrentUnit: setCurrentUnit,
    
    // Додаткові функції з GlobalState
    getCurrentTheme: getCurrentTheme,
    setCurrentTheme: setCurrentTheme,
    getCurrentAccent: getCurrentAccent,
    setCurrentAccent: setCurrentAccent,
    getCurrentPreviewData: getCurrentPreviewData,
    setCurrentPreviewData: setCurrentPreviewData,
    getPreviewSettings: getPreviewSettings,
    setPreviewSettings: setPreviewSettings,
    getOriginalSteleDimensions: getOriginalSteleDimensions,
    setOriginalSteleDimensions: setOriginalSteleDimensions,
    getCurrentSteleDimensions: getCurrentSteleDimensions,
    setCurrentSteleDimensions: setCurrentSteleDimensions,
    
    // Утилітарні функції
    resetState: resetState,
    exportState: exportState,
    importState: importState,
    cleanup: cleanup,
    getMemoryUsage: getMemoryUsage
  };
  
  // Зворотна сумісність - змінні доступні глобально
  global.modelLists = modelLists;
  global.carouselState = carouselState;
  global.activeTab = activeTab;
  global.addedElements = addedElements;
  global.currentUnit = currentUnit;
  global.currentTheme = currentTheme;
  global.currentAccent = currentAccent;
  global.currentPreviewData = currentPreviewData;
  global.previewSettings = previewSettings;
  global.originalSteleDimensions = originalSteleDimensions;
  global.currentSteleDimensions = currentSteleDimensions;
  
  // Ініціалізація
  if (global.ProGran3.Core.Logger) {
    global.ProGran3.Core.Logger.debugLog('StateManager модуль завантажено (об\'єднаний з GlobalState)', 'info', 'StateManager');
  }
  
})(window);