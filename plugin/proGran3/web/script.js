// progran3/web/script.js
// Головний файл ProGran3 - координує всі модулі та містить критичну логіку

// ============================================================================
// 📋 СТРУКТУРА ФАЙЛУ
// ============================================================================
// 1. СИСТЕМА ТАБІВ - переключення між табами та ініціалізація
// 2. КАРУСЕЛЬ - CarouselManager та всі функції каруселі (НЕ ТОРКАТИСЯ!)
// 3. ІНІЦІАЛІЗАЦІЯ - initializeApp, loadModelLists, window.onload
// 4. DEBUG ФУНКЦІЇ - debugLog, clearDebugLog
// 5. ПАНЕЛІ - togglePanel, advanceToNextPanel
// 6. SKETCHUP ІНТЕГРАЦІЯ - всі функції з window.sketchup (НЕ ТОРКАТИСЯ!)
// 7. УТИЛІТИ - convertToMm, formatValue, getAllInputValues
// 8. UI КОНТРОЛИ - selectThickness, selectTilingMode, selectSeam
// 9. ТЕМА - toggleTheme, initializeTheme
// 10. БУДІВЕЛЬНИКИ - addFoundation, addTiles, addSideCladding
// 11. ОГОРІЖІ - addFenceCorner, addFencePerimeter, addFenceDecor
// 12. ПІДСТАВКИ - addStandWithCustomSize, updateStandsDisplay
// 13. СТЕЛИ - selectSteleType, updateSteleDistance, createCentralDetail
// 14. ПРЕВЬЮ - generateModelPreview, receiveModelPreview
// 15. МАСШТАБУВАННЯ - applySteleScaling, resetSteleScaling

// ============================================================================
// 🔄 ГЛОБАЛЬНІ ЗМІННІ (перенесено в modules/core/GlobalState.js)
// ============================================================================
// modelLists, carouselState, activeTab, addedElements, currentUnit
// Доступні через: window.modelLists, window.carouselState, тощо

// ============================================================================
// 🗂️ СИСТЕМА ТАБІВ
// ============================================================================
// Функції для переключення між табами та ініціалізації каруселей

// Поточний активний таб
let activeTab = 'base';

// Функція переключення табів
function switchTab(tabName) {
  // Приховуємо всі таби
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(tab => {
    tab.style.display = 'none';
    tab.classList.remove('active');
  });
  
  // Видаляємо активний клас з усіх кнопок табів
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(button => {
    button.classList.remove('active');
  });
  
  // Показуємо вибраний таб
  const selectedTab = document.getElementById(tabName + '-tab');
  if (selectedTab) {
    selectedTab.style.display = 'block';
    selectedTab.classList.add('active');
  }
  
  // Активуємо відповідну кнопку
  const selectedButton = document.querySelector(`[data-tab="${tabName}"]`);
  if (selectedButton) {
    selectedButton.classList.add('active');
  }
  
  // Зберігаємо активний таб
  activeTab = tabName;
}

// Оновлення каруселей в активному табі
function updateCarouselsInActiveTab() {
  const activeTabContent = document.querySelector('.tab-content.active');
  if (activeTabContent) {
    const carousels = activeTabContent.querySelectorAll('.carousel-container');
    carousels.forEach(carousel => {
      const viewport = carousel.querySelector('.carousel-viewport');
      if (viewport) {
        // Тригеримо оновлення каруселі
        viewport.style.display = 'none';
        setTimeout(() => {
          viewport.style.display = 'block';
        }, 10);
      }
    });
  }
}

// Ініціалізація каруселей для конкретного таба
function initializeCarouselsForTab(tabName) {
  debugLog(`Ініціалізація каруселей для таба: ${tabName}`, 'info');
  
  const tabCarousels = {
    'base': ['stands', 'flowerbeds'],
    'monument': ['steles'],
    'gravestone': ['gravestones'],
    'fence': ['fence_decor'],
    'view': []
  };
  
  const carousels = tabCarousels[tabName] || [];
  
  carousels.forEach(category => {
    debugLog(`Перевіряємо карусель ${category} для таба ${tabName}`, 'info');
    
    const trackElement = document.getElementById(`${category}-carousel-track`);
    const viewportElement = document.getElementById(`${category}-carousel-viewport`);
    
    if (trackElement && viewportElement && modelLists && modelLists[category]) {
      debugLog(`Ініціалізуємо карусель ${category} для таба ${tabName}`, 'success');
      
      if (CarouselManager && CarouselManager.initialize) {
        CarouselManager.initialize(category);
      }
    } else {
      debugLog(`Не знайдено елементи каруселі ${category} для таба ${tabName}`, 'error');
    }
  });
}

// Ініціалізація табів
function initializeTabs() {
  // Перевіряємо наявність навігації табів
  const tabsNavigation = document.querySelector('.tabs-navigation');
  if (!tabsNavigation) {
    return;
  }
  
  // Перевіряємо наявність контенту табів
  const tabContents = document.querySelectorAll('.tab-content');
  if (tabContents.length === 0) {
    return;
  }
  
  // Спочатку приховуємо всі таби
  tabContents.forEach(tab => {
    tab.style.display = 'none';
    tab.classList.remove('active');
  });
  
  // Встановлюємо активний таб за замовчуванням
  switchTab('base');
  
  // Додаємо обробники подій для кнопок табів
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const tabName = this.getAttribute('data-tab');
      if (tabName) {
        switchTab(tabName);
      }
    });
  });
}

// Loading state management
function showLoadingState(elementId, message = 'Завантаження...') {
  const element = document.getElementById(elementId);
  if (element) {
    element.disabled = true;
    element.dataset.originalText = element.textContent;
    element.innerHTML = `<span class="loading-spinner"></span> ${message}`;
  }
}

function hideLoadingState(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.disabled = false;
    if (element.dataset.originalText) {
      element.textContent = element.dataset.originalText;
    }
  }
}

// Ініціалізація обробників подій
function initializeEventHandlers() {
  // Обробники для перемикача одиниць
  const unitLabels = document.querySelectorAll('.unit-label');
  unitLabels.forEach(label => {
    label.addEventListener('click', function() {
      const unit = this.getAttribute('data-unit');
      if (unit) {
        changeUnit(unit);
      }
    });
  });
  
  // Обробник для перемикача теми
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  
  // Обробники для блокуючих кнопок
  const openPurchaseBtn = document.getElementById('open-purchase-btn');
  if (openPurchaseBtn) {
    openPurchaseBtn.addEventListener('click', openPurchasePage);
  }
  
  const retryConnectionBtn = document.getElementById('retry-connection-btn');
  if (retryConnectionBtn) {
    retryConnectionBtn.addEventListener('click', retryConnection);
  }
}

// Ініціалізація floating labels
// initializeFloatingLabels() перенесено в modules/ui/AccordionManager.js

// Відстеження доданих елементів до моделі
// addedElements перенесено в modules/core/GlobalState.js

// Поточна одиниця вимірювання
// currentUnit перенесено в modules/core/GlobalState.js




// ============================================================================
// 🎠 КАРУСЕЛЬ (КРИТИЧНО НЕ ТОРКАТИСЯ!)
// ============================================================================
// CarouselManager - основна логіка каруселей
// Всі функції каруселі залишаються в script.js через складні залежності

// Універсальна система каруселей
const CarouselManager = {
  // Функція для отримання правильного ID елемента каруселі
  getCarouselElementId(category, elementType) {
    // Спеціальна обробка для fence_decor (використовує дефіси замість підкреслень)
    if (category === 'fence_decor') {
      return `fence-decor-carousel-${elementType}`;
    }
    return `${category}-carousel-${elementType}`;
  },
  
  // Розширена конфігурація каруселей
  carousels: {
    'stands': { 
      hasPreview: true, 
      previewMode: 'dynamic',
      autoLoad: true,
      design: 'default',
      maxItems: 10
    },
    'flowerbeds': { 
      hasPreview: true, 
      previewMode: 'dynamic',
      autoLoad: true,
      design: 'default',
      maxItems: 10
    },
    'gravestones': { 
      hasPreview: true, 
      previewMode: 'dynamic',
      autoLoad: true,
      design: 'default',
      maxItems: 10
    },
    'fence_decor': { 
      hasPreview: true, 
      previewMode: 'dynamic',
      autoLoad: true,
      design: 'default',
      maxItems: 10
    }
  },

  // Автоматична реєстрація нових каруселей
  registerCarousel(category, config = {}) {
    const defaultConfig = {
      hasPreview: true,
      previewMode: 'dynamic',
      autoLoad: true,
      design: 'default',
      maxItems: 10
    };
    
    this.carousels[category] = { ...defaultConfig, ...config };
    console.log(` Зареєстровано нову карусель: ${category}`);
  },

  // Отримання конфігурації каруселі
  getCarouselConfig(category) {
    return this.carousels[category] || null;
  },

  // Перевірка чи існує карусель
  hasCarousel(category) {
    return category in this.carousels;
  },

  // Перевірка чи ініціалізована карусель
  isInitialized(category) {
    return carouselState[category] && carouselState[category].initialized === true;
  },

  // Валідація стану каруселі
  validateState(category) {
    if (!carouselState[category]) {
      debugLog(`Стан каруселі ${category} не існує, створюємо`, 'warning');
      carouselState[category] = { index: 0, initialized: false };
      return false;
    }
    
    const state = carouselState[category];
    const models = modelLists[category];
    
    // Перевіряємо валідність індексу
    if (models && models.length > 0) {
      if (state.index < 0 || state.index >= models.length) {
        debugLog(`Невірний індекс ${state.index} для каруселі ${category}, скидаємо на 0`, 'warning');
        state.index = 0;
        return false;
      }
    }
    
    return true;
  },

  // Синхронізація стану каруселі
  syncState(category) {
    if (!this.validateState(category)) {
      return false;
    }
    
    const state = carouselState[category];
    const track = document.getElementById(this.getCarouselElementId(category, 'track'));
    
    if (!track) {
      debugLog(`Не знайдено track для синхронізації стану каруселі ${category}`, 'error');
      return false;
    }
    
    const items = track.querySelectorAll('.carousel-item');
    if (items.length === 0) {
      debugLog(`Немає елементів для синхронізації стану каруселі ${category}`, 'error');
      return false;
    }
    
    // Синхронізуємо активний елемент
    items.forEach((item, i) => {
      item.classList.toggle('active', i === state.index);
    });
    
    debugLog(`Стан каруселі ${category} синхронізовано`, 'success');
    return true;
  },

  // Очищення pending previews для каруселі
  clearPendingPreviews(category) {
    try {
      if (window.ProGran3 && window.ProGran3.Communication && window.ProGran3.Communication.SketchUpBridge) {
        // Очищуємо через SketchUpBridge
        const models = modelLists[category] || [];
        models.forEach(filename => {
          const componentPath = `${category}/${filename}`;
          if (window.ProGran3.Communication.SketchUpBridge.removePendingPreview) {
            window.ProGran3.Communication.SketchUpBridge.removePendingPreview(componentPath);
          }
        });
      } else {
        // Fallback очищення
        if (window.pendingPreviews) {
          const models = modelLists[category] || [];
          models.forEach(filename => {
            const componentPath = `${category}/${filename}`;
            delete window.pendingPreviews[componentPath];
          });
        }
      }
      
      debugLog(`Очищено pending previews для каруселі ${category}`, 'info');
    } catch (error) {
      debugLog(`Помилка при очищенні pending previews для ${category}: ${error.message}`, 'error');
    }
  },

  // Видалення event listeners
  removeEventListeners(category, viewport) {
    try {
      if (viewport && viewport._wheelHandler) {
        viewport.removeEventListener('wheel', viewport._wheelHandler);
        delete viewport._wheelHandler;
      }
    } catch (error) {
      debugLog(`Помилка при видаленні event listeners для ${category}: ${error.message}`, 'error');
    }
  },

  // Додавання wheel event listener з debouncing
  addWheelEventListener(category, viewport) {
    try {
      let wheelTimeout;
      
      const wheelHandler = (event) => {
        event.preventDefault();
        
        // Debouncing - ігноруємо події, якщо остання була менше 100ms тому
        if (wheelTimeout) {
          return;
        }
        
        wheelTimeout = setTimeout(() => {
          wheelTimeout = null;
        }, 100);
        
        const direction = event.deltaY > 0 ? 1 : -1;
        debugLog(`🎯 Подія wheel в каруселі ${category}: direction=${direction}`, 'info');
        this.moveCarousel(category, direction);
      };
      
      viewport._wheelHandler = wheelHandler;
      viewport.addEventListener('wheel', wheelHandler, { passive: false });
    } catch (error) {
      debugLog(`Помилка при додаванні wheel event listener для ${category}: ${error.message}`, 'error');
    }
  },

  // Ініціалізація каруселі (уніфікована логіка як у стел)
  initialize(category, options = {}) {
    try {
      debugLog(` CarouselManager.initialize викликано для ${category}`, 'info');
      
      // Перевіряємо, чи вже ініціалізована карусель (тимчасово відключено для діагностики)
      // if (this.isInitialized(category)) {
      //   debugLog(` Карусель ${category} вже ініціалізована, пропускаємо`, 'info');
      //   return;
      // }
      
      const track = document.getElementById(this.getCarouselElementId(category, 'track'));
      const viewport = document.getElementById(this.getCarouselElementId(category, 'viewport'));
    
    // Додаткова діагностика для fence_decor
    if (category === 'fence_decor') {
      debugLog(`🎯 Діагностика fence_decor в initialize:`, 'info');
      debugLog(`   - track: ${!!track}`, 'info');
      debugLog(`   - viewport: ${!!viewport}`, 'info');
      debugLog(`   - trackId: ${this.getCarouselElementId(category, 'track')}`, 'info');
      debugLog(`   - viewportId: ${this.getCarouselElementId(category, 'viewport')}`, 'info');
      debugLog(`   - modelLists[category]: ${!!modelLists[category]}`, 'info');
      debugLog(`   - кількість моделей: ${modelLists[category]?.length || 0}`, 'info');
    }
    
    if (!track || !viewport || !modelLists[category] || modelLists[category].length === 0) {
      debugLog(` Не вдалося ініціалізувати карусель ${category}: track=${!!track}, viewport=${!!viewport}, моделі=${!!modelLists[category]}, кількість=${modelLists[category]?.length || 0}`, 'error');
      return;
    }
    
    // Створюємо стан каруселі, якщо не існує
    if (!carouselState[category]) {
      carouselState[category] = { index: 0, initialized: false };
    }
    
    // Очищуємо попередній контент
    track.innerHTML = '';
    
    // Очищуємо pending previews
    this.clearPendingPreviews(category);
    
    // Видаляємо попередні event listeners
    this.removeEventListeners(category, viewport);

    modelLists[category].forEach(filename => {
      const item = document.createElement('div');
      item.className = 'carousel-item';
      // Стан ледачого завантаження
      item.dataset.status = 'idle';
      item.dataset.filename = filename;
      // Початковий індикатор
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'loading-indicator';
      loadingDiv.textContent = 'Готово до завантаження';
      item.appendChild(loadingDiv);
      track.appendChild(item);
    });
    
    // Додаємо прокрутку колесом миші з debouncing
    this.addWheelEventListener(category, viewport);

    // Ініціалізуємо перший елемент синхронно
    this.showCarouselItem(category, 0);
    this.loadOrGeneratePreview(category, 0);
    
      // Позначаємо як ініціалізовану
      carouselState[category].initialized = true;
      
      debugLog(` Карусель ${category} ініціалізована`, 'success');
    } catch (error) {
      debugLog(`Помилка при ініціалізації каруселі ${category}: ${error.message}`, 'error');
      console.error('Carousel initialization error:', error);
    }
  },


  // Показ елемента каруселі (уніфікована логіка як у стел)
  showCarouselItem(category, index) {
    debugLog(`🎯 showCarouselItem викликано для ${category}[${index}]`, 'info');
    
    const track = document.getElementById(this.getCarouselElementId(category, 'track'));
    const viewport = document.getElementById(this.getCarouselElementId(category, 'viewport'));
    
    // Перевіряємо існування DOM елементів
    if (!track || !viewport) {
      debugLog(` Не знайдено DOM елементи для каруселі ${category}`, 'error');
      return;
    }
    
    const items = track.querySelectorAll('.carousel-item');
    
    if (items.length === 0 || !items[index]) {
      debugLog(` Не вдалося знайти елементи для ${category}[${index}]`, 'error');
      return;
    }

    // Валідуємо індекс
    if (index < 0 || index >= items.length) {
      debugLog(` Невірний індекс ${index} для каруселі ${category} з ${items.length} елементами`, 'error');
      return;
    }

    items.forEach((item, i) => {
      item.classList.toggle('active', i === index);
    });
    
    const viewportCenter = viewport.offsetWidth / 2;
    const targetItem = items[index];
    const itemCenter = targetItem.offsetLeft + targetItem.offsetWidth / 2;
    const newTransform = viewportCenter - itemCenter;

    // Валідуємо та синхронізуємо стан каруселі
    this.validateState(category);
    carouselState[category].index = index;
    track.style.transform = `translateX(${newTransform}px)`;
    
    debugLog(` Показано елемент ${index} в каруселі ${category}`, 'success');
    
    // Ледаче завантаження для активного елемента та сусідів (як у стел)
    this.loadOrGeneratePreview(category, index);
    if (index + 1 < items.length) this.loadOrGeneratePreview(category, index + 1);
    if (index - 1 >= 0) this.loadOrGeneratePreview(category, index - 1);
    
    // updateAllDisplays() видалено - функція не існує
  },

  // Ледаче завантаження превью (уніфікована логіка як у стел)
  loadOrGeneratePreview(category, index) {
    debugLog(` loadOrGeneratePreview викликано для ${category}[${index}]`, 'info');
    
    const track = document.getElementById(this.getCarouselElementId(category, 'track'));
    if (!track) {
      debugLog(` Не знайдено track для ${category}`, 'error');
      return;
    }
    
    const items = track.querySelectorAll('.carousel-item');
    debugLog(`📋 Знайдено ${items.length} елементів в каруселі ${category}`, 'info');
    
    const item = items[index];
    if (!item) {
      debugLog(` Не знайдено елемент ${index} в каруселі ${category}`, 'error');
      return;
    }

    const currentStatus = item.dataset.status;
    if (currentStatus === 'loaded' || currentStatus === 'pending') {
      debugLog(`⏭️ Пропускаємо ${category}[${index}] - статус: ${currentStatus}`, 'info');
      return;
    }

    const filename = item.dataset.filename || (modelLists[category] && modelLists[category][index]);
    if (!filename) {
      debugLog(` Не знайдено filename для ${category}[${index}]`, 'error');
      debugLog(` modelLists[${category}]: ${JSON.stringify(modelLists[category])}`, 'error');
      return;
    }
    
    debugLog(` Знайдено filename: ${filename} для ${category}[${index}]`, 'success');

    let loadingDiv = item.querySelector('.loading-indicator');
    if (!loadingDiv) {
      loadingDiv = document.createElement('div');
      loadingDiv.className = 'loading-indicator';
      item.appendChild(loadingDiv);
      debugLog(`➕ Створено loading indicator для ${filename}`, 'info');
    }
    loadingDiv.textContent = 'Генерація превью...';

    item.dataset.status = 'pending';
    debugLog(` Встановлено статус 'pending' для ${filename}`, 'info');

    // Відразу запускаємо генерацію превью
    this.autoGeneratePreview(category, filename, item, loadingDiv);
  },

  // Автоматична генерація превью (уніфікована логіка як у стел)
  autoGeneratePreview(category, filename, item, loadingDiv) {
    debugLog(` autoGeneratePreview викликано для ${category}/${filename}`, 'info');
    
    if (!window.sketchup) {
      debugLog(` window.sketchup не доступний для ${filename}`, 'error');
      createPlaceholder(item, loadingDiv, `Помилка генерації\n${filename}`);
      return;
    }
    
    const componentPath = `${category}/${filename}`;
    debugLog(` Запуск генерації превью для: ${componentPath} (CarouselManager)`, 'info');
    
    // Генеруємо веб-превью через SketchUp
    window.sketchup.generate_web_preview(componentPath);
    debugLog(`📡 Викликано window.sketchup.generate_web_preview(${componentPath})`, 'info');
    
  // Зберігаємо посилання на елементи для callback через SketchUpBridge
  if (window.ProGran3 && window.ProGran3.Communication && window.ProGran3.Communication.SketchUpBridge) {
    debugLog(` Використовуємо SketchUpBridge для pending: ${componentPath}`, 'success');
    window.ProGran3.Communication.SketchUpBridge.addPendingPreview(componentPath, filename, 'CarouselManager', item, loadingDiv);
  } else {
    debugLog(` Використовуємо fallback для pending: ${componentPath}`, 'warning');
    // Fallback для зворотної сумісності
    window.pendingPreviews = window.pendingPreviews || {};
    window.pendingPreviews[componentPath] = { item, loadingDiv, filename, source: 'CarouselManager' };
  }
    
    debugLog(`📝 Додано до pending: ${componentPath} (CarouselManager)`, 'info');
  },



  // Створення заглушки
  createPlaceholder(item, loadingDiv, text) {
    createPlaceholder(item, loadingDiv, text);
  },

  // Рух каруселі (уніфікована логіка як у стел)
  moveCarousel(category, direction) {
    debugLog(` moveCarousel викликано для ${category}, direction=${direction}`, 'info');
    
    // Перевіряємо, чи ініціалізована карусель
    if (!this.isInitialized(category)) {
      debugLog(` Карусель ${category} не ініціалізована, пропускаємо moveCarousel`, 'warning');
      return;
    }
    
    // Валідуємо стан каруселі
    this.validateState(category);
    
    const state = carouselState[category];
    const newIndex = state.index + direction;
    const track = document.getElementById(this.getCarouselElementId(category, 'track'));
    
    // Перевіряємо існування track
    if (!track) {
      debugLog(` Не знайдено track для каруселі ${category}`, 'error');
      return;
    }
    
    const items = track.querySelectorAll('.carousel-item');
    
    // Перевіряємо, чи є елементи
    if (items.length === 0) {
      debugLog(` Немає елементів в каруселі ${category}`, 'error');
      return;
    }
    
    debugLog(`   - Поточний індекс: ${state.index}`, 'info');
    debugLog(`   - Новий індекс: ${newIndex}`, 'info');
    debugLog(`   - Всього елементів: ${items.length}`, 'info');
    
    // Циклічна прокрутка: якщо виходимо за межі, переходимо на протилежний кінець
    let finalIndex = newIndex;
    if (newIndex < 0) {
      finalIndex = items.length - 1; // Переходимо на останній елемент
    } else if (newIndex >= items.length) {
      finalIndex = 0; // Переходимо на перший елемент
    }
    
    debugLog(`   - Фінальний індекс: ${finalIndex}`, 'info');
    this.showCarouselItem(category, finalIndex);
  },

  // Додавання моделі
  addModel(category) {
    // Валідуємо стан каруселі
    this.validateState(category);
    const state = carouselState[category];
    const filename = modelLists[category][state.index];
    
    if (window.sketchup && window.sketchup.add_model) {
      // Для стел передаємо додаткові параметри типу, відстані та центральної деталі
      if (category === 'steles') {
        // Перевіряємо, чи існує стан стел
        if (!carouselState.steles) {
          debugLog('ПОМИЛКА: carouselState.steles не існує!', 'error');
          carouselState.steles = { type: 'single', distance: 200, centralDetail: false };
        }
        const steleType = carouselState.steles.type || 'single'; // За замовчуванням 'single'
        const steleDistance = carouselState.steles.distance || 200; // За замовчуванням 200мм
        const centralDetail = carouselState.steles.centralDetail || false; // За замовчуванням false
        const centralDetailWidth = carouselState.steles.centralDetailWidth || 200; // За замовчуванням 200мм
        const centralDetailDepth = carouselState.steles.centralDetailDepth || 50; // За замовчуванням 50мм
        const centralDetailHeight = carouselState.steles.centralDetailHeight || 250; // За замовчуванням 250мм
        
        debugLog(`Додавання стели: тип=${steleType} (${typeof steleType}), відстань=${steleDistance}мм, центральна деталь=${centralDetail}`, 'info');
        debugLog(`Повний стан стел: ${JSON.stringify(carouselState.steles)}`, 'info');
        
        window.sketchup.add_model(category, filename, steleType, steleDistance, centralDetail, centralDetailWidth, centralDetailDepth, centralDetailHeight);
        // Встановлюємо флаг, що модель створена
        carouselState.steles.modelCreated = true;
        debugLog(`Додавання стел типу: ${steleType}, відстань: ${steleDistance}мм, центральна деталь: ${centralDetail}. Флаг modelCreated встановлено в true`, 'info');
        
        // Згортаємо секцію 2 (Вибір моделі) після додавання стели
        this.collapseSteleModelSection();
        
        // Показуємо секцію масштабування стели тільки для однієї стели
        if (steleType === 'single') {
          setTimeout(() => {
            showSteleScalingSection();
          }, 500); // Невелика затримка для завершення додавання стели
        }
      } else {
        window.sketchup.add_model(category, filename);
      }
      addedElements[category] = true;
      updateSummaryTable();
    }
  },

  // Згортання секції вибору моделі стели
  collapseSteleModelSection() {
    try {
      const modelSection = document.querySelector('#stele-model-section');
      if (modelSection) {
        modelSection.classList.add('collapsed');
        debugLog('Секція вибору моделі стели згорнута', 'success');
      } else {
        debugLog('Не знайдено секцію вибору моделі стели', 'warning');
      }
    } catch (error) {
      debugLog(`Помилка при згортанні секції вибору моделі стели: ${error.message}`, 'error');
    }
  },

  // Реєстрація нової каруселі (оновлена)
  registerCarousel(category, config = {}) {
    const defaultConfig = {
      hasPreview: true,
      previewMode: 'dynamic',
      autoLoad: true,
      design: 'default',
      maxItems: 10
    };
    
    this.carousels[category] = { ...defaultConfig, ...config };
    
    // Автоматично створюємо стан каруселі
    if (!carouselState[category]) {
      carouselState[category] = { index: 0 };
    }
    
    console.log(` Зареєстровано нову карусель: ${category}`);
  },

  // Автоматична ініціалізація всіх каруселей
  initializeAllCarousels() {
    debugLog(` initializeAllCarousels викликано`, 'info');
    debugLog(`📋 Доступні каруселі: ${Object.keys(this.carousels).join(', ')}`, 'info');
    
    // Додаткова перевірка для gravestones
    if (this.carousels.gravestones) {
      debugLog(` Карусель gravestones знайдена в конфігурації`, 'success');
    } else {
      debugLog(` Карусель gravestones не знайдена в конфігурації`, 'error');
    }
    
    
    Object.keys(this.carousels).forEach(category => {
      debugLog(` Перевіряємо карусель: ${category}`, 'info');
      
      const trackElement = document.getElementById(this.getCarouselElementId(category, 'track'));
      const viewportElement = document.getElementById(this.getCarouselElementId(category, 'viewport'));
      
      debugLog(` Перевірка каруселі ${category}: моделі=${!!modelLists[category]}, кількість=${modelLists[category]?.length || 0}, track=${!!trackElement}, viewport=${!!viewportElement}`, 'info');
      
      // Додаткова перевірка для gravestones
      if (category === 'gravestones') {
        debugLog(`🎯 Спеціальна перевірка для gravestones:`, 'info');
        debugLog(`   - trackElement: ${!!trackElement}`, 'info');
        debugLog(`   - viewportElement: ${!!viewportElement}`, 'info');
        debugLog(`   - modelLists[gravestones]: ${!!modelLists[category]}`, 'info');
        debugLog(`   - кількість моделей: ${modelLists[category]?.length || 0}`, 'info');
        if (modelLists[category]) {
          debugLog(`   - моделі: ${modelLists[category].join(', ')}`, 'info');
        }
      }
      
      
      if (modelLists[category] && trackElement && viewportElement) {
        debugLog(` Умови виконані для ${category}, запускаємо initialize`, 'success');
        this.initialize(category);
        debugLog(` Автоматично ініціалізовано карусель: ${category}`, 'success');
      } else {
        debugLog(` Не вдалося ініціалізувати карусель: ${category}`, 'error');
        debugLog(` Деталі для ${category}: моделі=${!!modelLists[category]}, track=${!!trackElement}, viewport=${!!viewportElement}`, 'error');
      }
    });
  },

  // Отримання статистики каруселей
  getCarouselStats() {
    return {
      total: Object.keys(this.carousels).length,
      active: Object.keys(this.carousels).filter(cat => 
        modelLists[cat] && document.getElementById(`${cat}-carousel-track`)
      ).length,
      categories: Object.keys(this.carousels)
    };
  },

  // Приклад додавання нової каруселі
  addExampleCarousel() {
    // Додаємо нову карусель з кастомним дизайном
    this.registerCarousel('example', {
      hasPreview: true,
      previewMode: 'dynamic',
      autoLoad: true,
      design: 'gradient',
      maxItems: 15
    });
    
    console.log('📝 Приклад: Додано нову карусель "example" з дизайном gradient');
  }
};

