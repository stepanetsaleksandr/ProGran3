// proGran3/web/src/modules/utils/Units.js
// Модуль управління одиницями вимірювання для ProGran3

import { Logger } from './Logger.js';

export class UnitsManager {
  constructor() {
    this.currentUnit = 'mm';
    this.initialized = false;
  }

  // Ініціалізація перемикача одиниць
  initialize() {
    if (this.initialized) return;
    
    // Встановлюємо початковий стан кнопок
    this.updateUnitToggleButtons();
    
    this.initialized = true;
    Logger.debug('✅ Перемикач одиниць ініціалізовано', 'success');
  }

  // Зміна одиниць вимірювання
  changeUnit(newUnit) {
    Logger.debug(`🔄 Зміна одиниць з ${this.currentUnit} на ${newUnit}`, 'info');
    
    const oldUnit = this.currentUnit;
    this.currentUnit = newUnit;
    
    Logger.debug(`📝 Поточна одиниця встановлена: ${this.currentUnit}`, 'info');
    
    // Оновлюємо стан кнопок перемикача
    this.updateUnitToggleButtons();
    
    // Отримуємо всі поточні значення
    const oldValues = this.getAllInputValues();
    
    // Конвертуємо всі значення
    const newValues = this.convertAllValues(oldValues, oldUnit, newUnit);
    
    // Застосовуємо нові значення
    this.applyValues(newValues);
    
    // Оновлюємо лейбли
    this.updateUnitLabels();
    
    // Оновлюємо кнопки товщини та шву
    this.updateThicknessButtons();
    this.updateSeamButtons();
    
    // Оновлюємо всі відображення
    if (window.updateAllDisplays) {
      window.updateAllDisplays();
    }
    
    Logger.debug(`✅ Одиниці змінено на ${newUnit}`, 'success');
  }

  // Оновлення стану кнопок перемикача одиниць
  updateUnitToggleButtons() {
    const mmBtn = document.querySelector('.unit-btn[data-unit="mm"]');
    const cmBtn = document.querySelector('.unit-btn[data-unit="cm"]');
    
    Logger.debug(`🔍 Пошук кнопок: mmBtn=${!!mmBtn}, cmBtn=${!!cmBtn}`, 'info');
    
    if (mmBtn && cmBtn) {
      // Видаляємо активний клас з обох кнопок
      mmBtn.classList.remove('active');
      cmBtn.classList.remove('active');
      
      // Додаємо активний клас до поточної одиниці
      if (this.currentUnit === 'mm') {
        mmBtn.classList.add('active');
        Logger.debug('✅ Активна кнопка мм', 'success');
      } else {
        cmBtn.classList.add('active');
        Logger.debug('✅ Активна кнопка см', 'success');
      }
    } else {
      Logger.debug('❌ Кнопки не знайдено', 'error');
    }
  }

  // Отримання всіх значень з input полів
  getAllInputValues() {
    const inputs = {
      // Фундамент
      'foundation-depth': document.getElementById('foundation-depth')?.value,
      'foundation-width': document.getElementById('foundation-width')?.value,
      'foundation-height': document.getElementById('foundation-height')?.value,
      
      // Відмостка
      'blind-area-thickness': document.getElementById('blind-area-thickness')?.value,
      'blind-area-uniform-width': document.getElementById('blind-area-uniform-width')?.value,
      'blind-area-north': document.getElementById('blind-area-north')?.value,
      'blind-area-south': document.getElementById('blind-area-south')?.value,
      'blind-area-east': document.getElementById('blind-area-east')?.value,
      'blind-area-west': document.getElementById('blind-area-west')?.value,
      
      // Плитка
      'tile-border-width': document.getElementById('tile-border-width')?.value,
      'tile-overhang': document.getElementById('tile-overhang')?.value,
      'modular-thickness': document.getElementById('modular-thickness')?.value,
      'modular-overhang': document.getElementById('modular-overhang')?.value,
      
      // Облицювання
      'cladding-thickness': document.getElementById('cladding-thickness')?.value
    };
    
    return inputs;
  }

  // Конвертація всіх значень
  convertAllValues(oldValues, oldUnit, newUnit) {
    const newValues = {};
    
    Object.keys(oldValues).forEach(key => {
      const value = oldValues[key];
      if (value !== undefined && value !== null) {
        newValues[key] = this.convertValue(value, oldUnit, newUnit);
      }
    });
    
    return newValues;
  }

  // Конвертація одного значення
  convertValue(value, oldUnit, newUnit, isSeam = false) {
    if (oldUnit === newUnit) return value;
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return value;
    
    if (oldUnit === 'mm' && newUnit === 'cm') {
      return isSeam ? numValue : (numValue / 10).toFixed(0);
    } else if (oldUnit === 'cm' && newUnit === 'mm') {
      return (numValue * 10).toFixed(0);
    }
    
    return value;
  }

