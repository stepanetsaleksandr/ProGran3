// proGran3/web/src/modules/builders/TilingBuilder.js
// Модуль створення плитки для ProGran3

import { Logger } from '../utils/Logger.js';
import { convertToMm } from '../utils/Units.js';

export class TilingBuilder {
  constructor() {
    this.addedElements = window.addedElements || {};
  }

  // Створення плитки
  addTiling() {
    Logger.debug('🏗️ Створення плитки...', 'info');
    
    try {
      const thickness = convertToMm(document.getElementById('tiling-thickness').value);
      const mode = this.getSelectedTilingMode();
      
      Logger.debug(`📏 Товщина плитки: ${thickness} мм, режим: ${mode}`, 'info');
      
      // Валідація товщини
      if (!this.validateTilingThickness(thickness)) {
        Logger.debug('❌ Невірна товщина плитки', 'error');
        return false;
      }
      
      if (mode === 'uniform') {
        return this.addUniformTiling(thickness);
      } else {
        return this.addCustomTiling(thickness);
      }
      
    } catch (error) {
      Logger.debug(`❌ Помилка створення плитки: ${error.message}`, 'error');
      return false;
    }
  }

  // Створення плитки з однаковою шириною
  addUniformTiling(thickness) {
    const width = convertToMm(document.getElementById('tiling-uniform-width').value);
    
    Logger.debug(`🏗️ Створення плитки з однаковою шириною: ${width}мм, товщина: ${thickness}мм`, 'info');
    
    // Валідація ширини
    if (!this.validateTilingWidth(width)) {
      return false;
    }
    
    if (window.sketchup && window.sketchup.add_tiling_uniform) {
      window.sketchup.add_tiling_uniform(width, thickness);
      this.addedElements.tiling = true;
      
      if (window.updateSummaryTable) {
        window.updateSummaryTable();
      }
      
      Logger.debug('✅ Плитка з однаковою шириною створена успішно', 'success');
      return true;
    } else {
      Logger.debug('❌ window.sketchup.add_tiling_uniform не доступний', 'error');
      return false;
    }
  }

  // Створення плитки з різною шириною
  addCustomTiling(thickness) {
    const north = convertToMm(document.getElementById('tiling-north').value);
    const south = convertToMm(document.getElementById('tiling-south').value);
    const east = convertToMm(document.getElementById('tiling-east').value);
    const west = convertToMm(document.getElementById('tiling-west').value);
    
    Logger.debug(`🏗️ Створення плитки з різною шириною: П:${north}мм, Пд:${south}мм, С:${east}мм, З:${west}мм, товщина: ${thickness}мм`, 'info');
    
    // Валідація всіх сторін
    if (!this.validateTilingWidth(north) || !this.validateTilingWidth(south) || 
        !this.validateTilingWidth(east) || !this.validateTilingWidth(west)) {
      return false;
    }
    
    if (window.sketchup && window.sketchup.add_tiling_custom) {
      window.sketchup.add_tiling_custom(north, south, east, west, thickness);
      this.addedElements.tiling = true;
      
      if (window.updateSummaryTable) {
        window.updateSummaryTable();
      }
      
      Logger.debug('✅ Плитка з різною шириною створена успішно', 'success');
      return true;
    } else {
      Logger.debug('❌ window.sketchup.add_tiling_custom не доступний', 'error');
      return false;
    }
  }

  // Валідація товщини плитки
  validateTilingThickness(thickness) {
    if (thickness < 20 || thickness > 150) {
      Logger.debug('❌ Товщина плитки повинна бути від 20 до 150 мм', 'error');
      return false;
    }
    return true;
  }

  // Валідація ширини плитки
  validateTilingWidth(width) {
    if (width < 30 || width > 2000) {
      Logger.debug('❌ Ширина плитки повинна бути від 30 до 2000 мм', 'error');
      return false;
    }
    return true;
  }

  // Отримання вибраного режиму плитки
  getSelectedTilingMode() {
    const activeButton = document.querySelector('.button-group-tiling-mode .tiling-mode-btn.active');
    return activeButton ? activeButton.dataset.value : 'uniform';
  }

  // Вибір режиму плитки
  selectTilingMode(button) {
    Logger.debug(`🔄 Зміна режиму плитки на: ${button.dataset.value}`, 'info');
    
    // Видаляємо активний клас з усіх кнопок режиму ширини
    document.querySelectorAll('.button-group-tiling-mode .tiling-mode-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Додаємо активний клас до натиснутої кнопки
    button.classList.add('active');
    
    // Оновлюємо контроли
    this.updateTilingControls();
  }

  // Оновлення контролів плитки
  updateTilingControls() {
    const mode = this.getSelectedTilingMode();
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
    
    Logger.debug(`✅ Контроли плитки оновлено для режиму: ${mode}`, 'success');
  }

  // Перевірка чи плитка вже створена
  isTilingAdded() {
    return this.addedElements.tiling === true;
  }

  // Скидання стану плитки
  resetTiling() {
    this.addedElements.tiling = false;
    Logger.debug('🔄 Стан плитки скинуто', 'info');
  }

  // Отримання інформації про плитку для специфікації
  getTilingInfo() {
    if (!this.isTilingAdded()) {
      return '--';
    }
    
    const thickness = convertToMm(document.getElementById('tiling-thickness').value);
    const mode = this.getSelectedTilingMode();
    const unit = window.getCurrentUnit ? window.getCurrentUnit() : 'mm';
    const unitText = unit === 'mm' ? 'мм' : 'см';
    
    if (mode === 'uniform') {
      const width = convertToMm(document.getElementById('tiling-uniform-width').value);
      if (unit === 'cm') {
        return `Ширина: ${Math.round(width/10)} ${unitText}, Товщина: ${Math.round(thickness/10)} ${unitText}`;
      } else {
        return `Ширина: ${width} ${unitText}, Товщина: ${thickness} ${unitText}`;
      }
    } else {
      const north = convertToMm(document.getElementById('tiling-north').value);
      const south = convertToMm(document.getElementById('tiling-south').value);
      const east = convertToMm(document.getElementById('tiling-east').value);
      const west = convertToMm(document.getElementById('tiling-west').value);
      
      if (unit === 'cm') {
        return `П:${Math.round(north/10)} Пд:${Math.round(south/10)} С:${Math.round(east/10)} З:${Math.round(west/10)} ${unitText}, Т:${Math.round(thickness/10)} ${unitText}`;
      } else {
        return `П:${north} Пд:${south} С:${east} З:${west} ${unitText}, Т:${thickness} ${unitText}`;
      }
    }
  }
}

// Глобальний екземпляр
const tilingBuilder = new TilingBuilder();

// Експорт глобальних функцій для зворотної сумісності
export function addTiling() {
  return tilingBuilder.addTiling();
}

export function selectTilingMode(button) {
  return tilingBuilder.selectTilingMode(button);
}

export function getSelectedTilingMode() {
  return tilingBuilder.getSelectedTilingMode();
}

export function updateTilingControls() {
  return tilingBuilder.updateTilingControls();
}

export function isTilingAdded() {
  return tilingBuilder.isTilingAdded();
}

export function resetTiling() {
  return tilingBuilder.resetTiling();
}

export function getTilingInfo() {
  return tilingBuilder.getTilingInfo();
}