// ============================================================================
// 🐛 DEBUG ФУНКЦІЇ
// ============================================================================
// Функції для логування та діагностики

/**
 * Додає повідомлення до debug логу з кольоровим форматуванням
 * @param {string} message - Текст повідомлення
 * @param {string} type - Тип повідомлення: 'info', 'success', 'warning', 'error'
 * @example
 * debugLog('Фундамент створено', 'success');
 * debugLog('Помилка валідації', 'error');
 */
// DebugManager винесено в modules/core/DebugManager.js

// Функція для примусового оновлення каруселі
function forceRefreshCarousel() {
  debugLog('🔄 Примусове оновлення каруселі', 'info');
  
  // Очищуємо кеш моделей
  if (typeof modelLists !== 'undefined') {
    modelLists = {};
  }
  
  // Очищуємо стан каруселі
  if (typeof carouselState !== 'undefined') {
    carouselState = {};
  }
  
  // Очищуємо localStorage
  localStorage.removeItem('progran3_models');
  localStorage.removeItem('progran3_carousel');
  
  // Перезавантажуємо сторінку
  location.reload();
}

// Функція для оновлення конкретної категорії
function refreshCategory(category) {
  debugLog(`🔄 Оновлення категорії: ${category}`, 'info');
  
  // Очищуємо track
  const track = document.getElementById(`${category}-carousel-track`);
  if (track) {
    track.innerHTML = '';
  }
  
  // Скидаємо стан каруселі
  if (carouselState && carouselState[category]) {
    carouselState[category] = { index: 0, initialized: false };
  }
  
  // Перезавантажуємо карусель
  if (CarouselManager && CarouselManager.initialize) {
    CarouselManager.initialize(category);
  }
}

// --- ІНІЦІАЛІЗАЦІЯ ---
window.onload = async function () {
  debugLog(` window.onload викликано`, 'info');
  
  // Ініціалізуємо i18n першим
  debugLog(`🌍 Ініціалізуємо i18n`, 'info');
  await initializeI18n();
  
  // Ініціалізуємо додаток
  debugLog(` Викликаємо initializeApp()`, 'info');
  initializeApp();
  
  // Запускаємо готовність
  if (window.sketchup && window.sketchup.ready) {
    debugLog(`📞 Викликаємо window.sketchup.ready() для запуску heartbeat`, 'info');
    window.sketchup.ready();
    debugLog(`✅ Callback ready викликано - heartbeat має запуститися`, 'success');
  } else {
    debugLog(` window.sketchup.ready не доступний`, 'error');
  }
  
  // Оновлюємо статус ліцензії
  debugLog(`🔐 Оновлюємо статус ліцензії`, 'info');
  updateLicenseStatus();
};

// ============================================================================
// 🚀 ІНІЦІАЛІЗАЦІЯ
// ============================================================================
// Функції ініціалізації додатку та завантаження даних

// Ініціалізація додатку
function initializeApp() {
  debugLog(` initializeApp викликано`, 'info');
  
  // Ініціалізація обробників подій
  initializeEventHandlers();
  
  // Ініціалізація табів
  initializeTabs();
  
  // Ініціалізація акордеон поведінки для всіх табів
  initializeAccordionBehavior();
  
  // Ініціалізація превью табу
  initializePreviewTab();
  
  // Ініціалізація UI (без повторного виклику ready)
  if(document.querySelector('.tiling-mode-btn')) {
    debugLog(` Знайдено кнопки способу укладання, оновлюємо контроли`, 'success');
    updateTilingControls();
  } else {
    debugLog(` Не знайдено кнопки способу укладання`, 'error');
  }
  
  // Ініціалізація контролів відмостки
  if(document.getElementById('blind-area-mode')) {
    debugLog(` Знайдено blind-area-mode, оновлюємо контроли`, 'success');
    updateBlindAreaControls();
  } else {
    debugLog(` Не знайдено blind-area-mode`, 'error');
  }
  
  // Перевірка полів плитки
  debugLog(` Перевірка полів плитки...`, 'info');
  const tileBorderWidth = document.getElementById('tile-border-width');
  const tileOverhang = document.getElementById('tile-overhang');
  const modularThickness = document.getElementById('modular-thickness');
  const modularOverhang = document.getElementById('modular-overhang');
  
  // Перевіряємо кнопки товщини
  const thicknessButtons = document.querySelectorAll('.thickness-btn');
  if (thicknessButtons.length > 0) {
    debugLog(` Знайдено ${thicknessButtons.length} кнопок товщини плитки`, 'success');
    updateThicknessButtons(); // Оновлюємо відображення кнопок товщини
    const activeThickness = getSelectedThickness();
    debugLog(` Активна товщина: ${activeThickness}`, 'success');
  } else {
    debugLog(` Не знайдено кнопки товщини плитки`, 'error');
  }
  
  // Перевіряємо кнопки шву
  const seamButtons = document.querySelectorAll('.seam-btn');
  if (seamButtons.length > 0) {
    debugLog(` Знайдено ${seamButtons.length} кнопок шву`, 'success');
    updateSeamButtons(); // Оновлюємо відображення кнопок шву
    const activeSeam = getSelectedSeam();
    debugLog(` Активний шов: ${activeSeam} мм`, 'success');
  } else {
    debugLog(` Не знайдено кнопки шву`, 'error');
  }
  
  if (tileBorderWidth) {
    debugLog(` Знайдено поле ширини рамки: ${tileBorderWidth.value}`, 'success');
  } else {
    debugLog(` Не знайдено поле ширини рамки`, 'error');
  }
  
  if (tileOverhang) {
    debugLog(` Знайдено поле виступу: ${tileOverhang.value}`, 'success');
  } else {
    debugLog(` Не знайдено поле виступу`, 'error');
  }
  
  if (modularThickness) {
    debugLog(` Знайдено поле товщини модульної: ${modularThickness.value}`, 'success');
  } else {
    debugLog(` Не знайдено поле товщини модульної`, 'error');
  }
  
  if (modularOverhang) {
    debugLog(` Знайдено поле виступу модульної: ${modularOverhang.value}`, 'success');
  } else {
    debugLog(` Не знайдено поле виступу модульної`, 'error');
  }
  
  // Згортаємо всі панелі в кожному табі, крім першої
  const tabContents = document.querySelectorAll('.tab-content');
  debugLog(`📋 Знайдено ${tabContents.length} табів`, 'info');
  
  tabContents.forEach(tabContent => {
    const panels = tabContent.querySelectorAll('.panel');
    debugLog(`📋 Знайдено ${panels.length} панелей в табі ${tabContent.id}`, 'info');
    
    panels.forEach((panel, index) => {
      if (index > 0) {
        panel.classList.add('collapsed');
      }
    });
  });
  
  // Ініціалізуємо floating labels
  initializeFloatingLabels();
  debugLog(` Floating labels ініціалізовано`, 'success');
  
  debugLog(` Викликаємо updateAllDisplays()`, 'info');
  // updateAllDisplays() видалено - функція не існує
  // updateAllI18nLabels() видалено - функція не існує
  // updateUnitLabels() видалено - функція не існує
  updateThicknessButtons();
  updateSeamButtons();
  
  
  
  // Ініціалізуємо тему
  initializeTheme();
  debugLog(` Тема ініціалізована`, 'success');
  
  // Ініціалізуємо тип стел
  initializeSteleType();
  debugLog(` Тип стел ініціалізовано`, 'success');
  
  // Ініціалізуємо вмикач проміжків
  initializeStandsGaps();
  debugLog(` Вмикач проміжків ініціалізовано`, 'success');
  
  debugLog(` initializeApp завершено`, 'success');
}

function loadModelLists(data) {
  debugLog(`📥 loadModelLists викликано`, 'info');
  debugLog(`📊 Отримано дані для категорій: ${Object.keys(data).join(', ')}`, 'info');
  
  // Додаткова перевірка для gravestones
  if (data.gravestones) {
    debugLog(` Категорія gravestones знайдена з ${data.gravestones.length} моделями`, 'success');
    debugLog(`📋 Моделі gravestones: ${data.gravestones.join(', ')}`, 'info');
  } else {
    debugLog(` Категорія gravestones не знайдена в даних`, 'error');
  }
  
  
  modelLists = data;
  
  // Використовуємо автоматичну ініціалізацію всіх каруселей
  debugLog(` Викликаємо CarouselManager.initializeAllCarousels()`, 'info');
  CarouselManager.initializeAllCarousels();
  
  // Додатково ініціалізуємо каруселі для активного таба
  setTimeout(() => {
    initializeCarouselsForTab(activeTab);
  }, 200);
  
  // Примусово ініціалізуємо карусель gravestones
  setTimeout(() => {
    debugLog(`🎠 Примусова ініціалізація каруселі gravestones`, 'info');
    if (CarouselManager.hasCarousel('gravestones') && modelLists['gravestones']) {
      const trackElement = document.getElementById('gravestones-carousel-track');
      const viewportElement = document.getElementById('gravestones-carousel-viewport');
      
      if (trackElement && viewportElement) {
        debugLog(` Примусово ініціалізуємо карусель gravestones`, 'success');
        initializeGravestonesCarousel('gravestones');
      } else {
        debugLog(` Не знайдено елементи каруселі gravestones для примусової ініціалізації`, 'error');
      }
    } else {
      debugLog(` Карусель gravestones не доступна або немає моделей для примусової ініціалізації`, 'warning');
    }
  }, 500);
  
  
  
  
  // Ініціалізуємо основну карусель стел (копія тестової логіки)
  if (modelLists['steles'] && document.getElementById('steles-carousel-track')) {
    debugLog(`🏛️ Ініціалізуємо основну карусель стел (копія тестової)`, 'info');
    initializeMainStelesCarousel('steles');
  }
  
  // Примусово ініціалізуємо карусель fence_decor
  if (modelLists['fence_decor'] && document.getElementById('fence-decor-carousel-track')) {
    debugLog(`🎠 Примусово ініціалізуємо карусель fence_decor`, 'info');
    CarouselManager.initialize('fence_decor');
  }
  
  // Виводимо статистику каруселей
  const stats = CarouselManager.getCarouselStats();
  debugLog(`📊 Статистика каруселей: ${stats.active}/${stats.total} активних`, 'info');
  
  // updateAllDisplays() видалено - функція не існує
}

// ============================================================================
// 📋 ПАНЕЛІ
// ============================================================================
// Функції для роботи з панелями (згортання/розгортання)

function togglePanel(headerElement) {
  const panel = headerElement.closest('.panel');
  if (panel) {
    console.log('Toggle panel:', panel);
    const wasCollapsed = panel.classList.contains('collapsed');
    panel.classList.toggle('collapsed');
    console.log('Panel collapsed:', panel.classList.contains('collapsed'));
    
    // Якщо панель була розгорнута, ініціалізуємо каруселі в ній
    if (wasCollapsed) {
      setTimeout(() => {
        const carousels = panel.querySelectorAll('.carousel-container');
        carousels.forEach(carousel => {
          const viewport = carousel.querySelector('.carousel-viewport');
          if (viewport) {
            // Тригеримо оновлення каруселі
            viewport.style.display = 'none';
            setTimeout(() => {
              viewport.style.display = 'block';
            }, 10);
          }
        });
        
        // Додатково ініціалізуємо каруселі в розгорнутій панелі
        const carouselTracks = panel.querySelectorAll('.carousel-track');
        carouselTracks.forEach(track => {
          const category = track.id.replace('-carousel-track', '');
          if (CarouselManager.hasCarousel(category) && modelLists[category]) {
            debugLog(`🎠 Ініціалізуємо карусель ${category} в розгорнутій панелі`, 'info');
            CarouselManager.initialize(category);
          }
        });
        
        // Спеціальна обробка для каруселі gravestones
        const gravestoneTrack = panel.querySelector('#gravestones-carousel-track');
        if (gravestoneTrack && CarouselManager.hasCarousel('gravestones') && modelLists['gravestones']) {
          debugLog(`🎠 Спеціальна ініціалізація каруселі gravestones в розгорнутій панелі`, 'info');
          initializeGravestonesCarousel('gravestones');
        }
      }, 100);
    }
  } else {
    console.error('Panel not found for element:', headerElement);
  }
}

function advanceToNextPanel(buttonElement) {
  // Використовуємо модуль Panels якщо доступний
  if (window.ProGran3 && window.ProGran3.UI && window.ProGran3.UI.Panels) {
    const result = window.ProGran3.UI.Panels.advanceToNextPanel(buttonElement);
    if (result) {
      debugLog(` advanceToNextPanel виконано через модуль Panels`, 'success');
    } else {
      debugLog(` advanceToNextPanel не вдався через модуль Panels`, 'warning');
    }
    return;
  }
  
  // Fallback для зворотної сумісності
  // Знаходимо батьківську панель кнопки
  const currentPanel = buttonElement.closest('.panel');
  
  // Знаходимо всі панелі в поточному активному табі
  const activeTabContent = document.querySelector('.tab-content.active');
  if (!activeTabContent) {
    debugLog(` Не знайдено активний таб для advanceToNextPanel`, 'error');
    return;
  }
  
  const allPanelsInTab = Array.from(activeTabContent.querySelectorAll('.panel'));
  const currentIndex = allPanelsInTab.indexOf(currentPanel);
  const nextPanel = allPanelsInTab[currentIndex + 1];

  // Згортаємо поточну панель
  if (currentPanel && !currentPanel.classList.contains('collapsed')) {
    currentPanel.classList.add('collapsed');
  }

  // Розгортаємо наступну, якщо вона існує і є згорнутою
  if (nextPanel && nextPanel.classList.contains('collapsed')) {
    nextPanel.classList.remove('collapsed');
  }
  
  debugLog(` advanceToNextPanel: поточна панель ${currentIndex + 1}/${allPanelsInTab.length} в табі ${activeTab}`, 'info');
}



// --- ТЕСТОВИЙ БЛОК (очищений для нової функціональності) ---

// Ініціалізація основної каруселі стел (копія тестової логіки)
function initializeMainStelesCarousel(category) {
  const track = document.getElementById(`${category}-carousel-track`);
  const viewport = document.getElementById(`${category}-carousel-viewport`);
  if (!track || !viewport || !modelLists[category] || modelLists[category].length === 0) return;
  
  track.innerHTML = '';

  modelLists[category].forEach(filename => {
    const item = document.createElement('div');
    item.className = 'carousel-item';
    // Стан ледачого завантаження
    item.dataset.status = 'idle';
    item.dataset.filename = filename;
    // Початковий індикатор
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-indicator';
    loadingDiv.textContent = 'Готово до завантаження';
    item.appendChild(loadingDiv);
    track.appendChild(item);
  });
  
  // Додаємо прокрутку колесом миші БЕЗ debouncing (для тестування)
  viewport.addEventListener('wheel', (event) => {
    event.preventDefault();
    
    const direction = event.deltaY > 0 ? 1 : -1;
    debugLog(`🎯 Подія wheel в каруселі ${category}: direction=${direction}`, 'info');
    moveMainStelesCarousel(category, direction);
  });

  setTimeout(() => {
    showMainStelesCarouselItem(category, 0);
    // Ледаче завантаження для першого елемента
    loadOrGenerateMainStelesPreview(category, 0);
  }, 100); 
}



// Ледаче завантаження превью для основної каруселі стел
function loadOrGenerateMainStelesPreview(category, index) {
  const track = document.getElementById(`${category}-carousel-track`);
  if (!track) return;
  const items = track.querySelectorAll('.carousel-item');
  const item = items[index];
  if (!item) return;

  const currentStatus = item.dataset.status;
  if (currentStatus === 'loaded' || currentStatus === 'pending') return;

  const filename = item.dataset.filename || (modelLists[category] && modelLists[category][index]);
  if (!filename) return;

  let loadingDiv = item.querySelector('.loading-indicator');
  if (!loadingDiv) {
    loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-indicator';
    item.appendChild(loadingDiv);
  }
  loadingDiv.textContent = 'Генерація превью...';

  item.dataset.status = 'pending';

  // Відразу запускаємо генерацію превью
  autoGenerateMainStelesPreview(category, filename, item, loadingDiv);
}

// Автоматична генерація превью для основної каруселі стел
function autoGenerateMainStelesPreview(category, filename, item, loadingDiv) {
  if (!window.sketchup) {
    createPlaceholder(item, loadingDiv, `Помилка генерації\n${filename}`);
    return;
  }
  
  const componentPath = `${category}/${filename}`;
  debugLog(` Запуск генерації превью для: ${componentPath} (MainSteles)`, 'info');
  
  // Генеруємо веб-превью через SketchUp
  window.sketchup.generate_web_preview(componentPath);
  
  // Зберігаємо посилання на елементи для callback через SketchUpBridge
  if (window.ProGran3 && window.ProGran3.Communication && window.ProGran3.Communication.SketchUpBridge) {
    window.ProGran3.Communication.SketchUpBridge.addPendingPreview(componentPath, filename, 'MainSteles', item, loadingDiv);
  } else {
    // Fallback для зворотної сумісності
    window.pendingPreviews = window.pendingPreviews || {};
    window.pendingPreviews[componentPath] = { item, loadingDiv, filename, source: 'MainSteles' };
  }
  
  debugLog(`📝 Додано до pending: ${componentPath} (MainSteles)`, 'info');
}

// Універсальна функція для створення заглушки
function createPlaceholder(item, loadingDiv, text) {
  loadingDiv.remove();
  const placeholder = document.createElement('div');
  placeholder.style.cssText = `
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.1);
    color: #666;
    font-size: 12px;
    text-align: center;
    padding: 10px;
    box-sizing: border-box;
  `;
  placeholder.textContent = text;
  item.appendChild(placeholder);
}