  // Застосування нових значень
  applyValues(newValues) {
    Object.keys(newValues).forEach(key => {
      const element = document.getElementById(key);
      if (element) {
        element.value = newValues[key];
      }
    });
  }

  // Оновлення лейблів одиниць
  updateUnitLabels() {
    const unitText = this.currentUnit === 'mm' ? 'мм' : 'см';
    
    const labels = {
      'foundation-depth-label': `Довжина (${unitText})`,
      'foundation-width-label': `Ширина (${unitText})`,
      'foundation-height-label': `Висота (${unitText})`,
      'blind-area-thickness-label': `Товщина (${unitText})`,
      'blind-area-uniform-width-label': `Ширина (${unitText})`,
      'blind-area-north-label': `Північна сторона (${unitText})`,
      'blind-area-south-label': `Південна сторона (${unitText})`,
      'blind-area-east-label': `Східна сторона (${unitText})`,
      'blind-area-west-label': `Західна сторона (${unitText})`,
      'tile-border-width-label': `Ширина рамки (${unitText})`,
      'tile-overhang-label': `Виступ (${unitText})`,
      'modular-thickness-label': `Товщина (${unitText})`,
      'modular-overhang-label': `Виступ (${unitText})`,
      'cladding-thickness-label': `Товщина (${unitText})`
    };
    
    Object.keys(labels).forEach(key => {
      const element = document.getElementById(key);
      if (element) {
        element.textContent = labels[key];
      }
    });
  }

  // Оновлення кнопок товщини
  updateThicknessButtons() {
    const buttons = document.querySelectorAll('.thickness-btn');
    buttons.forEach(button => {
      const originalValue = button.dataset.originalValue || button.dataset.value;
      
      // Зберігаємо оригінальне значення в мм при першому виклику
      if (!button.dataset.originalValue) {
        button.dataset.originalValue = button.dataset.value;
      }
      
      if (this.currentUnit === 'mm') {
        button.textContent = `${originalValue} мм`;
        button.dataset.value = originalValue;
      } else {
        const cmValue = (originalValue / 10).toFixed(0);
        button.textContent = `${cmValue} см`;
        button.dataset.value = cmValue;
      }
    });
  }

  // Оновлення кнопок шву
  updateSeamButtons() {
    const buttons = document.querySelectorAll('.seam-btn');
    buttons.forEach(button => {
      const originalValue = button.dataset.originalValue || button.dataset.value;
      
      // Зберігаємо оригінальне значення в мм при першому виклику
      if (!button.dataset.originalValue) {
        button.dataset.originalValue = button.dataset.value;
      }
      
      // Шви завжди відображаються в мм
      button.textContent = `${originalValue} мм`;
      button.dataset.value = originalValue;
    });
  }

  // Форматування значення для відображення
  formatValue(value, unit = null) {
    const displayUnit = unit || this.currentUnit;
    const unitText = displayUnit === 'mm' ? 'мм' : 'см';
    
    if (displayUnit === 'cm' && !unit) {
      // Для см не показуємо десяткові знаки
      return `${value} ${unitText}`;
    }
    
    return `${value} ${unitText}`;
  }

  // Конвертація в мм
  convertToMm(value, isSeam = false) {
    if (this.currentUnit === 'mm') {
      return parseFloat(value);
    } else {
      return parseFloat(value) * 10;
    }
  }

  // Отримання поточної одиниці
  getCurrentUnit() {
    return this.currentUnit;
  }
}

// Глобальний екземпляр
const unitsManager = new UnitsManager();

// Експорт глобальних функцій для зворотної сумісності
export function changeUnit(newUnit) {
  unitsManager.changeUnit(newUnit);
}

export function initializeUnits() {
  unitsManager.initialize();
}

export function updateUnitToggleButtons() {
  unitsManager.updateUnitToggleButtons();
}

export function getCurrentUnit() {
  return unitsManager.getCurrentUnit();
}

export function updateUnitLabels() {
  unitsManager.updateUnitLabels();
}

export function updateThicknessButtons() {
  unitsManager.updateThicknessButtons();
}

export function updateSeamButtons() {
  unitsManager.updateSeamButtons();
}

export function formatValue(value, unit = null) {
  return unitsManager.formatValue(value, unit);
}

export function convertToMm(value, isSeam = false) {
  return unitsManager.convertToMm(value, isSeam);
}

export function getAllInputValues() {
  return unitsManager.getAllInputValues();
}

export function convertAllValues(oldValues, oldUnit, newUnit) {
  return unitsManager.convertAllValues(oldValues, oldUnit, newUnit);
}

export function convertValue(value, oldUnit, newUnit, isSeam = false) {
  return unitsManager.convertValue(value, oldUnit, newUnit, isSeam);
}
