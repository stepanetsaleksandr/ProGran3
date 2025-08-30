// proGran3/web/src/modules/builders/CladdingBuilder.js
// Модуль створення облицювання для ProGran3

import { Logger } from '../utils/Logger.js';
import { convertToMm } from '../utils/Units.js';

export class CladdingBuilder {
  constructor() {
    this.addedElements = window.addedElements || {};
  }

  // Створення облицювання
  addCladding() {
    Logger.debug('🏗️ Створення облицювання...', 'info');
    
    try {
      const thickness = convertToMm(document.getElementById('cladding-thickness').value);
      const height = convertToMm(document.getElementById('cladding-height').value);
      const mode = this.getSelectedCladdingMode();
      
      Logger.debug(`📏 Товщина облицювання: ${thickness} мм, висота: ${height} мм, режим: ${mode}`, 'info');
      
      // Валідація параметрів
      if (!this.validateCladdingParameters(thickness, height)) {
        Logger.debug('❌ Невірні параметри облицювання', 'error');
        return false;
      }
      
      if (mode === 'uniform') {
        return this.addUniformCladding(thickness, height);
      } else {
        return this.addCustomCladding(thickness, height);
      }
      
    } catch (error) {
      Logger.debug(`❌ Помилка створення облицювання: ${error.message}`, 'error');
      return false;
    }
  }

  // Створення облицювання з однаковою шириною
  addUniformCladding(thickness, height) {
    const width = convertToMm(document.getElementById('cladding-uniform-width').value);
    
    Logger.debug(`🏗️ Створення облицювання з однаковою шириною: ${width}мм, товщина: ${thickness}мм, висота: ${height}мм`, 'info');
    
    // Валідація ширини
    if (!this.validateCladdingWidth(width)) {
      return false;
    }
    
    if (window.sketchup && window.sketchup.add_cladding_uniform) {
      window.sketchup.add_cladding_uniform(width, thickness, height);
      this.addedElements.cladding = true;
      
      if (window.updateSummaryTable) {
        window.updateSummaryTable();
      }
      
      Logger.debug('✅ Облицювання з однаковою шириною створено успішно', 'success');
      return true;
    } else {
      Logger.debug('❌ window.sketchup.add_cladding_uniform не доступний', 'error');
      return false;
    }
  }

  // Створення облицювання з різною шириною
  addCustomCladding(thickness, height) {
    const north = convertToMm(document.getElementById('cladding-north').value);
    const south = convertToMm(document.getElementById('cladding-south').value);
    const east = convertToMm(document.getElementById('cladding-east').value);
    const west = convertToMm(document.getElementById('cladding-west').value);
    
    Logger.debug(`🏗️ Створення облицювання з різною шириною: П:${north}мм, Пд:${south}мм, С:${east}мм, З:${west}мм, товщина: ${thickness}мм, висота: ${height}мм`, 'info');
    
    // Валідація всіх сторін
    if (!this.validateCladdingWidth(north) || !this.validateCladdingWidth(south) || 
        !this.validateCladdingWidth(east) || !this.validateCladdingWidth(west)) {
      return false;
    }
    
    if (window.sketchup && window.sketchup.add_cladding_custom) {
      window.sketchup.add_cladding_custom(north, south, east, west, thickness, height);
      this.addedElements.cladding = true;
      
      if (window.updateSummaryTable) {
        window.updateSummaryTable();
      }
      
      Logger.debug('✅ Облицювання з різною шириною створено успішно', 'success');
      return true;
    } else {
      Logger.debug('❌ window.sketchup.add_cladding_custom не доступний', 'error');
      return false;
    }
  }

  // Валідація параметрів облицювання
  validateCladdingParameters(thickness, height) {
    // Валідація товщини
    if (thickness < 10 || thickness > 100) {
      Logger.debug('❌ Товщина облицювання повинна бути від 10 до 100 мм', 'error');
      return false;
    }
    
    // Валідація висоти
    if (height < 50 || height > 3000) {
      Logger.debug('❌ Висота облицювання повинна бути від 50 до 3000 мм', 'error');
      return false;
    }
    
    return true;
  }