// Функція для отримання згенерованого превью з Ruby
function receiveWebPreview(componentPath, base64Data) {
  debugLog(`📥 Отримано превью для: ${componentPath}`, 'info');
  debugLog(`📊 Розмір base64 даних: ${base64Data ? base64Data.length : 0} символів`, 'info');
  debugLog(` Перші 50 символів base64: ${base64Data ? base64Data.substring(0, 50) : 'null'}`, 'info');
  
  // Використовуємо SketchUpBridge якщо доступний
  if (window.ProGran3 && window.ProGran3.Communication && window.ProGran3.Communication.SketchUpBridge) {
    window.ProGran3.Communication.SketchUpBridge.receiveWebPreview(componentPath, base64Data);
    return;
  }
  
  // Fallback для зворотної сумісності
  const pendingData = window.pendingPreviews && window.pendingPreviews[componentPath];
  if (!pendingData) {
    debugLog(` Не знайдено pending дані для: ${componentPath}`, 'error');
    debugLog(`📋 Доступні pending: ${Object.keys(window.pendingPreviews || {}).join(', ')}`, 'error');
    return;
  }
  
  const { item, loadingDiv, filename, source } = pendingData;
  debugLog(` Знайдено pending дані для: ${filename} (${source})`, 'success');
  
  if (base64Data && base64Data.startsWith('data:image/')) {
    debugLog(`🖼️ Створюємо зображення для: ${filename}`, 'info');
    
    // Створюємо зображення з base64 даних
    const img = document.createElement('img');
    img.src = base64Data;
    img.alt = filename;
    
    // Видаляємо індикатор завантаження та додаємо зображення
    if (loadingDiv && loadingDiv.parentNode) {
      loadingDiv.parentNode.removeChild(loadingDiv);
      debugLog(`🗑️ Видалено loading indicator для: ${filename}`, 'info');
    }
    
    if (item) {
      item.appendChild(img);
      item.dataset.status = 'loaded';
      debugLog(` Зображення додано для: ${filename}`, 'success');
    }
    
  } else {
    debugLog(` Помилка: base64 дані не є валідним зображенням для: ${filename}`, 'error');
    // Якщо не вдалося згенерувати, показуємо заглушку
    if (item && loadingDiv) createPlaceholder(item, loadingDiv, `Помилка генерації\n${filename}`);
  }
  
  // Очищаємо pending
  delete window.pendingPreviews[componentPath];
  debugLog(`🧹 Очищено pending для: ${componentPath}`, 'info');
}

// Функція для обробки помилки генерації превью
function handlePreviewError(componentPath, errorMessage) {
  // Використовуємо SketchUpBridge якщо доступний
  if (window.ProGran3 && window.ProGran3.Communication && window.ProGran3.Communication.SketchUpBridge) {
    window.ProGran3.Communication.SketchUpBridge.handlePreviewError(componentPath, errorMessage);
    return;
  }
  
  // Fallback для зворотної сумісності
  const pendingData = window.pendingPreviews && window.pendingPreviews[componentPath];
  if (!pendingData) return;
  
  const { item, loadingDiv, filename } = pendingData;
  createPlaceholder(item, loadingDiv, `Помилка генерації\n${filename}`);
  
  // Очищаємо pending
  delete window.pendingPreviews[componentPath];
}



function moveMainStelesCarousel(category, direction) {
  const state = carouselState[category];
  const newIndex = state.index + direction;
  const track = document.getElementById(`${category}-carousel-track`);
  const items = track.querySelectorAll('.carousel-item');
  
  // Циклічна прокрутка: якщо виходимо за межі, переходимо на протилежний кінець
  let finalIndex = newIndex;
  if (newIndex < 0) {
    finalIndex = items.length - 1; // Переходимо на останній елемент
  } else if (newIndex >= items.length) {
    finalIndex = 0; // Переходимо на перший елемент
  }
  
  showMainStelesCarouselItem(category, finalIndex);
}



function showMainStelesCarouselItem(category, index) {
  const track = document.getElementById(`${category}-carousel-track`);
  const viewport = document.getElementById(`${category}-carousel-viewport`);
  const items = track.querySelectorAll('.carousel-item');
  
  if (!track || items.length === 0 || !items[index]) return;

  items.forEach((item, i) => {
    item.classList.toggle('active', i === index);
  });
  
  const viewportCenter = viewport.offsetWidth / 2;
  const targetItem = items[index];
  const itemCenter = targetItem.offsetLeft + targetItem.offsetWidth / 2;
  const newTransform = viewportCenter - itemCenter;

  carouselState[category].index = index;
  track.style.transform = `translateX(${newTransform}px)`;
  
  // Ледаче завантаження для активного елемента та сусідів
  loadOrGenerateMainStelesPreview(category, index);
  if (index + 1 < items.length) loadOrGenerateMainStelesPreview(category, index + 1);
  if (index - 1 >= 0) loadOrGenerateMainStelesPreview(category, index - 1);
  
  // updateAllDisplays() видалено - функція не існує
}





// --- УНІВЕРСАЛЬНІ ФУНКЦІЇ ДЛЯ КАРУСЕЛЕЙ ---

// Замінюємо старі функції на універсальні
function initializeCarousel(category) {
  CarouselManager.initialize(category);
}

function showCarouselItem(category, index) {
  CarouselManager.showCarouselItem(category, index);
}

function moveCarousel(category, direction) {
  CarouselManager.moveCarousel(category, direction);
}

function addModel(category) {
  CarouselManager.addModel(category);
}

// Функція для оновлення типу стел
// Функція для вибору типу стели (нова Apple-style логіка)
function selectSteleType(button) {
  debugLog('selectSteleType викликано!', 'info');
  const segments = document.querySelectorAll('.segment');
  const steleOptionsSection = document.getElementById('stele-options-section');
  const steleScalingSection = document.getElementById('stele-scaling-section');
  
  // Оновлюємо активний стан сегментів
  segments.forEach(segment => segment.classList.remove('active'));
  button.classList.add('active');
  
  const steleType = button.getAttribute('data-value');
  carouselState.steles.type = steleType;
  
  debugLog(`Вибрано тип стели: ${steleType} (${typeof steleType})`, 'info');
  debugLog(`Стан стел після вибору: ${JSON.stringify(carouselState.steles)}`, 'info');
  
  if (steleType === 'single') {
    // Приховуємо секцію для парних стел
    steleOptionsSection.style.display = 'none';
    
    // Показуємо секцію масштабування для однієї стели
    if (steleScalingSection) {
      steleScalingSection.style.display = 'block';
      debugLog('Показано секцію масштабування для одинарної стели', 'info');
      
      // Додаткова перевірка через затримку
      setTimeout(() => {
        if (steleScalingSection.style.display !== 'block') {
          steleScalingSection.style.display = 'block';
          debugLog('Примусово показано секцію масштабування (через затримку)', 'info');
        }
      }, 50);
    } else {
      debugLog('stele-scaling-section не знайдено в DOM при виборі single', 'error');
    }
    
    // Видаляємо центральну деталь, якщо вона була створена
    if (carouselState.steles.centralDetail && carouselState.steles.centralDetailCreated) {
      debugLog('Видаляємо центральну деталь при перемиканні на одну стелу', 'info');
      deleteCentralDetail();
      carouselState.steles.centralDetail = false;
    }
    
    // Оновлюємо чекбокс центральної деталі
    const centralDetailCheckbox = document.getElementById('central-detail');
    if (centralDetailCheckbox) {
      centralDetailCheckbox.checked = false;
    }
    
    debugLog('Тип стели: одна', 'info');
  } else if (steleType === 'paired') {
    // Показуємо секцію для парних стел з анімацією
    steleOptionsSection.style.display = 'block';
    
    // Приховуємо секцію масштабування для парних стел
    if (steleScalingSection) {
      steleScalingSection.style.display = 'none';
    }
    
    // Встановлюємо значення за замовчуванням для парних стел
    if (!carouselState.steles.distance) {
      carouselState.steles.distance = 200;
    }
    if (!carouselState.steles.centralDetail) {
      carouselState.steles.centralDetail = false;
    }
    if (!carouselState.steles.centralDetailWidth) {
      carouselState.steles.centralDetailWidth = 200;
    }
    if (!carouselState.steles.centralDetailDepth) {
      carouselState.steles.centralDetailDepth = 50;
    }
    if (!carouselState.steles.centralDetailHeight) {
      carouselState.steles.centralDetailHeight = 250;
    }
    
    updateCentralDetailDisplay();
    debugLog('Тип стели: парні', 'info');
  }
}

// Функція для оновлення типу стели (legacy support)
function updateSteleType() {
  const singleRadio = document.querySelector('input[name="stele-type"][value="single"]');
  const pairedRadio = document.querySelector('input[name="stele-type"][value="paired"]');
  
  if (singleRadio && pairedRadio) {
    if (singleRadio.checked) {
      const singleButton = document.querySelector('.segment[data-value="single"]');
      if (singleButton) selectSteleType(singleButton);
    } else if (pairedRadio.checked) {
      const pairedButton = document.querySelector('.segment[data-value="paired"]');
      if (pairedButton) selectSteleType(pairedButton);
    }
  }
}

// Функція для оновлення відстані між стелами
function updateSteleDistance() {
  const distanceInput = document.getElementById('stele-distance');
  if (distanceInput) {
    // Конвертуємо значення в міліметри для збереження в стані
    const distanceMm = convertToMm(distanceInput.value);
    carouselState.steles.distance = distanceMm;
    debugLog(`Відстань між стелами змінено на: ${distanceMm}мм`, 'info');
    
    // Оновлюємо розміри центральної деталі
    if (carouselState.steles.centralDetail) {
      updateCentralDetailFromSteleDistance();
    }
    
    // Автоматично оновлюємо існуючу модель стел
    updateExistingSteleModel();
  } else {
    debugLog('Поле stele-distance не знайдено', 'error');
  }
}

// Функція для автоматичного оновлення існуючої моделі стел
function updateExistingSteleModel() {
  // Перевіряємо, чи є вже створена модель стел
  if (carouselState.steles.modelCreated && window.sketchup && (window.sketchup.update_model || window.sketchup.add_model)) {
    const state = carouselState.steles;
    const filename = modelLists.steles[state.index];
    
    if (filename) {
      const steleType = state.type || 'single';
      const steleDistance = state.distance || 200;
      const centralDetail = state.centralDetail || false;
      const centralDetailWidth = state.centralDetailWidth || 200;
      const centralDetailDepth = state.centralDetailDepth || 50;
      const centralDetailHeight = state.centralDetailHeight || 1200;
      
      debugLog(`Оновлення моделі стел: ${filename}, відстань: ${steleDistance}мм, центральна деталь: ${centralDetail} (${centralDetailWidth}x${centralDetailDepth}x${centralDetailHeight}мм)`, 'info');
      
      // Спробуємо використати update_model, якщо вона існує
      if (window.sketchup.update_model) {
        window.sketchup.update_model('steles', filename, steleType, steleDistance, centralDetail, centralDetailWidth, centralDetailDepth, centralDetailHeight);
      } else if (window.sketchup.add_model) {
        // Fallback: використовуємо add_model як оновлення
        window.sketchup.add_model('steles', filename, steleType, steleDistance, centralDetail, centralDetailWidth, centralDetailDepth, centralDetailHeight);
      }
    }
  }
}

// Функція для оновлення вмикача проміжних
function updateStandsGaps() {
  const gapsCheckbox = document.getElementById('stands-gaps');
  if (gapsCheckbox) {
    carouselState.stands.gaps = gapsCheckbox.checked;
    debugLog(`Проміжна підставки: ${gapsCheckbox.checked ? 'увімкнено' : 'вимкнено'}`, 'info');
    
    // Показуємо/приховуємо поля розмірів проміжної
    const gapsDimensionsGroup = document.getElementById('gaps-dimensions-group');
    if (gapsDimensionsGroup) {
      if (gapsCheckbox.checked) {
        gapsDimensionsGroup.style.display = 'block';
        // Автоматично заповнюємо довжину та ширину з розмірів підставки
        updateGapsFromStandDimensions();
      } else {
        gapsDimensionsGroup.style.display = 'none';
      }
    }
  }
}

// Функція для оновлення розмірів проміжної з розмірів підставки
function updateGapsFromStandDimensions() {
  const standDepth = document.getElementById('stands-depth');
  const standWidth = document.getElementById('stands-width');
  const gapsDepth = document.getElementById('gaps-depth');
  const gapsWidth = document.getElementById('gaps-width');
  
  if (standDepth && standWidth && gapsDepth && gapsWidth) {
    const currentUnit = getCurrentUnit();
    
    // Конвертуємо розміри підставки в міліметри
    const standDepthMm = convertToMm(standDepth.value);
    const standWidthMm = convertToMm(standWidth.value);
    
    // Додаємо 50 мм до розмірів підставки
    const newDepthMm = standDepthMm + 50;
    const newWidthMm = standWidthMm + 50;
    
    // Конвертуємо назад в поточні одиниці
    const newDepth = currentUnit === 'cm' ? Math.round(newDepthMm / 10) : newDepthMm;
    const newWidth = currentUnit === 'cm' ? Math.round(newWidthMm / 10) : newWidthMm;
    
    gapsDepth.value = newDepth;
    gapsWidth.value = newWidth;
    debugLog(`Розміри проміжної оновлено з підставки (+50мм): ${newDepth}×${newWidth} ${currentUnit}`, 'info');
  }
}

// Функція для оновлення відображення розмірів проміжної
function updateGapsDisplay() {
  const depthInput = document.getElementById('gaps-depth');
  const widthInput = document.getElementById('gaps-width');
  const heightInput = document.getElementById('gaps-height');
  
  if (depthInput && widthInput && heightInput) {
    const depth = parseInt(depthInput.value) || 650;
    const width = parseInt(widthInput.value) || 200;
    const height = parseInt(heightInput.value) || 50;
    
    debugLog(`Розміри проміжної: ${height}×${width}×${depth} мм (В×Ш×Д)`, 'info');
  }
}


// Ініціалізація типу стел при завантаженні
function initializeSteleType() {
  // Ініціалізуємо стан стел, якщо не існує
  if (!carouselState.steles) {
    carouselState.steles = {
      type: 'single',
      distance: 200,
      centralDetail: false,
      centralDetailWidth: 200,
      centralDetailDepth: 50,
      centralDetailHeight: 250,
      centralDetailCreated: false,
      modelCreated: false
    };
    debugLog('Ініціалізовано стан стел з типом single', 'info');
  } else {
    debugLog(`Стан стел вже існує: ${JSON.stringify(carouselState.steles)}`, 'info');
  }
  
  // Примусово встановлюємо тип single, якщо не встановлений
  if (!carouselState.steles.type) {
    carouselState.steles.type = 'single';
    debugLog('Примусово встановлено тип стел: single', 'info');
  }
  
  const steleTypeInputs = document.querySelectorAll('input[name="stele-type"]');
  if (steleTypeInputs.length > 0) {
    const checkedInput = document.querySelector('input[name="stele-type"]:checked');
    if (checkedInput) {
      carouselState.steles.type = checkedInput.value;
      debugLog(`Ініціалізовано тип стел: ${checkedInput.value}`, 'info');
    }
  }
  initializeCentralDetail();
  
  // Ініціалізуємо нову Apple-style структуру
  initializeSteleSections();
  
  // Показуємо секцію масштабування для одинарної стели, якщо вона вже вибрана
  setTimeout(() => {
    if (carouselState.steles.type === 'single') {
      const steleScalingSection = document.getElementById('stele-scaling-section');
      if (steleScalingSection) {
        steleScalingSection.style.display = 'block';
        debugLog('Показано секцію масштабування при ініціалізації (з затримкою)', 'info');
      } else {
        debugLog('stele-scaling-section не знайдено в DOM', 'error');
      }
    }
  }, 200);
}

// Ініціалізація центральної деталі
function initializeCentralDetail() {
  const centralDetailCheckbox = document.getElementById('central-detail');
  if (centralDetailCheckbox) {
    carouselState.steles.centralDetail = centralDetailCheckbox.checked;
    carouselState.steles.centralDetailCreated = false; // Ініціалізуємо флаг
    updateCentralDetailDisplay();
    debugLog(`Ініціалізовано центральну деталь: ${centralDetailCheckbox.checked}`, 'info');
  }
}

// Ініціалізація нової Apple-style структури стел
function initializeSteleSections() {
  // Встановлюємо початковий стан сегментів з затримкою
  setTimeout(() => {
    const singleButton = document.querySelector('.segment[data-value="single"]');
    if (singleButton && !singleButton.classList.contains('active')) {
      debugLog('initializeSteleSections: викликаємо selectSteleType для single', 'info');
      selectSteleType(singleButton);
    }
  }, 100);
  
  // Ініціалізуємо центральну деталь
  initializeCentralDetail();
  
  debugLog('Ініціалізовано секції стел у Apple стилі', 'info');
}

// Оновлення центральної деталі
function updateCentralDetail() {
  const centralDetailCheckbox = document.getElementById('central-detail');
  if (centralDetailCheckbox) {
    const wasEnabled = carouselState.steles.centralDetail;
    const isNowEnabled = centralDetailCheckbox.checked;
    carouselState.steles.centralDetail = isNowEnabled;
    
    if (isNowEnabled) {
      // При вмиканні - створюємо центральну деталь
      updateCentralDetailDisplay();
      // Невелика затримка для завершення анімації показу полів
      setTimeout(() => {
        createCentralDetail();
      }, 100);
    } else {
      // При вимиканні - видаляємо центральну деталь
      if (carouselState.steles.centralDetailCreated) {
        deleteCentralDetail();
      }
      updateCentralDetailDisplay();
    }
    
    // Автоматично оновлюємо існуючу модель стел
    updateExistingSteleModel();
    
    debugLog(`Центральна деталь: ${isNowEnabled ? 'увімкнено' : 'вимкнено'} (було: ${wasEnabled}, створена: ${carouselState.steles.centralDetailCreated})`, 'info');
  }
}

// Оновлення відображення центральної деталі
function updateCentralDetailDisplay() {
  const centralDetailDimensionsGroup = document.getElementById('central-detail-dimensions-group');
  
  if (centralDetailDimensionsGroup) {
    if (carouselState.steles.type === 'paired') {
      if (carouselState.steles.centralDetail) {
        // Перевіряємо, чи поля були приховані раніше
        const wasHidden = centralDetailDimensionsGroup.style.display === 'none';
        centralDetailDimensionsGroup.style.display = 'block';
        
        // Ініціалізуємо значення тільки при першому показі
        if (wasHidden) {
          updateCentralDetailFromSteleDistance();
        }
      } else {
        centralDetailDimensionsGroup.style.display = 'none';
      }
    } else {
      centralDetailDimensionsGroup.style.display = 'none';
    }
  }
  
  // Оновлюємо розміри центральної деталі в стані
  const centralDetailWidth = document.getElementById('central-detail-width');
  const centralDetailDepth = document.getElementById('central-detail-depth');
  const centralDetailHeight = document.getElementById('central-detail-height');
  
  if (centralDetailWidth && centralDetailDepth && centralDetailHeight) {
    const widthMm = convertToMm(centralDetailWidth.value);
    const depthMm = convertToMm(centralDetailDepth.value);
    const heightMm = convertToMm(centralDetailHeight.value);
    
    carouselState.steles.centralDetailWidth = widthMm;
    carouselState.steles.centralDetailDepth = depthMm;
    carouselState.steles.centralDetailHeight = heightMm;
    
    debugLog(`Розміри центральної деталі оновлено в стані: ${widthMm}x${depthMm}x${heightMm}мм`, 'info');
  }
}


// Функція для ручного оновлення моделі стел з новими розмірами
function updateSteleModelWithNewDimensions() {
  debugLog('=== КНОПКА "ОНОВИТИ РОЗМІРИ" НАТИСНУТА ===', 'info');
  
  // Перевіряємо, чи є створена модель стел
  if (!carouselState.steles.modelCreated) {
    debugLog('ПОМИЛКА: Модель стел ще не створена', 'error');
    alert('Спочатку додайте стелу!');
    return;
  }
  
  debugLog('Модель створена, продовжуємо оновлення...', 'info');
  
  // Оновлюємо розміри в стані перед оновленням моделі
  updateCentralDetailDisplay();
  
  // Викликаємо оновлення моделі стел
  updateExistingSteleModel();
  
  // Якщо центральна деталь увімкнена, оновлюємо її окремо
  if (carouselState.steles.centralDetail) {
    debugLog('Оновлюємо центральну деталь з новими розмірами...', 'info');
    createCentralDetail();
  }
  
  debugLog('Оновлення завершено', 'info');
}

// Оновлення розмірів центральної деталі на основі відстані між стелами
function updateCentralDetailFromSteleDistance() {
  const steleDistance = parseFloat(document.getElementById('stele-distance').value) || 200;
  const centralDetailWidth = document.getElementById('central-detail-width');
  const centralDetailDepth = document.getElementById('central-detail-depth');
  const centralDetailHeight = document.getElementById('central-detail-height');
  
  if (centralDetailWidth && centralDetailDepth && centralDetailHeight) {
    const currentUnit = getCurrentUnit();
    
    // Ширина = відстань між стелами
    centralDetailWidth.value = steleDistance;
    
    // Товщина = 50мм (за замовчуванням) - конвертуємо в поточні одиниці
    const defaultDepth = currentUnit === 'cm' ? 5 : 50;
    centralDetailDepth.value = defaultDepth;
    
    // Висота = 1200мм (за замовчуванням) - конвертуємо в поточні одиниці
    const defaultHeight = currentUnit === 'cm' ? 120 : 1200;
    centralDetailHeight.value = defaultHeight;
    
    debugLog(`Оновлено розміри центральної деталі: ${steleDistance}×${defaultDepth}×${defaultHeight} ${currentUnit}`, 'info');
  }
}

// Створення центральної деталі
function createCentralDetail() {
  const centralDetailWidthRaw = parseFloat(document.getElementById('central-detail-width').value) || 200;
  const centralDetailDepthRaw = parseFloat(document.getElementById('central-detail-depth').value) || 50;
  const centralDetailHeightRaw = parseFloat(document.getElementById('central-detail-height').value) || 1200;
  
  // Конвертуємо значення в міліметри для передачі в Ruby
  const centralDetailWidth = convertToMm(centralDetailWidthRaw);
  const centralDetailDepth = convertToMm(centralDetailDepthRaw);
  const centralDetailHeight = convertToMm(centralDetailHeightRaw);
  
  const currentUnit = getCurrentUnit();
  debugLog(`Створення центральної деталі (${currentUnit} → мм):`, 'info');
  debugLog(`  - Ширина: ${centralDetailWidthRaw} ${currentUnit} → ${centralDetailWidth} мм`, 'info');
  debugLog(`  - Товщина: ${centralDetailDepthRaw} ${currentUnit} → ${centralDetailDepth} мм`, 'info');
  debugLog(`  - Висота: ${centralDetailHeightRaw} ${currentUnit} → ${centralDetailHeight} мм`, 'info');
  debugLog(`Центральна деталь: ${centralDetailWidth}×${centralDetailDepth}×${centralDetailHeight} мм`, 'info');
  
  // Викликаємо Ruby метод для створення центральної деталі
  if (window.sketchup && window.sketchup.create_central_detail) {
    window.sketchup.create_central_detail(centralDetailWidth, centralDetailDepth, centralDetailHeight);
    // Встановлюємо флаг, що центральна деталь була створена
    carouselState.steles.centralDetailCreated = true;
  } else {
    debugLog('SketchUp bridge не доступний для створення центральної деталі', 'error');
  }
}

