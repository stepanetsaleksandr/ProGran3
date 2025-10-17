// modules/ui/SummaryTable.js
// Система оновлення таблиці підсумку для ProGran3

(function(global) {
  'use strict';
  
  // Створюємо namespace
  global.ProGran3 = global.ProGran3 || {};
  global.ProGran3.UI = global.ProGran3.UI || {};
  
  // Приватні функції
  function logSummaryAction(message, type = 'info') {
    if (global.ProGran3.Core.Logger) {
      global.ProGran3.Core.Logger.debugLog(message, type, 'SummaryTable');
    }
  }
  
  function safeGetElement(id) {
    const element = document.getElementById(id);
    if (!element) {
      logSummaryAction(`Елемент не знайдено: ${id}`, 'warn');
    }
    return element;
  }
  
  function safeSetTextContent(element, text) {
    if (element) {
      element.textContent = text;
      return true;
    }
    return false;
  }
  
  function updateFoundationSummary(addedElements, currentUnit) {
    const unitText = currentUnit === 'mm' ? 'мм' : 'см';
    
    if (addedElements.foundation) {
      const foundationDepthEl = safeGetElement('foundation-depth');
      const foundationWidthEl = safeGetElement('foundation-width');
      const foundationHeightEl = safeGetElement('foundation-height');
      const summaryFoundationEl = safeGetElement('summary-foundation');
      
      if (foundationDepthEl && foundationWidthEl && foundationHeightEl && summaryFoundationEl) {
        const foundationDepth = foundationDepthEl.value;
        const foundationWidth = foundationWidthEl.value;
        const foundationHeight = foundationHeightEl.value;
        safeSetTextContent(summaryFoundationEl, 
          `${foundationDepth}×${foundationWidth}×${foundationHeight} ${unitText}`);
      }
    } else {
      safeSetTextContent(safeGetElement('summary-foundation'), '--');
    }
  }
  
  function updateTilingSummary(addedElements) {
    // Не оновлюємо автоматично - тільки через детальну специфікацію
    // Якщо користувач не натиснув кнопку, показуємо базову інфо
    if (addedElements.tiling) {
      const summaryTilingEl = safeGetElement('summary-tiling');
      if (summaryTilingEl && summaryTilingEl.textContent === '--') {
        const activeButton = document.querySelector('.tiling-mode-btn.active');
        if (activeButton) {
          safeSetTextContent(summaryTilingEl, activeButton.textContent + ' (оновіть для деталей)');
        }
      }
    } else {
      const summaryTilingEl = safeGetElement('summary-tiling');
      if (summaryTilingEl && !summaryTilingEl.textContent.includes('см')) {
        safeSetTextContent(summaryTilingEl, '--');
      }
    }
  }
  
  function updateCladdingSummary(addedElements, currentUnit) {
    const unitText = currentUnit === 'mm' ? 'мм' : 'см';
    
    if (addedElements.cladding) {
      const claddingThicknessEl = safeGetElement('cladding-thickness');
      const summaryCladdingEl = safeGetElement('summary-cladding');
      if (claddingThicknessEl && summaryCladdingEl) {
        const claddingThickness = claddingThicknessEl.value;
        safeSetTextContent(summaryCladdingEl, 
          `Товщина: ${claddingThickness} ${unitText}`);
      }
    } else {
      safeSetTextContent(safeGetElement('summary-cladding'), '--');
    }
  }
  
  function updateBlindAreaSummary(addedElements, currentUnit) {
    const unitText = currentUnit === 'mm' ? 'мм' : 'см';
    
    if (addedElements.blindArea) {
      const blindAreaThicknessEl = safeGetElement('blind-area-thickness');
      const blindAreaModeEl = safeGetElement('blind-area-mode');
      const summaryBlindAreaEl = safeGetElement('summary-blind-area');
      
      if (blindAreaThicknessEl && blindAreaModeEl && summaryBlindAreaEl) {
        const blindAreaThickness = blindAreaThicknessEl.value;
        const blindAreaMode = blindAreaModeEl.value;
        
        if (blindAreaMode === 'uniform') {
          const uniformWidthEl = safeGetElement('blind-area-uniform-width');
          if (uniformWidthEl) {
            const uniformWidth = uniformWidthEl.value;
            safeSetTextContent(summaryBlindAreaEl, 
              `Ширина: ${uniformWidth} ${unitText}, Товщина: ${blindAreaThickness} ${unitText}`);
          }
        } else {
          const blindAreaNorthEl = safeGetElement('blind-area-north');
          const blindAreaSouthEl = safeGetElement('blind-area-south');
          const blindAreaEastEl = safeGetElement('blind-area-east');
          const blindAreaWestEl = safeGetElement('blind-area-west');
          
          if (blindAreaNorthEl && blindAreaSouthEl && blindAreaEastEl && blindAreaWestEl) {
            const blindAreaNorth = blindAreaNorthEl.value;
            const blindAreaSouth = blindAreaSouthEl.value;
            const blindAreaEast = blindAreaEastEl.value;
            const blindAreaWest = blindAreaWestEl.value;
            safeSetTextContent(summaryBlindAreaEl, 
              `П:${blindAreaNorth} Пд:${blindAreaSouth} С:${blindAreaEast} З:${blindAreaWest} ${unitText}, Т:${blindAreaThickness} ${unitText}`);
          }
        }
      }
    } else {
      safeSetTextContent(safeGetElement('summary-blind-area'), '--');
    }
  }
  
  function updateCarouselItemSummary(addedElements, carouselState, modelLists, elementType, summaryId) {
    if (addedElements[elementType] && carouselState[elementType] && modelLists[elementType]) {
      const filename = modelLists[elementType][carouselState[elementType].index];
      const summaryEl = safeGetElement(summaryId);
      if (summaryEl) {
        safeSetTextContent(summaryEl, 
          filename ? filename.replace('.skp', '') : '--');
      }
    } else {
      safeSetTextContent(safeGetElement(summaryId), '--');
    }
  }
  
  function updateFenceCornerSummary(addedElements, currentUnit) {
    const unitText = currentUnit === 'mm' ? 'мм' : 'см';
    
    if (addedElements.fence_corner) {
      const postHeightEl = safeGetElement('fence-corner-post-height');
      const postSizeEl = safeGetElement('fence-corner-post-size');
      const sideHeightEl = safeGetElement('fence-corner-side-height');
      const sideLengthEl = safeGetElement('fence-corner-side-length');
      const summaryFenceCornerEl = safeGetElement('summary-fence-corner');
      
      if (postHeightEl && postSizeEl && sideHeightEl && sideLengthEl && summaryFenceCornerEl) {
        const postHeight = postHeightEl.value;
        const postSize = postSizeEl.value;
        const sideHeight = sideHeightEl.value;
        const sideLength = sideLengthEl.value;
        const decorativeSize = 100; // Фіксоване значення
        
        safeSetTextContent(summaryFenceCornerEl, 
          `Стовп: ${postHeight}×${postSize}×${postSize}${unitText}, Панель: ${sideHeight}×${sideLength}${unitText}, Декор: ${decorativeSize}${unitText}`);
      }
    } else {
      safeSetTextContent(safeGetElement('summary-fence-corner'), '--');
    }
  }
  
  function updateFencePerimeterSummary(addedElements, currentUnit) {
    const unitText = currentUnit === 'mm' ? 'мм' : 'см';
    
    if (addedElements.fence_perimeter) {
      const postHeightEl = safeGetElement('fence-perimeter-post-height');
      const postSizeEl = safeGetElement('fence-perimeter-post-size');
      const northCountEl = safeGetElement('fence-perimeter-north-count');
      const southCountEl = safeGetElement('fence-perimeter-south-count');
      const eastWestCountEl = safeGetElement('fence-perimeter-east-west-count');
      const summaryFencePerimeterEl = safeGetElement('summary-fence-perimeter');
      
      if (postHeightEl && postSizeEl && northCountEl && southCountEl && eastWestCountEl && summaryFencePerimeterEl) {
        const postHeight = postHeightEl.value;
        const postSize = postSizeEl.value;
        const northCount = northCountEl.value;
        const southCount = southCountEl.value;
        const eastWestCount = eastWestCountEl.value;
        const decorativeHeight = 100; // Фіксоване значення
        const decorativeThickness = 100; // Фіксоване значення
        
        safeSetTextContent(summaryFencePerimeterEl, 
          `Стовп: ${postHeight}×${postSize}×${postSize}${unitText}, Сторони: З${northCount} В${southCount} Б${eastWestCount}, Декор: ${decorativeHeight}×${decorativeThickness}${unitText}`);
      }
    } else {
      safeSetTextContent(safeGetElement('summary-fence-perimeter'), '--');
    }
  }
  
  function updateStandsSummary(addedElements, currentUnit) {
    const unitText = currentUnit === 'mm' ? 'мм' : 'см';
    const summaryStands = safeGetElement('summary-stands');
    
    if (summaryStands) {
      if (addedElements.stands) {
        const heightEl = safeGetElement('stands-height');
        const widthEl = safeGetElement('stands-width');
        const depthEl = safeGetElement('stands-depth');
        
        if (heightEl && widthEl && depthEl) {
          const height = heightEl.value;
          const width = widthEl.value;
          const depth = depthEl.value;
          safeSetTextContent(summaryStands, `${height}×${width}×${depth} ${unitText}`);
        } else {
          safeSetTextContent(summaryStands, 'Додано');
        }
      } else {
        safeSetTextContent(summaryStands, '--');
      }
    }
  }
  
  // Публічні функції
  function updateSummaryTable() {
    try {
      logSummaryAction('updateSummaryTable() викликано', 'info');
      
      // Отримуємо поточний стан
      const addedElements = global.ProGran3.Core.StateManager ? 
        global.ProGran3.Core.StateManager.getAddedElements() : 
        global.addedElements || {};
      
      const currentUnit = global.ProGran3.Utils.Units ? 
        global.ProGran3.Utils.Units.getCurrentUnit() : 
        global.currentUnit || 'mm';
      
      const carouselState = global.ProGran3.Core.StateManager ? 
        global.ProGran3.Core.StateManager.getCarouselState() : 
        global.carouselState || {};
      
      const modelLists = global.ProGran3.Core.StateManager ? 
        global.ProGran3.Core.StateManager.getModelLists() : 
        global.modelLists || {};
      
      // Оновлюємо тільки ті секції що не використовують детальну специфікацію
      updateFoundationSummary(addedElements, currentUnit);
      updateBlindAreaSummary(addedElements, currentUnit);
      updateFenceCornerSummary(addedElements, currentUnit);
      updateFencePerimeterSummary(addedElements, currentUnit);
      
      // Автоматично запитуємо детальну специфікацію для інших елементів
      if (addedElements.tiling || addedElements.cladding || addedElements.stands || 
          addedElements.steles || addedElements.flowerbeds || addedElements.gravestones) {
        logSummaryAction('Автоматичний запит детальної специфікації', 'info');
        setTimeout(() => refreshDetailedSummary(), 100);
      }
      
      logSummaryAction('updateSummaryTable() завершено успішно', 'success');
      
    } catch (error) {
      logSummaryAction(`Помилка в updateSummaryTable(): ${error.message}`, 'error');
      logSummaryAction(`Stack trace: ${error.stack}`, 'error');
    }
  }
  
  function getSummaryData() {
    const summaryData = {};
    
    const summaryElements = [
      'summary-foundation', 'summary-tiling', 'summary-cladding', 'summary-blind-area',
      'summary-stand', 'summary-flowerbed', 'summary-gravestone', 'summary-stele',
      'summary-fence-corner', 'summary-fence-perimeter', 'summary-fence-decor', 'summary-stands'
    ];
    
    summaryElements.forEach(id => {
      const element = safeGetElement(id);
      if (element) {
        summaryData[id] = element.textContent;
      }
    });
    
    return summaryData;
  }
  
  function clearSummaryTable() {
    const summaryElements = [
      'summary-foundation', 'summary-tiling', 'summary-cladding', 'summary-blind-area',
      'summary-stand', 'summary-flowerbed', 'summary-gravestone', 'summary-stele',
      'summary-fence-corner', 'summary-fence-perimeter', 'summary-fence-decor', 'summary-stands'
    ];
    
    summaryElements.forEach(id => {
      safeSetTextContent(safeGetElement(id), '--');
    });
    
    logSummaryAction('SummaryTable очищено', 'info');
  }
  
  // Оновлення детальної специфікації з Ruby
  function updateDetailedSummary(data) {
    try {
      logSummaryAction('updateDetailedSummary() викликано з даними: ' + JSON.stringify(data), 'info');
      console.log('📊 Детальна специфікація:', data);
      
      const categories = [
        // Фундамент, огорожі, відмостку НЕ оновлюємо - вони беруться з input полів
        { key: 'tiles', id: 'summary-tiling', label: 'Плитка' },
        { key: 'cladding', id: 'summary-cladding', label: 'Облицювання' },
        { key: 'stands', id: 'summary-stand', label: 'Підставка' },
        { key: 'flowerbeds', id: 'summary-flowerbed', label: 'Квітник' },
        { key: 'gravestones', id: 'summary-gravestone', label: 'Надгробна плита' },
        { key: 'steles', id: 'summary-stele', label: 'Стела' },
        { key: 'lamps', id: 'summary-lamp', label: 'Лампа' },
        { key: 'fence_decor', id: 'summary-fence-decor', label: 'Декор огорожі' }
      ];
      
      categories.forEach(category => {
        const element = safeGetElement(category.id);
        const items = data[category.key];
        
        console.log(`📌 Категорія ${category.label}:`, items);
        
        if (!element) {
          console.warn(`⚠️ Елемент ${category.id} не знайдено!`);
          return;
        }
        
        if (!items || items.length === 0) {
          console.log(`ℹ️ ${category.label}: немає даних`);
          // НЕ перезаписуємо якщо немає даних - залишаємо старе значення
          return;
        }
        
        // Формуємо текст специфікації
        const lines = items.map(item => {
          return `${item.width}×${item.depth}×${item.height} см (${item.material}) - ${item.count} шт`;
        });
        
        const text = lines.join('\n');
        console.log(`✅ ${category.label}: ${text}`);
        safeSetTextContent(element, text);
      });
      
      logSummaryAction('Детальна специфікація оновлена', 'success');
      
    } catch (error) {
      logSummaryAction(`Помилка в updateDetailedSummary(): ${error.message}`, 'error');
      console.error('❌ Помилка детальної специфікації:', error);
    }
  }
  
  // Функція для запиту детальної специфікації
  function refreshDetailedSummary() {
    try {
      logSummaryAction('Запит детальної специфікації', 'info');
      console.log('🔄 Викликаю window.sketchup.get_detailed_summary()');
      
      if (window.sketchup && window.sketchup.get_detailed_summary) {
        window.sketchup.get_detailed_summary();
        console.log('✅ Callback викликано успішно');
      } else {
        console.error('❌ window.sketchup.get_detailed_summary не доступний');
        logSummaryAction('SketchUp bridge не доступний', 'warn');
      }
      
    } catch (error) {
      console.error('❌ Помилка:', error);
      logSummaryAction(`Помилка при запиті специфікації: ${error.message}`, 'error');
    }
  }
  
  // Експорт публічного API
  global.ProGran3.UI.SummaryTable = {
    updateSummaryTable: updateSummaryTable,
    getSummaryData: getSummaryData,
    clearSummaryTable: clearSummaryTable,
    updateDetailedSummary: updateDetailedSummary,
    refreshDetailedSummary: refreshDetailedSummary
  };
  
  // Зворотна сумісність - функції доступні глобально
  global.updateSummaryTable = updateSummaryTable;
  global.updateDetailedSummary = updateDetailedSummary;
  global.refreshDetailedSummary = refreshDetailedSummary;
  
  // Ініціалізація
  if (global.ProGran3.Core.Logger) {
    global.ProGran3.Core.Logger.debugLog('SummaryTable модуль завантажено', 'info', 'SummaryTable');
  }
  
})(window);
