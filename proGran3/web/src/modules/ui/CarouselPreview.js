// proGran3/web/src/modules/ui/CarouselPreview.js
// Модуль попереднього перегляду елементів каруселі для ProGran3

import { Logger } from '../utils/Logger.js';

export class CarouselPreview {
  constructor() {
    this.previewCache = new Map();
    this.loadingStates = new Map();
  }

  // Створення попереднього перегляду для моделі
  createPreview(carouselType, modelIndex) {
    Logger.debug(`🖼️ Створення попереднього перегляду: ${carouselType}[${modelIndex}]`, 'info');
    
    try {
      const model = this.getModelByIndex(carouselType, modelIndex);
      if (!model) {
        Logger.debug(`❌ Модель ${carouselType}[${modelIndex}] не знайдена`, 'error');
        return null;
      }

      const previewKey = `${carouselType}_${modelIndex}`;
      
      // Перевіряємо кеш
      if (this.previewCache.has(previewKey)) {
        Logger.debug(`📋 Попередній перегляд ${previewKey} знайдено в кеші`, 'info');
        return this.previewCache.get(previewKey);
      }

      // Створюємо новий попередній перегляд
      const preview = this.generatePreviewElement(model, carouselType, modelIndex);
      
      // Кешуємо результат
      this.previewCache.set(previewKey, preview);
      
      Logger.debug(`✅ Попередній перегляд ${previewKey} створено`, 'success');
      return preview;
      
    } catch (error) {
      Logger.debug(`❌ Помилка створення попереднього перегляду: ${error.message}`, 'error');
      return null;
    }
  }

  // Генерація елемента попереднього перегляду
  generatePreviewElement(model, carouselType, modelIndex) {
    const previewContainer = document.createElement('div');
    previewContainer.className = 'carousel-preview-item';
    previewContainer.dataset.carouselType = carouselType;
    previewContainer.dataset.modelIndex = modelIndex;
    
    // Створюємо зображення
    const imageElement = document.createElement('img');
    imageElement.className = 'preview-image';
    imageElement.src = model.image || '';
    imageElement.alt = model.name || 'Попередній перегляд';
    imageElement.loading = 'lazy';
    
    // Обробка помилок завантаження зображення
    imageElement.onerror = () => {
      imageElement.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QmFjayBpbWFnZTwvdGV4dD48L3N2Zz4=';
      Logger.debug(`⚠️ Помилка завантаження зображення для ${carouselType}[${modelIndex}]`, 'info');
    };
    
    // Створюємо назву
    const nameElement = document.createElement('div');
    nameElement.className = 'preview-name';
    nameElement.textContent = model.name || 'Без назви';
    
    // Створюємо розміри
    const dimensionsElement = document.createElement('div');
    dimensionsElement.className = 'preview-dimensions';
    dimensionsElement.textContent = model.dimensions || '';
    
    // Створюємо індикатор завантаження
    const loadingElement = document.createElement('div');
    loadingElement.className = 'preview-loading';
    loadingElement.innerHTML = '<div class="spinner"></div>';
    
    // Додаємо елементи до контейнера
    previewContainer.appendChild(loadingElement);
    previewContainer.appendChild(imageElement);
    previewContainer.appendChild(nameElement);
    previewContainer.appendChild(dimensionsElement);
    
    // Обробка завантаження зображення
    imageElement.onload = () => {
      loadingElement.style.display = 'none';
      imageElement.style.display = 'block';
      Logger.debug(`✅ Зображення ${carouselType}[${modelIndex}] завантажено`, 'success');
    };
    
    // Додаємо обробник кліків
    previewContainer.addEventListener('click', () => {
      this.selectPreview(carouselType, modelIndex);
    });
    
    return previewContainer;
  }