// Видалення центральної деталі
function deleteCentralDetail() {
  debugLog('Видалення центральної деталі', 'info');
  
  // Викликаємо Ruby метод для видалення центральної деталі
  if (window.sketchup && window.sketchup.delete_central_detail) {
    window.sketchup.delete_central_detail();
    // Скидаємо флаг, що центральна деталь була створена
    carouselState.steles.centralDetailCreated = false;
  } else {
    debugLog('SketchUp bridge не доступний для видалення центральної деталі', 'error');
  }
}

// Ініціалізація вмикача проміжних при завантаженні
function initializeStandsGaps() {
  const gapsCheckbox = document.getElementById('stands-gaps');
  if (gapsCheckbox) {
    carouselState.stands.gaps = gapsCheckbox.checked;
    debugLog(`Ініціалізовано проміжну підставки: ${gapsCheckbox.checked}`, 'info');
    
    // Ініціалізуємо видимість полів проміжної
    const gapsDimensionsGroup = document.getElementById('gaps-dimensions-group');
    if (gapsDimensionsGroup) {
      if (gapsCheckbox.checked) {
        gapsDimensionsGroup.style.display = 'block';
        // Автоматично заповнюємо розміри з підставки
        updateGapsFromStandDimensions();
      } else {
        gapsDimensionsGroup.style.display = 'none';
      }
    }
  }
}

// --- ІНШІ ФУНКЦІЇ ---

function updateTilingControls() {
  const tilingMode = getSelectedTilingMode();
  const frameControls = document.getElementById('frame-controls');
  const modularControls = document.getElementById('modular-controls');
  
  if (tilingMode === 'frame') {
    frameControls.classList.remove('hidden');
    modularControls.classList.add('hidden');
  } else {
    frameControls.classList.add('hidden');
    modularControls.classList.remove('hidden');
  }
}

function selectBlindAreaMode(button) {
  // Видаляємо активний клас з усіх кнопок режиму ширини
  document.querySelectorAll('.button-group-tiling-mode .tiling-mode-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Додаємо активний клас до натиснутої кнопки
  button.classList.add('active');
  
  // Оновлюємо контроли
  updateBlindAreaControls();
}

// Функція видалена - замінена на нову версію нижче

function updateBlindAreaControls() {
  const mode = getSelectedBlindAreaMode();
  const uniformControls = document.getElementById('blind-area-uniform-controls');
  const customControls = document.getElementById('blind-area-custom-controls');
  
  if (mode === 'uniform') {
    uniformControls.classList.remove('hidden');
    customControls.classList.add('hidden');
  } else {
    uniformControls.classList.add('hidden');
    customControls.classList.remove('hidden');
  }
}




// updateAllDisplays() перенесено в modules/ui/AccordionManager.js

function updateModelDisplays() {
  // Оновлення відображення підставки - тепер використовуємо updateStandsDisplay
  updateStandsDisplay();
  
  // Оновлення відображення квітника
  if (carouselState.flowerbeds && modelLists.flowerbeds) {
    const flowerbedIndex = carouselState.flowerbeds.index;
    const flowerbedFilename = modelLists.flowerbeds[flowerbedIndex];
    if (flowerbedFilename) {
      document.getElementById('flowerbeds-dimensions-display').textContent = 
        flowerbedFilename.replace('.skp', '');
    }
  }
  
  // Оновлення відображення стели
  if (carouselState.steles && modelLists.steles) {
    const steleIndex = carouselState.steles.index;
    const steleFilename = modelLists.steles[steleIndex];
    if (steleFilename) {
      document.getElementById('steles-dimensions-display').textContent = 
        steleFilename.replace('.skp', '');
    }
  }
  
  // Оновлення відображення надгробної плити
  if (carouselState.gravestones && modelLists.gravestones) {
    const gravestoneIndex = carouselState.gravestones.index;
    const gravestoneFilename = modelLists.gravestones[gravestoneIndex];
    if (gravestoneFilename) {
      document.getElementById('gravestones-dimensions-display').textContent = 
        gravestoneFilename.replace('.skp', '');
    }
  }
  
  // Оновлення відображення декору огорожі
  if (carouselState.fence_decor && modelLists.fence_decor) {
    const fenceDecorIndex = carouselState.fence_decor.index;
    const fenceDecorFilename = modelLists.fence_decor[fenceDecorIndex];
    if (fenceDecorFilename) {
      document.getElementById('fence-decor-dimensions-display').textContent = 
        fenceDecorFilename.replace('.skp', '');
    }
  }
}

function updateSummaryTable() {
  try {
    debugLog(` updateSummaryTable() викликано`, 'info');
    const unitText = currentUnit === 'mm' ? 'мм' : 'см';
    
    // Фундамент
    if (addedElements.foundation) {
    const foundationDepthEl = document.getElementById('foundation-depth');
    const foundationWidthEl = document.getElementById('foundation-width');
    const foundationHeightEl = document.getElementById('foundation-height');
    const summaryFoundationEl = document.getElementById('summary-foundation');
    
    if (foundationDepthEl && foundationWidthEl && foundationHeightEl && summaryFoundationEl) {
      const foundationDepth = foundationDepthEl.value;
      const foundationWidth = foundationWidthEl.value;
      const foundationHeight = foundationHeightEl.value;
      summaryFoundationEl.textContent = 
        `${foundationDepth}×${foundationWidth}×${foundationHeight} ${unitText}`;
    }
  } else {
    const summaryFoundationEl = document.getElementById('summary-foundation');
    if (summaryFoundationEl) {
      summaryFoundationEl.textContent = '--';
    }
  }
  
  // Плитка
  if (addedElements.tiling) {
    const activeButton = document.querySelector('.tiling-mode-btn.active');
    const summaryTilingEl = document.getElementById('summary-tiling');
    if (activeButton && summaryTilingEl) {
      summaryTilingEl.textContent = activeButton.textContent;
    }
  } else {
    const summaryTilingEl = document.getElementById('summary-tiling');
    if (summaryTilingEl) {
      summaryTilingEl.textContent = '--';
    }
  }
  
  // Облицювання
  if (addedElements.cladding) {
    const claddingThicknessEl = document.getElementById('cladding-thickness');
    const summaryCladdingEl = document.getElementById('summary-cladding');
    if (claddingThicknessEl && summaryCladdingEl) {
      const claddingThickness = claddingThicknessEl.value;
      summaryCladdingEl.textContent = 
        `Товщина: ${claddingThickness} ${unitText}`;
    }
  } else {
    const summaryCladdingEl = document.getElementById('summary-cladding');
    if (summaryCladdingEl) {
      summaryCladdingEl.textContent = '--';
    }
  }
  
  // Відмостка
  if (addedElements.blindArea) {
    const blindAreaThicknessEl = document.getElementById('blind-area-thickness');
    const blindAreaModeEl = document.getElementById('blind-area-mode');
    const summaryBlindAreaEl = document.getElementById('summary-blind-area');
    
    if (blindAreaThicknessEl && blindAreaModeEl && summaryBlindAreaEl) {
      const blindAreaThickness = blindAreaThicknessEl.value;
      const blindAreaMode = blindAreaModeEl.value;
      
      if (blindAreaMode === 'uniform') {
        const uniformWidthEl = document.getElementById('blind-area-uniform-width');
        if (uniformWidthEl) {
          const uniformWidth = uniformWidthEl.value;
          summaryBlindAreaEl.textContent = 
            `Ширина: ${uniformWidth} ${unitText}, Товщина: ${blindAreaThickness} ${unitText}`;
        }
      } else {
        const blindAreaNorthEl = document.getElementById('blind-area-north');
        const blindAreaSouthEl = document.getElementById('blind-area-south');
        const blindAreaEastEl = document.getElementById('blind-area-east');
        const blindAreaWestEl = document.getElementById('blind-area-west');
        
        if (blindAreaNorthEl && blindAreaSouthEl && blindAreaEastEl && blindAreaWestEl) {
          const blindAreaNorth = blindAreaNorthEl.value;
          const blindAreaSouth = blindAreaSouthEl.value;
          const blindAreaEast = blindAreaEastEl.value;
          const blindAreaWest = blindAreaWestEl.value;
          summaryBlindAreaEl.textContent = 
            `П:${blindAreaNorth} Пд:${blindAreaSouth} С:${blindAreaEast} З:${blindAreaWest} ${unitText}, Т:${blindAreaThickness} ${unitText}`;
        }
      }
    }
  } else {
    const summaryBlindAreaEl = document.getElementById('summary-blind-area');
    if (summaryBlindAreaEl) {
      summaryBlindAreaEl.textContent = '--';
    }
  }
  
  // Підставка
  if (addedElements.stands) {
    const summaryStandEl = document.getElementById('summary-stand');
    if (summaryStandEl) {
      if (typeof addedElements.stands === 'object' && addedElements.stands.filename) {
        summaryStandEl.textContent = addedElements.stands.filename.replace('.skp', '');
      } else {
        summaryStandEl.textContent = 'Підставка';
      }
    }
  } else {
    const summaryStandEl = document.getElementById('summary-stand');
    if (summaryStandEl) {
      summaryStandEl.textContent = '--';
    }
  }
  
  // Квітник
  if (addedElements.flowerbeds && carouselState.flowerbeds && modelLists.flowerbeds) {
    const flowerbedFilename = modelLists.flowerbeds[carouselState.flowerbeds.index];
    const summaryFlowerbedEl = document.getElementById('summary-flowerbed');
    if (summaryFlowerbedEl) {
      summaryFlowerbedEl.textContent = 
        flowerbedFilename ? flowerbedFilename.replace('.skp', '') : '--';
    }
  } else {
    const summaryFlowerbedEl = document.getElementById('summary-flowerbed');
    if (summaryFlowerbedEl) {
      summaryFlowerbedEl.textContent = '--';
    }
  }
  
  // Надгробна плита
  if (addedElements.gravestones && carouselState.gravestones && modelLists.gravestones) {
    const gravestoneFilename = modelLists.gravestones[carouselState.gravestones.index];
    const summaryGravestoneEl = document.getElementById('summary-gravestone');
    if (summaryGravestoneEl) {
      summaryGravestoneEl.textContent = 
        gravestoneFilename ? gravestoneFilename.replace('.skp', '') : '--';
    }
  } else {
    const summaryGravestoneEl = document.getElementById('summary-gravestone');
    if (summaryGravestoneEl) {
      summaryGravestoneEl.textContent = '--';
    }
  }
  
  // Стела
  if (addedElements.steles && carouselState.steles && modelLists.steles) {
    const steleFilename = modelLists.steles[carouselState.steles.index];
    const summarySteleEl = document.getElementById('summary-stele');
    if (summarySteleEl) {
      summarySteleEl.textContent = 
        steleFilename ? steleFilename.replace('.skp', '') : '--';
    }
  } else {
    const summarySteleEl = document.getElementById('summary-stele');
    if (summarySteleEl) {
      summarySteleEl.textContent = '--';
    }
  }
  
  // Кутова огорожа
  if (addedElements.fence_corner) {
    const postHeightEl = document.getElementById('fence-corner-post-height');
    const postSizeEl = document.getElementById('fence-corner-post-size');
    const sideHeightEl = document.getElementById('fence-corner-side-height');
    const sideLengthEl = document.getElementById('fence-corner-side-length');
    const summaryFenceCornerEl = document.getElementById('summary-fence-corner');
    
    if (postHeightEl && postSizeEl && sideHeightEl && sideLengthEl && summaryFenceCornerEl) {
      const postHeight = postHeightEl.value;
      const postSize = postSizeEl.value;
      const sideHeight = sideHeightEl.value;
      const sideLength = sideLengthEl.value;
      const decorativeSize = 100; // Фіксоване значення
      
      summaryFenceCornerEl.textContent = 
        `Стовп: ${postHeight}×${postSize}×${postSize}${unitText}, Панель: ${sideHeight}×${sideLength}${unitText}, Декор: ${decorativeSize}${unitText}`;
    }
  } else {
    const summaryFenceCornerEl = document.getElementById('summary-fence-corner');
    if (summaryFenceCornerEl) {
      summaryFenceCornerEl.textContent = '--';
    }
  }
  
  // Периметральна огорожа
  if (addedElements.fence_perimeter) {
    const postHeightEl = document.getElementById('fence-perimeter-post-height');
    const postSizeEl = document.getElementById('fence-perimeter-post-size');
    const northCountEl = document.getElementById('fence-perimeter-north-count');
    const southCountEl = document.getElementById('fence-perimeter-south-count');
    const eastWestCountEl = document.getElementById('fence-perimeter-east-west-count');
    const summaryFencePerimeterEl = document.getElementById('summary-fence-perimeter');
    
    if (postHeightEl && postSizeEl && northCountEl && southCountEl && eastWestCountEl && summaryFencePerimeterEl) {
      const postHeight = postHeightEl.value;
      const postSize = postSizeEl.value;
      const northCount = northCountEl.value;
      const southCount = southCountEl.value;
      const eastWestCount = eastWestCountEl.value;
      const decorativeHeight = 100; // Фіксоване значення
      const decorativeThickness = 100; // Фіксоване значення
      
      summaryFencePerimeterEl.textContent = 
        `Стовп: ${postHeight}×${postSize}×${postSize}${unitText}, Сторони: З${northCount} В${southCount} Б${eastWestCount}, Декор: ${decorativeHeight}×${decorativeThickness}${unitText}`;
    }
  } else {
    const summaryFencePerimeterEl = document.getElementById('summary-fence-perimeter');
    if (summaryFencePerimeterEl) {
      summaryFencePerimeterEl.textContent = '--';
    }
  }
  
  // Декор огорожі
  const summaryFenceDecor = document.getElementById('summary-fence-decor');
  if (summaryFenceDecor) {
    if (addedElements.fence_decor && carouselState.fence_decor && modelLists.fence_decor) {
      const fenceDecorFilename = modelLists.fence_decor[carouselState.fence_decor.index];
      summaryFenceDecor.textContent = 
        fenceDecorFilename ? fenceDecorFilename.replace('.skp', '') : '--';
    } else {
      summaryFenceDecor.textContent = '--';
    }
  }
  
  // Підставка
  const summaryStands = document.getElementById('summary-stands');
  if (summaryStands) {
    if (addedElements.stands) {
      const heightEl = document.getElementById('stands-height');
      const widthEl = document.getElementById('stands-width');
      const depthEl = document.getElementById('stands-depth');
      
      if (heightEl && widthEl && depthEl) {
        const height = heightEl.value;
        const width = widthEl.value;
        const depth = depthEl.value;
        summaryStands.textContent = `${height}×${width}×${depth} ${unitText}`;
      } else {
        summaryStands.textContent = 'Додано';
      }
    } else {
      summaryStands.textContent = '--';
    }
  }
  } catch (error) {
    debugLog(` Помилка в updateSummaryTable(): ${error.message}`, 'error');
    debugLog(` Stack trace: ${error.stack}`, 'error');
  }
}

// ============================================================================
// 🏗️ БУДІВЕЛЬНИКИ (SKETCHUP ІНТЕГРАЦІЯ)
// ============================================================================
// Функції для створення елементів через SketchUp API
// ВСІ ФУНКЦІЇ З window.sketchup - НЕ ТОРКАТИСЯ!

// --- ФУНДАМЕНТ ---
// Функції для створення фундаменту

/**
 * Створює фундамент в SketchUp з параметрами з UI
 * Збирає розміри з полів вводу, конвертує в мм та викликає Ruby функцію
 * @example
 * addFoundation(); // Створює фундамент з поточними значеннями з UI
 */
function addFoundation() {
  const depth = document.getElementById('foundation-depth').value;
  const width = document.getElementById('foundation-width').value;
  const height = document.getElementById('foundation-height').value;
  
  if (window.sketchup && window.sketchup.add_foundation) {
    try {
      const depthMm = convertToMm(depth);
      const widthMm = convertToMm(width);
      const heightMm = convertToMm(height);
      
      debugLog(` Додаємо фундамент: ${depthMm}×${widthMm}×${heightMm} мм`, 'info');
      
      window.sketchup.add_foundation(depthMm, widthMm, heightMm);
      addedElements.foundation = true;
      updateSummaryTable();
      
      debugLog(` Фундамент додано успішно`, 'success');
    } catch (error) {
      debugLog(` Помилка при додаванні фундаменту: ${error.message}`, 'error');
    }
  } else {
    debugLog(` window.sketchup.add_foundation не доступний`, 'error');
  }
}

// --- ПЛИТКА ---
// Функції для створення плитки та облицювання

// Додавання плитки
function addTiles() {
  const mode = getSelectedTilingMode();
  debugLog(`🏗️ Додавання плитки, режим: ${mode}`, 'info');
  
  if (window.sketchup && window.sketchup.add_tiles) {
    try {
      if (mode === 'frame') {
        const thickness = getSelectedThickness();
        const borderWidth = document.getElementById('tile-border-width').value;
        const overhang = document.getElementById('tile-overhang').value;
        const seam = getSelectedSeam();
        
        debugLog(` Параметри рамки: товщина=${thickness}, ширина=${borderWidth}, виступ=${overhang}, шов=${seam}`, 'info');
        
        // Конвертуємо в мм
        const thicknessMm = convertToMm(thickness);
        const borderWidthMm = convertToMm(borderWidth);
        const overhangMm = convertToMm(overhang);
        const seamMm = convertToMm(seam, true); // Шви завжди в мм
        
        debugLog(` Параметри в мм: товщина=${thicknessMm}, ширина=${borderWidthMm}, виступ=${overhangMm}, шов=${seamMm}`, 'info');
        
        window.sketchup.add_tiles('frame', thicknessMm, borderWidthMm, overhangMm, seamMm);
      } else {
        const size = document.getElementById('modular-tile-size').value;
        const thickness = document.getElementById('modular-thickness').value;
        const seam = getSelectedSeam();
        const overhang = document.getElementById('modular-overhang').value;
        
        debugLog(` Параметри модульної: розмір=${size}, товщина=${thickness}, шов=${seam}, виступ=${overhang}`, 'info');
        
        // Конвертуємо в мм
        const thicknessMm = convertToMm(thickness);
        const seamMm = convertToMm(seam, true); // Шви завжди в мм
        const overhangMm = convertToMm(overhang);
        
        debugLog(` Параметри в мм: товщина=${thicknessMm}, шов=${seamMm}, виступ=${overhangMm}`, 'info');
        
        window.sketchup.add_tiles('modular', size, thicknessMm, seamMm, overhangMm);
      }
      addedElements.tiling = true;
      updateSummaryTable();
      debugLog(` Плитка додана успішно`, 'success');
    } catch (error) {
      debugLog(` Помилка при додаванні плитки: ${error.message}`, 'error');
    }
  } else {
    debugLog(` window.sketchup.add_tiles не доступний`, 'error');
  }
}

// Додавання облицювання
function addSideCladding() {
  const thickness = document.getElementById('cladding-thickness').value;
  
  if (window.sketchup && window.sketchup.add_side_cladding) {
    const thicknessMm = convertToMm(thickness);
    
    debugLog(` Додаємо облицювання: товщина=${thicknessMm}мм`, 'info');
    
    window.sketchup.add_side_cladding(thicknessMm);
    addedElements.cladding = true;
    updateSummaryTable();
    
    debugLog(` Облицювання додано успішно`, 'success');
  } else {
    debugLog(` window.sketchup.add_side_cladding не доступний`, 'error');
  }
}

// --- ОГОРІЖІ ---
// Функції для створення огорож (кутові, периметральні, декоративні)

// Додавання кутової огорожі
function addFenceCorner() {
  const postHeight = document.getElementById('fence-corner-post-height').value;
  const postSize = document.getElementById('fence-corner-post-size').value;
  const sideHeight = document.getElementById('fence-corner-side-height').value;
  const sideLength = document.getElementById('fence-corner-side-length').value;
  const sideThickness = document.getElementById('fence-corner-side-thickness').value;
  const decorativeSize = 100; // Фіксоване значення
  
  if (window.sketchup && window.sketchup.add_fence_corner) {
    const postHeightMm = convertToMm(postHeight);
    const postSizeMm = convertToMm(postSize);
    const sideHeightMm = convertToMm(sideHeight);
    const sideLengthMm = convertToMm(sideLength);
    const sideThicknessMm = convertToMm(sideThickness);
    
    debugLog(` Додаємо кутову огорожу: стовп=${postHeightMm}×${postSizeMm}мм`, 'info');
    
    window.sketchup.add_fence_corner(
      postHeightMm, 
      postSizeMm, 
      sideHeightMm, 
      sideLengthMm, 
      sideThicknessMm, 
      decorativeSize
    );
    addedElements.fence_corner = true;
    updateSummaryTable();
    
    debugLog(` Кутова огорожа додана успішно`, 'success');
  } else {
    debugLog(` window.sketchup.add_fence_corner не доступний`, 'error');
  }
}

// Додавання периметральної огорожі
function addFencePerimeter() {
  const postHeight = document.getElementById('fence-perimeter-post-height').value;
  const postSize = document.getElementById('fence-perimeter-post-size').value;
  const northCount = document.getElementById('fence-perimeter-north-count').value;
  const southCount = document.getElementById('fence-perimeter-south-count').value;
  const eastWestCount = document.getElementById('fence-perimeter-east-west-count').value;
  const decorativeHeight = 100; // Фіксоване значення
  const decorativeThickness = 100; // Фіксоване значення
  
  if (window.sketchup && window.sketchup.add_fence_perimeter) {
    const postHeightMm = convertToMm(postHeight);
    const postSizeMm = convertToMm(postSize);
    
    debugLog(` Додаємо периметральну огорожу: стовпи=${postHeightMm}×${postSizeMm}мм`, 'info');
    
    window.sketchup.add_fence_perimeter(
      postHeightMm, 
      postSizeMm, 
      parseInt(northCount), 
      parseInt(southCount), 
      parseInt(eastWestCount), 
      decorativeHeight, 
      decorativeThickness
    );
    addedElements.fence_perimeter = true;
    updateSummaryTable();
    
    debugLog(` Периметральна огорожа додана успішно`, 'success');
  } else {
    debugLog(` window.sketchup.add_fence_perimeter не доступний`, 'error');
  }
}

// Додавання декоративної огорожі
function addFenceDecor() {
  if (window.sketchup && window.sketchup.add_fence_decor) {
    debugLog(` Додаємо декоративну огорожу`, 'info');
    
    window.sketchup.add_fence_decor();
    addedElements.fence_decor = true;
    updateSummaryTable();
    
    debugLog(` Декоративна огорожа додана успішно`, 'success');
  } else {
    debugLog(` window.sketchup.add_fence_decor не доступний`, 'error');
  }
}

// --- СТЕЛИ ---
// Функції для створення стел та підставок

// Додавання підставки з кастомними розмірами
function addStandWithCustomSize() {
  const height = document.getElementById('stands-height').value;
  const width = document.getElementById('stands-width').value;
  const depth = document.getElementById('stands-depth').value;
  
  if (window.sketchup && window.sketchup.add_stand_with_custom_size) {
    const heightMm = convertToMm(height);
    const widthMm = convertToMm(width);
    const depthMm = convertToMm(depth);
    
    debugLog(` Додаємо підставку: ${heightMm}×${widthMm}×${depthMm} мм`, 'info');
    
    window.sketchup.add_stand_with_custom_size(heightMm, widthMm, depthMm);
    addedElements.stands = true;
    updateSummaryTable();
    
    debugLog(` Підставка додана успішно`, 'success');
  } else {
    debugLog(` window.sketchup.add_stand_with_custom_size не доступний`, 'error');
  }
}

// --- ВІДМОСТКА ---
// Функції для створення відмостки

/**
 * Створює відмостку в SketchUp з параметрами з UI
 * Підтримує два режими: однакова ширина (uniform) та різна ширина (custom)
 * @example
 * addBlindArea(); // Створює відмостку з поточними значеннями з UI
 */
function addBlindArea() {
  const thickness = document.getElementById('blind-area-thickness').value;
  const mode = getSelectedBlindAreaMode();
  
  if (mode === 'uniform') {
    const width = document.getElementById('blind-area-uniform-width').value;
    
    if (window.sketchup && window.sketchup.add_blind_area_uniform) {
      const thicknessMm = convertToMm(thickness);
      const widthMm = convertToMm(width);
      
      debugLog(` Додаємо відмостку (однакова ширина): ${widthMm}мм, товщина: ${thicknessMm}мм`, 'info');
      
      window.sketchup.add_blind_area_uniform(widthMm, thicknessMm);
      addedElements.blindArea = true;
      updateSummaryTable();
      
      debugLog(` Відмостка додана успішно`, 'success');
    } else {
      debugLog(` window.sketchup.add_blind_area_uniform не доступний`, 'error');
    }
  } else {
    const north = document.getElementById('blind-area-north').value;
    const south = document.getElementById('blind-area-south').value;
    const east = document.getElementById('blind-area-east').value;
    const west = document.getElementById('blind-area-west').value;
    
    if (window.sketchup && window.sketchup.add_blind_area_custom) {
      const thicknessMm = convertToMm(thickness);
      const northMm = convertToMm(north);
      const southMm = convertToMm(south);
      const eastMm = convertToMm(east);
      const westMm = convertToMm(west);
      
      debugLog(` Додаємо відмостку (різна ширина): П:${northMm}мм, Пд:${southMm}мм, С:${eastMm}мм, З:${westMm}мм, товщина: ${thicknessMm}мм`, 'info');
      
      window.sketchup.add_blind_area_custom(northMm, southMm, eastMm, westMm, thicknessMm);
      addedElements.blindArea = true;
      updateSummaryTable();
      
      debugLog(` Відмостка додана успішно`, 'success');
    } else {
      debugLog(` window.sketchup.add_blind_area_custom не доступний`, 'error');
    }
  }
}









// Функція для оновлення специфікації з моделі
function refreshSpecification() {
  debugLog(` Оновлення специфікації з моделі`, 'info');
  
  if (window.sketchup && window.sketchup.get_model_status) {
    // Викликаємо Ruby callback для отримання поточного стану моделі
    window.sketchup.get_model_status();
  } else {
    debugLog(` window.sketchup.get_model_status не доступний`, 'error');
    // Якщо callback недоступний, просто очищаємо специфікацію
    clearSpecification();
  }
}

// Функція для очищення специфікації
function clearSpecification() {
  debugLog(`🧹 Очищення специфікації`, 'info');
  
  // Скидаємо всі додані елементи
  Object.keys(addedElements).forEach(key => {
    addedElements[key] = false;
  });
  
  // Оновлюємо таблицю
  updateSummaryTable();
}

// Функція для отримання статусу моделі з Ruby (callback)
function receiveModelStatus(statusData) {
  debugLog(`📥 Отримано статус моделі: ${JSON.stringify(statusData)}`, 'info');
  
  // Оновлюємо addedElements на основі отриманих даних
  if (statusData) {
    // Оновлюємо тільки ті елементи, які дійсно знайдені в моделі
    // Якщо елемент не знайдений в моделі, залишаємо поточний стан
    if (statusData.foundation === true) {
      addedElements.foundation = true;
    }
    if (statusData.tiling === true) {
      addedElements.tiling = true;
    }
    if (statusData.cladding === true) {
      addedElements.cladding = true;
    }
    if (statusData.blindArea === true) {
      addedElements.blindArea = true;
    }
    if (statusData.stands === true) {
      addedElements.stands = true;
    }
    if (statusData.flowerbeds === true) {
      addedElements.flowerbeds = true;
    }
    if (statusData.gravestones === true) {
      addedElements.gravestones = true;
    }
    if (statusData.steles === true) {
      addedElements.steles = true;
    }
    if (statusData.fence_corner === true) {
      addedElements.fence_corner = true;
    }
    if (statusData.fence_perimeter === true) {
      addedElements.fence_perimeter = true;
    }
    if (statusData.fence_decor === true) {
      addedElements.fence_decor = true;
    }
    
    debugLog(`📊 Оновлений addedElements: ${JSON.stringify(addedElements)}`, 'info');
  } else {
    debugLog(` Дані статусу не отримані`, 'error');
  }
  
  // Оновлюємо таблицю
  updateSummaryTable();
  debugLog(` Специфікація оновлена`, 'success');
}

// Функції для створення відмостки

// Функції для роботи з одиницями вимірювання
function changeUnit(newUnit) {
  debugLog(` Зміна одиниці вимірювання: ${currentUnit} -> ${newUnit}`, 'info');
  
  if (currentUnit === newUnit) {
    debugLog(`ℹ️ Одиниця вже встановлена: ${newUnit}`, 'info');
    return;
  }
  
  // Зберігаємо старі значення та одиницю
  const oldValues = getAllInputValues();
  const oldUnit = currentUnit;
  
  // Оновлюємо поточну одиницю
  currentUnit = newUnit;
  
  // Конвертуємо всі значення
  convertAllValues(oldValues, oldUnit, newUnit);
  
  // Оновлюємо відображення
  updateUnitLabels();
  updateThicknessButtons();
  updateSeamButtons();
  
  // Відправляємо зміну в Ruby
  if (window.sketchup && window.sketchup.change_unit) {
    window.sketchup.change_unit(newUnit);
  }
  
  debugLog(` Одиниця вимірювання змінена на: ${newUnit}`, 'success');
}

// Оновлення лейблів одиниць вимірювання
function updateUnitLabels() {
  const unitSuffix = currentUnit === 'mm' ? 'мм' : 'см';
  
  // Лейбли фундаменту
  updateLabelText('foundation-depth-label', `Довжина (${unitSuffix})`);
  updateLabelText('foundation-width-label', `Ширина (${unitSuffix})`);
  updateLabelText('foundation-height-label', `Висота (${unitSuffix})`);
  
  // Лейбли відмостки
  updateLabelText('blind-area-thickness-label', `Товщина (${unitSuffix})`);
  updateLabelText('blind-area-uniform-width-label', `Ширина (${unitSuffix})`);
  updateLabelText('blind-area-north-label', `Північна сторона (${unitSuffix})`);
  updateLabelText('blind-area-south-label', `Південна сторона (${unitSuffix})`);
  updateLabelText('blind-area-east-label', `Східна сторона (${unitSuffix})`);
  updateLabelText('blind-area-west-label', `Західна сторона (${unitSuffix})`);
  
  // Лейбли плитки
  updateLabelText('tile-border-width-label', `Ширина рамки (${unitSuffix})`);
  updateLabelText('tile-overhang-label', `Виступ (${unitSuffix})`);
  updateLabelText('modular-thickness-label', `Товщина (${unitSuffix})`);
  updateLabelText('modular-overhang-label', `Виступ (${unitSuffix})`);
  
  // Лейбли облицювання
  updateLabelText('cladding-thickness-label', `Товщина (${unitSuffix})`);
  
  // Лейбли підставки
  updateLabelText('stands-depth-label', `Довжина (${unitSuffix})`);
  updateLabelText('stands-width-label', `Ширина (${unitSuffix})`);
  updateLabelText('stands-height-label', `Висота (${unitSuffix})`);
  updateLabelText('gaps-depth-label', `Довжина проміжки (${unitSuffix})`);
  updateLabelText('gaps-width-label', `Ширина проміжки (${unitSuffix})`);
  updateLabelText('gaps-height-label', `Висота проміжки (${unitSuffix})`);
  
  // Лейбли стели
  updateLabelText('stele-distance-label', `Відстань між стелами (${unitSuffix})`);
  updateLabelText('stele-width-label', `Ширина стели (${unitSuffix})`);
  updateLabelText('stele-height-label', `Висота стели (${unitSuffix})`);
  updateLabelText('stele-depth-label', `Глибина стели (${unitSuffix})`);
  updateLabelText('central-detail-width-label', `Ширина (${unitSuffix})`);
  updateLabelText('central-detail-depth-label', `Товщина (${unitSuffix})`);
  updateLabelText('central-detail-height-label', `Висота (${unitSuffix})`);
  
  // Лейбли огорожі
  updateLabelText('fence-corner-post-height-label', `Висота стовпа (${unitSuffix})`);
  updateLabelText('fence-corner-post-size-label', `Розмір стовпа (${unitSuffix})`);
  updateLabelText('fence-corner-side-height-label', `Висота панелі (${unitSuffix})`);
  updateLabelText('fence-corner-side-length-label', `Довжина панелі (${unitSuffix})`);
  updateLabelText('fence-corner-side-thickness-label', `Товщина панелі (${unitSuffix})`);
  updateLabelText('fence-perimeter-post-height-label', `Висота стовпа (${unitSuffix})`);
  updateLabelText('fence-perimeter-post-size-label', `Розмір стовпа (${unitSuffix})`);
  
  debugLog(`Лейбли одиниць оновлено на: ${unitSuffix}`, 'info');
}

// Допоміжна функція для оновлення тексту лейбла
function updateLabelText(labelId, newText) {
  const label = document.getElementById(labelId);
  if (label) {
    label.textContent = newText;
  }
}

// ============================================================================
// 🔧 УТИЛІТИ
// ============================================================================
// Допоміжні функції для роботи з даними та одиницями вимірювання

// --- ЗБІР ДАНИХ ---
// Функції для збору значень з UI

/**
 * Збирає всі значення з UI елементів у структурованому вигляді
 * @returns {Object} Об'єкт з усіма значеннями з форми, згрупованими за категоріями
 * @example
 * const values = getAllInputValues();
 * console.log(values.foundation.depth); // Значення глибини фундаменту
 * console.log(values.tiles.thickness); // Вибрана товщина плитки
 */
function getAllInputValues() {
  return {
    foundation: {
      depth: document.getElementById('foundation-depth').value,
      width: document.getElementById('foundation-width').value,
      height: document.getElementById('foundation-height').value
    },
    blindArea: {
      thickness: document.getElementById('blind-area-thickness').value,
      uniformWidth: document.getElementById('blind-area-uniform-width').value,
      north: document.getElementById('blind-area-north').value,
      south: document.getElementById('blind-area-south').value,
      east: document.getElementById('blind-area-east').value,
      west: document.getElementById('blind-area-west').value
    },
    tiles: {
      thickness: getSelectedThickness(),
      borderWidth: document.getElementById('tile-border-width').value,
      overhang: document.getElementById('tile-overhang').value,
      modularThickness: document.getElementById('modular-thickness').value,
      modularSeam: getSelectedSeam(),
      modularOverhang: document.getElementById('modular-overhang').value
    },
    cladding: {
      thickness: document.getElementById('cladding-thickness').value
    },
    stands: {
      height: document.getElementById('stands-height').value,
      width: document.getElementById('stands-width').value,
      depth: document.getElementById('stands-depth').value
    },
    gaps: {
      height: document.getElementById('gaps-height').value,
      width: document.getElementById('gaps-width').value,
      depth: document.getElementById('gaps-depth').value
    },
    steleDistance: document.getElementById('stele-distance').value,
    centralDetail: {
      width: document.getElementById('central-detail-width').value,
      depth: document.getElementById('central-detail-depth').value,
      height: document.getElementById('central-detail-height').value
    },
    steleScaling: {
      width: document.getElementById('stele-width') ? document.getElementById('stele-width').value : null,
      height: document.getElementById('stele-height') ? document.getElementById('stele-height').value : null,
      depth: document.getElementById('stele-depth') ? document.getElementById('stele-depth').value : null
    },
    fenceCorner: {
      postHeight: document.getElementById('fence-corner-post-height').value,
      postSize: document.getElementById('fence-corner-post-size').value,
      sideHeight: document.getElementById('fence-corner-side-height').value,
      sideLength: document.getElementById('fence-corner-side-length').value,
      sideThickness: document.getElementById('fence-corner-side-thickness').value,
      decorativeSize: 100 // Фіксоване значення
    },
    fencePerimeter: {
      postHeight: document.getElementById('fence-perimeter-post-height').value,
      postSize: document.getElementById('fence-perimeter-post-size').value,
      northCount: document.getElementById('fence-perimeter-north-count').value,
      southCount: document.getElementById('fence-perimeter-south-count').value,
      eastWestCount: document.getElementById('fence-perimeter-east-west-count').value,
      decorativeHeight: 100, // Фіксоване значення
      decorativeThickness: 100 // Фіксоване значення
    }
  };
}

// --- КОНВЕРТАЦІЯ ОДИНИЦЬ ---
// Функції для конвертації між мм/см

/**
 * Конвертує всі значення з однієї одиниці вимірювання в іншу
 * @param {Object} oldValues - Об'єкт зі старими значеннями (результат getAllInputValues())
 * @param {string} oldUnit - Стара одиниця вимірювання ('mm' або 'cm')
 * @param {string} newUnit - Нова одиниця вимірювання ('mm' або 'cm')
 * @example
 * const values = getAllInputValues();
 * convertAllValues(values, 'mm', 'cm'); // Конвертує всі значення з мм в см
 */
function convertAllValues(oldValues, oldUnit, newUnit) {
  // Конвертуємо значення фундаменту
  if (oldValues.foundation) {
    document.getElementById('foundation-depth').value = convertValue(oldValues.foundation.depth, oldUnit, newUnit);
    document.getElementById('foundation-width').value = convertValue(oldValues.foundation.width, oldUnit, newUnit);
    document.getElementById('foundation-height').value = convertValue(oldValues.foundation.height, oldUnit, newUnit);
  }
  
  // Конвертуємо значення відмостки
  if (oldValues.blindArea) {
    document.getElementById('blind-area-thickness').value = convertValue(oldValues.blindArea.thickness, oldUnit, newUnit);
    document.getElementById('blind-area-uniform-width').value = convertValue(oldValues.blindArea.uniformWidth, oldUnit, newUnit);
    document.getElementById('blind-area-north').value = convertValue(oldValues.blindArea.north, oldUnit, newUnit);
    document.getElementById('blind-area-south').value = convertValue(oldValues.blindArea.south, oldUnit, newUnit);
    document.getElementById('blind-area-east').value = convertValue(oldValues.blindArea.east, oldUnit, newUnit);
    document.getElementById('blind-area-west').value = convertValue(oldValues.blindArea.west, oldUnit, newUnit);
  }
  
  // Конвертуємо значення плитки
  if (oldValues.tiles) {
    // Оновлюємо кнопки товщини
    updateThicknessButtons();
    // Оновлюємо кнопки шву (шви завжди в мм)
    updateSeamButtons();
    document.getElementById('tile-border-width').value = convertValue(oldValues.tiles.borderWidth, oldUnit, newUnit);
    document.getElementById('tile-overhang').value = convertValue(oldValues.tiles.overhang, oldUnit, newUnit);
    document.getElementById('modular-thickness').value = convertValue(oldValues.tiles.modularThickness, oldUnit, newUnit);
    document.getElementById('modular-overhang').value = convertValue(oldValues.tiles.modularOverhang, oldUnit, newUnit);
    // Шви не конвертуються - залишаються в мм
  }
  
  // Конвертуємо значення облицювання
  if (oldValues.cladding) {
    document.getElementById('cladding-thickness').value = convertValue(oldValues.cladding.thickness, oldUnit, newUnit);
  }
  
  // Конвертуємо значення підставок
  if (oldValues.stands) {
    document.getElementById('stands-height').value = convertValue(oldValues.stands.height, oldUnit, newUnit);
    document.getElementById('stands-width').value = convertValue(oldValues.stands.width, oldUnit, newUnit);
    document.getElementById('stands-depth').value = convertValue(oldValues.stands.depth, oldUnit, newUnit);
  }
  
  // Конвертуємо значення зазорів
  if (oldValues.gaps) {
    document.getElementById('gaps-height').value = convertValue(oldValues.gaps.height, oldUnit, newUnit);
    document.getElementById('gaps-width').value = convertValue(oldValues.gaps.width, oldUnit, newUnit);
    document.getElementById('gaps-depth').value = convertValue(oldValues.gaps.depth, oldUnit, newUnit);
  }
  
  // Конвертуємо відстань між стелами
  if (oldValues.steleDistance) {
    document.getElementById('stele-distance').value = convertValue(oldValues.steleDistance, oldUnit, newUnit);
  }
  
  // Конвертуємо центральну деталь
  if (oldValues.centralDetail) {
    document.getElementById('central-detail-width').value = convertValue(oldValues.centralDetail.width, oldUnit, newUnit);
    document.getElementById('central-detail-depth').value = convertValue(oldValues.centralDetail.depth, oldUnit, newUnit);
    document.getElementById('central-detail-height').value = convertValue(oldValues.centralDetail.height, oldUnit, newUnit);
  }
  
  // Конвертуємо масштабування стел
  if (oldValues.steleScaling) {
    if (oldValues.steleScaling.width && document.getElementById('stele-width')) {
    document.getElementById('stele-width').value = convertValue(oldValues.steleScaling.width, oldUnit, newUnit);
    }
    if (oldValues.steleScaling.height && document.getElementById('stele-height')) {
    document.getElementById('stele-height').value = convertValue(oldValues.steleScaling.height, oldUnit, newUnit);
    }
    if (oldValues.steleScaling.depth && document.getElementById('stele-depth')) {
    document.getElementById('stele-depth').value = convertValue(oldValues.steleScaling.depth, oldUnit, newUnit);
    }
  }
  
  // Конвертуємо огорожі
  if (oldValues.fenceCorner) {
    document.getElementById('fence-corner-post-height').value = convertValue(oldValues.fenceCorner.postHeight, oldUnit, newUnit);
    document.getElementById('fence-corner-post-size').value = convertValue(oldValues.fenceCorner.postSize, oldUnit, newUnit);
    document.getElementById('fence-corner-side-height').value = convertValue(oldValues.fenceCorner.sideHeight, oldUnit, newUnit);
    document.getElementById('fence-corner-side-length').value = convertValue(oldValues.fenceCorner.sideLength, oldUnit, newUnit);
    document.getElementById('fence-corner-side-thickness').value = convertValue(oldValues.fenceCorner.sideThickness, oldUnit, newUnit);
  }
  
  if (oldValues.fencePerimeter) {
    document.getElementById('fence-perimeter-post-height').value = convertValue(oldValues.fencePerimeter.postHeight, oldUnit, newUnit);
    document.getElementById('fence-perimeter-post-size').value = convertValue(oldValues.fencePerimeter.postSize, oldUnit, newUnit);
  }
}

// Конвертація одного значення
function convertValue(value, oldUnit, newUnit, isSeam = false) {
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return value;
  
  // Шви завжди в мм, не конвертуються
  if (isSeam) return numValue;
  
  if (oldUnit === newUnit) return numValue;
  
  if (oldUnit === 'mm' && newUnit === 'cm') {
    return Math.round(numValue / 10 * 100) / 100; // Округлюємо до 2 знаків після коми
  } else if (oldUnit === 'cm' && newUnit === 'mm') {
    return Math.round(numValue * 10);
  }
  
  return numValue;
}

// Отримання поточної одиниці вимірювання
function getCurrentUnit() {
  return currentUnit || 'mm';
}

// Конвертація значення в мм для відправки в Ruby
function convertToMm(value, isSeam = false) {
  const numValue = parseFloat(value);
  if (isNaN(numValue)) {
    debugLog(`convertToMm: невалідне значення "${value}"`, 'warn');
    return value;
  }
  
  // Шви завжди вже в мм, не потребують конвертації
  if (isSeam) {
    debugLog(`convertToMm: шов "${value}" → ${numValue} мм (без конвертації)`, 'info');
    return numValue;
  }
  
  if (currentUnit === 'mm') {
    debugLog(`convertToMm: "${value}" мм → ${numValue} мм (без конвертації)`, 'info');
    return numValue;
  } else if (currentUnit === 'cm') {
    const result = Math.round(numValue * 10);
    debugLog(`convertToMm: "${value}" см → ${numValue} × 10 = ${result} мм`, 'info');
    return result;
  }
  
  debugLog(`convertToMm: невідома одиниця "${currentUnit}", повертаємо ${numValue}`, 'warn');
  return numValue;
}

// --- ФОРМАТУВАННЯ ---
// Функції для форматування значень

// Форматування значення для відображення
// Валідація числових значень
function validateNumericInput(value, min = 0, max = 10000, allowDecimals = true) {
  if (value === null || value === undefined || value === '') {
    return { valid: false, error: 'Значення не може бути порожнім' };
  }
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) {
    return { valid: false, error: 'Введіть коректне число' };
  }
  
  if (numValue < min) {
    return { valid: false, error: `Значення не може бути менше ${min}` };
  }
  
  if (numValue > max) {
    return { valid: false, error: `Значення не може бути більше ${max}` };
  }
  
  if (!allowDecimals && numValue % 1 !== 0) {
    return { valid: false, error: 'Введіть ціле число' };
  }
  
  return { valid: true, value: numValue };
}