  // Валідація ширини облицювання
  validateCladdingWidth(width) {
    if (width < 20 || width > 5000) {
      Logger.debug('❌ Ширина облицювання повинна бути від 20 до 5000 мм', 'error');
      return false;
    }
    return true;
  }

  // Отримання вибраного режиму облицювання
  getSelectedCladdingMode() {
    const activeButton = document.querySelector('.button-group-cladding-mode .cladding-mode-btn.active');
    return activeButton ? activeButton.dataset.value : 'uniform';
  }

  // Вибір режиму облицювання
  selectCladdingMode(button) {
    Logger.debug(`🔄 Зміна режиму облицювання на: ${button.dataset.value}`, 'info');
    
    // Видаляємо активний клас з усіх кнопок режиму ширини
    document.querySelectorAll('.button-group-cladding-mode .cladding-mode-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Додаємо активний клас до натиснутої кнопки
    button.classList.add('active');
    
    // Оновлюємо контроли
    this.updateCladdingControls();
  }

  // Оновлення контролів облицювання
  updateCladdingControls() {
    const mode = this.getSelectedCladdingMode();
    const uniformControls = document.getElementById('uniform-cladding-controls');
    const customControls = document.getElementById('custom-cladding-controls');
    
    if (mode === 'uniform') {
      uniformControls.classList.remove('hidden');
      customControls.classList.add('hidden');
    } else {
      uniformControls.classList.add('hidden');
      customControls.classList.remove('hidden');
    }
    
    // Оновлюємо всі відображення
    if (window.updateAllDisplays) {
      window.updateAllDisplays();
    }
    
    Logger.debug(`✅ Контроли облицювання оновлено для режиму: ${mode}`, 'success');
  }

  // Перевірка чи облицювання вже створене
  isCladdingAdded() {
    return this.addedElements.cladding === true;
  }

  // Скидання стану облицювання
  resetCladding() {
    this.addedElements.cladding = false;
    Logger.debug('🔄 Стан облицювання скинуто', 'info');
  }

  // Отримання інформації про облицювання для специфікації
  getCladdingInfo() {
    if (!this.isCladdingAdded()) {
      return '--';
    }
    
    const thickness = convertToMm(document.getElementById('cladding-thickness').value);
    const height = convertToMm(document.getElementById('cladding-height').value);
    const mode = this.getSelectedCladdingMode();
    const unit = window.getCurrentUnit ? window.getCurrentUnit() : 'mm';
    const unitText = unit === 'mm' ? 'мм' : 'см';
    
    if (mode === 'uniform') {
      const width = convertToMm(document.getElementById('cladding-uniform-width').value);
      if (unit === 'cm') {
        return `Ш:${Math.round(width/10)} В:${Math.round(height/10)} Т:${Math.round(thickness/10)} ${unitText}`;
      } else {
        return `Ш:${width} В:${height} Т:${thickness} ${unitText}`;
      }
    } else {
      const north = convertToMm(document.getElementById('cladding-north').value);
      const south = convertToMm(document.getElementById('cladding-south').value);
      const east = convertToMm(document.getElementById('cladding-east').value);
      const west = convertToMm(document.getElementById('cladding-west').value);
      
      if (unit === 'cm') {
        return `П:${Math.round(north/10)} Пд:${Math.round(south/10)} С:${Math.round(east/10)} З:${Math.round(west/10)} В:${Math.round(height/10)} Т:${Math.round(thickness/10)} ${unitText}`;
      } else {
        return `П:${north} Пд:${south} С:${east} З:${west} В:${height} Т:${thickness} ${unitText}`;
      }
    }
  }
}

// Глобальний екземпляр
const claddingBuilder = new CladdingBuilder();

// Експорт глобальних функцій для зворотної сумісності
export function addCladding() {
  return claddingBuilder.addCladding();
}

export function selectCladdingMode(button) {
  return claddingBuilder.selectCladdingMode(button);
}

export function getSelectedCladdingMode() {
  return claddingBuilder.getSelectedCladdingMode();
}

export function updateCladdingControls() {
  return claddingBuilder.updateCladdingControls();
}

export function isCladdingAdded() {
  return claddingBuilder.isCladdingAdded();
}

export function resetCladding() {
  return claddingBuilder.resetCladding();
}

export function getCladdingInfo() {
  return claddingBuilder.getCladdingInfo();
}
