// modules/core/GlobalState.js
// Глобальний стан ProGran3

(function(global) {
  'use strict';
  
  // Створюємо namespace
  global.ProGran3 = global.ProGran3 || {};
  global.ProGran3.Core = global.ProGran3.Core || {};
  
  // Приватні змінні стану
  let modelLists = {};
  let carouselState = {
    stands: { index: 0, gaps: false },
    steles: { index: 0, type: 'single', distance: 200, centralDetail: false, centralDetailWidth: 200, centralDetailDepth: 50, centralDetailHeight: 1200, modelCreated: false },
    flowerbeds: { index: 0 },
    gravestones: { index: 0 },
    fence_decor: { index: 0 }
  };
  let activeTab = 'base';
  let addedElements = {
    foundation: false,
    tiles: false,
    blindArea: false,
    fenceCorner: false,
    fencePerimeter: false,
    stands: false,
    steles: false,
    flowerbeds: false,
    gravestones: false,
    lamps: false,
    fenceDecor: false
  };
  let currentUnit = 'mm';
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
  
  // Публічні методи для доступу до стану
  const GlobalState = {
    // Отримання стану
    getModelLists: () => modelLists,
    getCarouselState: () => carouselState,
    getActiveTab: () => activeTab,
    getAddedElements: () => addedElements,
    getCurrentUnit: () => currentUnit,
    getCurrentTheme: () => currentTheme,
    getCurrentAccent: () => currentAccent,
    getCurrentPreviewData: () => currentPreviewData,
    getPreviewSettings: () => previewSettings,
    getOriginalSteleDimensions: () => originalSteleDimensions,
    getCurrentSteleDimensions: () => currentSteleDimensions,
    
    // Встановлення стану
    setModelLists: (value) => { modelLists = value; },
    setCarouselState: (value) => { carouselState = value; },
    setActiveTab: (value) => { activeTab = value; },
    setAddedElements: (value) => { addedElements = value; },
    setCurrentUnit: (value) => { currentUnit = value; },
    setCurrentTheme: (value) => { currentTheme = value; },
    setCurrentAccent: (value) => { currentAccent = value; },
    setCurrentPreviewData: (value) => { currentPreviewData = value; },
    setPreviewSettings: (value) => { previewSettings = value; },
    setOriginalSteleDimensions: (value) => { originalSteleDimensions = value; },
    setCurrentSteleDimensions: (value) => { currentSteleDimensions = value; },
    
    // Оновлення частини стану
    updateCarouselState: (category, updates) => {
      if (carouselState[category]) {
        carouselState[category] = { ...carouselState[category], ...updates };
      }
    },
    
    updateAddedElements: (element, value) => {
      addedElements[element] = value;
    },
    
    // Скидання стану
    reset: () => {
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
        tiles: false,
        blindArea: false,
        fenceCorner: false,
        fencePerimeter: false,
        stands: false,
        steles: false,
        flowerbeds: false,
        gravestones: false,
        lamps: false,
        fenceDecor: false
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
    },
    
    // Експорт/імпорт стану
    exportState: () => ({
      modelLists,
      carouselState,
      activeTab,
      addedElements,
      currentUnit,
      currentTheme,
      currentAccent,
      previewSettings
    }),
    
    importState: (state) => {
      if (state.modelLists) modelLists = state.modelLists;
      if (state.carouselState) carouselState = state.carouselState;
      if (state.activeTab) activeTab = state.activeTab;
      if (state.addedElements) addedElements = state.addedElements;
      if (state.currentUnit) currentUnit = state.currentUnit;
      if (state.currentTheme) currentTheme = state.currentTheme;
      if (state.currentAccent) currentAccent = state.currentAccent;
      if (state.previewSettings) previewSettings = state.previewSettings;
    }
  };
  
  // Експорт
  global.ProGran3.Core.GlobalState = GlobalState;
  
  // Зворотна сумісність - глобальні змінні
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
  
})(window);
