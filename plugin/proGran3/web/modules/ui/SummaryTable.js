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
        <button class="copy-summary-icon-btn" onclick="window.ProGran3.UI.SummaryTable.copySummaryToClipboard()" title="Копіювати підсумок">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
      </div>`;
    }
    
    metadataContainer.innerHTML = html;
    console.log('✅ Метадані оновлено');
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
    copySummaryToClipboard: copySummaryToClipboard
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
