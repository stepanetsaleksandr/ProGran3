// proGran3/web/src/modules/ui/CarouselManager.js
// Модуль управління каруселлю для ProGran3

import { Logger } from '../utils/Logger.js';

export class CarouselManager {
  constructor() {
    this.carouselState = window.carouselState || {
      stands: { index: 0 },
      steles: { index: 0 },
      flowerbeds: { index: 0 }
    };
    this.modelLists = window.modelLists || {};
  }

  // Ініціалізація каруселі
  initializeCarousel(carouselType) {
    Logger.debug(`🎠 Ініціалізація каруселі: ${carouselType}`, 'info');
    
    try {
      const carouselContainer = document.getElementById(`${carouselType}-carousel`);
      if (!carouselContainer) {
        Logger.debug(`❌ Контейнер каруселі ${carouselType} не знайдено`, 'error');
        return false;
      }

      // Завантажуємо моделі для даного типу
      this.loadModelsForCarousel(carouselType);
      
      // Оновлюємо відображення
      this.updateCarouselDisplay(carouselType);
      
      Logger.debug(`✅ Карусель ${carouselType} ініціалізована`, 'success');
      return true;
      
    } catch (error) {
      Logger.debug(`❌ Помилка ініціалізації каруселі ${carouselType}: ${error.message}`, 'error');
      return false;
    }
  }

  // Завантаження моделей для каруселі
  loadModelsForCarousel(carouselType) {
    Logger.debug(`📦 Завантаження моделей для ${carouselType}`, 'info');
    
    if (window.sketchup && window.sketchup.get_models) {
      try {
        const models = window.sketchup.get_models(carouselType);
        this.modelLists[carouselType] = models || [];
        Logger.debug(`📋 Завантажено ${this.modelLists[carouselType].length} моделей для ${carouselType}`, 'success');
      } catch (error) {
        Logger.debug(`❌ Помилка завантаження моделей ${carouselType}: ${error.message}`, 'error');
        this.modelLists[carouselType] = [];
      }
    } else {
      Logger.debug(`⚠️ window.sketchup.get_models не доступний для ${carouselType}`, 'info');
      this.modelLists[carouselType] = [];
    }
  }

  // Оновлення відображення каруселі
  updateCarouselDisplay(carouselType) {
    const carouselContainer = document.getElementById(`${carouselType}-carousel`);
    if (!carouselContainer) return;

    const models = this.modelLists[carouselType] || [];
    const currentIndex = this.carouselState[carouselType]?.index || 0;
    
    if (models.length === 0) {
      carouselContainer.innerHTML = '<div class="no-models">Немає доступних моделей</div>';
      return;
    }

    const currentModel = models[currentIndex];
    if (!currentModel) return;

    // Оновлюємо зображення
    const imageElement = carouselContainer.querySelector('.carousel-image');
    if (imageElement) {
      imageElement.src = currentModel.image || '';
      imageElement.alt = currentModel.name || 'Модель';
    }

    // Оновлюємо назву
    const nameElement = carouselContainer.querySelector('.carousel-name');
    if (nameElement) {
      nameElement.textContent = currentModel.name || 'Без назви';
    }

    // Оновлюємо розміри
    const dimensionsElement = carouselContainer.querySelector('.carousel-dimensions');
    if (dimensionsElement) {
      dimensionsElement.textContent = currentModel.dimensions || '';
    }

    // Оновлюємо навігацію
    this.updateCarouselNavigation(carouselType, models.length, currentIndex);
    
    Logger.debug(`🔄 Карусель ${carouselType} оновлена (${currentIndex + 1}/${models.length})`, 'info');
  }

  // Оновлення навігації каруселі
  updateCarouselNavigation(carouselType, totalModels, currentIndex) {
    const prevButton = document.getElementById(`${carouselType}-prev`);
    const nextButton = document.getElementById(`${carouselType}-next`);
    const counterElement = document.getElementById(`${carouselType}-counter`);

    if (prevButton) {
      prevButton.disabled = currentIndex === 0;
      prevButton.style.opacity = currentIndex === 0 ? '0.5' : '1';
    }

    if (nextButton) {
      nextButton.disabled = currentIndex === totalModels - 1;
      nextButton.style.opacity = currentIndex === totalModels - 1 ? '0.5' : '1';
    }

    if (counterElement) {
      counterElement.textContent = `${currentIndex + 1} / ${totalModels}`;
    }
  }

