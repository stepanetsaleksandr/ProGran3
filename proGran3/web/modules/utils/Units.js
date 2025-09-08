// modules/utils/Units.js
// Система одиниць вимірювання для ProGran3

(function(global) {
  'use strict';
  
  // Створюємо namespace
  global.ProGran3 = global.ProGran3 || {};
  global.ProGran3.Utils = global.ProGran3.Utils || {};
  
  // Приватні змінні
  let currentUnit = 'mm';
  const conversionFactors = {
    mm: 1,
    cm: 10
  };
  
  // Приватні функції
  function logUnitChange(message, type = 'info') {
    if (global.ProGran3.Core.Logger) {
      global.ProGran3.Core.Logger.debugLog(message, type, 'Units');
    }
  }
  
  function validateUnit(unit) {
    return unit === 'mm' || unit === 'cm';
  }
  
  function getConversionFactor(fromUnit, toUnit) {
    if (!validateUnit(fromUnit) || !validateUnit(toUnit)) {
      return 1;
    }
    return conversionFactors[fromUnit] / conversionFactors[toUnit];
  }
  
  // Публічні функції
  function changeUnit(newUnit) {
    if (!validateUnit(newUnit)) {
      logUnitChange(`Невірна одиниця: ${newUnit}`, 'error');
      return false;
    }
    
    const oldUnit = currentUnit;
    currentUnit = newUnit;
    
    // Оновлюємо StateManager якщо доступний
    if (global.ProGran3.Core.StateManager) {
      global.ProGran3.Core.StateManager.setCurrentUnit(newUnit);
    }
    
    // Оновлюємо UI
    updateUnitLabels();
    updateUnitToggleButtons();
    
    logUnitChange(`Одиниця змінена з ${oldUnit} на ${newUnit}`, 'info');
    return true;
  }
  
  function getCurrentUnit() {
    return currentUnit;
  }
  
  function updateUnitLabels() {
    const labels = document.querySelectorAll('[id$="-label"]');
    labels.forEach(label => {
      const currentText = label.textContent;
      if (currentText.includes('(мм)') || currentText.includes('(см)')) {
        const newText = currentText.replace(/\(мм\)|\(см\)/g, `(${currentUnit})`);
        label.textContent = newText;
      }
    });
    
    // Оновлюємо заголовки розмірів
    const dimensionDisplays = document.querySelectorAll('.header-dimensions');
    dimensionDisplays.forEach(display => {
      if (display.textContent) {
        updateDimensionDisplay(display);
      }
    });
  }
  
  function updateUnitToggleButtons() {
    const mmButton = document.getElementById('unit-mm');
    const cmButton = document.getElementById('unit-cm');
    
    if (mmButton && cmButton) {
      mmButton.checked = (currentUnit === 'mm');
      cmButton.checked = (currentUnit === 'cm');
    }
  }
  
  function updateDimensionDisplay(element) {
    if (!element.textContent) return;
    
    const text = element.textContent;
    const match = text.match(/(\d+(?:\.\d+)?)\s*(мм|см)/);
    if (match) {
      const value = parseFloat(match[1]);
      const unit = match[2];
      const convertedValue = convertValue(value, unit, currentUnit);
      const newText = text.replace(/(\d+(?:\.\d+)?)\s*(мм|см)/, `${formatValue(convertedValue)} ${currentUnit}`);
      element.textContent = newText;
    }
  }
  
  function convertValue(value, fromUnit, toUnit) {
    if (typeof value !== 'number' || isNaN(value)) {
      return 0;
    }
    
    if (!validateUnit(fromUnit) || !validateUnit(toUnit)) {
      return value;
    }
    
    if (fromUnit === toUnit) {
      return value;
    }
    
    const factor = getConversionFactor(fromUnit, toUnit);
    return value * factor;
  }
  
  function formatValue(value, unit = null) {
    if (typeof value !== 'number' || isNaN(value)) {
      return '0';
    }
    
    const targetUnit = unit || currentUnit;
    
    if (targetUnit === 'cm') {
      // Для сантиметрів не показуємо десяткові знаки
      return Math.round(value).toString();
    } else {
      // Для міліметрів показуємо десяткові знаки якщо потрібно
      return value % 1 === 0 ? value.toString() : value.toFixed(1);
    }
  }
  
  function getAllInputValues() {
    const values = {
      foundation: {
        depth: document.getElementById('foundation-depth')?.value || '0',
        width: document.getElementById('foundation-width')?.value || '0',
        height: document.getElementById('foundation-height')?.value || '0'
      },
      blindArea: {
        thickness: document.getElementById('blind-area-thickness')?.value || '0',
        uniformWidth: document.getElementById('blind-area-uniform-width')?.value || '0',
        north: document.getElementById('blind-area-north')?.value || '0',
        south: document.getElementById('blind-area-south')?.value || '0',
        east: document.getElementById('blind-area-east')?.value || '0',
        west: document.getElementById('blind-area-west')?.value || '0'
      },
      tiles: {
        thickness: getSelectedThickness() || '0',
        borderWidth: document.getElementById('tile-border-width')?.value || '0',
        overhang: document.getElementById('tile-overhang')?.value || '0',
        modularThickness: document.getElementById('modular-thickness')?.value || '0',
        modularSeam: getSelectedSeam() || '0',
        modularOverhang: document.getElementById('modular-overhang')?.value || '0'
      },
      cladding: {
        thickness: document.getElementById('cladding-thickness')?.value || '0'
      },
      stands: {
        height: document.getElementById('stands-height')?.value || '0',
        width: document.getElementById('stands-width')?.value || '0',
        depth: document.getElementById('stands-depth')?.value || '0'
      }
    };
    
    return values;
  }
  
  function convertAllValues(oldValues, oldUnit, newUnit) {
    if (!validateUnit(oldUnit) || !validateUnit(newUnit)) {
      return oldValues;
    }
    
    const converted = JSON.parse(JSON.stringify(oldValues));
    
    function convertObject(obj) {
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          convertObject(obj[key]);
        } else if (typeof obj[key] === 'string' && !isNaN(parseFloat(obj[key]))) {
          const value = parseFloat(obj[key]);
          obj[key] = convertValue(value, oldUnit, newUnit).toString();
        }
      });
    }
    
    convertObject(converted);
    return converted;
  }
  
  function getSelectedThickness() {
    const activeButton = document.querySelector('.thickness-btn.active');
    return activeButton ? activeButton.dataset.value : null;
  }
  
  function getSelectedSeam() {
    const activeButton = document.querySelector('.seam-btn.active');
    return activeButton ? activeButton.dataset.value : null;
  }
  
  function updateThicknessButtons() {
    const buttons = document.querySelectorAll('.thickness-btn');
    buttons.forEach(button => {
      const value = parseFloat(button.dataset.value);
      if (!isNaN(value)) {
        const convertedValue = convertValue(value, 'mm', currentUnit);
        button.textContent = `${formatValue(convertedValue)} ${currentUnit}`;
      }
    });
  }
  
  function updateSeamButtons() {
    const buttons = document.querySelectorAll('.seam-btn');
    buttons.forEach(button => {
      const value = parseFloat(button.dataset.value);
      if (!isNaN(value)) {
        const convertedValue = convertValue(value, 'mm', currentUnit);
        button.textContent = `${formatValue(convertedValue)} ${currentUnit}`;
      }
    });
  }
  
  function toggleUnit() {
    const newUnit = currentUnit === 'mm' ? 'cm' : 'mm';
    return changeUnit(newUnit);
  }
  
  function convertToMm(value, unit = null) {
    const sourceUnit = unit || currentUnit;
    return convertValue(value, sourceUnit, 'mm');
  }
  
  function convertFromMm(value, unit = null) {
    const targetUnit = unit || currentUnit;
    return convertValue(value, 'mm', targetUnit);
  }
  
  // Експорт публічного API
  global.ProGran3.Utils.Units = {
    changeUnit: changeUnit,
    getCurrentUnit: getCurrentUnit,
    updateUnitLabels: updateUnitLabels,
    updateUnitToggleButtons: updateUnitToggleButtons,
    convertValue: convertValue,
    formatValue: formatValue,
    getAllInputValues: getAllInputValues,
    convertAllValues: convertAllValues,
    updateThicknessButtons: updateThicknessButtons,
    updateSeamButtons: updateSeamButtons,
    toggleUnit: toggleUnit,
    convertToMm: convertToMm,
    convertFromMm: convertFromMm
  };
  
  // Зворотна сумісність - функції доступні глобально
  global.changeUnit = changeUnit;
  global.getCurrentUnit = getCurrentUnit;
  global.updateUnitLabels = updateUnitLabels;
  global.updateUnitToggleButtons = updateUnitToggleButtons;
  global.formatValue = formatValue;
  global.convertToMm = convertToMm;
  global.getAllInputValues = getAllInputValues;
  global.convertAllValues = convertAllValues;
  global.convertValue = convertValue;
  global.toggleUnit = toggleUnit;
  
  // Ініціалізація
  if (global.ProGran3.Core.Logger) {
    global.ProGran3.Core.Logger.debugLog('Units модуль завантажено', 'info', 'Units');
  }
  
})(window);
