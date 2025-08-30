// proGran3/web/src/modules/builders/FoundationBuilder.js
// Модуль створення фундаменту для ProGran3

import { Logger } from '../utils/Logger.js';
import { convertToMm } from '../utils/Units.js';

export class FoundationBuilder {
  constructor() {
    this.addedElements = window.addedElements || {};
  }

  // Створення фундаменту
  addFoundation() {
    Logger.debug('🏗️ Створення фундаменту...', 'info');
    
    try {
      // Отримуємо розміри фундаменту
      const depth = convertToMm(document.getElementById('foundation-depth').value);
      const width = convertToMm(document.getElementById('foundation-width').value);
      const height = convertToMm(document.getElementById('foundation-height').value);
      
      Logger.debug(`📏 Розміри фундаменту: ${depth}×${width}×${height} мм`, 'info');
      
      // Валідація розмірів
      if (!this.validateFoundationDimensions(depth, width, height)) {
        Logger.debug('❌ Невірні розміри фундаменту', 'error');
        return false;
      }
      
      // Виклик SketchUp API
      if (window.sketchup && window.sketchup.add_foundation) {
        window.sketchup.add_foundation(depth, width, height);
        this.addedElements.foundation = true;
        
        // Оновлюємо підсумкову таблицю
        if (window.updateSummaryTable) {
          window.updateSummaryTable();
        }
        
        Logger.debug('✅ Фундамент створено успішно', 'success');
        return true;
      } else {
        Logger.debug('❌ window.sketchup.add_foundation не доступний', 'error');
        return false;
      }
      
    } catch (error) {
      Logger.debug(`❌ Помилка створення фундаменту: ${error.message}`, 'error');
      return false;
    }
  }

  // Валідація розмірів фундаменту
  validateFoundationDimensions(depth, width, height) {
    // Мінімальні розміри (в мм)
    const minDimension = 100;  // 10 см
    const maxDimension = 10000; // 10 м
    
    // Перевірка довжини
    if (depth < minDimension || depth > maxDimension) {
      Logger.debug(`❌ Довжина фундаменту повинна бути від ${minDimension} до ${maxDimension} мм`, 'error');
      return false;
    }
    
    // Перевірка ширини
    if (width < minDimension || width > maxDimension) {
      Logger.debug(`❌ Ширина фундаменту повинна бути від ${minDimension} до ${maxDimension} мм`, 'error');
      return false;
    }
    
    // Перевірка висоти
    if (height < 50 || height > 1000) {
      Logger.debug('❌ Висота фундаменту повинна бути від 50 до 1000 мм', 'error');
      return false;
    }
    
    return true;
  }

  // Отримання поточних розмірів фундаменту
  getFoundationDimensions() {
    const depth = document.getElementById('foundation-depth')?.value;
    const width = document.getElementById('foundation-width')?.value;
    const height = document.getElementById('foundation-height')?.value;
    
    return {
      depth: depth ? convertToMm(depth) : 0,
      width: width ? convertToMm(width) : 0,
      height: height ? convertToMm(height) : 0
    };
  }

  // Перевірка чи фундамент вже створений
  isFoundationAdded() {
    return this.addedElements.foundation === true;
  }

  // Скидання стану фундаменту
  resetFoundation() {
    this.addedElements.foundation = false;
    Logger.debug('🔄 Стан фундаменту скинуто', 'info');
  }

  // Отримання інформації про фундамент для специфікації
  getFoundationInfo() {
    if (!this.isFoundationAdded()) {
      return '--';
    }
    
    const dims = this.getFoundationDimensions();
    const unit = window.getCurrentUnit ? window.getCurrentUnit() : 'mm';
    const unitText = unit === 'mm' ? 'мм' : 'см';
    
    if (unit === 'cm') {
      return `${Math.round(dims.depth/10)}×${Math.round(dims.width/10)}×${Math.round(dims.height/10)} ${unitText}`;
    } else {
      return `${dims.depth}×${dims.width}×${dims.height} ${unitText}`;
    }
  }
}

// Глобальний екземпляр
const foundationBuilder = new FoundationBuilder();

// Експорт глобальних функцій для зворотної сумісності
export function addFoundation() {
  return foundationBuilder.addFoundation();
}

export function getFoundationDimensions() {
  return foundationBuilder.getFoundationDimensions();
}

export function isFoundationAdded() {
  return foundationBuilder.isFoundationAdded();
}

export function resetFoundation() {
  return foundationBuilder.resetFoundation();
}

export function getFoundationInfo() {
  return foundationBuilder.getFoundationInfo();
}
