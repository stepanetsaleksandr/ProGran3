// proGran3/web/src/index.js
// Точка входу для модульної архітектури ProGran3

// Імпорт модулів
import { Logger, debugLog, clearDebugLog } from './modules/utils/Logger.js';
import { 
    changeUnit,
  getCurrentUnit,
  updateUnitLabels,
  initializeUnits, 
  updateThicknessButtons, 
  updateSeamButtons,
  formatValue,
  convertToMm,
  getAllInputValues,
  convertAllValues,
  convertValue,
  toggleUnit
} from './modules/utils/Units.js';
import { 
  switchTab, 
  updateCarouselsInActiveTab, 
  initializeTabs 
} from './modules/ui/Tabs.js';
import { 
  togglePanel, 
  advanceToNextPanel, 
  initializeFloatingLabels 
} from './modules/ui/Panels.js';
import { 
  addFoundation,
  getFoundationDimensions,
  isFoundationAdded,
  resetFoundation,
  getFoundationInfo
} from './modules/builders/FoundationBuilder.js';
import { 
  addBlindArea,
  selectBlindAreaMode,
  getSelectedBlindAreaMode,
  updateBlindAreaControls,
  isBlindAreaAdded,
  resetBlindArea,
  getBlindAreaInfo
} from './modules/builders/BlindAreaBuilder.js';
import { 
  addTiling,
  selectTilingMode,
  getSelectedTilingMode,
  updateTilingControls,
  isTilingAdded,
  resetTiling,
  getTilingInfo
} from './modules/builders/TilingBuilder.js';
import { 
  addCladding,
  selectCladdingMode,
  getSelectedCladdingMode,
  updateCladdingControls,
  isCladdingAdded,
  resetCladding,
  getCladdingInfo
} from './modules/builders/CladdingBuilder.js';
import { 
  initializeCarousel,
  nextModel,
  prevModel,
  selectModel,
  getCurrentModel,
  getCurrentIndex,
  getModelCount,
  resetCarousel,
  updateCarouselsInActiveTab,
  getCurrentModelInfo
} from './modules/ui/CarouselManager.js';
import { 
  createPreview,
  createPreviewGrid,
  updatePreview,
  selectPreview,
  clearPreviewCache,
  isPreviewLoaded,
  getCacheStats,
  preloadPreviews
} from './modules/ui/CarouselPreview.js';
import { 
  initializeSketchUpBridge,
  isSketchUpConnected,
  callSketchUpMethod,
  getModels,
  createFoundation,
  createUniformBlindArea,
  createCustomBlindArea,
  createUniformTiling,
  createCustomTiling,
  createUniformCladding,
  createCustomCladding,
  addStand,
  addStele,
  addFlowerbed,
  addGravestone,
  getConnectionStatus,
  resetSketchUpBridge,
  isMethodAvailable,
  getAvailableMethods
} from './modules/communication/SketchUpBridge.js';
import { 
  registerCallback,
  invokeCallback,
  invokeAsyncCallback,
  unregisterCallback,
  hasCallback,
  getCallback,
  addEventListener,
  removeEventListener,
  dispatchEvent,
  registerAsyncCallback,
  invokeAsyncCallbackByName,
  getCallbackHistory,
  clearCallbackHistory,
  getCallbackStats,
  getAllCallbacks,
  getAllAsyncCallbacks,
  getAllEvents,
  invokeMultipleCallbacks,
  resetCallbacks
} from './modules/communication/Callbacks.js';

// Глобальні змінні (зберігаємо для зворотної сумісності)
let modelLists = {};
let carouselState = {
  stands: { index: 0 },
  steles: { index: 0 },
  flowerbeds: { index: 0 },
  gravestones: { index: 0 }
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
  fence_perimeter: false
};

// Експорт глобальних змінних для зворотної сумісності
window.modelLists = modelLists;
window.carouselState = carouselState;
window.activeTab = activeTab;
window.addedElements = addedElements;

