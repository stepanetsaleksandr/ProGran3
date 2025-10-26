// modules/ui/AccordionManager.js
// Менеджер акордеонів та UI елементів ProGran3

(function(global) {
  'use strict';
  
  // Створюємо namespace
  global.ProGran3 = global.ProGran3 || {};
  global.ProGran3.UI = global.ProGran3.UI || {};
  
  // Приватні змінні
  let isInitialized = false;
  
  // Публічні методи
  const AccordionManager = {
    // Ініціалізація floating labels
    initializeFloatingLabels: function() {
      const floatingInputs = document.querySelectorAll('.floating-label input');
      const floatingSelects = document.querySelectorAll('.floating-label select');
      
      // Обробка input елементів
      floatingInputs.forEach(input => {
        // Встановлюємо початковий стан для полів зі значеннями
        if (input.value && input.value.trim() !== '') {
          input.classList.add('has-value');
        }
        
        // Додаємо обробники подій
        input.addEventListener('focus', function() {
          this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
          this.parentElement.classList.remove('focused');
          if (this.value && this.value.trim() !== '') {
            this.classList.add('has-value');
          } else {
            this.classList.remove('has-value');
          }
        });
        
        input.addEventListener('input', function() {
          if (this.value && this.value.trim() !== '') {
            this.classList.add('has-value');
          } else {
            this.classList.remove('has-value');
          }
        });
      });
      
      // Обробка select елементів
      floatingSelects.forEach(select => {
        // Встановлюємо початковий стан для полів зі значеннями
        if (select.value && select.value.trim() !== '') {
          select.classList.add('has-value');
        }
        
        // Додаємо обробники подій
        select.addEventListener('focus', function() {
          this.parentElement.classList.add('focused');
        });
        
        select.addEventListener('blur', function() {
          this.parentElement.classList.remove('focused');
          if (this.value && this.value.trim() !== '') {
            this.classList.add('has-value');
          } else {
            this.classList.remove('has-value');
          }
        });
        
        select.addEventListener('change', function() {
          if (this.value && this.value.trim() !== '') {
            this.classList.add('has-value');
          } else {
            this.classList.remove('has-value');
          }
        });
      });
    },
    
    // Універсальна функція для акордеон поведінки в будь-якому табі
    toggleAccordionPanel: function(headerElement) {
      const panel = headerElement.closest('.panel');
      if (!panel) return;
      
      // Знаходимо батьківський таб
      const tab = panel.closest('.tab-content');
      if (!tab) return;
      
      // Знаходимо всі панелі в поточному табі
      const allPanels = tab.querySelectorAll('.panel');
      
      // Якщо поточна панель розгорнута, згортаємо її
      if (!panel.classList.contains('collapsed')) {
        panel.classList.add('collapsed');
        if (window.debugLog) {
          window.debugLog(`Панель згорнута (акордеон) в табі ${tab.id}`, 'info');
        }
        return;
      }
      
      // Згортаємо всі панелі в табі
      allPanels.forEach(p => {
        p.classList.add('collapsed');
      });
      
      // Розгортаємо поточну панель
      panel.classList.remove('collapsed');
      
      if (window.debugLog) {
        window.debugLog(`Панель розгорнута (акордеон) в табі ${tab.id}`, 'info');
      }
    },
    
    // Оновлення всіх відображень
    updateAllDisplays: function() {
      if (window.debugLog) {
        window.debugLog(`updateAllDisplays() викликано`, 'info');
      }
      
      const currentUnit = window.ProGran3 && window.ProGran3.Core && window.ProGran3.Core.StateManager 
        ? window.ProGran3.Core.StateManager.getCurrentUnit() 
        : (window.currentUnit || 'mm');
      
      const unitText = currentUnit === 'mm' ? 'мм' : 'см';
      
      // Оновлення відображення розмірів фундаменту
      const foundationDepth = document.getElementById('foundation-depth');
      const foundationWidth = document.getElementById('foundation-width');
      const foundationHeight = document.getElementById('foundation-height');
      const foundationDisplay = document.getElementById('foundation-dimensions-display');
      
      if (foundationDepth && foundationWidth && foundationHeight && foundationDisplay) {
        foundationDisplay.textContent = 
          `${foundationDepth.value}×${foundationWidth.value}×${foundationHeight.value} ${unitText}`;
      }
      
      // Оновлення відображення типу плитки
      const activeButton = document.querySelector('.tiling-mode-btn.active');
      const tilingDisplay = document.getElementById('tiling-type-display');
      if (activeButton && tilingDisplay) {
        tilingDisplay.textContent = activeButton.textContent;
      }
      
      // Оновлення відображення товщини облицювання
      const claddingThickness = document.getElementById('cladding-thickness');
      const claddingDisplay = document.getElementById('cladding-dimensions-display');
      if (claddingThickness && claddingDisplay) {
        claddingDisplay.textContent = `Товщина: ${claddingThickness.value} ${unitText}`;
      }
      
      // Оновлення відображення розмірів відмостки
      const blindAreaWidth = document.getElementById('blind-area-width');
      const blindAreaDepth = document.getElementById('blind-area-depth');
      const blindAreaDisplay = document.getElementById('blind-area-dimensions-display');
      
      if (blindAreaWidth && blindAreaDepth && blindAreaDisplay) {
        blindAreaDisplay.textContent = 
          `${blindAreaWidth.value}×${blindAreaDepth.value} ${unitText}`;
      }
      
      // Оновлення відображення розмірів огорожі
      this.updateFenceDisplays();
      
      // Оновлення відображення розмірів стели
      this.updateSteleDisplays();
    },
    
    // Оновлення відображень огорожі
    updateFenceDisplays: function() {
      const currentUnit = window.ProGran3 && window.ProGran3.Core && window.ProGran3.Core.StateManager 
        ? window.ProGran3.Core.StateManager.getCurrentUnit() 
        : (window.currentUnit || 'mm');
      
      const unitText = currentUnit === 'mm' ? 'мм' : 'см';
      
      // Кутова огорожа
      const cornerPostHeight = document.getElementById('fence-corner-post-height');
      const cornerPostSize = document.getElementById('fence-corner-post-size');
      const cornerSideHeight = document.getElementById('fence-corner-side-height');
      const cornerSideLength = document.getElementById('fence-corner-side-length');
      const cornerDisplay = document.getElementById('fence-corner-dimensions-display');
      
      if (cornerPostHeight && cornerPostSize && cornerSideHeight && cornerSideLength && cornerDisplay) {
        cornerDisplay.textContent = 
          `Стовп: ${cornerPostHeight.value}×${cornerPostSize.value}мм, Панель: ${cornerSideHeight.value}×${cornerSideLength.value}мм`;
      }
      
      // Периметральна огорожа
      const perimeterPostHeight = document.getElementById('fence-perimeter-post-height');
      const perimeterPostSize = document.getElementById('fence-perimeter-post-size');
      const perimeterDisplay = document.getElementById('fence-perimeter-dimensions-display');
      
      if (perimeterPostHeight && perimeterPostSize && perimeterDisplay) {
        perimeterDisplay.textContent = 
          `Стовп: ${perimeterPostHeight.value}×${perimeterPostSize.value}мм`;
      }
    },
    
    // Оновлення відображень стели
    updateSteleDisplays: function() {
      const currentUnit = window.ProGran3 && window.ProGran3.Core && window.ProGran3.Core.StateManager 
        ? window.ProGran3.Core.StateManager.getCurrentUnit() 
        : (window.currentUnit || 'mm');
      
      const unitText = currentUnit === 'mm' ? 'мм' : 'см';
      
      const steleWidth = document.getElementById('stele-width');
      const steleHeight = document.getElementById('stele-height');
      const steleDepth = document.getElementById('stele-depth');
      const steleDisplay = document.getElementById('stele-dimensions-display');
      
      if (steleWidth && steleHeight && steleDepth && steleDisplay) {
        steleDisplay.textContent = 
          `${steleWidth.value}×${steleHeight.value}×${steleDepth.value} ${unitText}`;
      }
    },
    
    // Оновлення всіх лейблів з одиницями вимірювання
    updateUnitLabels: function() {
      const currentUnit = window.ProGran3 && window.ProGran3.Core && window.ProGran3.Core.StateManager 
        ? window.ProGran3.Core.StateManager.getCurrentUnit() 
        : (window.currentUnit || 'mm');
      
      const unitText = currentUnit === 'mm' ? 'мм' : 'см';
      
      // Стела - масштабування
      const steleWidthLabel = document.getElementById('stele-width-label');
      const steleHeightLabel = document.getElementById('stele-height-label');
      const steleDepthLabel = document.getElementById('stele-depth-label');
      
      if (steleWidthLabel) {
        steleWidthLabel.textContent = `Ширина стели (${unitText})`;
      }
      if (steleHeightLabel) {
        steleHeightLabel.textContent = `Висота стели (${unitText})`;
      }
      if (steleDepthLabel) {
        steleDepthLabel.textContent = `Глибина стели (${unitText})`;
      }
      
      // Фундамент
      const foundationDepthLabel = document.getElementById('foundation-depth-label');
      const foundationWidthLabel = document.getElementById('foundation-width-label');
      const foundationHeightLabel = document.getElementById('foundation-height-label');
      
      if (foundationDepthLabel) foundationDepthLabel.textContent = `Довжина (${unitText})`;
      if (foundationWidthLabel) foundationWidthLabel.textContent = `Ширина (${unitText})`;
      if (foundationHeightLabel) foundationHeightLabel.textContent = `Висота (${unitText})`;
      
      // Плитка
      const tilingWidthLabel = document.getElementById('tiling-width-label');
      const tilingHeightLabel = document.getElementById('tiling-height-label');
      const tilingThicknessLabel = document.getElementById('tiling-thickness-label');
      
      if (tilingWidthLabel) tilingWidthLabel.textContent = `Ширина (${unitText})`;
      if (tilingHeightLabel) tilingHeightLabel.textContent = `Висота (${unitText})`;
      if (tilingThicknessLabel) tilingThicknessLabel.textContent = `Товщина (${unitText})`;
      
      // Облицювання
      const claddingThicknessLabel = document.getElementById('cladding-thickness-label');
      if (claddingThicknessLabel) claddingThicknessLabel.textContent = `Товщина (${unitText})`;
      
      // Відмостка
      const blindAreaWidthLabel = document.getElementById('blind-area-width-label');
      const blindAreaDepthLabel = document.getElementById('blind-area-depth-label');
      
      if (blindAreaWidthLabel) blindAreaWidthLabel.textContent = `Ширина (${unitText})`;
      if (blindAreaDepthLabel) blindAreaDepthLabel.textContent = `Довжина (${unitText})`;
      
      // Підставки
      const standsWidthLabel = document.getElementById('stands-width-label');
      const standsDepthLabel = document.getElementById('stands-depth-label');
      const standsHeightLabel = document.getElementById('stands-height-label');
      
      if (standsWidthLabel) standsWidthLabel.textContent = `Ширина (${unitText})`;
      if (standsDepthLabel) standsDepthLabel.textContent = `Довжина (${unitText})`;
      if (standsHeightLabel) standsHeightLabel.textContent = `Висота (${unitText})`;
      
      // Проміжки
      const gapsHeightLabel = document.getElementById('gaps-height-label');
      const gapsWidthLabel = document.getElementById('gaps-width-label');
      const gapsDepthLabel = document.getElementById('gaps-depth-label');
      
      if (gapsHeightLabel) gapsHeightLabel.textContent = `Висота проміжної (${unitText})`;
      if (gapsWidthLabel) gapsWidthLabel.textContent = `Ширина проміжної (${unitText})`;
      if (gapsDepthLabel) gapsDepthLabel.textContent = `Довжина проміжної (${unitText})`;
      
      // Відстань між стелами
      const steleDistanceLabel = document.getElementById('stele-distance-label');
      if (steleDistanceLabel) steleDistanceLabel.textContent = `Відстань між стелами (${unitText})`;
      
      // Центральна деталь
      const centralDetailWidthLabel = document.getElementById('central-detail-width-label');
      const centralDetailDepthLabel = document.getElementById('central-detail-depth-label');
      const centralDetailHeightLabel = document.getElementById('central-detail-height-label');
      
      if (centralDetailWidthLabel) centralDetailWidthLabel.textContent = `Ширина (${unitText})`;
      if (centralDetailDepthLabel) centralDetailDepthLabel.textContent = `Товщина (${unitText})`;
      if (centralDetailHeightLabel) centralDetailHeightLabel.textContent = `Висота (${unitText})`;
    },
    
    // Ініціалізація всіх UI компонентів
    init: function() {
      this.initializeFloatingLabels();
      isInitialized = true;
      
      if (window.debugLog) {
        window.debugLog('AccordionManager ініціалізовано', 'success');
      }
    },
    
    // Перевірка чи ініціалізовано
    isInitialized: function() {
      return isInitialized;
    }
  };
  
  // Експорт
  global.ProGran3.UI.AccordionManager = AccordionManager;
  
  // Зворотна сумісність - глобальні функції
  global.initializeFloatingLabels = function() {
    return AccordionManager.initializeFloatingLabels();
  };
  
  global.toggleAccordionPanel = function(headerElement) {
    return AccordionManager.toggleAccordionPanel(headerElement);
  };
  
  global.updateAllDisplays = function() {
    return AccordionManager.updateAllDisplays();
  };
  
  global.updateUnitLabels = function() {
    return AccordionManager.updateUnitLabels();
  };
  
})(window);
