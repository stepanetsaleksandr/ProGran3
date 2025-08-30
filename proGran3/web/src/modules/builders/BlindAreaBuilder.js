// proGran3/web/src/modules/builders/BlindAreaBuilder.js
// Модуль створення відмостки для ProGran3

import { Logger } from '../utils/Logger.js';
import { convertToMm } from '../utils/Units.js';

export class BlindAreaBuilder {
  constructor() {
    this.addedElements = window.addedElements || {};
  }

  // Створення відмостки
  addBlindArea() {
    Logger.debug('🏗️ Створення відмостки...', 'info');
    
    try {
      const thickness = convertToMm(document.getElementById('blind-area-thickness').value);
      const mode = this.getSelectedBlindAreaMode();
      
      Logger.debug(`📏 Товщина відмостки: ${thickness} мм, режим: ${mode}`, 'info');
      
      // Валідація товщини
      if (!this.validateBlindAreaThickness(thickness)) {
        Logger.debug('❌ Невірна товщина відмостки', 'error');
        return false;
      }
      
      if (mode === 'uniform') {
        return this.addUniformBlindArea(thickness);
      } else {
        return this.addCustomBlindArea(thickness);
      }
      
    } catch (error) {
      Logger.debug(`❌ Помилка створення відмостки: ${error.message}`, 'error');
      return false;
    }
  }

  // Створення відмостки з однаковою шириною
  addUniformBlindArea(thickness) {
    const width = convertToMm(document.getElementById('blind-area-uniform-width').value);
    
    Logger.debug(`🏗️ Створення відмостки з однаковою шириною: ${width}мм, товщина: ${thickness}мм`, 'info');
    
    // Валідація ширини
    if (!this.validateBlindAreaWidth(width)) {
      return false;
    }
    
    if (window.sketchup && window.sketchup.add_blind_area_uniform) {
      window.sketchup.add_blind_area_uniform(width, thickness);
      this.addedElements.blindArea = true;
      
      if (window.updateSummaryTable) {
        window.updateSummaryTable();
      }
      
      Logger.debug('✅ Відмостка з однаковою шириною створена успішно', 'success');
      return true;
    } else {
      Logger.debug('❌ window.sketchup.add_blind_area_uniform не доступний', 'error');
      return false;
    }
  }

  // Створення відмостки з різною шириною
  addCustomBlindArea(thickness) {
    const north = convertToMm(document.getElementById('blind-area-north').value);
    const south = convertToMm(document.getElementById('blind-area-south').value);
    const east = convertToMm(document.getElementById('blind-area-east').value);
    const west = convertToMm(document.getElementById('blind-area-west').value);
    
    Logger.debug(`🏗️ Створення відмостки з різною шириною: П:${north}мм, Пд:${south}мм, С:${east}мм, З:${west}мм, товщина: ${thickness}мм`, 'info');
    
    // Валідація всіх сторін
    if (!this.validateBlindAreaWidth(north) || !this.validateBlindAreaWidth(south) || 
        !this.validateBlindAreaWidth(east) || !this.validateBlindAreaWidth(west)) {
      return false;
    }
    
    if (window.sketchup && window.sketchup.add_blind_area_custom) {
      window.sketchup.add_blind_area_custom(north, south, east, west, thickness);
      this.addedElements.blindArea = true;
      
      if (window.updateSummaryTable) {
        window.updateSummaryTable();
      }
      
      Logger.debug('✅ Відмостка з різною шириною створена успішно', 'success');
      return true;
    } else {
      Logger.debug('❌ window.sketchup.add_blind_area_custom не доступний', 'error');
      return false;
    }
  }

  // Валідація товщини відмостки
  validateBlindAreaThickness(thickness) {
    if (thickness < 30 || thickness > 200) {
      Logger.debug('❌ Товщина відмостки повинна бути від 30 до 200 мм', 'error');
      return false;
    }
    return true;
  }

