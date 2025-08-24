// proGran3/web/carousel/carousel.js
// Незалежний JavaScript модуль каруселі з унікальним дизайном

class CarouselModule {
  constructor(carouselId, config = {}) {
    this.carouselId = carouselId;
    this.config = {
      hasPreview: true,
      previewMode: 'dynamic',
      massGeneration: false,
      design: 'white_gradient',
      ...config
    };
    
    this.currentIndex = 0;
    this.models = [];
    this.items = [];
    this.isInitialized = false;
    
    console.log(`🎨 Створено модуль каруселі: ${carouselId}`);
  }
  
  // Ініціалізація каруселі
  initialize(modelList) {
    this.models = modelList || [];
    this.currentIndex = 0;
    
    console.log(`🎨 Ініціалізація каруселі ${this.carouselId}:`, this.models);
    
    // Створюємо елементи каруселі
    this.createCarouselItems();
    
    // Налаштовуємо події
    this.setupEvents();
    
    // Показуємо перший елемент
    this.showCurrentItem();
    
    this.isInitialized = true;
    
    // Викликаємо callback ініціалізації
    if (window.sketchup) {
      window.sketchup.initialize_carousel_module(this.carouselId, JSON.stringify(this.models));
    }
    
    console.log(`✅ Карусель ${this.carouselId} ініціалізована`);
  }
  
  // Створення елементів каруселі
  createCarouselItems() {
    const track = document.getElementById(`${this.carouselId}-track`);
    if (!track) return;
    
    track.innerHTML = '';
    this.items = [];
    
    this.models.forEach((model, index) => {
      const item = this.createCarouselItem(model, index);
      track.appendChild(item);
      this.items.push(item);
    });
  }
  
  // Створення одного елемента каруселі
  createCarouselItem(model, index) {
    const item = document.createElement('div');
    item.className = 'carousel-module-item';
    item.dataset.index = index;
    item.dataset.model = model;
    item.dataset.status = 'idle';
    
    // Унікальний дизайн з білим фоном та градієнтом
    item.innerHTML = `
      <div class="carousel-module-item-content">
        <div class="carousel-module-item-preview">
          <div class="carousel-module-loading">
            <div class="carousel-module-loading-text">Готово до завантаження</div>
          </div>
        </div>
        <div class="carousel-module-item-info">
          <div class="carousel-module-item-name">${model.replace('.skp', '')}</div>
          <div class="carousel-module-item-index">${index + 1} / ${this.models.length}</div>
        </div>
      </div>
    `;
    
    return item;
  }
  
  // Налаштування подій
  setupEvents() {
    const viewport = document.getElementById(`${this.carouselId}-viewport`);
    if (!viewport) return;
    
    // Подія прокрутки колеса миші
    viewport.addEventListener('wheel', (event) => {
      event.preventDefault();
      const direction = event.deltaY > 0 ? 1 : -1;
      this.navigate(direction);
    });
    
    // Події кнопок
    this.setupButtonEvents();
  }
  
