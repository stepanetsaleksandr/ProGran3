// proGran3/web/src/modules/utils/Units.js
// Новий модуль управління одиницями вимірювання для ProGran3

export class UnitsManager {
  constructor() {
    this.currentUnit = 'mm';
    this.initialized = false;
    this.radioInputs = null;
  }

  // Ініціалізація нового перемикача
  initialize() {
    if (this.initialized) return;
    
    // Знаходимо radio inputs
    this.radioInputs = {
      mm: document.getElementById('unit-mm'),
      cm: document.getElementById('unit-cm')
    };
    
    // Встановлюємо початковий стан
    this.setCurrentUnit(this.currentUnit);
    
    // Додаємо event listeners
    this.setupEventListeners();
    
    // Додаємо обробник кліків на весь перемикач
    const unitToggle = document.querySelector('.unit-toggle');
    if (unitToggle) {
      unitToggle.addEventListener('click', (e) => {
        // Якщо клікнули не на label або input
        if (!e.target.matches('label, input')) {
          // Перемикаємо на протилежну одиницю
          const newUnit = this.currentUnit === 'mm' ? 'cm' : 'mm';
          this.changeUnit(newUnit);
        }
      });
    }
    
    // Оновлюємо всі лейбли та значення
    this.updateAll();
    
    this.initialized = true;
  }

  // Налаштування event listeners
  setupEventListeners() {
    if (this.radioInputs.mm) {
      this.radioInputs.mm.addEventListener('change', () => {
        if (this.radioInputs.mm.checked) {
          this.changeUnit('mm');
        }
      });
    }
    
    if (this.radioInputs.cm) {
      this.radioInputs.cm.addEventListener('change', () => {
        if (this.radioInputs.cm.checked) {
          this.changeUnit('cm');
        }
      });
    }
    
    // Додатково додаємо обробники для labels
    const mmLabel = document.querySelector('label[for="unit-mm"]');
    const cmLabel = document.querySelector('label[for="unit-cm"]');
    
    if (mmLabel) {
      mmLabel.addEventListener('click', () => {
        this.changeUnit('mm');
      });
    }
    
    if (cmLabel) {
      cmLabel.addEventListener('click', () => {
        this.changeUnit('cm');
      });
    }
  }

  // Встановлення поточної одиниці
  setCurrentUnit(unit) {
    this.currentUnit = unit;
    
    if (this.radioInputs[unit]) {
      this.radioInputs[unit].checked = true;
    }
    
    // Також оновлюємо radio inputs напряму
    const mmRadio = document.getElementById('unit-mm');
    const cmRadio = document.getElementById('unit-cm');
    
    if (mmRadio && cmRadio) {
      mmRadio.checked = (unit === 'mm');
      cmRadio.checked = (unit === 'cm');
    }
  }

  // Зміна одиниць вимірювання
  changeUnit(newUnit) {
    if (this.currentUnit === newUnit) return;
    
    console.log(`Зміна одиниць з ${this.currentUnit} на ${newUnit}`);
    
    const oldUnit = this.currentUnit;
    this.currentUnit = newUnit;
    
    // Оновлюємо radio inputs
    this.setCurrentUnit(newUnit);
    
    // Отримуємо всі поточні значення
    const oldValues = this.getAllInputValues();
    
    // Конвертуємо всі значення
    const newValues = this.convertAllValues(oldValues, oldUnit, newUnit);
    
    // Застосовуємо нові значення
    this.applyValues(newValues);
    
    // Оновлюємо все інше
    this.updateAll();
  }

  // Оновлення всього інтерфейсу
  updateAll() {
    this.updateUnitLabels();
    this.updateThicknessButtons();
    this.updateSeamButtons();
    
    // Оновлюємо всі відображення
    if (window.updateAllDisplays) {
      window.updateAllDisplays();
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
      if (value !== undefined && value !== null && value !== '') {
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
      return isSeam ? numValue : Math.round(numValue / 10);
    } else if (oldUnit === 'cm' && newUnit === 'mm') {
      return numValue * 10;
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
        const cmValue = Math.round(originalValue / 10);
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
      return `${Math.round(value)} ${unitText}`;
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

// Функція для перемикання одиниць з HTML
export function toggleUnit() {
  const newUnit = unitsManager.getCurrentUnit() === 'mm' ? 'cm' : 'mm';
  unitsManager.changeUnit(newUnit);
}

export function initializeUnits() {
  unitsManager.initialize();
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