  // Валідація ширини відмостки
  validateBlindAreaWidth(width) {
    if (width < 50 || width > 1000) {
      Logger.debug('❌ Ширина відмостки повинна бути від 50 до 1000 мм', 'error');
      return false;
    }
    return true;
  }

  // Отримання вибраного режиму відмостки
  getSelectedBlindAreaMode() {
    const activeButton = document.querySelector('.button-group-tiling-mode .tiling-mode-btn.active');
    return activeButton ? activeButton.dataset.value : 'uniform';
  }

  // Вибір режиму відмостки
  selectBlindAreaMode(button) {
    Logger.debug(`🔄 Зміна режиму відмостки на: ${button.dataset.value}`, 'info');
    
    // Видаляємо активний клас з усіх кнопок режиму ширини
    document.querySelectorAll('.button-group-tiling-mode .tiling-mode-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Додаємо активний клас до натиснутої кнопки
    button.classList.add('active');
    
    // Оновлюємо контроли
    this.updateBlindAreaControls();
  }

  // Оновлення контролів відмостки
  updateBlindAreaControls() {
    const mode = this.getSelectedBlindAreaMode();
    const uniformControls = document.getElementById('uniform-controls');
    const customControls = document.getElementById('custom-controls');
    
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
    
    Logger.debug(`✅ Контроли відмостки оновлено для режиму: ${mode}`, 'success');
  }

  // Перевірка чи відмостка вже створена
  isBlindAreaAdded() {
    return this.addedElements.blindArea === true;
  }

  // Скидання стану відмостки
  resetBlindArea() {
    this.addedElements.blindArea = false;
    Logger.debug('🔄 Стан відмостки скинуто', 'info');
  }

  // Отримання інформації про відмостку для специфікації
  getBlindAreaInfo() {
    if (!this.isBlindAreaAdded()) {
      return '--';
    }
    
    const thickness = convertToMm(document.getElementById('blind-area-thickness').value);
    const mode = this.getSelectedBlindAreaMode();
    const unit = window.getCurrentUnit ? window.getCurrentUnit() : 'mm';
    const unitText = unit === 'mm' ? 'мм' : 'см';
    
    if (mode === 'uniform') {
      const width = convertToMm(document.getElementById('blind-area-uniform-width').value);
      if (unit === 'cm') {
        return `Ширина: ${Math.round(width/10)} ${unitText}, Товщина: ${Math.round(thickness/10)} ${unitText}`;
      } else {
        return `Ширина: ${width} ${unitText}, Товщина: ${thickness} ${unitText}`;
      }
    } else {
      const north = convertToMm(document.getElementById('blind-area-north').value);
      const south = convertToMm(document.getElementById('blind-area-south').value);
      const east = convertToMm(document.getElementById('blind-area-east').value);
      const west = convertToMm(document.getElementById('blind-area-west').value);
      
      if (unit === 'cm') {
        return `П:${Math.round(north/10)} Пд:${Math.round(south/10)} С:${Math.round(east/10)} З:${Math.round(west/10)} ${unitText}, Т:${Math.round(thickness/10)} ${unitText}`;
      } else {
        return `П:${north} Пд:${south} С:${east} З:${west} ${unitText}, Т:${thickness} ${unitText}`;
      }
    }
  }
}

// Глобальний екземпляр
const blindAreaBuilder = new BlindAreaBuilder();

// Експорт глобальних функцій для зворотної сумісності
export function addBlindArea() {
  return blindAreaBuilder.addBlindArea();
}

export function selectBlindAreaMode(button) {
  return blindAreaBuilder.selectBlindAreaMode(button);
}

export function getSelectedBlindAreaMode() {
  return blindAreaBuilder.getSelectedBlindAreaMode();
}

export function updateBlindAreaControls() {
  return blindAreaBuilder.updateBlindAreaControls();
}

export function isBlindAreaAdded() {
  return blindAreaBuilder.isBlindAreaAdded();
}

export function resetBlindArea() {
  return blindAreaBuilder.resetBlindArea();
}

export function getBlindAreaInfo() {
  return blindAreaBuilder.getBlindAreaInfo();
}