function formatValue(value, unit = null) {
  try {
    const u = unit || currentUnit;
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return value;
    
    if (u === 'mm') {
      return `${Math.round(numValue)}мм`;
    } else if (u === 'cm') {
      return `${numValue.toFixed(0)}см`; // Прибираємо десяткові знаки для см
    }
  } catch (error) {
    debugLog(`Помилка форматування значення: ${error.message}`, 'error');
    return value;
  }
  
  return value;
}

// Конвертація значення в мм для відправки в Ruby
function convertToMm(value, isSeam = false) {
  const numValue = parseFloat(value);
  if (isNaN(numValue)) {
    debugLog(`convertToMm: невалідне значення "${value}"`, 'warn');
    return value;
  }
  
  // Шви завжди вже в мм, не потребують конвертації
  if (isSeam) {
    debugLog(`convertToMm: шов "${value}" → ${numValue} мм (без конвертації)`, 'info');
    return numValue;
  }
  
  if (currentUnit === 'mm') {
    debugLog(`convertToMm: "${value}" мм → ${numValue} мм (без конвертації)`, 'info');
    return numValue;
  } else if (currentUnit === 'cm') {
    const result = Math.round(numValue * 10);
    debugLog(`convertToMm: "${value}" см → ${numValue} × 10 = ${result} мм`, 'info');
    return result;
  }
  
  debugLog(`convertToMm: невідома одиниця "${currentUnit}", повертаємо ${numValue}`, 'warn');
  return numValue;
}



// ============================================================================
// 🎛️ UI КОНТРОЛИ
// ============================================================================
// Функції для роботи з UI елементами (кнопки, селектори, тощо)

// --- КОНТРОЛИ ТОВЩИНИ ---
// Функції для вибору та отримання товщини плитки

/**
 * Обробляє вибір товщини плитки користувачем
 * @param {HTMLElement} button - Кнопка, яку натиснув користувач
 * @example
 * selectThickness(document.querySelector('.thickness-btn[data-value="20"]'));
 */