  // Перехід до наступної моделі
  nextModel(carouselType) {
    const models = this.modelLists[carouselType] || [];
    const currentIndex = this.carouselState[carouselType]?.index || 0;
    
    if (currentIndex < models.length - 1) {
      this.carouselState[carouselType].index = currentIndex + 1;
      this.updateCarouselDisplay(carouselType);
      Logger.debug(`➡️ Перехід до наступної моделі ${carouselType}: ${currentIndex + 1}`, 'info');
      return true;
    }
    
    Logger.debug(`⚠️ Досягнуто кінець каруселі ${carouselType}`, 'info');
    return false;
  }

  // Перехід до попередньої моделі
  prevModel(carouselType) {
    const currentIndex = this.carouselState[carouselType]?.index || 0;
    
    if (currentIndex > 0) {
      this.carouselState[carouselType].index = currentIndex - 1;
      this.updateCarouselDisplay(carouselType);
      Logger.debug(`⬅️ Перехід до попередньої моделі ${carouselType}: ${currentIndex - 1}`, 'info');
      return true;
    }
    
    Logger.debug(`⚠️ Досягнуто початок каруселі ${carouselType}`, 'info');
    return false;
  }

  // Вибір конкретної моделі
  selectModel(carouselType, index) {
    const models = this.modelLists[carouselType] || [];
    
    if (index >= 0 && index < models.length) {
      this.carouselState[carouselType].index = index;
      this.updateCarouselDisplay(carouselType);
      Logger.debug(`🎯 Вибрано модель ${carouselType} з індексом ${index}`, 'info');
      return true;
    }
    
    Logger.debug(`❌ Невірний індекс моделі ${carouselType}: ${index}`, 'error');
    return false;
  }

  // Отримання поточної моделі
  getCurrentModel(carouselType) {
    const models = this.modelLists[carouselType] || [];
    const currentIndex = this.carouselState[carouselType]?.index || 0;
    
    return models[currentIndex] || null;
  }

  // Отримання поточного індексу
  getCurrentIndex(carouselType) {
    return this.carouselState[carouselType]?.index || 0;
  }

  // Отримання кількості моделей
  getModelCount(carouselType) {
    return (this.modelLists[carouselType] || []).length;
  }

  // Скидання каруселі
  resetCarousel(carouselType) {
    this.carouselState[carouselType] = { index: 0 };
    this.updateCarouselDisplay(carouselType);
    Logger.debug(`🔄 Карусель ${carouselType} скинута`, 'info');
  }

  // Оновлення всіх каруселей в активній вкладці
  updateCarouselsInActiveTab() {
    const activeTab = window.activeTab || 'base';
    Logger.debug(`🔄 Оновлення каруселей в активній вкладці: ${activeTab}`, 'info');
    
    const carouselTypes = this.getCarouselTypesForTab(activeTab);
    carouselTypes.forEach(type => {
      this.updateCarouselDisplay(type);
    });
  }

  // Отримання типів каруселей для вкладки
  getCarouselTypesForTab(tabName) {
    const tabCarousels = {
      'base': ['stands', 'flowerbeds'],
      'elements': ['steles'],
      'finishing': []
    };
    
    return tabCarousels[tabName] || [];
  }

  // Перевірка чи карусель видима
  isCarouselVisible(carouselType) {
    const carouselElement = document.getElementById(`${carouselType}-carousel`);
    if (!carouselElement) return false;
    
    const style = window.getComputedStyle(carouselElement);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }

  // Отримання інформації про поточну модель
  getCurrentModelInfo(carouselType) {
    const model = this.getCurrentModel(carouselType);
    if (!model) return '--';
    
    return {
      name: model.name || 'Без назви',
      dimensions: model.dimensions || '',
      image: model.image || '',
      index: this.getCurrentIndex(carouselType),
      total: this.getModelCount(carouselType)
    };
  }
}

// Глобальний екземпляр
const carouselManager = new CarouselManager();

// Експорт глобальних функцій для зворотної сумісності
export function initializeCarousel(carouselType) {
  return carouselManager.initializeCarousel(carouselType);
}

export function nextModel(carouselType) {
  return carouselManager.nextModel(carouselType);
}

export function prevModel(carouselType) {
  return carouselManager.prevModel(carouselType);
}

export function selectModel(carouselType, index) {
  return carouselManager.selectModel(carouselType, index);
}

export function getCurrentModel(carouselType) {
  return carouselManager.getCurrentModel(carouselType);
}

export function getCurrentIndex(carouselType) {
  return carouselManager.getCurrentIndex(carouselType);
}

export function getModelCount(carouselType) {
  return carouselManager.getModelCount(carouselType);
}

export function resetCarousel(carouselType) {
  return carouselManager.resetCarousel(carouselType);
}

export function updateCarouselsInActiveTab() {
  return carouselManager.updateCarouselsInActiveTab();
}

export function getCurrentModelInfo(carouselType) {
  return carouselManager.getCurrentModelInfo(carouselType);
}