// Експорт функцій для зворотної сумісності
window.debugLog = debugLog;
window.clearDebugLog = clearDebugLog;
window.changeUnit = changeUnit;
window.toggleUnit = toggleUnit;
window.updateUnitToggleButtons = updateUnitToggleButtons;
window.getCurrentUnit = getCurrentUnit;
window.updateUnitLabels = updateUnitLabels;
window.updateThicknessButtons = updateThicknessButtons;
window.updateSeamButtons = updateSeamButtons;
window.formatValue = formatValue;
window.convertToMm = convertToMm;
window.getAllInputValues = getAllInputValues;
window.convertAllValues = convertAllValues;
window.convertValue = convertValue;
window.switchTab = switchTab;
window.updateCarouselsInActiveTab = updateCarouselsInActiveTab;
window.initializeTabs = initializeTabs;
window.togglePanel = togglePanel;
window.advanceToNextPanel = advanceToNextPanel;
window.initializeFloatingLabels = initializeFloatingLabels;
window.addFoundation = addFoundation;
window.getFoundationDimensions = getFoundationDimensions;
window.isFoundationAdded = isFoundationAdded;
window.resetFoundation = resetFoundation;
window.getFoundationInfo = getFoundationInfo;
window.addBlindArea = addBlindArea;
window.selectBlindAreaMode = selectBlindAreaMode;
window.getSelectedBlindAreaMode = getSelectedBlindAreaMode;
window.updateBlindAreaControls = updateBlindAreaControls;
window.isBlindAreaAdded = isBlindAreaAdded;
window.resetBlindArea = resetBlindArea;
window.getBlindAreaInfo = getBlindAreaInfo;
window.addTiling = addTiling;
window.selectTilingMode = selectTilingMode;
window.getSelectedTilingMode = getSelectedTilingMode;
window.updateTilingControls = updateTilingControls;
window.isTilingAdded = isTilingAdded;
window.resetTiling = resetTiling;
window.getTilingInfo = getTilingInfo;
window.addCladding = addCladding;
window.selectCladdingMode = selectCladdingMode;
window.getSelectedCladdingMode = getSelectedCladdingMode;
window.updateCladdingControls = updateCladdingControls;
window.isCladdingAdded = isCladdingAdded;
window.resetCladding = resetCladding;
window.getCladdingInfo = getCladdingInfo;
window.initializeCarousel = initializeCarousel;
window.nextModel = nextModel;
window.prevModel = prevModel;
window.selectModel = selectModel;
window.getCurrentModel = getCurrentModel;
window.getCurrentIndex = getCurrentIndex;
window.getModelCount = getModelCount;
window.resetCarousel = resetCarousel;
window.updateCarouselsInActiveTab = updateCarouselsInActiveTab;
window.getCurrentModelInfo = getCurrentModelInfo;
window.createPreview = createPreview;
window.createPreviewGrid = createPreviewGrid;
window.updatePreview = updatePreview;
window.selectPreview = selectPreview;
window.clearPreviewCache = clearPreviewCache;
window.isPreviewLoaded = isPreviewLoaded;
window.getCacheStats = getCacheStats;
window.preloadPreviews = preloadPreviews;
window.initializeSketchUpBridge = initializeSketchUpBridge;
window.isSketchUpConnected = isSketchUpConnected;
window.callSketchUpMethod = callSketchUpMethod;
window.getModels = getModels;
window.createFoundation = createFoundation;
window.createUniformBlindArea = createUniformBlindArea;
window.createCustomBlindArea = createCustomBlindArea;
window.createUniformTiling = createUniformTiling;
window.createCustomTiling = createCustomTiling;
window.createUniformCladding = createUniformCladding;
window.createCustomCladding = createCustomCladding;
window.addStand = addStand;
window.addStele = addStele;
window.addFlowerbed = addFlowerbed;
window.getConnectionStatus = getConnectionStatus;
window.resetSketchUpBridge = resetSketchUpBridge;
window.isMethodAvailable = isMethodAvailable;
window.getAvailableMethods = getAvailableMethods;
window.registerCallback = registerCallback;
window.invokeCallback = invokeCallback;
window.invokeAsyncCallback = invokeAsyncCallback;
window.unregisterCallback = unregisterCallback;
window.hasCallback = hasCallback;
window.getCallback = getCallback;
window.addEventListener = addEventListener;
window.removeEventListener = removeEventListener;
window.dispatchEvent = dispatchEvent;
window.registerAsyncCallback = registerAsyncCallback;
window.invokeAsyncCallbackByName = invokeAsyncCallbackByName;
window.getCallbackHistory = getCallbackHistory;
window.clearCallbackHistory = clearCallbackHistory;
window.getCallbackStats = getCallbackStats;
window.getAllCallbacks = getAllCallbacks;
window.getAllAsyncCallbacks = getAllAsyncCallbacks;
window.getAllEvents = getAllEvents;
window.invokeMultipleCallbacks = invokeMultipleCallbacks;
window.resetCallbacks = resetCallbacks;