function selectThickness(button) {
  // Видаляємо активний клас з усіх кнопок
  const buttons = document.querySelectorAll('.thickness-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  // Додаємо активний клас до натиснутої кнопки
  button.classList.add('active');
  
  // Оновлюємо відображення
  // updateAllDisplays() видалено - функція не існує
  
  debugLog(` Вибрано товщину плитки: ${button.dataset.value}`, 'success');
}

// Отримання вибраної товщини
function getSelectedThickness() {
  const activeButton = document.querySelector('.thickness-btn.active');
  if (activeButton) {
    return activeButton.dataset.value;
  }
  return '20'; // Значення за замовчуванням
}

// Оновлення кнопок товщини
function updateThicknessButtons() {
  const buttons = document.querySelectorAll('.thickness-btn');
  buttons.forEach(button => {
    const originalValue = button.dataset.originalValue || button.dataset.value;
    
    // Зберігаємо оригінальне значення в мм при першому виклику
    if (!button.dataset.originalValue) {
      button.dataset.originalValue = button.dataset.value;
    }
    
    if (currentUnit === 'mm') {
      button.textContent = `${originalValue} мм`;
      button.dataset.value = originalValue;
    } else {
      const cmValue = (originalValue / 10).toFixed(0); // Прибираємо десяткові знаки для см
      button.textContent = `${cmValue} см`;
      button.dataset.value = cmValue;
    }
  });
}

// --- КОНТРОЛИ ПЛИТКИ ---
// Функції для вибору способу укладання плитки

// Вибір способу укладання плитки
function selectTilingMode(button) {
  // Видаляємо активний клас з усіх кнопок
  const buttons = document.querySelectorAll('.tiling-mode-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  // Додаємо активний клас до натиснутої кнопки
  button.classList.add('active');
  
  // Оновлюємо контроли
  updateTilingControls();
  
  debugLog(` Вибрано спосіб укладання: ${button.dataset.value}`, 'success');
}

// Отримання вибраного способу укладання
function getSelectedTilingMode() {
  const activeButton = document.querySelector('.tiling-mode-btn.active');
  if (activeButton) {
    return activeButton.dataset.value;
  }
  return 'standard'; // Значення за замовчуванням
}

// --- КОНТРОЛИ ШВІВ ---
// Функції для вибору та отримання швів

// Вибір шву
function selectSeam(button) {
  // Видаляємо активний клас з усіх кнопок
  const buttons = document.querySelectorAll('.seam-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  // Додаємо активний клас до натиснутої кнопки
  button.classList.add('active');
  
  // Оновлюємо відображення
  // updateAllDisplays() видалено - функція не існує
  
  debugLog(` Вибрано шов: ${button.dataset.value} мм`, 'success');
}

// Отримання вибраного шву
function getSelectedSeam() {
  const activeButton = document.querySelector('.seam-btn.active');
  if (activeButton) {
    return activeButton.dataset.value;
  }
  return '3'; // Значення за замовчуванням
}

// Оновлення кнопок швів
function updateSeamButtons() {
  const buttons = document.querySelectorAll('.seam-btn');
  buttons.forEach(btn => {
    const value = parseFloat(btn.dataset.value);
    btn.textContent = `${value}мм`; // Шви завжди в мм
  });
}

// --- КОНТРОЛИ СТЕЛ ---
// Функції для вибору типу стел (дублікат видалено)

// --- КОНТРОЛИ ВІДМОСТКИ ---
// Функції для вибору режиму відмостки

// Перемикач режиму відмостки
function toggleBlindAreaCustomMode(checkbox) {
  const customControls = document.getElementById('blind-area-custom-controls');
  const uniformControls = document.getElementById('blind-area-uniform-controls');
  
  if (checkbox.checked) {
    // Вмикаємо режим різної ширини
    customControls.classList.remove('hidden');
    uniformControls.classList.add('hidden');
    debugLog(' Увімкнено режим різної ширини відмостки', 'info');
  } else {
    // Вимікаємо режим різної ширини (однакова ширина)
    customControls.classList.add('hidden');
    uniformControls.classList.remove('hidden');
    debugLog(' Увімкнено режим однакової ширини відмостки', 'info');
  }
  
  // Оновлюємо контроли відмостки
  updateBlindAreaControls();
}

// Отримання вибраного режиму відмостки
function getSelectedBlindAreaMode() {
  const customModeCheckbox = document.getElementById('blind-area-custom-mode');
  if (customModeCheckbox && customModeCheckbox.checked) {
    return 'custom';
  }
  return 'uniform'; // За замовчуванням однакова ширина
}

// Функція для вибору товщини плитки
function selectThickness(button) {
  // Видаляємо активний клас з усіх кнопок
  const buttons = document.querySelectorAll('.thickness-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  // Додаємо активний клас до натиснутої кнопки
  button.classList.add('active');
  
  // Оновлюємо відображення
  // updateAllDisplays() видалено - функція не існує
  
  debugLog(` Вибрано товщину плитки: ${button.dataset.value}`, 'success');
}

// Функція для вибору способу укладання
function selectTilingMode(button) {
  // Видаляємо активний клас з усіх кнопок
  const buttons = document.querySelectorAll('.tiling-mode-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  // Додаємо активний клас до натиснутої кнопки
  button.classList.add('active');
  
  // Оновлюємо контроли
  updateTilingControls();
  
  debugLog(` Вибрано спосіб укладання: ${button.dataset.value}`, 'success');
}

// Функція для вибору шву
function selectSeam(button) {
  // Видаляємо активний клас з усіх кнопок
  const buttons = document.querySelectorAll('.seam-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  // Додаємо активний клас до натиснутої кнопки
  button.classList.add('active');
  
  // Оновлюємо відображення
  // updateAllDisplays() видалено - функція не існує
  
  debugLog(` Вибрано шов: ${button.dataset.value} мм`, 'success');
}

// Функція для отримання вибраної товщини плитки
function getSelectedThickness() {
  const activeButton = document.querySelector('.thickness-btn.active');
  if (!activeButton) return '30';
  
  // Якщо одиниці в см, то data-value містить значення в см
  if (currentUnit === 'cm') {
    return activeButton.dataset.value;
  } else {
    // Якщо одиниці в мм, то data-value містить значення в мм
    return activeButton.dataset.value;
  }
}

// Функція для отримання вибраного способу укладання
function getSelectedTilingMode() {
  const activeButton = document.querySelector('.tiling-mode-btn.active');
  return activeButton ? activeButton.dataset.value : 'modular';
}

// Функція для отримання вибраного шву
function getSelectedSeam() {
  const activeButton = document.querySelector('.seam-btn.active');
  if (!activeButton) return '2';
  
  // Шви завжди повертаються в мм, незалежно від поточних одиниць
  return activeButton.dataset.value;
}

// Функція для оновлення тексту кнопок товщини при зміні одиниць

// Функція для оновлення тексту кнопок шву при зміні одиниць
// Дублікат функції updateSeamButtons видалено

// Функція для скидання опцій товщини плитки до початкових значень (для зворотної сумісності)
function resetTileThicknessOptions() {
  debugLog(` Функція resetTileThicknessOptions застаріла, використовуйте кнопки`, 'warning');
}

// Функція для оновлення значення слайдера



// ========== MISSING FUNCTIONS ==========

// Глобальні змінні для функціональності
// currentTheme та currentAccent перенесено в modules/core/GlobalState.js



// ============================================================================
// 🎨 ТЕМА
// ============================================================================
// Функції для переключення теми та налаштувань інтерфейсу

function toggleTheme() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.classList.toggle('dark', currentTheme === 'dark');
  localStorage.setItem('theme', currentTheme);

  // Update header text to show current theme
  const header = document.querySelector('header h1');
  if (header) {
    header.textContent = 'ProGran';
  }


}


function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  const savedAccent = localStorage.getItem('accent') || 'blue';

  currentTheme = savedTheme;
  currentAccent = savedAccent;

  document.documentElement.classList.toggle('dark', currentTheme === 'dark');
  document.documentElement.setAttribute('data-accent', currentAccent);

  // Set initial header text
  const header = document.querySelector('header h1');
  if (header) {
    header.textContent = 'ProGran';
  }
}







// Ініціалізація теми при завантаженні
// ВИДАЛЕНО - тепер ініціалізація відбувається в index.js

// ========== GRAVESTONES CAROUSEL FUNCTIONS ==========

// Ініціалізація каруселі надгробних плит з превью




// Додавання вибраного декору огорожі до моделі

// --- FENCE ФУНКЦІЇ ---

// Оновлення відображення кутової огорожі
function updateFenceCornerDisplay() {
  const postHeight = document.getElementById('fence-corner-post-height').value;
  const postSize = document.getElementById('fence-corner-post-size').value;
  const sideHeight = document.getElementById('fence-corner-side-height').value;
  const sideLength = document.getElementById('fence-corner-side-length').value;
  const sideThickness = document.getElementById('fence-corner-side-thickness').value;
  const decorativeSize = 100; // Фіксоване значення
  
  const display = document.getElementById('fence-corner-dimensions-display');
  if (display) {
    const unit = getCurrentUnit();
    const unitText = unit === 'cm' ? 'см' : 'мм';
    
    // Конвертуємо значення для відображення
    const postHeightDisplay = unit === 'cm' ? (postHeight / 10).toFixed(0) : postHeight;
    const postSizeDisplay = unit === 'cm' ? (postSize / 10).toFixed(0) : postSize;
    const sideHeightDisplay = unit === 'cm' ? (sideHeight / 10).toFixed(0) : sideHeight;
    const sideLengthDisplay = unit === 'cm' ? (sideLength / 10).toFixed(0) : sideLength;
    const sideThicknessDisplay = unit === 'cm' ? (sideThickness / 10).toFixed(0) : sideThickness;
    const decorativeSizeDisplay = unit === 'cm' ? (decorativeSize / 10).toFixed(0) : decorativeSize;
    
    const dimensions = [
      `Стовп: ${postHeightDisplay}×${postSizeDisplay}×${postSizeDisplay}${unitText}`,
      `Панель: ${sideLengthDisplay}×${sideHeightDisplay}×${sideThicknessDisplay}${unitText}`,
      `Декор: ${decorativeSizeDisplay}${unitText}`
    ];
    
    display.textContent = dimensions.join(' | ');
  }
}

// Оновлення відображення розмірів підставки
// toggleDebugLog винесено в modules/core/DebugManager.js


function updateStandsDisplay() {
  const height = document.getElementById('stands-height').value;
  const width = document.getElementById('stands-width').value;
  const depth = document.getElementById('stands-depth').value;
  
  debugLog(` updateStandsDisplay: отримано значення`, 'info');
  debugLog(`   - Висота: ${height}`, 'info');
  debugLog(`   - Ширина: ${width}`, 'info');
  debugLog(`   - Довжина: ${depth}`, 'info');
  
  const display = document.getElementById('stands-dimensions-display');
  if (display) {
    const unit = getCurrentUnit();
    const unitText = unit === 'cm' ? 'см' : 'мм';
    
    // Конвертуємо значення для відображення
    const heightDisplay = unit === 'cm' ? (height / 10).toFixed(0) : height;
    const widthDisplay = unit === 'cm' ? (width / 10).toFixed(0) : width;
    const depthDisplay = unit === 'cm' ? (depth / 10).toFixed(0) : depth;
    
    const displayText = `${heightDisplay}×${widthDisplay}×${depthDisplay} ${unitText}`;
    display.textContent = displayText;
    
    debugLog(` Відображення оновлено: ${displayText}`, 'info');
  } else {
    debugLog(` Не знайдено елемент stands-dimensions-display`, 'warning');
  }
  
  // Якщо проміжна увімкнена, оновлюємо її розміри
  const gapsCheckbox = document.getElementById('stands-gaps');
  if (gapsCheckbox && gapsCheckbox.checked) {
    updateGapsFromStandDimensions();
  }
}

// Оновлення відображення периметральної огорожі
function updateFencePerimeterDisplay() {
  const postHeight = document.getElementById('fence-perimeter-post-height').value;
  const postSize = document.getElementById('fence-perimeter-post-size').value;
  const northCount = document.getElementById('fence-perimeter-north-count').value;
  const southCount = document.getElementById('fence-perimeter-south-count').value;
  const eastWestCount = document.getElementById('fence-perimeter-east-west-count').value;
  const decorativeHeight = 100; // Фіксоване значення
  const decorativeThickness = 100; // Фіксоване значення
  
  const display = document.getElementById('fence-perimeter-dimensions-display');
  if (display) {
    const unit = getCurrentUnit();
    const unitText = unit === 'cm' ? 'см' : 'мм';
    
    // Конвертуємо значення для відображення
    const postHeightDisplay = unit === 'cm' ? (postHeight / 10).toFixed(0) : postHeight;
    const postSizeDisplay = unit === 'cm' ? (postSize / 10).toFixed(0) : postSize;
    const decorativeHeightDisplay = unit === 'cm' ? (decorativeHeight / 10).toFixed(0) : decorativeHeight;
    const decorativeThicknessDisplay = unit === 'cm' ? (decorativeThickness / 10).toFixed(0) : decorativeThickness;
    
    const dimensions = [
      `Стовпи: ${postHeightDisplay}×${postSizeDisplay}×${postSizeDisplay}${unitText}`,
      `Сторони: З${northCount} В${southCount} Б${eastWestCount}`,
      `Декор: ${decorativeHeightDisplay}×${decorativeThicknessDisplay}${unitText}`
    ];
    
    display.textContent = dimensions.join(' | ');
  }
}

// Додавання кутової огорожі
function addFenceCorner() {
  try {
    const postHeight = parseInt(document.getElementById('fence-corner-post-height').value);
    const postSize = parseInt(document.getElementById('fence-corner-post-size').value);
    const sideHeight = parseInt(document.getElementById('fence-corner-side-height').value);
    const sideLength = parseInt(document.getElementById('fence-corner-side-length').value);
    const sideThickness = parseInt(document.getElementById('fence-corner-side-thickness').value);
    const decorativeSize = 100; // Фіксоване значення
    
    // Декор тепер додається окремо через блок "Декор огорожі"
    
    debugLog(`🏗️ Створення кутової огорожі: ${postHeight}×${postSize}×${postSize}см`, 'info');
    debugLog(` Перевірка доступності функцій:`, 'info');
    debugLog(`   - window.sketchup: ${typeof window.sketchup}`, 'info');
    debugLog(`   - window.sketchup?.add_fence_corner: ${typeof window.sketchup?.add_fence_corner}`, 'info');
    
    if (window.sketchup && window.sketchup.add_fence_corner) {
      try {
        debugLog(`📞 Виклик window.sketchup.add_fence_corner з параметрами:`, 'info');
        debugLog(`   - postHeight: ${postHeight}`, 'info');
        debugLog(`   - postSize: ${postSize}`, 'info');
        debugLog(`   - sideHeight: ${sideHeight}`, 'info');
        debugLog(`   - sideLength: ${sideLength}`, 'info');
        debugLog(`   - sideThickness: ${sideThickness}`, 'info');
        debugLog(`   - decorativeSize: ${decorativeSize} (фіксоване)`, 'info');
        
        // Конвертуємо в мм перед відправкою в Ruby
        const postHeightMm = convertToMm(postHeight);
        const postSizeMm = convertToMm(postSize);
        const sideHeightMm = convertToMm(sideHeight);
        const sideLengthMm = convertToMm(sideLength);
        const sideThicknessMm = convertToMm(sideThickness);
        const decorativeSizeMm = convertToMm(decorativeSize);
        
        const result = window.sketchup.add_fence_corner(postHeightMm, postSizeMm, postSizeMm, sideHeightMm, sideLengthMm, sideThicknessMm, decorativeSizeMm);
        debugLog(`📤 Результат виклику: ${result}`, 'info');
        
        // Декор тепер додається окремо через блок "Декор огорожі"
        
        addedElements['fence_corner'] = true;
        updateSummaryTable();
        debugLog(` Кутова огорожа створена успішно`, 'success');
      } catch (error) {
        debugLog(` Помилка створення кутової огорожі: ${error.message}`, 'error');
        debugLog(` Stack trace: ${error.stack}`, 'error');
      }
    } else {
      debugLog(` window.sketchup.add_fence_corner не доступний`, 'error');
      debugLog(` Доступні функції в window.sketchup:`, 'info');
      if (window.sketchup) {
        Object.keys(window.sketchup).forEach(key => {
          if (key.includes('fence') || key.includes('Fence')) {
            debugLog(`   - ${key}: ${typeof window.sketchup[key]}`, 'info');
          }
        });
      }
    }
  } catch (error) {
    debugLog(` Критична помилка в addFenceCorner: ${error.message}`, 'error');
    debugLog(` Stack trace: ${error.stack}`, 'error');
  }
}

// Додавання периметральної огорожі
function addFencePerimeter() {
  console.log(' addFencePerimeter() викликано!');
  debugLog(' addFencePerimeter() викликано!', 'info');
  
  try {
    const postHeight = parseInt(document.getElementById('fence-perimeter-post-height').value);
    const postSize = parseInt(document.getElementById('fence-perimeter-post-size').value);
    const northCount = parseInt(document.getElementById('fence-perimeter-north-count').value);
    const southCount = parseInt(document.getElementById('fence-perimeter-south-count').value);
    const eastWestCount = parseInt(document.getElementById('fence-perimeter-east-west-count').value);
    const decorativeHeight = 100; // Фіксоване значення
    const decorativeThickness = 100; // Фіксоване значення
    
    // Декор тепер додається окремо через блок "Декор огорожі"
    
    debugLog(`🏗️ Створення периметральної огорожі: ${postHeight}×${postSize}×${postSize}см`, 'info');
    debugLog(` Детальна діагностика параметрів:`, 'info');
    debugLog(`   - postHeight: ${postHeight} (тип: ${typeof postHeight})`, 'info');
    debugLog(`   - postSize: ${postSize} (тип: ${typeof postSize})`, 'info');
    debugLog(`   - northCount: ${northCount} (тип: ${typeof northCount})`, 'info');
    debugLog(`   - southCount: ${southCount} (тип: ${typeof southCount})`, 'info');
    debugLog(`   - eastWestCount: ${eastWestCount} (тип: ${typeof eastWestCount})`, 'info');
    debugLog(`   - decorativeHeight: ${decorativeHeight} (тип: ${typeof decorativeHeight})`, 'info');
    debugLog(`   - decorativeThickness: ${decorativeThickness} (тип: ${typeof decorativeThickness})`, 'info');
    debugLog(` Перевірка доступності функцій:`, 'info');
    debugLog(`   - window.sketchup: ${typeof window.sketchup}`, 'info');
    debugLog(`   - window.sketchup?.add_fence_perimeter: ${typeof window.sketchup?.add_fence_perimeter}`, 'info');
    debugLog(` Поточний стан addedElements:`, 'info');
    debugLog(`   - addedElements.fence_perimeter: ${addedElements.fence_perimeter}`, 'info');
    debugLog(`   - addedElements.fence_corner: ${addedElements.fence_corner}`, 'info');
    
    if (window.sketchup && window.sketchup.add_fence_perimeter) {
      try {
        debugLog(`📞 Виклик window.sketchup.add_fence_perimeter з параметрами:`, 'info');
        debugLog(`   - postHeight: ${postHeight}`, 'info');
        debugLog(`   - postSize: ${postSize}`, 'info');
        debugLog(`   - northCount: ${northCount}`, 'info');
        debugLog(`   - southCount: ${southCount}`, 'info');
        debugLog(`   - eastWestCount: ${eastWestCount}`, 'info');
        debugLog(`   - decorativeHeight: ${decorativeHeight} (фіксоване)`, 'info');
        debugLog(`   - decorativeThickness: ${decorativeThickness} (фіксоване)`, 'info');
        
        // Конвертуємо в мм перед відправкою в Ruby
        const postHeightMm = convertToMm(postHeight);
        const postSizeMm = convertToMm(postSize);
        const decorativeHeightMm = convertToMm(decorativeHeight);
        const decorativeThicknessMm = convertToMm(decorativeThickness);
        
        const result = window.sketchup.add_fence_perimeter(postHeightMm, postSizeMm, postSizeMm, northCount, southCount, eastWestCount, decorativeHeightMm, decorativeThicknessMm);
        debugLog(`📤 Результат виклику: ${result}`, 'info');
        
        // Декор тепер додається окремо через блок "Декор огорожі"
        
        addedElements['fence_perimeter'] = true;
        updateSummaryTable();
        debugLog(` Периметральна огорожа створена успішно`, 'success');
        debugLog(` Стан після створення:`, 'info');
        debugLog(`   - addedElements.fence_perimeter: ${addedElements.fence_perimeter}`, 'info');
        debugLog(`   - addedElements.fence_corner: ${addedElements.fence_corner}`, 'info');
      } catch (error) {
        debugLog(` Помилка створення периметральної огорожі: ${error.message}`, 'error');
        debugLog(` Stack trace: ${error.stack}`, 'error');
      }
    } else {
      debugLog(` window.sketchup.add_fence_perimeter не доступний`, 'error');
      debugLog(` Доступні функції в window.sketchup:`, 'info');
      if (window.sketchup) {
        Object.keys(window.sketchup).forEach(key => {
          if (key.includes('fence') || key.includes('Fence')) {
            debugLog(`   - ${key}: ${typeof window.sketchup[key]}`, 'info');
          }
        });
      }
    }
  } catch (error) {
    debugLog(` Критична помилка в addFencePerimeter: ${error.message}`, 'error');
    debugLog(` Stack trace: ${error.stack}`, 'error');
  }
  
  console.log('🏁 addFencePerimeter() завершено!');
  debugLog('🏁 addFencePerimeter() завершено!', 'info');
}

// Додавання декору огорожі
function addFenceDecor() {
  console.log(' addFenceDecor() викликано!');
  debugLog(' addFenceDecor() викликано!', 'info');
  
  try {
    debugLog(` Крок 1: Перевірка каруселі декору`, 'info');
    
    // Отримуємо вибраний декор з каруселі
    let selectedDecor = null;
    debugLog(` Діагностика каруселі декору:`, 'info');
    debugLog(`   - carouselState.fence_decor: ${JSON.stringify(carouselState.fence_decor)}`, 'info');
    debugLog(`   - modelLists.fence_decor: ${JSON.stringify(modelLists.fence_decor)}`, 'info');
    
    if (carouselState.fence_decor && modelLists.fence_decor && modelLists.fence_decor[carouselState.fence_decor.index]) {
      selectedDecor = modelLists.fence_decor[carouselState.fence_decor.index];
      debugLog(` Вибраний декор для огорожі: ${selectedDecor}`, 'info');
    } else {
      debugLog(` Декор не вибрано`, 'warning');
      alert('Будь ласка, виберіть декор з каруселі');
      return;
    }
    
    debugLog(` Крок 2: Перевірка наявності огорожі`, 'info');
    
    // Перевіряємо, чи є огорожа в моделі
    if (!addedElements['fence_corner'] && !addedElements['fence_perimeter']) {
      debugLog(` Немає огорожі в моделі`, 'warning');
      alert('Спочатку створіть огорожу (кутову або периметральну)');
      return;
    }
    
    debugLog(` Крок 3: Додавання декору через SketchUp API`, 'info');
    
    // Додаємо декор
    if (window.sketchup.add_model) {
      debugLog(` Додаємо декор на всі стовпчики огорожі: ${selectedDecor}`, 'info');
      debugLog(` Викликаємо window.sketchup.add_model('fence_decor', '${selectedDecor}')`, 'info');
      const decorResult = window.sketchup.add_model('fence_decor', selectedDecor);
      debugLog(`📤 Результат додавання декору: ${decorResult}`, 'info');
      
      debugLog(` Крок 4: Оновлення стану`, 'info');
      addedElements['fence_decor'] = true;
      
      debugLog(` Крок 5: Оновлення таблиці специфікації`, 'info');
      updateSummaryTable();
      
      debugLog(` Декор успішно додано на огорожу`, 'success');
    } else {
      debugLog(` window.sketchup.add_model не доступний`, 'warning');
      alert('Помилка: не вдалося додати декор');
    }
    
  } catch (error) {
    debugLog(` Помилка в addFenceDecor(): ${error.message}`, 'error');
    debugLog(` Stack trace: ${error.stack}`, 'error');
    debugLog(` Помилка на рядку: ${error.lineNumber}`, 'error');
    alert(`Помилка при додаванні декору: ${error.message}`);
  }
  
  console.log('🏁 addFenceDecor() завершено!');
  debugLog('🏁 addFenceDecor() завершено!', 'info');
}

// Додавання підставки з кастомними розмірами
function addStandWithCustomSize() {
  console.log('🏗️ addStandWithCustomSize() викликано!');
  debugLog('🏗️ addStandWithCustomSize() викликано!', 'info');
  
  try {
    // Отримуємо розміри з полів вводу (порядок: довжина, ширина, висота)
    const depthRaw = parseInt(document.getElementById('stands-depth').value);  // Довжина (перше поле)
    const widthRaw = parseInt(document.getElementById('stands-width').value);  // Ширина (друге поле)
    const heightRaw = parseInt(document.getElementById('stands-height').value); // Висота (третє поле)
    
    debugLog(` Отримано розміри з полів:`, 'info');
    debugLog(`   - Висота (stands-height): ${heightRaw}`, 'info');
    debugLog(`   - Ширина (stands-width): ${widthRaw}`, 'info');
    debugLog(`   - Довжина (stands-depth): ${depthRaw}`, 'info');
    
    // Конвертуємо в міліметри для передачі до Ruby
    const height = convertToMm(heightRaw);
    const width = convertToMm(widthRaw);
    const depth = convertToMm(depthRaw);
    
    const currentUnit = getCurrentUnit();
    debugLog(` Конвертовано в міліметри (${currentUnit} → мм):`, 'info');
    debugLog(`   - Висота: ${heightRaw} ${currentUnit} → ${height} мм`, 'info');
    debugLog(`   - Ширина: ${widthRaw} ${currentUnit} → ${width} мм`, 'info');
    debugLog(`   - Довжина: ${depthRaw} ${currentUnit} → ${depth} мм`, 'info');
    debugLog(` Розміри підставки: ${height}×${width}×${depth} мм (В×Ш×Д)`, 'info');
    
    // Перевіряємо валідність розмірів
    if (isNaN(height) || isNaN(width) || isNaN(depth) || height <= 0 || width <= 0 || depth <= 0) {
      debugLog(` Невалідні розміри підставки`, 'error');
      alert('Будь ласка, введіть коректні розміри підставки');
      return;
    }
    
    // Отримуємо стан вмикача проміжної
    const gapsEnabled = carouselState.stands.gaps || false;
    debugLog(` Проміжна підставки: ${gapsEnabled ? 'увімкнено' : 'вимкнено'}`, 'info');
    
    // Отримуємо розміри проміжної якщо увімкнено
    let gapsHeight = 0, gapsWidth = 0, gapsDepth = 0;
    if (gapsEnabled) {
      const gapsDepthRaw = parseInt(document.getElementById('gaps-depth').value);
      const gapsWidthRaw = parseInt(document.getElementById('gaps-width').value);
      const gapsHeightRaw = parseInt(document.getElementById('gaps-height').value);
      
      gapsHeight = convertToMm(gapsHeightRaw);
      gapsWidth = convertToMm(gapsWidthRaw);
      gapsDepth = convertToMm(gapsDepthRaw);
      
      debugLog(` Розміри проміжної: ${gapsHeight}×${gapsWidth}×${gapsDepth} мм (В×Ш×Д)`, 'info');
    }
    
    // Додаємо підставку через SketchUp API
    if (window.sketchup.add_stand) {
      debugLog(`🏗️ Додаємо підставку з розмірами: ${height}×${width}×${depth}`, 'info');
      // Передаємо параметри в порядку: height, width, depth, gaps, gapsHeight, gapsWidth, gapsDepth
      const result = window.sketchup.add_stand(height, width, depth, gapsEnabled, gapsHeight, gapsWidth, gapsDepth);
      debugLog(`📤 Результат додавання підставки: ${result}`, 'info');
      
      // Зберігаємо інформацію про розміри
      if (!window.standCustomSizes) {
        window.standCustomSizes = {};
      }
      window.standCustomSizes['stand_custom'] = { height, width, depth };
      
      addedElements['stands'] = {
        filename: 'stand_custom',
        height: height,
        width: width,
        depth: depth,
        gaps: gapsEnabled,
        gapsHeight: gapsHeight,
        gapsWidth: gapsWidth,
        gapsDepth: gapsDepth
      };
      updateSummaryTable();
      debugLog(` Підставка успішно додана`, 'success');
    } else {
      debugLog(` window.sketchup.add_stand не доступний`, 'warning');
      alert('Помилка: не вдалося додати підставку');
    }
    
  } catch (error) {
    debugLog(` Помилка в addStandWithCustomSize(): ${error.message}`, 'error');
    debugLog(` Stack trace: ${error.stack}`, 'error');
    alert(`Помилка при додаванні підставки: ${error.message}`);
  }
  
  console.log('🏁 addStandWithCustomSize() завершено!');
  debugLog('🏁 addStandWithCustomSize() завершено!', 'info');
}



// Спеціальна ініціалізація каруселі підставок

// --- ФУНКЦІЇ ДЛЯ ПРЕВЬЮ МОДЕЛІ ---

// Глобальні змінні для превью
// currentPreviewData та previewSettings перенесено в modules/core/GlobalState.js

// Оновлення налаштувань превью
function updatePreviewSettings() {
  const sizeSelect = document.getElementById('preview-size');
  const qualitySelect = document.getElementById('preview-quality');
  
  if (sizeSelect) {
    previewSettings.size = parseInt(sizeSelect.value);
  }
  
  if (qualitySelect) {
    previewSettings.quality = qualitySelect.value;
  }
  
  debugLog(`Налаштування превью оновлено: розмір=${previewSettings.size}, якість=${previewSettings.quality}`, 'info');
}

// Генерація превью моделі
function generateModelPreview() {
  debugLog('🎨 Початок генерації превью моделі', 'info');
  
  // Оновлюємо налаштування
  updatePreviewSettings();
  
  // Показуємо статус генерації
  showPreviewStatus(true);
  
  // Приховуємо попереднє превью
  hidePreviewContainer();
  
  try {
    // Перевіряємо доступність SketchUp API
    if (!window.sketchup || !window.sketchup.generate_model_preview) {
      throw new Error('SketchUp API для генерації превью не доступний');
    }
    
    debugLog(`📐 Параметри превью: розмір=${previewSettings.size}, якість=${previewSettings.quality}`, 'info');
    
    // Викликаємо SketchUp API для генерації превью
    const result = window.sketchup.generate_model_preview(previewSettings.size, previewSettings.quality);
    
    debugLog(`📤 Результат callback: ${result} (тип: ${typeof result})`, 'info');
    
    // Callback тепер повертає 1 або 0, а дані приходять через execute_script
    if (result === 1) {
      debugLog('✅ Callback успішний, очікуємо дані через execute_script', 'success');
    } else if (result === 0) {
      throw new Error('Callback повернув помилку');
    } else {
      debugLog(`⚠️ Callback повернув неочікуване значення: ${result}, але продовжуємо`, 'warn');
      // Не кидаємо помилку, оскільки превью все одно генерується
    }
    
  } catch (error) {
    debugLog(`❌ Помилка генерації превью: ${error.message}`, 'error');
    alert(`Помилка при створенні превью: ${error.message}`);
    showPreviewStatus(false);
  }
}

// Обробка успішного результату превью (викликається з Ruby)
function receiveModelPreview(result) {
  debugLog('📥 Отримано результат превью з Ruby', 'info');
  debugLog(`📊 Дані: success=${result.success}, size=${result.size}, quality=${result.quality}`, 'info');
  
  try {
    if (result && result.success && result.data) {
      // Зберігаємо дані превью
      currentPreviewData = {
        base64: result.data,
        size: result.size,
        quality: result.quality,
        generatedAt: result.generated_at || new Date().toISOString(),
        filename: `model_preview_${Date.now()}.png`
      };
      
      // Показуємо превью
      showPreviewContainer();
      updatePreviewInfo();
      
      debugLog('✅ Превью успішно згенеровано та відображено', 'success');
    } else {
      throw new Error('Некоректні дані превью');
    }
  } catch (error) {
    debugLog(`❌ Помилка обробки превью: ${error.message}`, 'error');
    alert(`Помилка обробки превью: ${error.message}`);
  } finally {
    // Приховуємо статус генерації
    showPreviewStatus(false);
  }
}

// Обробка помилки превью (викликається з Ruby)
function handleModelPreviewError(errorMessage) {
  debugLog(`❌ Помилка превью з Ruby: ${errorMessage}`, 'error');
  alert(`Помилка при створенні превью: ${errorMessage}`);
  showPreviewStatus(false);
}

// Показ/приховування статусу генерації
function showPreviewStatus(show) {
  const statusElement = document.getElementById('preview-status');
  if (statusElement) {
    statusElement.style.display = show ? 'block' : 'none';
  }
  
  // Блокуємо/розблокуємо кнопку
  const button = document.getElementById('generate-preview-btn');
  if (button) {
    button.disabled = show;
    button.textContent = show ? 'Генерація...' : '📷 Створити превью';
  }
}

// Показ контейнера превью
function showPreviewContainer() {
  const container = document.getElementById('preview-container');
  if (container) {
    container.style.display = 'block';
    
    // Встановлюємо зображення
    const img = document.getElementById('preview-image');
    if (img && currentPreviewData) {
      img.src = currentPreviewData.base64;
      img.alt = 'Превью моделі';
    }
  }
}

// Приховування контейнера превью
function hidePreviewContainer() {
  const container = document.getElementById('preview-container');
  if (container) {
    container.style.display = 'none';
  }
}

// Оновлення інформації про превью
function updatePreviewInfo() {
  const infoElement = document.getElementById('preview-info-text');
  if (infoElement && currentPreviewData) {
    const size = currentPreviewData.size;
    const quality = currentPreviewData.quality;
    const date = new Date(currentPreviewData.generatedAt).toLocaleString();
    
    infoElement.textContent = `Розмір: ${size}×${size} пікселів | Якість: ${quality} | Створено: ${date}`;
  }
}

// Завантаження превью
function downloadPreview() {
  if (!currentPreviewData) {
    alert('Немає превью для завантаження');
    return;
  }
  
  try {
    debugLog('💾 Завантаження превью', 'info');
    
    // Створюємо посилання для завантаження
    const link = document.createElement('a');
    link.href = currentPreviewData.base64;
    link.download = currentPreviewData.filename;
    
    // Додаємо до DOM, клікаємо і видаляємо
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    debugLog(`✅ Превью завантажено: ${currentPreviewData.filename}`, 'success');
    
  } catch (error) {
    debugLog(`❌ Помилка завантаження превью: ${error.message}`, 'error');
    alert(`Помилка при завантаженні превью: ${error.message}`);
  }
}

// Копіювання превью в буфер обміну
async function copyPreviewToClipboard() {
  if (!currentPreviewData) {
    alert('Немає превью для копіювання');
    return;
  }
  
  try {
    debugLog('📋 Копіювання превью в буфер обміну', 'info');
    
    // Конвертуємо base64 в blob
    const response = await fetch(currentPreviewData.base64);
    const blob = await response.blob();
    
    // Копіюємо в буфер обміну
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob
      })
    ]);
    
    debugLog('✅ Превью скопійовано в буфер обміну', 'success');
    alert('Превью скопійовано в буфер обміну!');
    
  } catch (error) {
    debugLog(`❌ Помилка копіювання превью: ${error.message}`, 'error');
    alert(`Помилка при копіюванні превью: ${error.message}`);
  }
}

