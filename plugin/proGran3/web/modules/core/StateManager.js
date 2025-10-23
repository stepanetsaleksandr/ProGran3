// modules/core/StateManager.js
// Управління глобальним станом ProGran3

(function(global) {
  'use strict';
  
  // Створюємо namespace
  global.ProGran3 = global.ProGran3 || {};
  global.ProGran3.Core = global.ProGran3.Core || {};
  
  // Приватні змінні (інкапсуляція)
  let modelLists = {};
  let carouselState = {
    stands: { index: 0 },
    steles: { index: 0 },
    flowerbeds: { index: 0 },
    gravestones: { index: 0 },
    fence_decor: { index: 0 }
  };
  let activeTab = 'base';
  let addedElements = {
    foundation: false,
    tiling: false,
    cladding: false,
    blindArea: false,
    stands: false,
    flowerbeds: false,
    gravestones: false,
    steles: false,
    fence_corner: false,
    fence_perimeter: false,
    blind_area: false,
    tiles: false,
    pavement_tiles: false
  };
  let currentUnit = 'mm';
  
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
  
  // Публічні функції
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
  
  // Memory cleanup function
  function cleanup() {
    logStateChange('cleanup', 'Memory cleanup initiated');
    
    // Reset all state variables to defaults
    modelLists = {};
    carouselState = {
      stands: { index: 0 },
      steles: { index: 0 },
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
      stands: false,
      flowerbeds: false,
      gravestones: false,
      steles: false,
      fence_corner: false,
      fence_perimeter: false,
      blind_area: false,
      tiles: false,
      pavement_tiles: false
    };
    currentUnit = 'mm';
    
    logStateChange('cleanup', 'Memory cleanup completed');
  }
  
  // Memory usage monitoring
  function getMemoryUsage() {
    const stateSize = JSON.stringify({
      modelLists,
      carouselState,
      activeTab,
      addedElements,
      currentUnit
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
      stands: { index: 0 },
      steles: { index: 0 },
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
      stands: false,
      flowerbeds: false,
      gravestones: false,
      steles: false,
      fence_corner: false,
      fence_perimeter: false,
      blind_area: false,
      tiles: false,
      pavement_tiles: false
    };
    currentUnit = 'mm';
    logStateChange('resetState');
  }
  
  function exportState() {
    return {
      modelLists: getModelLists(),
      carouselState: getCarouselState(),
      activeTab: getActiveTab(),
      addedElements: getAddedElements(),
      currentUnit: getCurrentUnit(),
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
  
  // Експорт публічного API
  global.ProGran3.Core.StateManager = {
    getModelLists: getModelLists,
    setModelLists: setModelLists,
    getCarouselState: getCarouselState,
    setCarouselState: setCarouselState,
    getActiveTab: getActiveTab,
    setActiveTab: setActiveTab,
    getAddedElements: getAddedElements,
    setAddedElement: setAddedElement,
    getCurrentUnit: getCurrentUnit,
    setCurrentUnit: setCurrentUnit,
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
  
  // Ініціалізація
  if (global.ProGran3.Core.Logger) {
    global.ProGran3.Core.Logger.debugLog('StateManager модуль завантажено', 'info', 'StateManager');
  }
  
})(window);