// Ініціалізація модульної архітектури
Logger.debug('🚀 Модульна архітектура ProGran3 завантажена', 'success');

// Експорт для використання в інших модулях
export {
  Logger,
  debugLog,
  clearDebugLog,
  changeUnit,
  getCurrentUnit,
  updateUnitLabels,
  updateThicknessButtons,
  updateSeamButtons,
  formatValue,
  convertToMm,
  getAllInputValues,
  convertAllValues,
  convertValue,
  switchTab,
  updateCarouselsInActiveTab,
  initializeTabs,
  togglePanel,
  advanceToNextPanel,
  initializeFloatingLabels,
  addFoundation,
  getFoundationDimensions,
  isFoundationAdded,
  resetFoundation,
  getFoundationInfo,
  addBlindArea,
  selectBlindAreaMode,
  getSelectedBlindAreaMode,
  updateBlindAreaControls,
  isBlindAreaAdded,
  resetBlindArea,
  getBlindAreaInfo,
  addTiling,
  selectTilingMode,
  getSelectedTilingMode,
  updateTilingControls,
  isTilingAdded,
  resetTiling,
  getTilingInfo,
  addCladding,
  selectCladdingMode,
  getSelectedCladdingMode,
  updateCladdingControls,
  isCladdingAdded,
  resetCladding,
  getCladdingInfo,
  initializeCarousel,
  nextModel,
  prevModel,
  selectModel,
  getCurrentModel,
  getCurrentIndex,
  getModelCount,
  resetCarousel,
  updateCarouselsInActiveTab,
  getCurrentModelInfo,
  createPreview,
  createPreviewGrid,
  updatePreview,
  selectPreview,
  clearPreviewCache,
  isPreviewLoaded,
  getCacheStats,
  preloadPreviews,
  initializeSketchUpBridge,
  isSketchUpConnected,
  callSketchUpMethod,
  getModels,
  createFoundation,
  createUniformBlindArea,
  createCustomBlindArea,
  createUniformTiling,
  createCustomTiling,
  createUniformCladding,
  createCustomCladding,
  addStand,
  addStele,
  addFlowerbed,
  addGravestone,
  getConnectionStatus,
  resetSketchUpBridge,
  isMethodAvailable,
  getAvailableMethods,
  registerCallback,
  invokeCallback,
  invokeAsyncCallback,
  unregisterCallback,
  hasCallback,
  getCallback,
  addEventListener,
  removeEventListener,
  dispatchEvent,
  registerAsyncCallback,
  invokeAsyncCallbackByName,
  getCallbackHistory,
  clearCallbackHistory,
  getCallbackStats,
  getAllCallbacks,
  getAllAsyncCallbacks,
  getAllEvents,
  invokeMultipleCallbacks,
  resetCallbacks,
  modelLists,
  carouselState,
  activeTab,
  addedElements,
  initializeUnits,
  updateUnitToggleButtons
};

// Глобальні змінні для теми
let currentTheme = 'light';
let currentAccent = 'blue';

// Функція перемикання теми
function toggleTheme() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.classList.toggle('dark', currentTheme === 'dark');
  localStorage.setItem('theme', currentTheme);

  // Update header text to show current theme
  const header = document.querySelector('header h1');
  if (header) {
    header.textContent = 'ProGran';
  }
}

// Функція ініціалізації теми
function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  const savedAccent = localStorage.getItem('accent') || 'blue';

  currentTheme = savedTheme;
  currentAccent = savedAccent;

  document.documentElement.classList.toggle('dark', currentTheme === 'dark');
  document.documentElement.setAttribute('data-accent', currentAccent);

  // Set initial header text
  const header = document.querySelector('header h1');
  if (header) {
    header.textContent = 'ProGran';
  }
}

// Ініціалізація при завантаженні DOM
document.addEventListener('DOMContentLoaded', function() {
  // Ініціалізація теми
  initializeTheme();
  
  // Ініціалізація перемикача одиниць
  initializeUnits();
});

// Експорт глобальних функцій
window.initializeTheme = initializeTheme;
window.initializeUnits = initializeUnits;
window.toggleTheme = toggleTheme;