// Ініціалізація превью при завантаженні сторінки
function initializePreviewTab() {
  debugLog('🎨 Ініціалізація таба превью', 'info');
  
  // Встановлюємо початкові налаштування
  updatePreviewSettings();
  
  // Додаємо обробники подій
  const sizeSelect = document.getElementById('preview-size');
  const qualitySelect = document.getElementById('preview-quality');
  
  if (sizeSelect) {
    sizeSelect.addEventListener('change', updatePreviewSettings);
  }
  
  if (qualitySelect) {
    qualitySelect.addEventListener('change', updatePreviewSettings);
  }
  
  debugLog('✅ Таб превью ініціалізовано', 'success');
}


// Функція для перемикання секції вибору моделі стели
function toggleSteleModelSection(headerElement) {
  const section = headerElement.closest('.stele-section');
  if (section) {
    const wasCollapsed = section.classList.contains('collapsed');
    section.classList.toggle('collapsed');
    
    if (wasCollapsed) {
      debugLog('Секція вибору моделі стели розгорнута', 'info');
    } else {
      debugLog('Секція вибору моделі стели згорнута', 'info');
    }
  }
}

// Універсальна функція для акордеон поведінки в будь-якому табі
// toggleAccordionPanel() перенесено в modules/ui/AccordionManager.js

// Функція для автоматичного застосування акордеон поведінки до всіх панелей
function initializeAccordionBehavior() {
  // Знаходимо всі таби
  const tabs = document.querySelectorAll('.tab-content');
  
  tabs.forEach(tab => {
    const panels = tab.querySelectorAll('.panel');
    
    panels.forEach(panel => {
      const header = panel.querySelector('.panel-header');
      if (header) {
        // Перевіряємо, чи вже є onclick обробник
        const currentOnclick = header.getAttribute('onclick');
        
        // Якщо є togglePanel, замінюємо на toggleAccordionPanel
        if (currentOnclick && currentOnclick.includes('togglePanel')) {
          header.setAttribute('onclick', 'toggleAccordionPanel(this)');
          debugLog(`Застосовано акордеон поведінку до панелі в табі ${tab.id}`, 'info');
        }
        // Якщо є toggleBasePanel, замінюємо на toggleAccordionPanel
        else if (currentOnclick && currentOnclick.includes('toggleBasePanel')) {
          header.setAttribute('onclick', 'toggleAccordionPanel(this)');
          debugLog(`Застосовано акордеон поведінку до панелі в табі ${tab.id}`, 'info');
        }
        // Якщо немає onclick, додаємо toggleAccordionPanel
        else if (!currentOnclick) {
          header.setAttribute('onclick', 'toggleAccordionPanel(this)');
          debugLog(`Додано акордеон поведінку до панелі в табі ${tab.id}`, 'info');
        }
      }
    });
  });
  
  debugLog('✅ Акордеон поведінка ініціалізована для всіх табів', 'success');
}

// Функція для застосування акордеон поведінки до нової панелі
function applyAccordionToNewPanel(panelElement) {
  if (!panelElement) return;
  
  const header = panelElement.querySelector('.panel-header');
  if (!header) return;
  
  // Перевіряємо, чи вже є onclick обробник
  const currentOnclick = header.getAttribute('onclick');
  
  // Якщо немає onclick або є togglePanel, замінюємо на toggleAccordionPanel
  if (!currentOnclick || currentOnclick.includes('togglePanel')) {
    header.setAttribute('onclick', 'toggleAccordionPanel(this)');
    debugLog(`Застосовано акордеон поведінку до нової панелі`, 'info');
  }
}

// Функція для застосування акордеон поведінки до всіх панелей в табі
function applyAccordionToTab(tabElement) {
  if (!tabElement) return;
  
  const panels = tabElement.querySelectorAll('.panel');
  panels.forEach(panel => {
    applyAccordionToNewPanel(panel);
  });
  
  debugLog(`Застосовано акордеон поведінку до всіх панелей в табі ${tabElement.id}`, 'info');
}

// === ФУНКЦІЇ ДЛЯ МАСШТАБУВАННЯ СТЕЛИ ===

// Глобальні змінні для зберігання оригінальних розмірів стели
// originalSteleDimensions та currentSteleDimensions перенесено в modules/core/GlobalState.js

// Функція для отримання поточних розмірів стели з SketchUp (асинхронна)
function getCurrentSteleDimensions() {
  return new Promise((resolve, reject) => {
    debugLog('getCurrentSteleDimensions: початок виконання', 'info');
    
    if (!window.sketchup) {
      debugLog('getCurrentSteleDimensions: window.sketchup не існує', 'error');
      reject(new Error('window.sketchup не існує'));
      return;
    }
    
    if (!window.sketchup.get_stele_dimensions) {
      debugLog('getCurrentSteleDimensions: window.sketchup.get_stele_dimensions не існує', 'error');
      debugLog(`Доступні методи: ${Object.keys(window.sketchup)}`, 'info');
      reject(new Error('window.sketchup.get_stele_dimensions не існує'));
      return;
    }
    
    try {
      debugLog('getCurrentSteleDimensions: викликаємо window.sketchup.get_stele_dimensions()', 'info');
      window.sketchup.get_stele_dimensions();
      
      // Чекаємо, щоб Ruby callback встиг виконатися
      setTimeout(() => {
        const dimensions = window.sketchup.steleDimensions;
        debugLog(`getCurrentSteleDimensions: отримано розміри стели з SketchUp: ${JSON.stringify(dimensions)}`, 'info');
        
        if (!dimensions) {
          debugLog('getCurrentSteleDimensions: dimensions is null', 'warn');
          reject(new Error('Розміри стели не отримано'));
          return;
        }
        
        if (typeof dimensions.width === 'undefined' || typeof dimensions.height === 'undefined' || typeof dimensions.depth === 'undefined') {
          debugLog(`getCurrentSteleDimensions: невалідні розміри: width=${dimensions.width}, height=${dimensions.height}, depth=${dimensions.depth}`, 'warn');
          reject(new Error('Невалідні розміри стели'));
          return;
        }
        
        debugLog(`getCurrentSteleDimensions: валідні розміри: ${dimensions.width}×${dimensions.height}×${dimensions.depth} мм`, 'info');
        resolve(dimensions);
      }, 200); // Збільшуємо час очікування
      
    } catch (error) {
      debugLog(`getCurrentSteleDimensions: помилка отримання розмірів стели: ${error.message}`, 'error');
      debugLog(`getCurrentSteleDimensions: stack trace: ${error.stack}`, 'error');
      reject(error);
    }
  });
}

// Функція для встановлення розмірів стели в UI
function setSteleDimensionsInUI(dimensions) {
  if (!dimensions) {
    debugLog('setSteleDimensionsInUI: dimensions is null or undefined', 'error');
    return;
  }
  
  debugLog(`setSteleDimensionsInUI: отримано dimensions: ${JSON.stringify(dimensions)}`, 'info');
  
  // Перевіряємо, чи всі розміри існують
  if (typeof dimensions.width === 'undefined' || typeof dimensions.height === 'undefined' || typeof dimensions.depth === 'undefined') {
    debugLog(`setSteleDimensionsInUI: некоректні розміри: width=${dimensions.width}, height=${dimensions.height}, depth=${dimensions.depth}`, 'error');
    return;
  }
  
  const currentUnit = getCurrentUnit();
  
  // Конвертуємо з мм в поточні одиниці
  const width = currentUnit === 'cm' ? Math.round(dimensions.width / 10) : dimensions.width;
  const height = currentUnit === 'cm' ? Math.round(dimensions.height / 10) : dimensions.height;
  const depth = currentUnit === 'cm' ? Math.round(dimensions.depth / 10) : dimensions.depth;
  
  debugLog(`setSteleDimensionsInUI: конвертація розмірів:`, 'info');
  debugLog(`  Оригінальні (мм): width=${dimensions.width}, height=${dimensions.height}, depth=${dimensions.depth}`, 'info');
  debugLog(`  Конвертовані (${currentUnit}): width=${width}, height=${height}, depth=${depth}`, 'info');
  debugLog(`  Мапінг до UI полів:`, 'info');
  debugLog(`    dimensions.width (${dimensions.width}) → stele-width (${width})`, 'info');
  debugLog(`    dimensions.height (${dimensions.height}) → stele-height (${height})`, 'info');
  debugLog(`    dimensions.depth (${dimensions.depth}) → stele-depth (${depth})`, 'info');
  
  const steleWidth = document.getElementById('stele-width');
  const steleHeight = document.getElementById('stele-height');
  const steleDepth = document.getElementById('stele-depth');
  
  if (steleWidth) {
    steleWidth.value = width;
    debugLog(`setSteleDimensionsInUI: встановлено stele-width = ${width}`, 'info');
  }
  if (steleHeight) {
    steleHeight.value = height;
    debugLog(`setSteleDimensionsInUI: встановлено stele-height = ${height}`, 'info');
  }
  if (steleDepth) {
    steleDepth.value = depth;
    debugLog(`setSteleDimensionsInUI: встановлено stele-depth = ${depth}`, 'info');
  }
  
  debugLog(`Встановлено розміри стели в UI: ${width}×${height}×${depth} ${currentUnit}`, 'info');
}

// Функція для показу секції масштабування стели
async function showSteleScalingSection() {
  // Показуємо секцію масштабування тільки для однієї стели
  if (carouselState.steles.type !== 'single') {
    debugLog('Секція масштабування доступна тільки для однієї стели', 'info');
    return;
  }
  
  debugLog('showSteleScalingSection: показуємо секцію масштабування', 'info');
  
  const scalingSection = document.getElementById('stele-scaling-section');
  if (scalingSection) {
    scalingSection.style.display = 'block';
    
    debugLog('showSteleScalingSection: отримуємо розміри стели...', 'info');
    
    try {
      // Отримуємо поточні розміри стели (асинхронно)
      const dimensions = await getCurrentSteleDimensions();
      debugLog(`showSteleScalingSection: отримано dimensions: ${JSON.stringify(dimensions)}`, 'info');
      
      if (dimensions && dimensions.width && dimensions.height && dimensions.depth) {
        originalSteleDimensions = dimensions;
        currentSteleDimensions = { ...dimensions };
        setSteleDimensionsInUI(dimensions);
        debugLog(`showSteleScalingSection: встановлено оригінальні розміри: ${dimensions.width}×${dimensions.height}×${dimensions.depth} мм`, 'info');
        debugLog('Показано секцію масштабування стели', 'info');
      } else {
        throw new Error('Невалідні розміри стели');
      }
    } catch (error) {
      debugLog(`showSteleScalingSection: помилка отримання розмірів стели: ${error.message}`, 'error');
      
      // Показуємо помилку користувачу
      if (window.ProGran3 && window.ProGran3.UI && window.ProGran3.UI.showNotification) {
        window.ProGran3.UI.showNotification('Не вдалося отримати розміри стели для масштабування', 'error');
      }
      
      // Приховуємо секцію масштабування
      scalingSection.style.display = 'none';
      return;
    }
  } else {
    debugLog('showSteleScalingSection: не знайдено секцію масштабування', 'error');
  }
}

