// modules/ui/Tabs.js
// Система табів для ProGran3

(function(global) {
  'use strict';
  
  // Створюємо namespace
  global.ProGran3 = global.ProGran3 || {};
  global.ProGran3.UI = global.ProGran3.UI || {};
  
  // Приватні змінні
  let activeTab = 'base';
  let tabCallbacks = {};
  
  // Приватні функції
  function logTabAction(message, type = 'info') {
    if (global.ProGran3.Core.Logger) {
      global.ProGran3.Core.Logger.debugLog(message, type, 'Tabs');
    }
  }
  
  function validateTabName(tabName) {
    const validTabs = ['base', 'monument', 'gravestone', 'fence', 'materials', 'view'];
    return validTabs.includes(tabName);
  }
  
  function hideAllTabs() {
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => {
      tab.classList.remove('active');
    });
    
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.classList.remove('active');
    });
  }
  
  function showTab(tabName) {
    const selectedTab = document.getElementById(tabName + '-tab');
    if (selectedTab) {
      selectedTab.classList.add('active');
    }
    
    const selectedButton = document.querySelector(`[data-tab="${tabName}"]`);
    if (selectedButton) {
      selectedButton.classList.add('active');
    }
  }
  
  function updateCarouselsInActiveTab() {
    const activeTabContent = document.querySelector('.tab-content.active');
    if (!activeTabContent) return;
    
    const carousels = activeTabContent.querySelectorAll('.carousel-container');
    carousels.forEach(carousel => {
      const viewport = carousel.querySelector('.carousel-viewport');
      if (viewport) {
        // Тригеримо оновлення каруселі
        viewport.style.display = 'none';
        setTimeout(() => {
          viewport.style.display = 'block';
        }, 10);
      }
    });
  }
  
  function initializeCarouselsForTab(tabName) {
    logTabAction(`Ініціалізація каруселей для таба: ${tabName}`, 'info');
    
    const tabCarousels = {
      'base': ['stands', 'flowerbeds'],
      'monument': ['steles'],
      'gravestone': ['gravestones'],
      'fence': ['fence_decor'],
      'materials': [],
      'view': []
    };
    
    const carousels = tabCarousels[tabName] || [];
    
    carousels.forEach(category => {
      logTabAction(`Перевіряємо карусель ${category} для таба ${tabName}`, 'info');
      
      const trackElement = document.getElementById(`${category}-carousel-track`);
      const viewportElement = document.getElementById(`${category}-carousel-viewport`);
      
      if (trackElement && viewportElement && global.modelLists && global.modelLists[category]) {
        logTabAction(`Ініціалізуємо карусель ${category} для таба ${tabName}`, 'success');
        
        if (global.CarouselManager && global.CarouselManager.initialize) {
          global.CarouselManager.initialize(category);
        }
      } else {
        logTabAction(`Не знайдено елементи каруселі ${category} для таба ${tabName}`, 'error');
      }
    });
  }
  
  // Публічні функції
  function switchTab(tabName) {
    if (!validateTabName(tabName)) {
      logTabAction(`Невірний таб: ${tabName}`, 'error');
      return false;
    }
    
    if (activeTab === tabName) {
      logTabAction(`Таб ${tabName} вже активний`, 'info');
      return true;
    }
    
    const oldTab = activeTab;
    activeTab = tabName;
    
    // Оновлюємо StateManager якщо доступний
    if (global.ProGran3.Core.StateManager) {
      global.ProGran3.Core.StateManager.setActiveTab(tabName);
    }
    
    // Приховуємо всі таби
    hideAllTabs();
    
    // Показуємо вибраний таб
    showTab(tabName);
    
    logTabAction(`Переключення на таб: ${oldTab} -> ${tabName}`, 'info');
    
    // Оновлюємо каруселі в активному табі
    setTimeout(() => {
      updateCarouselsInActiveTab();
      initializeCarouselsForTab(tabName);
      
      // Спеціальна обробка для таба gravestone
      if (tabName === 'gravestone') {
        setTimeout(() => {
          logTabAction(`Спеціальна ініціалізація каруселі gravestones для таба gravestone`, 'info');
          if (global.CarouselManager && global.CarouselManager.hasCarousel && global.modelLists && global.modelLists['gravestones']) {
            const trackElement = document.getElementById('gravestones-carousel-track');
            const viewportElement = document.getElementById('gravestones-carousel-viewport');
            
            if (trackElement && viewportElement) {
              logTabAction(`Спеціально ініціалізуємо карусель gravestones для таба gravestone`, 'success');
              if (global.initializeGravestonesCarousel) {
                global.initializeGravestonesCarousel('gravestones');
              }
            } else {
              logTabAction(`Не знайдено елементи каруселі gravestones для таба gravestone`, 'error');
            }
          } else {
            logTabAction(`Карусель gravestones не доступна або немає моделей для таба gravestone`, 'warning');
          }
        }, 300);
      }
    }, 100);
    
    // Викликаємо callback якщо є
    if (tabCallbacks[tabName]) {
      try {
        tabCallbacks[tabName](tabName, oldTab);
      } catch (error) {
        logTabAction(`Помилка в callback для таба ${tabName}: ${error.message}`, 'error');
      }
    }
    
    return true;
  }
  
  function getActiveTab() {
    return activeTab;
  }
  
  function initializeTabs() {
    logTabAction(`Ініціалізація табів`, 'info');
    
    const tabNavigation = document.querySelector('.tabs-navigation');
    if (!tabNavigation) {
      logTabAction(`Не знайдено навігацію табів`, 'error');
      return false;
    }
    
    const tabContents = document.querySelectorAll('.tab-content');
    if (!tabContents.length) {
      logTabAction(`Не знайдено контент табів`, 'error');
      return false;
    }
    
    logTabAction(`Знайдено ${tabContents.length} табів`, 'success');
    
    // Додаємо обробники подій для кнопок табів
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      const tabName = button.dataset.tab;
      if (tabName && validateTabName(tabName)) {
        button.addEventListener('click', () => {
          logTabAction(`Переключення на таб: ${tabName}`, 'info');
          switchTab(tabName);
        });
      }
    });
    
    // Встановлюємо активний таб за замовчуванням
    switchTab(activeTab);
    
    logTabAction(`Таби ініціалізовані успішно`, 'success');
    return true;
  }
  
  function registerTabCallback(tabName, callback) {
    if (!validateTabName(tabName)) {
      logTabAction(`Невірний таб для callback: ${tabName}`, 'error');
      return false;
    }
    
    if (typeof callback !== 'function') {
      logTabAction(`Callback має бути функцією для таба: ${tabName}`, 'error');
      return false;
    }
    
    tabCallbacks[tabName] = callback;
    logTabAction(`Callback зареєстровано для таба: ${tabName}`, 'info');
    return true;
  }
  
  function unregisterTabCallback(tabName) {
    if (tabCallbacks[tabName]) {
      delete tabCallbacks[tabName];
      logTabAction(`Callback видалено для таба: ${tabName}`, 'info');
      return true;
    }
    return false;
  }
  
  function getTabCallbacks() {
    return { ...tabCallbacks };
  }
  
  // Експорт публічного API
  global.ProGran3.UI.Tabs = {
    switchTab: switchTab,
    getActiveTab: getActiveTab,
    initializeTabs: initializeTabs,
    updateCarouselsInActiveTab: updateCarouselsInActiveTab,
    initializeCarouselsForTab: initializeCarouselsForTab,
    registerTabCallback: registerTabCallback,
    unregisterTabCallback: unregisterTabCallback,
    getTabCallbacks: getTabCallbacks
  };
  
  // Зворотна сумісність - функції доступні глобально
  global.switchTab = switchTab;
  global.updateCarouselsInActiveTab = updateCarouselsInActiveTab;
  global.initializeCarouselsForTab = initializeCarouselsForTab;
  global.initializeTabs = initializeTabs;
  
  // Ініціалізація
  if (global.ProGran3.Core.Logger) {
    global.ProGran3.Core.Logger.debugLog('Tabs модуль завантажено', 'info', 'Tabs');
  }
  
})(window);
