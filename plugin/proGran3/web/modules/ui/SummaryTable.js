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
  
  // Функція для форматування розмірів з вирівнюванням (від найбільшого до найменшого)
  function formatDimensions(depth, width, height) {
    console.log(`📐 [formatDimensions] Вхідні дані: depth=${depth}, width=${width}, height=${height}`);
    const dimensions = [depth, width, height].map(Number).sort((a, b) => b - a); // Від найбільшого до найменшого
    console.log(`📐 [formatDimensions] Відсортовані: [${dimensions.join(', ')}]`);
    
    // Простий текст без HTML таблиці
    const result = `${dimensions[0]}  ${dimensions[1]}  ${dimensions[2]}`;
    
    console.log(`📐 [formatDimensions] Згенерований простий текст: ${result}`);
    return result;
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
      // Foundation та BlindArea НЕ оновлюємо автоматично - тільки через детальну специфікацію (кнопка "Оновити")
      // updateFoundationSummary(addedElements, currentUnit);
      // updateBlindAreaSummary(addedElements, currentUnit);
      updateFenceCornerSummary(addedElements, currentUnit);
      updateFencePerimeterSummary(addedElements, currentUnit);
      
      // Автоматично запитуємо детальну специфікацію для всіх основних елементів
      if (addedElements.foundation || addedElements.blindArea || addedElements.tiling || 
          addedElements.cladding || addedElements.stands || addedElements.steles || 
          addedElements.flowerbeds || addedElements.gravestones) {
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
      logSummaryAction('updateDetailedSummary() викликано', 'info');
      console.log('📊 Детальна специфікація:', data);
      
      // Зберігаємо дані для звіту
      window.lastSummaryData = data;
      
      // Перевіряємо структуру даних (v3.0 - з metadata)
      const summaryData = data.summary || data;  // Підтримка старого формату
      const metadata = data.metadata || null;
      
      // Оновлюємо метадані (статистика вгорі)
      if (metadata) {
        updateSummaryMetadata(metadata);
      }
      
      // Оновлюємо Foundation окремо (з площею та об'ємом)
      if (summaryData.foundation && summaryData.foundation.length > 0) {
        const foundation = summaryData.foundation[0];
        console.log('📐 Foundation дані:', foundation);
        
        const foundationEl = safeGetElement('summary-foundation');
        if (foundationEl) {
          const area = foundation.area_m2 !== undefined ? foundation.area_m2 : 'N/A';
          const volume = foundation.volume_m3 !== undefined ? foundation.volume_m3 : 'N/A';
          const text = `${foundation.depth} × ${foundation.width} × ${foundation.height} см\nПлоща: ${area} м²\nОб'єм: ${volume} м³`;
          safeSetTextContent(foundationEl, text);
          console.log('✅ Foundation оновлено:', text);
        }
      }
      
      // Оновлюємо BlindArea окремо (з площею та об'ємом)
      if (summaryData.blind_area && summaryData.blind_area.length > 0) {
        const blindArea = summaryData.blind_area[0];
        console.log('📐 BlindArea дані:', blindArea);
        
        const blindAreaEl = safeGetElement('summary-blind-area');
        if (blindAreaEl) {
          const area = blindArea.area_m2 !== undefined ? blindArea.area_m2 : 'N/A';
          const volume = blindArea.volume_m3 !== undefined ? blindArea.volume_m3 : 'N/A';
          const text = `${blindArea.depth} × ${blindArea.width} × ${blindArea.height} см\nПлоща: ${area} м²\nОб'єм: ${volume} м³`;
          safeSetTextContent(blindAreaEl, text);
          console.log('✅ BlindArea оновлено:', text);
        }
      }
      
      // Оновлюємо Stands окремо (з площею та об'ємом, + проміжна деталь)
      if (summaryData.stands && summaryData.stands.length > 0) {
        console.log('📐 Stands дані:', summaryData.stands);
        
        const standEl = safeGetElement('summary-stand');
        if (standEl) {
          const lines = summaryData.stands.map(stand => {
            const area = stand.area_m2 !== undefined ? stand.area_m2 : 'N/A';
            const volume = stand.volume_m3 !== undefined ? stand.volume_m3 : 'N/A';
            const standType = stand.stand_type === 'проміжна' ? 'Проміжна деталь' : 'Підставка';
            return `${standType}: ${stand.depth} × ${stand.width} × ${stand.height} см\nПлоща: ${area} м²\nОб'єм: ${volume} м³`;
          });
          
          const text = lines.join('\n\n');
          safeSetTextContent(standEl, text);
          console.log('✅ Stands оновлено:', text);
        }
      }
      
      // Оновлюємо Tiles окремо (групуємо за розмірами)
      if (summaryData.tiles && summaryData.tiles.length > 0) {
        console.log('📐 Tiles дані:', summaryData.tiles);
        
        const tilesEl = safeGetElement('summary-tiling');
        if (tilesEl) {
          // Групуємо плитки за розмірами
          const grouped = {};
          
          summaryData.tiles.forEach(tile => {
            const key = `${tile.depth}×${tile.width}×${tile.height}×${tile.tile_type || 'horizontal'}`;
            
            if (!grouped[key]) {
              grouped[key] = {
                depth: tile.depth,
                width: tile.width,
                height: tile.height,
                tile_type: tile.tile_type || 'horizontal',
                count: 0,
                totalArea: 0,
                totalVolume: 0
              };
            }
            
            grouped[key].count++;
            grouped[key].totalArea += (tile.area_m2 || 0);
            grouped[key].totalVolume += (tile.volume_m3 || 0);
          });
          
          // Формуємо текст
          const tileLines = [];
          let grandTotalArea = 0;
          let grandTotalVolume = 0;
          
          Object.values(grouped).forEach((group, index) => {
            grandTotalArea += group.totalArea;
            grandTotalVolume += group.totalVolume;
            
            const typeLabel = group.tile_type === 'вертикальна' ? 'Вертикальна плитка' : 'Плитка';
            
            tileLines.push(
              `${typeLabel} ${group.depth} × ${group.width} × ${group.height} см - ${group.count} шт\n` +
              `  Площа: ${group.totalArea.toFixed(3)} м², Об'єм: ${group.totalVolume.toFixed(4)} м³`
            );
          });
          
          tileLines.push(
            `\nЗАГАЛОМ:\n` +
            `  Площа: ${grandTotalArea.toFixed(2)} м²\n` +
            `  Об'єм: ${grandTotalVolume.toFixed(3)} м³`
          );
          
          const text = tileLines.join('\n\n');
          safeSetTextContent(tilesEl, text);
          console.log('✅ Tiles оновлено:', text);
        }
      }
      
      // Оновлюємо Стели (групуємо за розмірами)
      if (summaryData.steles && summaryData.steles.length > 0) {
        console.log('📐 Steles дані:', summaryData.steles);
        
        const steleEl = safeGetElement('summary-stele');
        if (steleEl) {
          const grouped = {};
          
          summaryData.steles.forEach(stele => {
            const key = `${stele.depth}×${stele.width}×${stele.height}`;
            
            if (!grouped[key]) {
              grouped[key] = {
                depth: stele.depth,
                width: stele.width,
                height: stele.height,
                count: 0,
                totalArea: 0,
                totalVolume: 0
              };
            }
            
            grouped[key].count++;
            grouped[key].totalArea += (stele.area_m2 || 0);
            grouped[key].totalVolume += (stele.volume_m3 || 0);
          });
          
          const steleLines = [];
          let totalArea = 0;
          let totalVolume = 0;
          
          Object.values(grouped).forEach(group => {
            totalArea += group.totalArea;
            totalVolume += group.totalVolume;
            
            steleLines.push(
              `Стела ${group.depth} × ${group.width} × ${group.height} см - ${group.count} шт\n` +
              `  Площа: ${group.totalArea.toFixed(3)} м², Об'єм: ${group.totalVolume.toFixed(4)} м³`
            );
          });
          
          if (Object.keys(grouped).length > 1) {
            steleLines.push(`\nЗАГАЛОМ:\n  Площа: ${totalArea.toFixed(2)} м²\n  Об'єм: ${totalVolume.toFixed(3)} м³`);
          }
          
          const text = steleLines.join('\n\n');
          safeSetTextContent(steleEl, text);
          console.log('✅ Steles оновлено:', text);
        }
      }
      
      // Оновлюємо Квітники (групуємо за розмірами)
      if (summaryData.flowerbeds && summaryData.flowerbeds.length > 0) {
        console.log('📐 Flowerbeds дані:', summaryData.flowerbeds);
        
        const flowerbedEl = safeGetElement('summary-flowerbed');
        if (flowerbedEl) {
          const grouped = {};
          
          summaryData.flowerbeds.forEach(flowerbed => {
            const key = `${flowerbed.depth}×${flowerbed.width}×${flowerbed.height}`;
            
            if (!grouped[key]) {
              grouped[key] = {
                depth: flowerbed.depth,
                width: flowerbed.width,
                height: flowerbed.height,
                count: 0,
                totalArea: 0,
                totalVolume: 0
              };
            }
            
            grouped[key].count++;
            grouped[key].totalArea += (flowerbed.area_m2 || 0);
            grouped[key].totalVolume += (flowerbed.volume_m3 || 0);
          });
          
          const flowerbedLines = [];
          let totalArea = 0;
          let totalVolume = 0;
          
          Object.values(grouped).forEach(group => {
            totalArea += group.totalArea;
            totalVolume += group.totalVolume;
            
            flowerbedLines.push(
              `Квітник ${group.depth} × ${group.width} × ${group.height} см - ${group.count} шт\n` +
              `  Площа: ${group.totalArea.toFixed(3)} м², Об'єм: ${group.totalVolume.toFixed(4)} м³`
            );
          });
          
          if (Object.keys(grouped).length > 1) {
            flowerbedLines.push(`\nЗАГАЛОМ:\n  Площа: ${totalArea.toFixed(2)} м²\n  Об'єм: ${totalVolume.toFixed(3)} м³`);
          }
          
          const text = flowerbedLines.join('\n\n');
          safeSetTextContent(flowerbedEl, text);
          console.log('✅ Flowerbeds оновлено:', text);
        }
      }
      
      // Оновлюємо Кутову огорожу (групуємо за типом)
      if (summaryData.fence_corner && summaryData.fence_corner.length > 0) {
        console.log('📐 Fence Corner дані:', summaryData.fence_corner);
        
        const fenceCornerEl = safeGetElement('summary-fence-corner');
        if (fenceCornerEl) {
          // Групуємо за назвою компонента
          const grouped = {};
          
          summaryData.fence_corner.forEach(item => {
            const key = item.name;
            
            if (!grouped[key]) {
              grouped[key] = {
                name: item.name,
                depth: item.depth,
                width: item.width,
                height: item.height,
                count: 0,
                totalArea: 0,
                totalVolume: 0
              };
            }
            
            grouped[key].count++;
            grouped[key].totalArea += (item.area_m2 || 0);
            grouped[key].totalVolume += (item.volume_m3 || 0);
          });
          
          const fenceLines = [];
          let grandTotalArea = 0;
          let grandTotalVolume = 0;
          
          Object.values(grouped).forEach(group => {
            grandTotalArea += group.totalArea;
            grandTotalVolume += group.totalVolume;
            
            // Визначаємо тип (Post, Panel_X, Panel_Y)
            const componentName = group.name.replace('CornerFence_', '');
            
            fenceLines.push(
              `${componentName}: ${group.depth} × ${group.width} × ${group.height} см - ${group.count} шт\n` +
              `  Площа: ${group.totalArea.toFixed(3)} м², Об'єм: ${group.totalVolume.toFixed(4)} м³`
            );
          });
          
          fenceLines.push(`\nЗАГАЛОМ:\n  Площа: ${grandTotalArea.toFixed(2)} м²\n  Об'єм: ${grandTotalVolume.toFixed(3)} м³`);
          
          const text = fenceLines.join('\n\n');
          safeSetTextContent(fenceCornerEl, text);
          console.log('✅ Fence Corner оновлено:', text);
        }
      }
      
      // Оновлюємо Декор огорожі (ball.skp та інші)
      if (summaryData.fence_decor && summaryData.fence_decor.length > 0) {
        console.log('📐 Fence Decor дані:', summaryData.fence_decor);
        
        const fenceDecorEl = safeGetElement('summary-fence-decor');
        if (fenceDecorEl) {
          const grouped = {};
          
          summaryData.fence_decor.forEach(item => {
            const key = item.name;
            
            if (!grouped[key]) {
              grouped[key] = {
                name: item.name,
                depth: item.depth,
                width: item.width,
                height: item.height,
                count: 0,
                totalArea: 0,
                totalVolume: 0
              };
            }
            
            grouped[key].count++;
            grouped[key].totalArea += (item.area_m2 || 0);
            grouped[key].totalVolume += (item.volume_m3 || 0);
          });
          
          const decorLines = [];
          let totalArea = 0;
          let totalVolume = 0;
          
          Object.values(grouped).forEach(group => {
            totalArea += group.totalArea;
            totalVolume += group.totalVolume;
            
            decorLines.push(
              `${group.name}: ${group.depth} × ${group.width} × ${group.height} см - ${group.count} шт\n` +
              `  Площа: ${group.totalArea.toFixed(3)} м², Об'єм: ${group.totalVolume.toFixed(4)} м³`
            );
          });
          
          if (Object.keys(grouped).length > 1) {
            decorLines.push(`\nЗАГАЛОМ:\n  Площа: ${totalArea.toFixed(2)} м²\n  Об'єм: ${totalVolume.toFixed(3)} м³`);
          }
          
          const text = decorLines.join('\n\n');
          safeSetTextContent(fenceDecorEl, text);
          console.log('✅ Fence Decor оновлено:', text);
        }
      }
      
      const categories = [
        { key: 'gravestones', id: 'summary-gravestone', label: 'Надгробна плита' },
        { key: 'lamps', id: 'summary-lamp', label: 'Лампа' }
      ];
      
      categories.forEach(category => {
        const element = safeGetElement(category.id);
        const items = summaryData[category.key];
        
        console.log(`📌 Категорія ${category.label}:`, items);
        
        if (!element) {
          console.warn(`⚠️ Елемент ${category.id} не знайдено!`);
          return;
        }
        
        if (!items || items.length === 0) {
          console.log(`ℹ️ ${category.label}: немає даних`);
          return;
        }
        
        // Формуємо текст специфікації (виправляємо порядок розмірів)
        const lines = items.map(item => {
          return `${item.depth}×${item.width}×${item.height} см (${item.material}) - ${item.count} шт`;
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
  
  // Оновлення метаданих (тільки попередження та timestamp)
  function updateSummaryMetadata(metadata) {
    console.log('📊 Оновлення метаданих:', metadata);
    
    // Знаходимо або створюємо контейнер для метаданих
    let metadataContainer = document.getElementById('summary-metadata');
    
    if (!metadataContainer) {
      // Створюємо контейнер після таблиці підсумку
      const summarySection = document.querySelector('.summary-table');
      if (summarySection) {
        metadataContainer = document.createElement('div');
        metadataContainer.id = 'summary-metadata';
        metadataContainer.className = 'summary-metadata';
        summarySection.parentNode.insertBefore(metadataContainer, summarySection.nextSibling);
      } else {
        console.warn('⚠️ Не знайдено .summary-table для вставки метаданих');
        return;
      }
    }
    
    let html = '';
    
    // Попередження (якщо є)
    if (metadata.warnings && metadata.warnings.length > 0) {
      html += '<div class="summary-warnings">';
      html += '<div class="warnings-title">⚠️ Попередження:</div>';
      html += '<ul class="warnings-list">';
      metadata.warnings.forEach(warning => {
        html += `<li>${warning}</li>`;
      });
      html += '</ul>';
      html += '</div>';
    }
    
    // Timestamp з кнопкою-іконкою копіювання
    if (metadata.timestamp) {
      const date = new Date(metadata.timestamp);
      const formattedTime = date.toLocaleString('uk-UA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      html += `<div class="summary-footer">
        <span class="summary-timestamp">Оновлено: ${formattedTime}</span>
        <div class="summary-actions">
          <button class="summary-icon-btn" onclick="window.ProGran3.UI.SummaryTable.generateReport()" title="Згенерувати звіт">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </button>
          <button class="summary-icon-btn" onclick="window.ProGran3.UI.SummaryTable.copySummaryToClipboard()" title="Копіювати підсумок">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </div>
      </div>`;
    }
    
    metadataContainer.innerHTML = html;
    console.log('✅ Метадані оновлено');
  }
  
  // Генерація професійного звіту
  async function generateReport() {
    console.log('📄 Генерація звіту...');
    
    try {
      let reportData = null;
      
      // 1. Перевіряємо збережені дані
      if (window.lastSummaryData && Object.keys(window.lastSummaryData).length > 0) {
        console.log('✅ Використовую збережені дані для звіту');
        reportData = window.lastSummaryData;
      } 
      // 2. Fallback до StateManager
      else if (global.ProGran3.Core.StateManager) {
        console.log('🔄 Отримую дані з StateManager...');
        const addedElements = global.ProGran3.Core.StateManager.getAddedElements();
        const currentUnit = global.ProGran3.Utils.Units ? 
          global.ProGran3.Utils.Units.getCurrentUnit() : 'mm';
        
        // Генеруємо базові дані для звіту
        reportData = {
          summary: generateSummaryData(addedElements, currentUnit),
          metadata: {
            plugin_version: '3.2.1',
            generated_at: new Date().toISOString(),
            unit: currentUnit
          }
        };
        console.log('✅ Дані згенеровано з StateManager:', reportData);
      }
      // 3. Fallback до глобальних змінних
      else if (global.addedElements) {
        console.log('🔄 Отримую дані з глобальних змінних...');
        const addedElements = global.addedElements;
        const currentUnit = global.currentUnit || 'mm';
        
        reportData = {
          summary: generateSummaryData(addedElements, currentUnit),
          metadata: {
            plugin_version: '3.2.1',
            generated_at: new Date().toISOString(),
            unit: currentUnit
          }
        };
        console.log('✅ Дані згенеровано з глобальних змінних:', reportData);
      }
      // 4. Запит з Ruby
      else if (window.sketchup) {
        console.log('🔄 Запит даних з Ruby...');
        window.sketchup.generate_report();
        return; // Після запиту даних з Ruby, callback автоматично викличе showReportModal
      }
      
      if (reportData) {
        await showReportModal(reportData);
      } else {
        console.error('❌ Немає даних для звіту');
        alert('Спочатку натисніть "Оновити" у підсумку проекту або додайте елементи до моделі');
      }
    } catch (error) {
      console.error('❌ Помилка генерації звіту:', error);
      
      // Показуємо зрозуміле повідомлення користувачу
      let userMessage = 'Помилка при генерації звіту';
      
      if (error.message.includes('підключення до інтернету') || error.message.includes('Немає підключення')) {
        userMessage = 'Немає підключення до інтернету.\n\nДля генерації звіту потрібне підключення до сервера.\nПеревірте мережеві налаштування та спробуйте знову.';
      } else if (error.message.includes('Сервер недоступний')) {
        userMessage = 'Сервер тимчасово недоступний.\n\nСпробуйте пізніше або зверніться до підтримки.';
      } else if (error.message.includes('Таймаут')) {
        userMessage = 'Таймаут підключення до сервера.\n\nПеревірте швидкість інтернету та спробуйте знову.';
      } else {
        userMessage = `Помилка генерації звіту:\n${error.message}`;
      }
      
      alert(userMessage);
    }
  }
  
  // Генерація даних для звіту з поточного стану
  function generateSummaryData(addedElements, currentUnit) {
    console.log('📊 Генерація даних для звіту з поточного стану');
    console.log('📊 addedElements:', addedElements);
    console.log('📊 currentUnit:', currentUnit);
    
    const summaryData = {};
    
    // Генеруємо дані для кожної категорії
    Object.keys(addedElements).forEach(category => {
      if (addedElements[category]) {
        const elementData = addedElements[category];
        
        if (typeof elementData === 'object' && elementData !== null) {
          // Якщо це об'єкт з розмірами
          if (elementData.height && elementData.width && elementData.depth) {
            summaryData[category] = [{
              height: elementData.height,
              width: elementData.width,
              depth: elementData.depth,
              count: 1,
              area_m2: calculateArea(elementData.height, elementData.width, currentUnit),
              volume_m3: calculateVolume(elementData.height, elementData.width, elementData.depth, currentUnit)
            }];
          }
          // Якщо це простий об'єкт
          else {
            summaryData[category] = [{
              count: 1,
              area_m2: 0,
              volume_m3: 0
            }];
          }
        }
        // Якщо це просто true/false
        else if (elementData === true) {
          summaryData[category] = [{
            count: 1,
            area_m2: 0,
            volume_m3: 0
          }];
        }
      }
    });
    
    console.log('📊 Згенеровані дані для звіту:', summaryData);
    return summaryData;
  }
  
  // Розрахунок площі
  function calculateArea(height, width, unit) {
    const h = parseFloat(height) || 0;
    const w = parseFloat(width) || 0;
    
    if (unit === 'cm') {
      return (h * w) / 10000; // см² в м²
    } else {
      return (h * w) / 1000000; // мм² в м²
    }
  }
  
  // Розрахунок об'єму
  function calculateVolume(height, width, depth, unit) {
    const h = parseFloat(height) || 0;
    const w = parseFloat(width) || 0;
    const d = parseFloat(depth) || 0;
    
    if (unit === 'cm') {
      return (h * w * d) / 1000000; // см³ в м³
    } else {
      return (h * w * d) / 1000000000; // мм³ в м³
    }
  }
  
  // Показ модального вікна зі звітом
  async function showReportModal(data) {
    console.log('📊 Відображення звіту:', data);
    
    // Розширюємо основне вікно ВЛІВО
    if (window.sketchup && window.sketchup.expand_window_for_report) {
      console.log('📐 Розширення вікна вліво...');
      window.sketchup.expand_window_for_report();
    }
    
    // Створюємо модальне вікно якщо його немає
    let modal = document.getElementById('report-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'report-modal';
      modal.className = 'report-modal';
      document.body.appendChild(modal);
    }
    
    // Показуємо loading
    modal.innerHTML = `
      <div class="report-modal-overlay"></div>
      <div class="report-modal-content" style="display:flex; align-items:center; justify-content:center; min-height:400px;">
        <div style="text-align:center;">
          <div class="loading-spinner" style="margin:0 auto 20px;"></div>
          <div>Завантаження модуля генерації звіту...</div>
        </div>
      </div>
    `;
    modal.style.display = 'flex';
    
    try {
      // Генеруємо HTML звіту (async, завантажує модуль)
      const reportHTML = await generateReportHTML(data);
    
    modal.innerHTML = `
      <div class="report-modal-overlay" onclick="window.ProGran3.UI.SummaryTable.closeReportModal()"></div>
      <div class="report-modal-content">
        <div class="report-modal-header">
          <div class="report-header-buttons">
            <button class="report-print-btn-icon" onclick="window.ProGran3.UI.SummaryTable.printReport()" title="Друк звіту">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1 2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              Друк
            </button>
            <button class="report-pdf-btn-icon" onclick="window.ProGran3.UI.SummaryTable.exportToPDF()" title="Зберегти як PDF (оберіть принтер 'Save as PDF' в діалозі друку)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10,9 9,9 8,9"></polyline>
              </svg>
              PDF
            </button>
          </div>
          <h2>Звіт проекту</h2>
          <button class="report-close-btn" onclick="window.ProGran3.UI.SummaryTable.closeReportModal()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="report-modal-body">
          <div class="report-pages-container" id="report-pages-container">
            ${reportHTML}
          </div>
        </div>
      </div>
    `;
    
      // Показуємо модальне вікно
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      
      console.log('✅ Модальне вікно відкрито');
      
    } catch (error) {
      console.error('❌ Помилка генерації звіту:', error);
      
      // Показуємо помилку в modal
      modal.innerHTML = `
        <div class="report-modal-overlay" onclick="window.ProGran3.UI.SummaryTable.closeReportModal()"></div>
        <div class="report-modal-content" style="padding:40px; text-align:center;">
          <h2 style="color:#ff6b6b; margin-bottom:20px;">❌ Помилка генерації звіту</h2>
          <p style="margin-bottom:20px;">${error.message}</p>
          <p style="color:#666; font-size:14px;">Для генерації звіту потрібне підключення до інтернету</p>
          <button onclick="window.ProGran3.UI.SummaryTable.closeReportModal()" 
                  style="margin-top:20px; padding:10px 20px; cursor:pointer;">
            Закрити
          </button>
        </div>
      `;
      modal.style.display = 'flex';
    }
    
    // Додаємо обробник клавіші ESC
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeReportModal();
      }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Зберігаємо посилання на обробник для очищення
    modal._escapeHandler = handleEscape;
    
    // Після відкриття вікна, розбиваємо контент на сторінки
    setTimeout(() => {
      paginateReport();
    }, 100);
  }
  
  // Функція для розбивання звіту на сторінки A4
  function paginateReport() {
    const container = document.getElementById('report-pages-container');
    if (!container) return;
    
    console.log('📄 Розбиття звіту на сторінки A4...');
    
    // Отримуємо всі елементи контенту
    const content = container.innerHTML;
    
    // Створюємо тимчасовий контейнер для вимірювання
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.width = '190mm'; // 210mm - 2*10mm padding
    document.body.appendChild(tempDiv);
    tempDiv.innerHTML = content;
    
    // Константи A4 (з урахуванням padding 10mm з кожної сторони)
    const A4_HEIGHT_MM = 297;
    const PAGE_PADDING_MM = 10; // Зменшено з 15mm
    const USABLE_HEIGHT_MM = A4_HEIGHT_MM - (PAGE_PADDING_MM * 2); // 277mm
    const MM_TO_PX = 3.7795275591; // 1mm = 3.78px at 96 DPI
    const MAX_PAGE_HEIGHT_PX = USABLE_HEIGHT_MM * MM_TO_PX; // ~1047px
    
    console.log(`📐 Максимальна висота сторінки: ${MAX_PAGE_HEIGHT_PX}px (~${USABLE_HEIGHT_MM}mm)`);
    
    // Отримуємо всі блоки контенту
    const header = tempDiv.querySelector('.report-header');
    const table = tempDiv.querySelector('.report-table');
    const preview = tempDiv.querySelector('.report-preview-section');
    const footer = tempDiv.querySelector('.report-footer');
    
    const headerHeight = header ? header.offsetHeight : 0;
    const footerHeight = footer ? footer.offsetHeight : 0;
    const previewHeight = preview ? preview.offsetHeight : 0;
    
    console.log(`📊 Висоти елементів: header=${headerHeight}px, footer=${footerHeight}px, preview=${previewHeight}px`);
    
    // Обчислюємо доступний простір для таблиці на першій сторінці
    let availableHeight = MAX_PAGE_HEIGHT_PX - headerHeight - footerHeight - 40; // 40px запас
    
    const tableRows = table ? table.querySelectorAll('tbody tr') : [];
    console.log(`📊 Знайдено ${tableRows.length} рядків таблиці`);
    
    // Якщо все вміщується на одну сторінку
    const totalContentHeight = headerHeight + (table ? table.offsetHeight : 0) + previewHeight + footerHeight;
    console.log(`📊 Загальна висота контенту: ${totalContentHeight}px`);
    
    if (totalContentHeight <= MAX_PAGE_HEIGHT_PX) {
      console.log('✅ Весь контент вміщується на одну сторінку');
      container.innerHTML = `
        <div class="report-page-single">
          ${content}
          <div class="report-page-number">Сторінка 1 з 1</div>
        </div>
      `;
      document.body.removeChild(tempDiv);
      return;
    }
    
    console.log('📄 Потрібно розбити на кілька сторінок');
    
    // Генеруємо багатосторінковий звіт
    const pages = generateMultiPageReport(header, table, tableRows, preview, footer, MAX_PAGE_HEIGHT_PX);
    
    container.innerHTML = pages;
    document.body.removeChild(tempDiv);
    
    console.log('✅ Звіт розбито на сторінки');
  }
  
  // Генерація багатосторінкового звіту
  function generateMultiPageReport(header, table, tableRows, preview, footer, maxHeight) {
    const pages = [];
    let currentPage = 1;
    
    // Перша сторінка з header та початком таблиці
    let pageContent = header ? header.outerHTML : '';
    
    if (table) {
      const thead = table.querySelector('thead');
      pageContent += `<div class="report-main"><table class="report-table">${thead.outerHTML}<tbody>`;
      
      let currentHeight = 100; // Зменшена приблизна висота header + thead (оптимізовано)
      let rowIndex = 0;
      
      // Додаємо рядки поки вміщуються (більше рядків на сторінку)
      while (rowIndex < tableRows.length && currentHeight < maxHeight - 80) { // Зменшено резерв з 150 до 80
        const row = tableRows[rowIndex];
        pageContent += row.outerHTML;
        currentHeight += row.offsetHeight || 25; // Зменшено з 30 до 25
        rowIndex++;
      }
      
      pageContent += `</tbody></table></div>`;
      
      // Якщо є ще рядки, додаємо їх на наступні сторінки
      while (rowIndex < tableRows.length) {
        pages.push(`
          <div class="report-page-single">
            ${pageContent}
            <div class="report-page-number">Сторінка ${currentPage} з ?</div>
          </div>
        `);
        
        currentPage++;
        pageContent = (header ? header.outerHTML : '') + 
                     `<div class="report-main"><table class="report-table">${thead.outerHTML}<tbody>`;
        
        currentHeight = 100; // Оптимізовано
        
        while (rowIndex < tableRows.length && currentHeight < maxHeight - 80) { // Більше місця для контенту
          const row = tableRows[rowIndex];
          pageContent += row.outerHTML;
          currentHeight += row.offsetHeight || 25;
          rowIndex++;
        }
        
        pageContent += `</tbody></table></div>`;
      }
    }
    
    // Додаємо превью і footer на останню сторінку або окрему
    if (preview) {
      pageContent += preview.outerHTML;
    }
    if (footer) {
      pageContent += footer.outerHTML;
    }
    
    pages.push(`
      <div class="report-page-single">
        ${pageContent}
        <div class="report-page-number">Сторінка ${currentPage} з ${currentPage}</div>
      </div>
    `);
    
    // Оновлюємо номери сторінок
    return pages.map((page, index) => 
      page.replace('Сторінка ? з ?', `Сторінка ${index + 1} з ${pages.length}`)
          .replace(/Сторінка \d+ з \?/, `Сторінка ${index + 1} з ${pages.length}`)
          .replace(/Сторінка \d+ з \d+/, `Сторінка ${index + 1} з ${pages.length}`)
    ).join('');
  }
  
  // Генерація HTML звіту (формат A4)
  // v3.2: Професійна генерація звітів з сервера (захист IP)
  async function generateReportHTML(data) {
    console.log('📄 Генерація звіту локально (embedded версія)...');
    
    try {
      // Використовуємо embedded версію для локального форматування розмірів
      const html = generateReportHTML_Embedded(data);
      console.log('✅ Embedded версія звіту згенерована успішно');
      return html;
      
    } catch (error) {
      console.error('❌ Помилка embedded версії:', error);
      throw new Error('Помилка генерації звіту: ' + error.message);
    }
  }
  
  // Перевірка підключення до інтернету
  async function checkInternetConnection() {
    try {
      console.log('🌐 Перевірка підключення до інтернету...');
      
      // Швидка перевірка через fetch до сервера
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 секунд timeout
      
      const response = await fetch('https://server-8hx1hwz27-provis3ds-projects.vercel.app/api/systems', {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('✅ Підключення до сервера встановлено');
        return true;
      } else {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
    } catch (error) {
      console.error('❌ Помилка підключення до сервера:', error);
      
      if (error.name === 'AbortError') {
        throw new Error('Таймаут підключення до сервера. Перевірте інтернет з\'єднання.');
      } else if (error.message.includes('Failed to fetch')) {
        throw new Error('Немає підключення до інтернету. Перевірте мережеві налаштування.');
      } else {
        throw new Error('Сервер недоступний: ' + error.message);
      }
    }
  }
  
  // Очищення cache модулів
  function clearModuleCache() {
    try {
      console.log('🗑️ Очищення cache модулів...');
      
      // Очищаємо ModuleLoader cache
      if (global.ProGran3.Core.ModuleLoader) {
        global.ProGran3.Core.ModuleLoader.clearAllModulesCache();
      }
      
      // Очищаємо localStorage cache
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('ProGran3_Module_')) {
          localStorage.removeItem(key);
        }
      });
      
      console.log('✅ Cache модулів очищено');
      
    } catch (error) {
      console.warn('⚠️ Помилка очищення cache:', error);
    }
  }
  
  // Embedded версія ВИДАЛЕНА для захисту інтелектуальної власності
  function generateReportHTML_Embedded(data) {
    // Embedded версія активована як fallback
    console.log('📄 Використовуємо embedded версію як fallback');
    
    const summaryData = data.summary || data;
    const metadata = data.metadata || {};
    
    const currentDate = new Date().toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Розраховуємо загальну статистику
    let totalComponents = 0;
    let totalArea = 0;
    let totalVolume = 0;
    
    Object.values(summaryData).forEach(category => {
      if (Array.isArray(category)) {
        category.forEach(item => {
          totalComponents += (item.count || 1);
          totalArea += (item.area_m2 || 0) * (item.count || 1);
          totalVolume += (item.volume_m3 || 0) * (item.count || 1);
        });
      }
    });
    
    let html = `
      <div class="report-header">
        <div class="report-title-row">
          <h1>Технічний звіт проекту</h1>
          <div class="report-date">${currentDate}</div>
        </div>
      </div>
      
      <div class="report-main">
        <table class="report-table">
          <thead>
            <tr>
              <th>Назва</th>
              <th>Розміри (см)</th>
              <th class="text-center">Кількість</th>
              <th class="text-right">Площа (м²)</th>
              <th class="text-right">Об'єм (м³)</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    // Додаємо всі категорії в одну таблицю
    const categories = [
      { key: 'foundation', label: 'Фундамент' },
      { key: 'blind_area', label: 'Відмостка' },
      { key: 'stands', label: 'Підставка' },
      { key: 'tiles', label: 'Плитка' },
      { key: 'steles', label: 'Стела' },
      { key: 'flowerbeds', label: 'Квітник' },
      { key: 'fence_corner', label: 'Кутова огорожа' },
      { key: 'fence_decor', label: 'Декор огорожі' }
    ];
    
    let hasData = false;
    
    categories.forEach(category => {
      const items = summaryData[category.key];
      console.log(`📋 [generateReportHTML] Категорія: ${category.label} (${category.key})`);
      console.log(`📋 [generateReportHTML] Items:`, items);
      
      if (items && items.length > 0) {
        hasData = true;
        console.log(`✅ [generateReportHTML] Генеруємо рядки для ${category.label}, кількість: ${items.length}`);
        html += generateCategoryRows(category.label, items);
      } else {
        console.log(`⚠️ [generateReportHTML] Немає даних для ${category.label}`);
      }
    });
    
    if (!hasData) {
      html += `
        <tr>
          <td colspan="5" class="text-center" style="padding: 20px; color: #999;">
            Немає даних для звіту
          </td>
        </tr>
      `;
    }
    
    html += `
          </tbody>
        </table>
        
        ${(() => {
          // Перевіряємо чи увімкнений перемикач превью
          const previewToggle = document.getElementById('include-preview-toggle');
          const includePreview = previewToggle ? previewToggle.checked : false;
          
          console.log('📄 Генерація звіту: перемикач превью =', includePreview);
          
          if (includePreview) {
            console.log('   Викликаємо generatePreviewSection()');
            return generatePreviewSection();
          } else {
            console.log('   Пропускаємо превью (перемикач вимкнений)');
            return '';
          }
        })()}
      </div>
      
      <div class="report-footer">
        <div class="report-footer-info">
          <div>Згенеровано: ${new Date().toLocaleString('uk-UA')}</div>
          <div>ProGran3 Plugin v3.1</div>
        </div>
    `;
    
    return html;
  }
  
  // Генерація секції превью
  function generatePreviewSection() {
    console.log('🔍 Перевірка превью даних:', window.currentPreviewData);
    
    // Перевіряємо різні можливі місця зберігання превью даних
    let previewData = null;
    
    // Спочатку перевіряємо window.currentPreviewData
    if (window.currentPreviewData) {
      if (typeof window.currentPreviewData === 'string') {
        previewData = window.currentPreviewData;
        console.log('✅ Превью дані знайдені в window.currentPreviewData (string), довжина:', previewData.length);
      } else if (typeof window.currentPreviewData === 'object' && window.currentPreviewData.base64) {
        previewData = window.currentPreviewData.base64;
        console.log('✅ Превью дані знайдені в window.currentPreviewData (object), довжина:', previewData.length);
      }
    }
    
    // Якщо не знайшли, перевіряємо global.currentPreviewData
    if (!previewData && global.currentPreviewData) {
      if (typeof global.currentPreviewData === 'string') {
        previewData = global.currentPreviewData;
        console.log('✅ Превью дані знайдені в global.currentPreviewData (string), довжина:', previewData.length);
      } else if (typeof global.currentPreviewData === 'object' && global.currentPreviewData.base64) {
        previewData = global.currentPreviewData.base64;
        console.log('✅ Превью дані знайдені в global.currentPreviewData (object), довжина:', previewData.length);
      }
    }
    
    // Якщо все ще не знайшли, перевіряємо через GlobalState
    if (!previewData && global.ProGran3 && global.ProGran3.Core && global.ProGran3.Core.GlobalState) {
      const globalPreviewData = global.ProGran3.Core.GlobalState.getCurrentPreviewData();
      if (globalPreviewData) {
        if (typeof globalPreviewData === 'string') {
          previewData = globalPreviewData;
          console.log('✅ Превью дані знайдені через GlobalState (string), довжина:', previewData.length);
        } else if (typeof globalPreviewData === 'object' && globalPreviewData.base64) {
          previewData = globalPreviewData.base64;
          console.log('✅ Превью дані знайдені через GlobalState (object), довжина:', previewData.length);
        }
      }
    }
    
    if (!previewData) {
      console.log('❌ Превью дані відсутні в усіх можливих місцях');
      return '';
    }
    
    // Перевіряємо чи дані валідні
    if (typeof previewData !== 'string' || previewData.length < 100) {
      console.log('❌ Превью дані невалідні, довжина:', previewData ? previewData.length : 0);
      return '';
    }
    
    console.log('🎨 Генеруємо HTML для превью секції, дані:', previewData.substring(0, 50) + '...');
    
    // Перевіряємо чи дані вже містять data:image prefix
    const imageSrc = previewData.startsWith('data:image') ? previewData : `data:image/png;base64,${previewData}`;
    console.log('🎨 Image src перші 100 символів:', imageSrc.substring(0, 100));
    
    return `
      <div class="report-preview-section">
        <h2 class="report-section-title">Превью моделі</h2>
        <div class="report-preview-container">
          <img src="${imageSrc}" 
               alt="Превью моделі" 
               class="report-preview-image"
               onerror="console.error('❌ Помилка завантаження превью зображення:', this.src.substring(0, 100) + '...')"
               onload="console.log('✅ Превью зображення завантажено успішно')">
        </div>
      </div>
    `;
  }
  
  // Генерація рядків для категорії (без окремої таблиці)
  function generateCategoryRows(label, items) {
    console.log(`📊 [generateCategoryRows] Категорія: ${label}, кількість items: ${items.length}`);
    console.log(`📊 [generateCategoryRows] Items:`, items);
    
    let html = '';
    
    // Групуємо однакові елементи
    const grouped = {};
    items.forEach((item, index) => {
      console.log(`  📦 Item ${index}:`, {
        name: item.name,
        depth: item.depth,
        width: item.width,
        height: item.height,
        count: item.count,
        area: item.area_m2,
        volume: item.volume_m3
      });
      
      const key = `${item.depth}×${item.width}×${item.height}`;
      if (!grouped[key]) {
        grouped[key] = {
          name: item.name || label,
          depth: item.depth,
          width: item.width,
          height: item.height,
          count: 0,
          totalArea: 0,
          totalVolume: 0
        };
      }
      grouped[key].count += (item.count || 1);
      grouped[key].totalArea += (item.area_m2 || 0) * (item.count || 1);
      grouped[key].totalVolume += (item.volume_m3 || 0) * (item.count || 1);
    });
    
    console.log(`📊 [generateCategoryRows] Згруповано:`, grouped);
    console.log(`📊 [generateCategoryRows] Кількість груп: ${Object.keys(grouped).length}`);
    
    // Розділювач категорії
    html += `
      <tr class="report-category-divider">
        <td colspan="5"><strong>${label}</strong></td>
      </tr>
    `;
    
    // Відображаємо згруповані елементи
    Object.values(grouped).forEach((group, index) => {
      console.log(`  ✅ Генеруємо рядок ${index} для групи:`, group);
      console.log(`  📐 Вхідні розміри: depth=${group.depth}, width=${group.width}, height=${group.height}`);
      const formattedDims = formatDimensions(group.depth, group.width, group.height);
      console.log(`  📐 Форматовані розміри:`, formattedDims);
      
      html += `
        <tr>
          <td>${group.name}</td>
          <td>${formattedDims}</td>
          <td class="text-center">${group.count}</td>
          <td class="text-center">${group.totalArea.toFixed(2)}</td>
          <td class="text-center">${group.totalVolume.toFixed(3)}</td>
        </tr>
      `;
    });
    
    // Підсумок по категорії
    const categoryTotal = Object.values(grouped).reduce((acc, g) => ({
      count: acc.count + g.count,
      area: acc.area + g.totalArea,
      volume: acc.volume + g.totalVolume
    }), { count: 0, area: 0, volume: 0 });
    
    html += `
      <tr class="report-category-total">
        <td colspan="2">Разом ${label}:</td>
        <td class="text-center"><strong>${categoryTotal.count}</strong></td>
        <td class="text-center"><strong>${categoryTotal.area.toFixed(2)}</strong></td>
        <td class="text-center"><strong>${categoryTotal.volume.toFixed(3)}</strong></td>
      </tr>
    `;
    
    console.log(`✅ [generateCategoryRows] Згенеровано HTML для ${label}, довжина: ${html.length}`);
    
    return html;
  }
  
  // Закриття модального вікна
  function closeReportModal() {
    const modal = document.getElementById('report-modal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
      console.log('✅ Модальне вікно закрито');
      
      // Очищаємо обробник клавіші ESC
      if (modal._escapeHandler) {
        document.removeEventListener('keydown', modal._escapeHandler);
        modal._escapeHandler = null;
      }
      
      // Повертаємо розмір та позицію вікна до початкових
      if (window.sketchup && window.sketchup.restore_window_size) {
        console.log('📐 Повернення розміру та позиції вікна...');
        console.log('   Викликаємо window.sketchup.restore_window_size()');
        try {
          window.sketchup.restore_window_size();
          console.log('   ✅ Виклик успішний');
        } catch (error) {
          console.error('   ❌ Помилка виклику:', error);
        }
      } else {
        console.warn('⚠️ window.sketchup.restore_window_size недоступний');
      }
    }
  }
  
  // Друк звіту
  function printReport() {
    if (window.sketchup && window.sketchup.log_message) {
      window.sketchup.log_message('🖨️ [JS] printReport викликано');
    }
    
    const reportContent = document.getElementById('report-pages-container');
    if (!reportContent) {
      if (window.sketchup && window.sketchup.log_message) {
        window.sketchup.log_message('❌ [JS] report-pages-container не знайдено');
      }
      return;
    }
    
    if (window.sketchup && window.sketchup.log_message) {
      window.sketchup.log_message('   Контент знайдено, готуємо HTML...');
    }
    
    // ВАЖЛИВО: Отримуємо HTML з усіма сторінками, як вони відображені в модальному вікні
    const pages = reportContent.querySelectorAll('.report-page-single');
    let pagesHTML = '';
    
    if (pages.length > 0) {
      // Якщо є розбивка на сторінки, експортуємо кожну сторінку окремо
      if (window.sketchup && window.sketchup.log_message) {
        window.sketchup.log_message(`   Знайдено ${pages.length} сторінок`);
      }
      
      pages.forEach((page, index) => {
        pagesHTML += `
          <div class="report-page" style="page-break-after: ${index < pages.length - 1 ? 'always' : 'auto'};">
            ${page.innerHTML}
          </div>
        `;
      });
    } else {
      // Якщо немає розбивки, експортуємо як є
      if (window.sketchup && window.sketchup.log_message) {
        window.sketchup.log_message('   Немає розбивки на сторінки, експортуємо як одну сторінку');
      }
      pagesHTML = `<div class="report-page">${reportContent.innerHTML}</div>`;
    }
    
    // Створюємо повний HTML документ
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Звіт проекту ProGran3</title>
  <link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@600&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body { 
      font-family: 'Comfortaa', Arial, sans-serif; 
      margin: 0; 
      padding: 20px; 
      background: white;
      color: #2c3e50;
    }
    
    /* Header звіту */
    .report-header {
      text-align: center;
      margin-bottom: 3px;
      padding: 1px 0;
      border-bottom: 1px solid #3498db;
    }
    
    .report-header h1 {
      margin: 0;
      font-size: 1.1em;
      color: #2c3e50;
      font-weight: 600;
      font-family: 'Comfortaa', sans-serif;
    }
    
    .report-date {
      font-size: 0.8em;
      color: #95a5a6;
      font-style: italic;
    }
    
    /* Таблиці */
    .report-table {
      width: 100%;
      border-collapse: collapse;
      margin: 3px 0;
      font-size: 0.9em;
      font-family: 'Comfortaa', sans-serif;
    }
    
    .report-table thead {
      background: #34495e;
      color: white;
    }
    
    .report-table th {
      padding: 5px 4px;
      font-weight: 600;
      font-size: 0.75em;
      text-transform: uppercase;
      letter-spacing: 0.2px;
      font-family: 'Comfortaa', sans-serif;
      white-space: nowrap;
    }
    
    .report-table th:nth-child(1) {
      text-align: left;
      width: 35%;
    }
    
    .report-table th:nth-child(2) {
      text-align: left;
      width: 20%;
    }
    
    .report-table th:nth-child(3),
    .report-table th:nth-child(4),
    .report-table th:nth-child(5) {
      text-align: center;
      width: 15%;
    }
    
    .report-table td {
      padding: 5px 4px;
      border-bottom: 1px solid #ecf0f1;
      font-family: 'Comfortaa', sans-serif;
      font-weight: 600;
      font-size: 0.9em;
    }
    
    .report-table td:nth-child(1) {
      text-align: left;
      width: 35%;
    }
    
    .report-table td:nth-child(2) {
      text-align: center;
      width: 20%;
      font-family: 'Comfortaa', sans-serif;
      padding: 0;
    }
    
    .report-table td:nth-child(3),
    .report-table td:nth-child(4),
    .report-table td:nth-child(5) {
      text-align: center;
      width: 15%;
    }
    
    /* Розділювачі категорій */
    .report-category-divider td {
      background: #3498db !important;
      color: white !important;
      font-weight: 600;
      font-size: 0.75em;
      padding: 3px 4px !important;
      letter-spacing: 0.3px;
      border-top: 2px solid #2980b9;
      font-family: 'Comfortaa', sans-serif;
    }
    
    /* Підсумки по категоріях */
    .report-category-total td {
      background: #ecf0f1 !important;
      font-weight: 600;
      font-size: 0.75em;
      color: #2c3e50;
      border-bottom: 2px solid #bdc3c7 !important;
      font-family: 'Comfortaa', sans-serif;
      padding: 3px 4px !important;
    }
    
    .report-category-total td:nth-child(1) {
      text-align: left;
    }
    
    .report-category-total td:nth-child(2),
    .report-category-total td:nth-child(3),
    .report-category-total td:nth-child(4),
    .report-category-total td:nth-child(5) {
      text-align: center;
    }
    
    /* Розміри - компактний табличний варіант */
    .dimensions-table {
      border-collapse: collapse;
      margin: 0;
      padding: 0;
      display: inline-table;
      border: none;
    }
    
    .dimensions-table td {
      border: none;
      padding: 2px 6px;
      text-align: center;
      font-weight: 500;
      background-color: transparent;
      min-width: 35px;
      font-size: 0.9rem;
      white-space: nowrap;
    }
    
    /* Превю зображення */
    .report-preview-section {
      margin-top: 15px;
      padding-top: 10px;
      border-top: 1px solid #ddd;
      page-break-inside: avoid;
    }
    
    .report-section-title {
      font-size: 14pt;
      color: #2c3e50;
      margin-bottom: 8px;
      font-family: 'Comfortaa', sans-serif;
      font-weight: 600;
    }
    
    .report-preview-container {
      text-align: center;
      margin: 10px 0;
      page-break-inside: avoid;
    }
    
    .report-preview-image {
      max-width: 100%;
      height: auto;
      border: 1px solid #ddd;
    }
    
    /* Footer */
    .report-footer {
      margin-top: 10px;
      padding-top: 6px;
      border-top: 1px solid #ddd;
      font-size: 8pt;
      color: #666;
    }
    
    /* Стилі для сторінок */
    .report-page {
      background: white;
      margin: 0;
      padding: 20px;
      min-height: 297mm;
    }
    
    /* Налаштування для друку */
    @page {
      size: A4;
      margin: 20mm;
    }
    
    @media print {
      body { margin: 0; padding: 0; }
      .no-print { display: none !important; }
      
      .report-page {
        margin: 0;
        padding: 10mm;
      }
      
      .report-table tr {
        page-break-inside: avoid;
      }
      
      .report-table thead {
        display: table-header-group;
      }
    }
    
    .print-instructions {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #3498db;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 9999;
      font-family: 'Comfortaa', Arial, sans-serif;
    }
    
    .print-btn {
      background: #2ecc71;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      margin-top: 10px;
      width: 100%;
      font-family: 'Comfortaa', Arial, sans-serif;
    }
    
    .print-btn:hover {
      background: #27ae60;
    }
  </style>
  <script>
    // Автоматично відкриваємо діалог друку після завантаження
    window.addEventListener('load', function() {
      // Затримка 500ms щоб контент встиг завантажитися
      setTimeout(function() {
        window.print();
      }, 500);
    });
    
    function printNow() {
      window.print();
    }
  </script>
</head>
<body>
<div class="print-instructions no-print">
  <strong>Інструкція:</strong><br>
  1. Оберіть принтер "Microsoft Print to PDF"<br>
  2. Натисніть "Print" / "Друк"<br>
  3. Оберіть місце для збереження<br><br>
  <button class="print-btn" onclick="printNow()">Відкрити діалог друку</button>
</div>
${pagesHTML}
</body>
</html>`;
    
    if (window.sketchup && window.sketchup.log_message) {
      window.sketchup.log_message('   HTML готовий, розмір: ' + htmlContent.length + ' символів');
    }
    
    // Викликаємо Ruby callback для збереження та відкриття файлу
    if (window.sketchup && window.sketchup.save_and_print_report) {
      if (window.sketchup && window.sketchup.log_message) {
        window.sketchup.log_message('   Викликаємо save_and_print_report...');
      }
      window.sketchup.save_and_print_report(htmlContent);
    } else {
      if (window.sketchup && window.sketchup.log_message) {
        window.sketchup.log_message('⚠️ [JS] save_and_print_report callback не знайдено');
        window.sketchup.log_message('   Перезавантажте SketchUp повністю для застосування змін');
      }
      
      // ТИМЧАСОВЕ РІШЕННЯ: копіюємо HTML в буфер обміну
      if (window.sketchup && window.sketchup.copy_report_html) {
        window.sketchup.copy_report_html(htmlContent);
      }
    }
  }

  // Експорт в PDF
  function exportToPDF() {
    // Логування в Ruby Console
    if (window.sketchup && window.sketchup.log_message) {
      window.sketchup.log_message('📄 [JS] exportToPDF викликано');
    }
    
    try {
      // Викликаємо функцію друку напряму
      // У діалозі друку користувач може обрати "Microsoft Print to PDF"
      if (window.sketchup && window.sketchup.log_message) {
        window.sketchup.log_message('   Викликаємо printReport()...');
      }
      
      printReport();
      
      if (window.sketchup && window.sketchup.log_message) {
        window.sketchup.log_message('✅ [JS] printReport виконано успішно');
      }
      
    } catch (error) {
      // Логування помилки в Ruby Console
      if (window.sketchup && window.sketchup.log_message) {
        window.sketchup.log_message('❌ [JS] Помилка в exportToPDF: ' + error.message);
      }
    }
  }
  
  // Копіювання підсумку в clipboard
  function copySummaryToClipboard() {
    try {
      const summaryElements = [
        'summary-foundation',
        'summary-blind-area',
        'summary-stand',
        'summary-tiling',
        'summary-stele',
        'summary-flowerbed',
        'summary-fence-corner',
        'summary-fence-decor',
        'summary-gravestone',
        'summary-lamp'
      ];
      
      let text = '=== ПІДСУМОК ПРОЕКТУ ProGran3 ===\n\n';
      
      // Метадані
      const metadata = document.getElementById('summary-metadata');
      if (metadata) {
        const stats = metadata.querySelectorAll('.stat-item');
        stats.forEach(stat => {
          const label = stat.querySelector('.stat-label')?.textContent || '';
          const value = stat.querySelector('.stat-value')?.textContent || '';
          text += `${label} ${value}\n`;
        });
        text += '\n';
      }
      
      // Компоненти
      const labels = {
        'summary-foundation': 'Фундамент',
        'summary-blind-area': 'Відмостка',
        'summary-stand': 'Підставка',
        'summary-tiling': 'Плитка',
        'summary-stele': 'Стела',
        'summary-flowerbed': 'Квітник',
        'summary-fence-corner': 'Кутова огорожа',
        'summary-fence-decor': 'Декор огорожі',
        'summary-gravestone': 'Надгробна плита',
        'summary-lamp': 'Лампа'
      };
      
      summaryElements.forEach(id => {
        const element = document.getElementById(id);
        if (element && element.textContent.trim() !== '--' && element.textContent.trim() !== '') {
          text += `${labels[id]}:\n${element.textContent}\n\n`;
        }
      });
      
      // Timestamp
      const timestamp = document.querySelector('.summary-timestamp span');
      if (timestamp) {
        text += `\n${timestamp.textContent}`;
      }
      
      // Копіюємо
      navigator.clipboard.writeText(text).then(() => {
        console.log('✅ Підсумок скопійовано в clipboard');
        
        // Показуємо візуальний feedback
        const btn = document.querySelector('.copy-summary-icon-btn');
        if (btn) {
          btn.classList.add('copied');
          
          setTimeout(() => {
            btn.classList.remove('copied');
          }, 2000);
        }
      }).catch(err => {
        console.error('❌ Помилка копіювання:', err);
        alert('Помилка копіювання в буфер обміну');
      });
      
    } catch (error) {
      console.error('❌ Помилка при копіюванні:', error);
      alert('Помилка копіювання підсумку');
    }
  }
  
  // Експорт публічного API
  global.ProGran3.UI.SummaryTable = {
    updateSummaryTable: updateSummaryTable,
    getSummaryData: getSummaryData,
    clearSummaryTable: clearSummaryTable,
    updateDetailedSummary: updateDetailedSummary,
    refreshDetailedSummary: refreshDetailedSummary,
    copySummaryToClipboard: copySummaryToClipboard,
    generateReport: generateReport,
    showReportModal: showReportModal,
    closeReportModal: closeReportModal,
    printReport: printReport,
    exportToPDF: exportToPDF
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