  // Вибір попереднього перегляду
  selectPreview(carouselType, modelIndex) {
    Logger.debug(`🎯 Вибір попереднього перегляду: ${carouselType}[${modelIndex}]`, 'info');
    
    // Видаляємо активний клас з усіх попередніх переглядів
    document.querySelectorAll('.carousel-preview-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // Додаємо активний клас до вибраного
    const selectedPreview = document.querySelector(`[data-carousel-type="${carouselType}"][data-model-index="${modelIndex}"]`);
    if (selectedPreview) {
      selectedPreview.classList.add('active');
    }
    
    // Оновлюємо карусель
    if (window.selectModel) {
      window.selectModel(carouselType, modelIndex);
    }
    
    Logger.debug(`✅ Попередній перегляд ${carouselType}[${modelIndex}] вибрано`, 'success');
  }

  // Створення сітки попередніх переглядів
  createPreviewGrid(carouselType) {
    Logger.debug(`📋 Створення сітки попередніх переглядів для ${carouselType}`, 'info');
    
    try {
      const models = this.getModelsForCarousel(carouselType);
      const gridContainer = document.createElement('div');
      gridContainer.className = 'carousel-preview-grid';
      gridContainer.dataset.carouselType = carouselType;
      
      if (models.length === 0) {
        gridContainer.innerHTML = '<div class="no-preview">Немає доступних моделей</div>';
        return gridContainer;
      }
      
      // Створюємо попередні перегляди для всіх моделей
      models.forEach((model, index) => {
        const preview = this.createPreview(carouselType, index);
        if (preview) {
          gridContainer.appendChild(preview);
        }
      });
      
      Logger.debug(`✅ Сітка попередніх переглядів ${carouselType} створена (${models.length} елементів)`, 'success');
      return gridContainer;
      
    } catch (error) {
      Logger.debug(`❌ Помилка створення сітки попередніх переглядів: ${error.message}`, 'error');
      return null;
    }
  }

  // Оновлення попереднього перегляду
  updatePreview(carouselType, modelIndex) {
    const previewKey = `${carouselType}_${modelIndex}`;
    const model = this.getModelByIndex(carouselType, modelIndex);
    
    if (!model) {
      Logger.debug(`❌ Модель ${carouselType}[${modelIndex}] не знайдена для оновлення`, 'error');
      return false;
    }
    
    // Видаляємо з кешу
    this.previewCache.delete(previewKey);
    
    // Створюємо новий попередній перегляд
    const newPreview = this.createPreview(carouselType, modelIndex);
    
    // Оновлюємо в DOM
    const existingPreview = document.querySelector(`[data-carousel-type="${carouselType}"][data-model-index="${modelIndex}"]`);
    if (existingPreview && newPreview) {
      existingPreview.replaceWith(newPreview);
      Logger.debug(`✅ Попередній перегляд ${previewKey} оновлено`, 'success');
      return true;
    }
    
    return false;
  }

  // Очищення кешу попередніх переглядів
  clearPreviewCache(carouselType = null) {
    if (carouselType) {
      // Очищаємо кеш для конкретного типу каруселі
      for (const key of this.previewCache.keys()) {
        if (key.startsWith(`${carouselType}_`)) {
          this.previewCache.delete(key);
        }
      }
      Logger.debug(`🗑️ Кеш попередніх переглядів для ${carouselType} очищено`, 'info');
    } else {
      // Очищаємо весь кеш
      this.previewCache.clear();
      Logger.debug('🗑️ Весь кеш попередніх переглядів очищено', 'info');
    }
  }

  // Отримання моделі за індексом
  getModelByIndex(carouselType, modelIndex) {
    const models = this.getModelsForCarousel(carouselType);
    return models[modelIndex] || null;
  }

  // Отримання моделей для каруселі
  getModelsForCarousel(carouselType) {
    return window.modelLists?.[carouselType] || [];
  }

  // Перевірка чи попередній перегляд завантажений
  isPreviewLoaded(carouselType, modelIndex) {
    const previewKey = `${carouselType}_${modelIndex}`;
    return this.previewCache.has(previewKey);
  }

  // Отримання статистики кешу
  getCacheStats() {
    return {
      totalCached: this.previewCache.size,
      carouselTypes: Array.from(this.previewCache.keys()).map(key => key.split('_')[0])
    };
  }

  // Попереднє завантаження попередніх переглядів
  preloadPreviews(carouselType, startIndex = 0, count = 5) {
    Logger.debug(`⏳ Попереднє завантаження попередніх переглядів: ${carouselType} (${startIndex}-${startIndex + count - 1})`, 'info');
    
    const models = this.getModelsForCarousel(carouselType);
    const endIndex = Math.min(startIndex + count, models.length);
    
    for (let i = startIndex; i < endIndex; i++) {
      if (!this.isPreviewLoaded(carouselType, i)) {
        setTimeout(() => {
          this.createPreview(carouselType, i);
        }, (i - startIndex) * 100); // Затримка для уникнення блокування
      }
    }
    
    Logger.debug(`✅ Попереднє завантаження ${carouselType} заплановано`, 'success');
  }
}

// Глобальний екземпляр
const carouselPreview = new CarouselPreview();

// Експорт глобальних функцій для зворотної сумісності
export function createPreview(carouselType, modelIndex) {
  return carouselPreview.createPreview(carouselType, modelIndex);
}

export function createPreviewGrid(carouselType) {
  return carouselPreview.createPreviewGrid(carouselType);
}

export function updatePreview(carouselType, modelIndex) {
  return carouselPreview.updatePreview(carouselType, modelIndex);
}

export function selectPreview(carouselType, modelIndex) {
  return carouselPreview.selectPreview(carouselType, modelIndex);
}

export function clearPreviewCache(carouselType = null) {
  return carouselPreview.clearPreviewCache(carouselType);
}

export function isPreviewLoaded(carouselType, modelIndex) {
  return carouselPreview.isPreviewLoaded(carouselType, modelIndex);
}

export function getCacheStats() {
  return carouselPreview.getCacheStats();
}

export function preloadPreviews(carouselType, startIndex = 0, count = 5) {
  return carouselPreview.preloadPreviews(carouselType, startIndex, count);
}