// Функція для приховування секції масштабування стели
function hideSteleScalingSection() {
  const scalingSection = document.getElementById('stele-scaling-section');
  if (scalingSection) {
    scalingSection.style.display = 'none';
    debugLog('Приховано секцію масштабування стели', 'info');
  }
}

// Функція для оновлення масштабування стели (викликається при зміні значень)
function updateSteleScaling() {
  const steleWidth = document.getElementById('stele-width');
  const steleHeight = document.getElementById('stele-height');
  const steleDepth = document.getElementById('stele-depth');
  
  if (!steleWidth || !steleHeight || !steleDepth) {
    debugLog('updateSteleScaling: не знайдено елементи вводу', 'error');
    return;
  }
  
  // Перевіряємо, чи значення не порожні
  if (!steleWidth.value || !steleHeight.value || !steleDepth.value) {
    debugLog(`updateSteleScaling: порожні значення: width=${steleWidth.value}, height=${steleHeight.value}, depth=${steleDepth.value}`, 'warn');
    return;
  }
  
  const currentUnit = getCurrentUnit();
  
  // Конвертуємо в мм для зберігання
  debugLog(`updateSteleScaling: конвертація значень:`, 'info');
  debugLog(`  Ширина: "${steleWidth.value}" (${currentUnit}) → convertToMm()`, 'info');
  debugLog(`  Висота: "${steleHeight.value}" (${currentUnit}) → convertToMm()`, 'info');
  debugLog(`  Глибина: "${steleDepth.value}" (${currentUnit}) → convertToMm()`, 'info');
  
  const widthMm = convertToMm(steleWidth.value);
  const heightMm = convertToMm(steleHeight.value);
  const depthMm = convertToMm(steleDepth.value);
  
  debugLog(`updateSteleScaling: результати конвертації:`, 'info');
  debugLog(`  Ширина: ${widthMm} мм`, 'info');
  debugLog(`  Висота: ${heightMm} мм`, 'info');
  debugLog(`  Глибина: ${depthMm} мм`, 'info');
  
  // Перевіряємо, чи конвертація пройшла успішно
  if (isNaN(widthMm) || isNaN(heightMm) || isNaN(depthMm)) {
    debugLog(`updateSteleScaling: помилка конвертації: widthMm=${widthMm}, heightMm=${heightMm}, depthMm=${depthMm}`, 'error');
    return;
  }
  
  currentSteleDimensions = {
    width: widthMm,
    height: heightMm,
    depth: depthMm
  };
  
  debugLog(`Оновлено розміри стели: ${widthMm}×${heightMm}×${depthMm} мм`, 'info');
}

// Функція для застосування масштабування стели
function applySteleScaling() {
  if (!currentSteleDimensions) {
    debugLog('Немає розмірів для масштабування стели', 'error');
    return;
  }
  
  if (!originalSteleDimensions) {
    debugLog('Немає оригінальних розмірів стели', 'error');
    return;
  }
  
  // Розраховуємо коефіцієнти масштабування
  // МАСШТАБУВАННЯ ВСІХ РОЗМІРІВ:
  // - Висота: тільки вгору (від основи)
  // - Ширина та глибина: від центру (в обидві сторони)
  const scaleX = originalSteleDimensions.depth > 0 ? currentSteleDimensions.depth / originalSteleDimensions.depth : 1;   // UI "глибина" → X-вісь
  const scaleY = originalSteleDimensions.width > 0 ? currentSteleDimensions.width / originalSteleDimensions.width : 1;   // UI "ширина" → Y-вісь
  const scaleZ = originalSteleDimensions.height > 0 ? currentSteleDimensions.height / originalSteleDimensions.height : 1; // UI "висота" → Z-вісь
  
  // Перевіряємо на NaN та Infinity
  if (isNaN(scaleX) || isNaN(scaleY) || isNaN(scaleZ) || !isFinite(scaleX) || !isFinite(scaleY) || !isFinite(scaleZ)) {
    debugLog(`Помилка розрахунку коефіцієнтів масштабування: scaleX=${scaleX}, scaleY=${scaleY}, scaleZ=${scaleZ}`, 'error');
    if (window.ProGran3 && window.ProGran3.UI && window.ProGran3.UI.showNotification) {
      window.ProGran3.UI.showNotification('Помилка розрахунку коефіцієнтів масштабування', 'error');
    }
    return;
  }
  
  debugLog(`Застосування масштабування стели (ВСІ РОЗМІРИ):`, 'info');
  debugLog(`  Оригінальні розміри: ${originalSteleDimensions.width}(ширина)×${originalSteleDimensions.height}(висота)×${originalSteleDimensions.depth}(глибина) мм`, 'info');
  debugLog(`  Нові розміри: ${currentSteleDimensions.width}(ширина)×${currentSteleDimensions.height}(висота)×${currentSteleDimensions.depth}(глибина) мм`, 'info');
  debugLog(`  Значення з UI:`, 'info');
  debugLog(`    Ширина: ${document.getElementById('stele-width')?.value} → ${currentSteleDimensions.width} мм (від центру)`, 'info');
  debugLog(`    Висота: ${document.getElementById('stele-height')?.value} → ${currentSteleDimensions.height} мм (тільки вгору)`, 'info');
  debugLog(`    Глибина: ${document.getElementById('stele-depth')?.value} → ${currentSteleDimensions.depth} мм (від центру)`, 'info');
  debugLog(`  Коефіцієнти масштабування: X(глибина)=${scaleX.toFixed(3)}, Y(ширина)=${scaleY.toFixed(3)}, Z(висота)=${scaleZ.toFixed(3)}`, 'info');
  debugLog(`  Детальний розрахунок:`, 'info');
  debugLog(`    scaleX = ${currentSteleDimensions.depth} / ${originalSteleDimensions.depth} = ${scaleX.toFixed(3)} (глибина від центру)`, 'info');
  debugLog(`    scaleY = ${currentSteleDimensions.width} / ${originalSteleDimensions.width} = ${scaleY.toFixed(3)} (ширина від центру)`, 'info');
  debugLog(`    scaleZ = ${currentSteleDimensions.height} / ${originalSteleDimensions.height} = ${scaleZ.toFixed(3)} (висота тільки вгору)`, 'info');
  debugLog(`  Очікувані результати:`, 'info');
  debugLog(`    Глибина: ${originalSteleDimensions.depth} × ${scaleX.toFixed(3)} = ${(originalSteleDimensions.depth * scaleX).toFixed(1)} мм (від центру)`, 'info');
  debugLog(`    Ширина: ${originalSteleDimensions.width} × ${scaleY.toFixed(3)} = ${(originalSteleDimensions.width * scaleY).toFixed(1)} мм (від центру)`, 'info');
  debugLog(`    Висота: ${originalSteleDimensions.height} × ${scaleZ.toFixed(3)} = ${(originalSteleDimensions.height * scaleZ).toFixed(1)} мм (тільки вгору)`, 'info');
  
  // Перевіряємо, чи стела існує перед масштабуванням
  const dimensionsBefore = getCurrentSteleDimensions();
  if (!dimensionsBefore) {
    debugLog('❌ Стела не знайдена перед масштабуванням', 'error');
    if (window.ProGran3 && window.ProGran3.UI && window.ProGran3.UI.showNotification) {
      window.ProGran3.UI.showNotification('Стела не знайдена для масштабування', 'error');
    }
    return;
  }
  
  debugLog(`Стела знайдена перед масштабуванням: ${dimensionsBefore.width}×${dimensionsBefore.height}×${dimensionsBefore.depth} мм`, 'info');
  
  // Використовуємо основний метод масштабування (модифікація існуючої стели)
  if (window.sketchup && window.sketchup.scale_stele) {
    try {
      debugLog(`Викликаємо scale_stele з коефіцієнтами: X(глибина)=${scaleX}, Y(ширина)=${scaleY}, Z(висота)=${scaleZ}`, 'info');
      
      const success = window.sketchup.scale_stele(scaleX, scaleY, scaleZ);
      
      if (success) {
        debugLog('✅ Масштабування стели застосовано успішно', 'success');
        
        // Оновлюємо оригінальні розміри
        originalSteleDimensions = { ...currentSteleDimensions };
        
        // Перевіряємо, чи стела все ще існує після масштабування
        setTimeout(() => {
          const dimensions = getCurrentSteleDimensions();
          if (dimensions) {
            debugLog(`Стела після масштабування: ${dimensions.width}(ширина)×${dimensions.height}(висота)×${dimensions.depth}(глибина) мм`, 'info');
            // Показуємо повідомлення користувачу тільки якщо стела існує
            if (window.ProGran3 && window.ProGran3.UI && window.ProGran3.UI.showNotification) {
              window.ProGran3.UI.showNotification('Масштабування стели застосовано успішно', 'success');
            }
          } else {
            debugLog('⚠️ Стела не знайдена після масштабування', 'warn');
            if (window.ProGran3 && window.ProGran3.UI && window.ProGran3.UI.showNotification) {
              window.ProGran3.UI.showNotification('Помилка: стела зникла після масштабування', 'error');
            }
          }
        }, 200);
      } else {
        debugLog('❌ Помилка застосування масштабування стели, спробуємо альтернативний метод', 'warn');
        
        // Спробуємо альтернативний метод
        if (window.sketchup && window.sketchup.scale_stele_alternative) {
          try {
            debugLog(`Спробуємо альтернативний метод з розмірами: ${currentSteleDimensions.width}×${currentSteleDimensions.height}×${currentSteleDimensions.depth} мм`, 'info');
            
            const altSuccess = window.sketchup.scale_stele_alternative(
              currentSteleDimensions.width, 
              currentSteleDimensions.height, 
              currentSteleDimensions.depth
            );
            
            if (altSuccess) {
              debugLog('✅ Альтернативне масштабування стели застосовано успішно', 'success');
              originalSteleDimensions = { ...currentSteleDimensions };
              
              // Перевіряємо, чи стела існує після альтернативного масштабування
              setTimeout(() => {
                const dimensions = getCurrentSteleDimensions();
                if (dimensions) {
                  debugLog(`Стела після альтернативного масштабування: ${dimensions.width}(ширина)×${dimensions.height}(висота)×${dimensions.depth}(глибина) мм`, 'info');
                  if (window.ProGran3 && window.ProGran3.UI && window.ProGran3.UI.showNotification) {
                    window.ProGran3.UI.showNotification('Масштабування стели застосовано успішно (альтернативний метод)', 'success');
                  }
                } else {
                  debugLog('⚠️ Стела не знайдена після альтернативного масштабування', 'warn');
                  if (window.ProGran3 && window.ProGran3.UI && window.ProGran3.UI.showNotification) {
                    window.ProGran3.UI.showNotification('Помилка: стела зникла після альтернативного масштабування', 'error');
                  }
                }
              }, 200);
            } else {
              debugLog('❌ Альтернативний метод також не спрацював', 'error');
              if (window.ProGran3 && window.ProGran3.UI && window.ProGran3.UI.showNotification) {
                window.ProGran3.UI.showNotification('Помилка застосування масштабування', 'error');
              }
            }
          } catch (altError) {
            debugLog(`Помилка альтернативного методу: ${altError.message}`, 'error');
            if (window.ProGran3 && window.ProGran3.UI && window.ProGran3.UI.showNotification) {
              window.ProGran3.UI.showNotification('Помилка масштабування стели', 'error');
            }
          }
        } else {
          debugLog('❌ Альтернативний метод не доступний', 'error');
          if (window.ProGran3 && window.ProGran3.UI && window.ProGran3.UI.showNotification) {
            window.ProGran3.UI.showNotification('Помилка застосування масштабування', 'error');
          }
        }
      }
    } catch (error) {
      debugLog(`Помилка виклику scale_stele: ${error.message}`, 'error');
      debugLog(`Stack trace: ${error.stack}`, 'error');
      if (window.ProGran3 && window.ProGran3.UI && window.ProGran3.UI.showNotification) {
        window.ProGran3.UI.showNotification('Помилка масштабування стели', 'error');
      }
    }
  } else {
    debugLog('Метод scale_stele не доступний в window.sketchup', 'error');
    debugLog(`Доступні методи: ${Object.keys(window.sketchup || {})}`, 'info');
  }
}

// Функція для скидання масштабування стели до оригінальних розмірів
function resetSteleScaling() {
  if (!originalSteleDimensions) {
    debugLog('Немає оригінальних розмірів для скидання', 'error');
    return;
  }
  
  setSteleDimensionsInUI(originalSteleDimensions);
  currentSteleDimensions = { ...originalSteleDimensions };
  
  debugLog('Скинуто масштабування стели до оригінальних розмірів', 'info');
}

// ============================================================================
// СИСТЕМА АВТОМАТИЧНОЇ ПЕРЕБУДОВИ ЗАЛЕЖНИХ КОМПОНЕНТІВ
// ============================================================================

// Збереження параметрів користувача для залежних компонентів
function saveUserParametersForDependents(baseCategory) {
  debugLog(`💾 Збереження параметрів користувача для залежних компонентів: ${baseCategory}`, 'info');
  
  const userParams = {};
  
  // Зберігаємо параметри підставки
  if (addedElements.stands) {
    userParams.stands = {
      filename: carouselState.stands.currentModel,
      gaps: carouselState.stands.gaps || false
    };
  }
  
  // Зберігаємо параметри стел
  if (addedElements.steles) {
    userParams.steles = {
      filename: carouselState.steles.currentModel,
      type: carouselState.steles.type || 'single',
      distance: carouselState.steles.distance || 200,
      centralDetail: carouselState.steles.centralDetail || false,
      centralDetailWidth: carouselState.steles.centralDetailWidth || 200,
      centralDetailDepth: carouselState.steles.centralDetailDepth || 50,
      centralDetailHeight: carouselState.steles.centralDetailHeight || 1200
    };
  }
  
  // Зберігаємо параметри квітників
  if (addedElements.flowerbeds) {
    userParams.flowerbeds = {
      filename: carouselState.flowerbeds.currentModel
    };
  }
  
  // Зберігаємо параметри надгробків
  if (addedElements.gravestones) {
    userParams.gravestones = {
      filename: carouselState.gravestones.currentModel
    };
  }
  
  // Зберігаємо параметри лампадок
  if (addedElements.lamps) {
    userParams.lamps = {
      filename: carouselState.lamps.currentModel,
      positionType: carouselState.lamps.positionType || 'center'
    };
  }
  
  debugLog(`💾 Збережено параметри для компонентів: ${Object.keys(userParams).join(', ')}`, 'success');
  return userParams;
}

// Перебудова залежних компонентів з збереженими параметрами
function rebuildDependentComponentsWithParams(userParams) {
  debugLog(`🔄 Перебудова залежних компонентів з параметрами`, 'info');
  
  Object.keys(userParams).forEach(component => {
    const params = userParams[component];
    debugLog(`🔄 Перебудова компонента ${component} з параметрами: ${Object.keys(params).join(', ')}`, 'info');
    
    // Відправляємо команду в SketchUp для перебудови
    if (window.sketchup) {
      window.sketchup.rebuild_component_with_params(component, JSON.stringify(params));
    }
  });
  
  debugLog(`✅ Перебудова залежних компонентів завершена`, 'success');
}

// Обробка зміни фундаменту з автоматичною перебудовою
function handleFoundationChangeWithRebuild(newParams) {
  debugLog(`🏗️ Зміна фундаменту з автоматичною перебудовою`, 'info');
  
  // Зберігаємо параметри користувача для залежних компонентів
  const userParams = saveUserParametersForDependents('foundation');
  
  if (Object.keys(userParams).length === 0) {
    debugLog(`ℹ️ Немає залежних компонентів для перебудови`, 'info');
    return;
  }
  
  debugLog(`💾 Збережено параметри для ${Object.keys(userParams).length} компонентів`, 'info');
  
  // Відправляємо команду в SketchUp для перебудови
  if (window.sketchup) {
    window.sketchup.rebuild_after_foundation_change(JSON.stringify(newParams), JSON.stringify(userParams));
  }
  
  // Оновлюємо UI після перебудови
  setTimeout(() => {
    updateSummaryTable();
    debugLog(`✅ Перебудова завершена, UI оновлено`, 'success');
  }, 2000);
}

// Обробка зміни підставки з автоматичною перебудовою
function handleStandsChangeWithRebuild(newParams) {
  debugLog(`🏗️ Зміна підставки з автоматичною перебудовою`, 'info');
  
  // Зберігаємо параметри користувача для залежних компонентів
  const userParams = saveUserParametersForDependents('stands');
  
  if (Object.keys(userParams).length === 0) {
    debugLog(`ℹ️ Немає залежних компонентів для перебудови`, 'info');
    return;
  }
  
  debugLog(`💾 Збережено параметри для ${Object.keys(userParams).length} компонентів`, 'info');
  
  // Відправляємо команду в SketchUp для перебудови
  if (window.sketchup) {
    window.sketchup.rebuild_after_stands_change(JSON.stringify(newParams), JSON.stringify(userParams));
  }
  
  // Оновлюємо UI після перебудови
  setTimeout(() => {
    updateSummaryTable();
    debugLog(`✅ Перебудова завершена, UI оновлено`, 'success');
  }, 2000);
}

// Універсальна функція для обробки зміни базового компонента
function handleBaseComponentChangeWithRebuild(componentType, newParams) {
  debugLog(`🏗️ Зміна ${componentType} з автоматичною перебудовою`, 'info');
  
  // Зберігаємо параметри користувача для залежних компонентів
  const userParams = saveUserParametersForDependents(componentType);
  
  if (Object.keys(userParams).length === 0) {
    debugLog(`ℹ️ Немає залежних компонентів для перебудови`, 'info');
    return;
  }
  
  debugLog(`💾 Збережено параметри для ${Object.keys(userParams).length} компонентів`, 'info');
  
  // Відправляємо команду в SketchUp для перебудови
  if (window.sketchup) {
    window.sketchup.rebuild_after_component_change(componentType, JSON.stringify(newParams), JSON.stringify(userParams));
  }
  
  // Оновлюємо UI після перебудови
  setTimeout(() => {
    updateSummaryTable();
    debugLog(`✅ Перебудова ${componentType} завершена, UI оновлено`, 'success');
  }, 2000);
}

// ============================================================================
// 🔐 ЛІЦЕНЗІЙНІ ФУНКЦІЇ
// ============================================================================

// Оновлення статусу ліцензії в UI
function updateLicenseStatus() {
  try {
    console.log('🔐 [DEBUG] updateLicenseStatus викликано');
    console.log('🔐 [DEBUG] window.sketchup:', window.sketchup);
    
    // Отримуємо інформацію про ліцензію з Ruby
    if (window.sketchup && window.sketchup.has_license) {
      console.log('🔐 [DEBUG] Викликаємо has_license()');
      const hasLicense = window.sketchup.has_license();
      console.log('🔐 [DEBUG] hasLicense:', hasLicense);
      
      const licenseInfo = window.sketchup.license_info ? window.sketchup.license_info() : null;
      console.log('🔐 [DEBUG] licenseInfo:', licenseInfo);
      
      if (hasLicense && licenseInfo) {
        // Ліцензія активна - оновлюємо тільки footer
        const footerEmail = document.getElementById('license-footer-email');
        const footerKey = document.getElementById('license-footer-key');
        footerEmail.textContent = licenseInfo.email || 'Невідомий email';
        footerKey.textContent = licenseInfo.license_key ? licenseInfo.license_key.substring(0, 8) + '...' : '';
      } else {
        // Демо режим - оновлюємо тільки footer
        console.log('🔐 [DEBUG] Демо режим - оновлюємо footer');
        const footerEmail = document.getElementById('license-footer-email');
        const footerKey = document.getElementById('license-footer-key');
        console.log('🔐 [DEBUG] footerEmail element:', footerEmail);
        console.log('🔐 [DEBUG] footerKey element:', footerKey);
        
        if (footerEmail) {
          footerEmail.textContent = 'Не активована';
          console.log('🔐 [DEBUG] Встановлено footerEmail: Не активована');
        } else {
          console.log('🔐 [DEBUG] Помилка: footerEmail element не знайдено');
        }
        
        if (footerKey) {
          footerKey.textContent = '';
          console.log('🔐 [DEBUG] Встановлено footerKey: порожньо');
        } else {
          console.log('🔐 [DEBUG] Помилка: footerKey element не знайдено');
        }
      }
    } else {
      // Fallback - демо режим
      console.log('🔐 [DEBUG] Fallback - демо режим');
      const footerEmail = document.getElementById('license-footer-email');
      const footerKey = document.getElementById('license-footer-key');
      console.log('🔐 [DEBUG] footerEmail element:', footerEmail);
      console.log('🔐 [DEBUG] footerKey element:', footerKey);
      
      if (footerEmail) {
        footerEmail.textContent = 'Не активована';
        console.log('🔐 [DEBUG] Встановлено footerEmail: Не активована');
      } else {
        console.log('🔐 [DEBUG] Помилка: footerEmail element не знайдено');
      }
      
      if (footerKey) {
        footerKey.textContent = '';
        console.log('🔐 [DEBUG] Встановлено footerKey: порожньо');
      } else {
        console.log('🔐 [DEBUG] Помилка: footerKey element не знайдено');
      }
    }
  } catch (error) {
    console.error('Помилка оновлення статусу ліцензії:', error);
    // Fallback - демо режим
    const footerEmail = document.getElementById('license-footer-email');
    const footerKey = document.getElementById('license-footer-key');
    footerEmail.textContent = 'Не активована';
    footerKey.textContent = '';
  }
}

// Функція активації ліцензії
function activateLicense() {
  const emailInput = document.getElementById('email-input');
  const licenseKeyInput = document.getElementById('license-key-input');
  
  const email = emailInput.value.trim();
  const licenseKey = licenseKeyInput.value.trim();
  
  if (!email || !licenseKey) {
    alert('Будь ласка, введіть email та ключ ліцензії');
    return;
  }
  
  try {
    // Викликаємо Ruby функцію активації з email та license_key
    if (window.sketchup && window.sketchup.activate_license) {
      const result = window.sketchup.activate_license(licenseKey, email);
      
      if (result && result.success) {
        alert('Ліцензія успішно активована!');
        updateLicenseStatus();
        hideBlockingCard();
        // Оновлюємо статус після успішної активації
        setTimeout(() => {
          updateLicenseStatus();
        }, 1000);
      } else {
        alert('Помилка активації ліцензії: ' + (result.error || 'Невідома помилка'));
      }
    } else {
      alert('Функція активації ліцензії недоступна');
    }
  } catch (error) {
    console.error('Помилка активації ліцензії:', error);
    alert('Помилка активації ліцензії: ' + error.message);
  }
}

// Функція перевірки статусу блокування з сервера
function checkServerBlockingStatus() {
  try {
    if (window.sketchup && window.sketchup.check_blocking_status) {
      const result = window.sketchup.check_blocking_status();
      
      if (result && result.success) {
        if (result.blocked) {
          showBlockingCard();
        } else {
          hideBlockingCard();
        }
        updateLicenseStatus();
      } else {
        console.warn('Не вдалося перевірити статус блокування:', result.error);
      }
    }
  } catch (error) {
    console.error('Помилка перевірки статусу блокування:', error);
  }
}

// Показ карточки блокування
function showBlockingCard() {
  const blockingCard = document.getElementById('blocking-card');
  if (blockingCard) {
    blockingCard.style.display = 'block';
  }
}

// Приховування карточки блокування
function hideBlockingCard() {
  const blockingCard = document.getElementById('blocking-card');
  if (blockingCard) {
    blockingCard.style.display = 'none';
  }
}