  // Налаштування подій кнопок
  setupButtonEvents() {
    // Кнопка "Попередня"
    const prevBtn = document.querySelector(`#${this.carouselId}-module .carousel-module-btn.prev`);
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.previous());
    }
    
    // Кнопка "Наступна"
    const nextBtn = document.querySelector(`#${this.carouselId}-module .carousel-module-btn.next`);
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.next());
    }
    
    // Кнопка "Генерувати превью"
    const generateBtn = document.querySelector(`#${this.carouselId}-module .carousel-module-btn.generate`);
    if (generateBtn) {
      generateBtn.addEventListener('click', () => this.generatePreview());
    }
    
    // Кнопка "Додати модель"
    const addBtn = document.querySelector(`#${this.carouselId}-module .carousel-module-btn.add`);
    if (addBtn) {
      addBtn.addEventListener('click', () => this.addCurrentModel());
    }
  }
  
  // Навігація
  navigate(direction) {
    const newIndex = this.currentIndex + direction;
    
    if (newIndex >= 0 && newIndex < this.models.length) {
      this.currentIndex = newIndex;
      this.showCurrentItem();
      
      // Викликаємо callback навігації
      if (window.sketchup) {
        if (direction > 0) {
          window.sketchup.carousel_next(this.carouselId);
        } else {
          window.sketchup.carousel_previous(this.carouselId);
        }
      }
    }
  }
  
  // Перехід до наступної моделі
  next() {
    this.navigate(1);
  }
  
  // Перехід до попередньої моделі
  previous() {
    this.navigate(-1);
  }
  
  // Показ поточного елемента
  showCurrentItem() {
    this.items.forEach((item, index) => {
      item.classList.toggle('active', index === this.currentIndex);
    });
    
    // Оновлюємо інформацію
    this.updateInfo();
    
    // Завантажуємо превью для поточного елемента
    this.loadPreviewForCurrent();
  }
  
  // Оновлення інформації
  updateInfo() {
    const infoElement = document.getElementById(`${this.carouselId}-info`);
    if (!infoElement) return;
    
    const currentModel = this.models[this.currentIndex];
    const modelName = currentModel ? currentModel.replace('.skp', '') : '--';
    
    infoElement.innerHTML = `
      <span class="current-model">${modelName}</span>
      <span class="model-counter">${this.currentIndex + 1} / ${this.models.length}</span>
    `;
  }
  
  // Завантаження превью для поточного елемента
  loadPreviewForCurrent() {
    const currentItem = this.items[this.currentIndex];
    if (!currentItem) return;
    
    const status = currentItem.dataset.status;
    if (status === 'loaded' || status === 'pending') return;
    
    currentItem.dataset.status = 'pending';
    
    const loadingElement = currentItem.querySelector('.carousel-module-loading-text');
    if (loadingElement) {
      loadingElement.textContent = 'Генерація превью...';
    }
    
    // Генеруємо превью через Ruby
    if (window.sketchup) {
      window.sketchup.carousel_generate_preview(this.carouselId);
    }
  }
  
  // Генерація превью
  generatePreview() {
    console.log(`🎨 Генерація превью для каруселі: ${this.carouselId}`);
    
    if (window.sketchup) {
      window.sketchup.carousel_generate_preview(this.carouselId);
    }
  }
  
  // Додавання поточної моделі
  addCurrentModel() {
    console.log(`➕ Додавання моделі: ${this.models[this.currentIndex]}`);
    
    if (window.sketchup) {
      window.sketchup.carousel_add_model(this.carouselId);
    }
  }
  
  // Отримання інформації про карусель
  getInfo() {
    if (window.sketchup) {
      window.sketchup.carousel_get_info(this.carouselId);
    }
  }
  
  // Обробка згенерованого превью
  handlePreviewGenerated(base64Data) {
    const currentItem = this.items[this.currentIndex];
    if (!currentItem) return;
    
    const previewElement = currentItem.querySelector('.carousel-module-item-preview');
    if (!previewElement) return;
    
    // Видаляємо індикатор завантаження
    const loadingElement = currentItem.querySelector('.carousel-module-loading');
    if (loadingElement) {
      loadingElement.remove();
    }
    
    // Створюємо зображення
    const img = document.createElement('img');
    img.src = base64Data;
    img.alt = this.models[this.currentIndex];
    img.className = 'carousel-module-preview-image';
    
    previewElement.appendChild(img);
    currentItem.dataset.status = 'loaded';
    
    console.log(`✅ Превью згенеровано для: ${this.models[this.currentIndex]}`);
  }
  
  // Обробка помилки генерації превью
  handlePreviewError(errorMessage) {
    const currentItem = this.items[this.currentIndex];
    if (!currentItem) return;
    
    const loadingElement = currentItem.querySelector('.carousel-module-loading-text');
    if (loadingElement) {
      loadingElement.textContent = 'Помилка генерації';
      loadingElement.style.color = '#ff6b6b';
    }
    
    currentItem.dataset.status = 'error';
    
    console.error(`❌ Помилка генерації превью: ${errorMessage}`);
  }
}

// Глобальні функції для інтеграції з Ruby
window.carouselModuleInitialized = function(carouselId, info) {
  console.log(`✅ Карусель ініціалізована:`, info);
};

window.carouselNavigated = function(carouselId, info) {
  console.log(`➡️ Навігація каруселі:`, info);
};

window.carouselPreviewGenerated = function(carouselId, base64Data) {
  const carousel = window.carouselModules && window.carouselModules[carouselId];
  if (carousel) {
    carousel.handlePreviewGenerated(base64Data);
  }
};

window.carouselPreviewError = function(carouselId, errorMessage) {
  const carousel = window.carouselModules && window.carouselModules[carouselId];
  if (carousel) {
    carousel.handlePreviewError(errorMessage);
  }
};

window.carouselModelAdded = function(carouselId, info) {
  console.log(`➕ Модель додана:`, info);
};

window.carouselInfoReceived = function(carouselId, info) {
  console.log(`📊 Інформація про карусель:`, info);
};

// Функції для кнопок
window.carouselModuleNext = function(carouselId) {
  const carousel = window.carouselModules && window.carouselModules[carouselId];
  if (carousel) {
    carousel.next();
  }
};

window.carouselModulePrevious = function(carouselId) {
  const carousel = window.carouselModules && window.carouselModules[carouselId];
  if (carousel) {
    carousel.previous();
  }
};

window.carouselModuleGeneratePreview = function(carouselId) {
  const carousel = window.carouselModules && window.carouselModules[carouselId];
  if (carousel) {
    carousel.generatePreview();
  }
};

window.carouselModuleAddModel = function(carouselId) {
  const carousel = window.carouselModules && window.carouselModules[carouselId];
  if (carousel) {
    carousel.addCurrentModel();
  }
};

// Ініціалізація глобального реєстру каруселей
window.carouselModules = {};

console.log('🎨 Модуль каруселі завантажено');
