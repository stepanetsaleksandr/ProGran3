// progran3/web/script.js

// --- ГЛОБАЛЬНІ ЗМІННІ ---
let modelLists = {};
let carouselState = {
  stands: { index: 0, gaps: false }, // Додаємо вмикач проміжків
  steles: { index: 0, type: 'single', distance: 200 }, // Додаємо тип стел та відстань
  flowerbeds: { index: 0 },
  gravestones: { index: 0 },
  fence_decor: { index: 0 }
};

// --- ІНІЦІАЛІЗАЦІЯ I18N ---
async function initializeI18n() {
  try {
    // Ініціалізуємо I18nManager
    if (window.ProGran3 && window.ProGran3.I18n && window.ProGran3.I18n.Manager) {
      await window.ProGran3.I18n.Manager.init();
      debugLog('I18n ініціалізовано успішно', 'success');
    }
    
    // Ініціалізуємо перемикач мов
    if (window.ProGran3 && window.ProGran3.UI && window.ProGran3.UI.LanguageSwitcher) {
      window.ProGran3.UI.LanguageSwitcher.init();
      debugLog('Перемикач мов ініціалізовано', 'success');
    }
  } catch (error) {
    debugLog(`Помилка ініціалізації i18n: ${error.message}`, 'error');
  }
}

// --- ФУНКЦІЇ I18N ---
// Функція для отримання перекладу
function t(key, params = {}) {
  if (window.ProGran3 && window.ProGran3.I18n && window.ProGran3.I18n.Manager) {
    return window.ProGran3.I18n.Manager.t(key, params);
  }
  return key; // Fallback
}

// Функція для зміни мови
async function changeLanguage(lang) {
  if (window.ProGran3 && window.ProGran3.I18n && window.ProGran3.I18n.Manager) {
    const success = await window.ProGran3.I18n.Manager.changeLanguage(lang);
    if (success) {
      debugLog(`Мову змінено на: ${lang}`, 'success');
      // Оновлюємо динамічний контент
      updateDynamicContent();
    }
    return success;
  }
  return false;
}

// Оновлення динамічного контенту після зміни мови
function updateDynamicContent() {
  // Оновлюємо заголовки панелей
  updatePanelHeaders();
  
  // Оновлюємо всі лейбли з data-i18n атрибутами
  updateAllI18nLabels();
  
  // Оновлюємо розміри в заголовках
  updateAllDisplays();
  
  // Оновлюємо лейбли з одиницями вимірювання
  updateUnitLabels();
  
  // Оновлюємо специфікацію
  if (typeof updateSummaryTable === 'function') {
    updateSummaryTable();
  }
}

// Оновлення заголовків панелей
function updatePanelHeaders() {
  const panels = document.querySelectorAll('.panel-title');
  panels.forEach(panel => {
    const key = panel.getAttribute('data-i18n');
    if (key) {
      panel.textContent = t(key);
    }
  });
}

// Оновлення всіх лейблів з data-i18n атрибутами
function updateAllI18nLabels() {
  const labels = document.querySelectorAll('[data-i18n]');
  debugLog(`Оновлення ${labels.length} лейблів з data-i18n атрибутами`, 'info');
  
  labels.forEach(label => {
    const key = label.getAttribute('data-i18n');
    if (key) {
      // Перевіряємо, чи це не лейбл з одиницями вимірювання (крім спеціальних випадків)
      if (!label.id.includes('-label') || label.id.includes('stele-distance-label') || label.id.includes('gaps-') || label.id.includes('stands-')) {
        const translation = t(key);
        if (translation !== key) {
          label.textContent = translation;
          debugLog(`Оновлено лейбл ${label.id}: ${key} -> ${translation}`, 'info');
        } else {
          debugLog(`Переклад не знайдено для ключа: ${key}`, 'warning');
        }
      }
    }
  });
}

// --- СИСТЕМА ТАБІВ ---
let activeTab = 'base'; // Активний таб за замовчуванням

// Функція переключення табів
function switchTab(tabName) {
  // Приховуємо всі таби
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(tab => {
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
    selectedTab.classList.add('active');
  }
  
  // Активуємо відповідну кнопку
  const selectedButton = document.querySelector(`[data-tab="${tabName}"]`);
  if (selectedButton) {
    selectedButton.classList.add('active');
  }
  
  // Зберігаємо активний таб
  activeTab = tabName;
  
  // Оновлюємо каруселі в активному табі
  setTimeout(() => {
    updateCarouselsInActiveTab();
    // Ініціалізуємо каруселі для нового таба
    initializeCarouselsForTab(tabName);
  }, 50);
    
    
}

// Оновлення каруселей в активному табі
function updateCarouselsInActiveTab() {
  const activeTabContent = document.querySelector('.tab-content.active');
  if (activeTabContent) {
    // Знаходимо всі каруселі в активному табі
    const carousels = activeTabContent.querySelectorAll('.carousel-container');
    carousels.forEach(carousel => {
      // Перевіряємо, чи карусель видима
      const viewport = carousel.querySelector('.carousel-viewport');
      if (viewport && viewport.offsetParent !== null) {
        // Тільки оновлюємо видимі каруселі
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
  debugLog(`🎠 Ініціалізація каруселей для таба: ${tabName}`, 'info');
  
  const tabCarousels = {
    'base': ['stands', 'flowerbeds'],
    'monument': ['stands', 'steles'],
    'gravestone': ['flowerbeds', 'gravestones'],
    'fence': ['fence_decor']
  };
  
  const carouselTypes = tabCarousels[tabName] || [];
  carouselTypes.forEach(category => {
    debugLog(`Перевіряємо карусель ${category} для таба ${tabName}`, 'info');
    
    // Перевіряємо, чи вже ініціалізована карусель (тимчасово відключено для діагностики)
    // if (CarouselManager.isInitialized(category)) {
    //   debugLog(`Карусель ${category} вже ініціалізована, пропускаємо`, 'info');
    //   return;
    // }
    
    if (CarouselManager.hasCarousel(category) && modelLists[category]) {
      const trackElement = document.getElementById(CarouselManager.getCarouselElementId(category, 'track'));
      const viewportElement = document.getElementById(CarouselManager.getCarouselElementId(category, 'viewport'));
      
      if (trackElement && viewportElement) {
        debugLog(`Ініціалізуємо карусель ${category} для таба ${tabName}`, 'success');
        CarouselManager.initialize(category);
      } else {
        debugLog(`Не знайдено елементи каруселі ${category} для таба ${tabName}`, 'error');
      }
    } else {
      debugLog(`Карусель ${category} не доступна або немає моделей для таба ${tabName}`, 'warning');
    }
  });
}

// Ініціалізація табів
function initializeTabs() {
  debugLog(`Ініціалізація табів`, 'info');
  
  // Перевіряємо наявність навігації табів
  const tabsNavigation = document.querySelector('.tabs-navigation');
  if (!tabsNavigation) {
    debugLog(`Не знайдено навігацію табів`, 'error');
    return;
  }
  
  // Перевіряємо наявність контенту табів
  const tabContents = document.querySelectorAll('.tab-content');
  if (tabContents.length === 0) {
    debugLog(`Не знайдено контент табів`, 'error');
    return;
  }
  
  debugLog(`Знайдено ${tabContents.length} табів`, 'success');
  
  // Встановлюємо активний таб за замовчуванням
  switchTab('base');
  
  // Додаємо обробники подій для кнопок табів
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const tabName = this.getAttribute('data-tab');
      if (tabName) {
        debugLog(` Переключення на таб: ${tabName}`, 'info');
        switchTab(tabName);
      }
    });
  });
  
  debugLog(` Таби ініціалізовані успішно`, 'success');
}

// Ініціалізація floating labels
function initializeFloatingLabels() {
  const floatingInputs = document.querySelectorAll('.floating-label input');
  const floatingSelects = document.querySelectorAll('.floating-label select');
  
  // Обробка input елементів
  floatingInputs.forEach(input => {
    // Встановлюємо початковий стан для полів зі значеннями
    if (input.value && input.value.trim() !== '') {
      input.classList.add('has-value');
    }
    
    // Додаємо обробники подій
    input.addEventListener('focus', function() {
      this.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', function() {
      this.parentElement.classList.remove('focused');
      if (this.value && this.value.trim() !== '') {
        this.classList.add('has-value');
      } else {
        this.classList.remove('has-value');
      }
    });
    
    input.addEventListener('input', function() {
      if (this.value && this.value.trim() !== '') {
        this.classList.add('has-value');
      } else {
        this.classList.remove('has-value');
      }
    });
  });
  
  // Обробка select елементів
  floatingSelects.forEach(select => {
    // Встановлюємо початковий стан для полів зі значеннями
    if (select.value && select.value.trim() !== '') {
      select.classList.add('has-value');
    }
    
    // Додаємо обробники подій
    select.addEventListener('focus', function() {
      this.parentElement.classList.add('focused');
    });
    
    select.addEventListener('blur', function() {
      this.parentElement.classList.remove('focused');
      if (this.value && this.value.trim() !== '') {
        this.classList.add('has-value');
      } else {
        this.classList.remove('has-value');
      }
    });
    
    select.addEventListener('change', function() {
      if (this.value && this.value.trim() !== '') {
        this.classList.add('has-value');
      } else {
        this.classList.remove('has-value');
      }
    });
  });
}

// Відстеження доданих елементів до моделі
let addedElements = {
  foundation: false,
  tiling: false,
  cladding: false,
  blindArea: false,
  stands: false,
  flowerbeds: false,
  gravestones: false,
  steles: false,
  fence_corner: false,
  fence_perimeter: false,
  fence_decor: false
};

// Поточна одиниця вимірювання
let currentUnit = 'mm';




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
    
    updateAllDisplays();
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
      // Для стел передаємо додаткові параметри типу та відстані
      if (category === 'steles') {
        const steleType = state.type || 'single'; // За замовчуванням 'single'
        const steleDistance = state.distance || 200; // За замовчуванням 200мм
        window.sketchup.add_model(category, filename, steleType, steleDistance);
        debugLog(`Додавання стел типу: ${steleType}, відстань: ${steleDistance}мм`, 'info');
      } else {
        window.sketchup.add_model(category, filename);
      }
      addedElements[category] = true;
      updateSummaryTable();
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

// --- DEBUG ФУНКЦІЇ ---

// Функція для додавання повідомлень в debug лог
function debugLog(message, type = 'info') {
  const debugLog = document.getElementById('debug-log');
  if (!debugLog) return;
  
  const timestamp = new Date().toLocaleTimeString();
  const color = type === 'error' ? '#ff6b6b' : type === 'success' ? '#51cf66' : type === 'warning' ? '#ffd43b' : '#339af0';
  
  const logEntry = document.createElement('div');
  logEntry.style.color = color;
  logEntry.style.marginBottom = '2px';
  logEntry.innerHTML = `<span style="color: #868e96;">[${timestamp}]</span> ${message}`;
  
  debugLog.appendChild(logEntry);
  debugLog.scrollTop = debugLog.scrollHeight;
  
  // Обмежуємо кількість записів
  while (debugLog.children.length > 50) {
    debugLog.removeChild(debugLog.firstChild);
  }
}

// Функція для очищення debug логу
function clearDebugLog() {
  const debugLog = document.getElementById('debug-log');
  if (debugLog) {
    debugLog.innerHTML = '<div> Очікування логів...</div>';
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
    debugLog(`📞 Викликаємо window.sketchup.ready()`, 'info');
    window.sketchup.ready();
  } else {
    debugLog(` window.sketchup.ready не доступний`, 'error');
  }
};

// Ініціалізація додатку
function initializeApp() {
  debugLog(` initializeApp викликано`, 'info');
  
  // Ініціалізація табів
  initializeTabs();
  
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
  updateAllDisplays();
  updateAllI18nLabels();
  updateUnitLabels();
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
  
  updateAllDisplays();
}

// --- ЛОГІКА ДЛЯ ЗГОРТАННЯ ПАНЕЛЕЙ ---

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
  
  updateAllDisplays();
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
function updateSteleType() {
  const selectedType = document.querySelector('input[name="stele-type"]:checked').value;
  carouselState.steles.type = selectedType;
  debugLog(`Тип стел змінено на: ${selectedType}`, 'info');
  
  // Показуємо/ховаємо поле відстані для парних стел
  const distanceGroup = document.getElementById('stele-distance-group');
  if (distanceGroup) {
    if (selectedType === 'paired') {
      distanceGroup.style.display = 'block';
    } else {
      distanceGroup.style.display = 'none';
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
  const steleTypeInputs = document.querySelectorAll('input[name="stele-type"]');
  if (steleTypeInputs.length > 0) {
    const checkedInput = document.querySelector('input[name="stele-type"]:checked');
    if (checkedInput) {
      carouselState.steles.type = checkedInput.value;
      debugLog(`Ініціалізовано тип стел: ${checkedInput.value}`, 'info');
    }
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

function getSelectedBlindAreaMode() {
  const activeButton = document.querySelector('.button-group-tiling-mode .tiling-mode-btn.active');
  return activeButton ? activeButton.dataset.value : 'uniform';
}

function updateBlindAreaControls() {
  const mode = getSelectedBlindAreaMode();
  const uniformControls = document.getElementById('uniform-controls');
  const customControls = document.getElementById('custom-controls');
  
  if (mode === 'uniform') {
    uniformControls.classList.remove('hidden');
    customControls.classList.add('hidden');
  } else {
    uniformControls.classList.add('hidden');
    customControls.classList.remove('hidden');
  }
  
  updateAllDisplays();
}

function addBlindArea() {
  const thickness = convertToMm(document.getElementById('blind-area-thickness').value);
  const mode = getSelectedBlindAreaMode();
  
  if (mode === 'uniform') {
    const width = convertToMm(document.getElementById('blind-area-uniform-width').value);
    debugLog(`🏗️ Створення відмостки з однаковою шириною: ${width}мм, товщина: ${thickness}мм`, 'info');
    if (window.sketchup && window.sketchup.add_blind_area_uniform) {
      window.sketchup.add_blind_area_uniform(width, thickness);
      addedElements.blindArea = true;
      updateSummaryTable();
    } else { debugLog(` window.sketchup.add_blind_area_uniform не доступний`, 'error'); }
  } else {
    const north = convertToMm(document.getElementById('blind-area-north').value);
    const south = convertToMm(document.getElementById('blind-area-south').value);
    const east = convertToMm(document.getElementById('blind-area-east').value);
    const west = convertToMm(document.getElementById('blind-area-west').value);
    debugLog(`🏗️ Створення відмостки з різною шириною: П:${north}мм, Пд:${south}мм, С:${east}мм, З:${west}мм, товщина: ${thickness}мм`, 'info');
    if (window.sketchup && window.sketchup.add_blind_area_custom) {
      window.sketchup.add_blind_area_custom(north, south, east, west, thickness);
      addedElements.blindArea = true;
      updateSummaryTable();
    } else { debugLog(` window.sketchup.add_blind_area_custom не доступний`, 'error'); }
  }
}



function updateAllDisplays() {
  debugLog(` updateAllDisplays() викликано`, 'info');
  const unitText = currentUnit === 'mm' ? 'мм' : 'см';
  
  // Оновлення відображення розмірів фундаменту
  const foundationDepth = document.getElementById('foundation-depth').value;
  const foundationWidth = document.getElementById('foundation-width').value;
  const foundationHeight = document.getElementById('foundation-height').value;
  document.getElementById('foundation-dimensions-display').textContent = 
    `${foundationDepth}×${foundationWidth}×${foundationHeight} ${unitText}`;
  
  // Оновлення відображення типу плитки
  const tilingMode = getSelectedTilingMode();
  const activeButton = document.querySelector('.tiling-mode-btn.active');
  if (activeButton) {
    document.getElementById('tiling-type-display').textContent = activeButton.textContent;
  }
  
  // Оновлення відображення товщини облицювання
  const claddingThickness = document.getElementById('cladding-thickness').value;
  document.getElementById('cladding-dimensions-display').textContent = 
    `Товщина: ${claddingThickness} ${unitText}`;
  
  // Оновлення відображення розмірів відмостки
  const blindAreaThickness = document.getElementById('blind-area-thickness').value;
  const blindAreaMode = getSelectedBlindAreaMode();
  
  if (blindAreaMode === 'uniform') {
    const uniformWidth = document.getElementById('blind-area-uniform-width').value;
    document.getElementById('blind-area-dimensions-display').textContent = 
      `Ширина: ${uniformWidth} ${unitText}, Товщина: ${blindAreaThickness} ${unitText}`;
  } else {
    const blindAreaNorth = document.getElementById('blind-area-north').value;
    const blindAreaSouth = document.getElementById('blind-area-south').value;
    const blindAreaEast = document.getElementById('blind-area-east').value;
    const blindAreaWest = document.getElementById('blind-area-west').value;
    document.getElementById('blind-area-dimensions-display').textContent = 
      `П:${blindAreaNorth} Пд:${blindAreaSouth} С:${blindAreaEast} З:${blindAreaWest} ${unitText}, Т:${blindAreaThickness} ${unitText}`;
  }
  
  // Оновлення відображення вибраних моделей
  updateModelDisplays();
  
  
  // Оновлення відображення огорожі
  updateFenceCornerDisplay();
  updateFencePerimeterDisplay();
  
  // Оновлення відображення підставки
  debugLog(` Викликаємо updateStandsDisplay() з updateAllDisplays()`, 'info');
  updateStandsDisplay();
  
  // Оновлення підсумкової таблиці
  debugLog(` Викликаємо updateSummaryTable() з updateAllDisplays()`, 'info');
  updateSummaryTable();
  
  debugLog(` updateAllDisplays() завершено`, 'info');
}

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

// Функції для додавання елементів
function addFoundation() {
  const depth = document.getElementById('foundation-depth').value;
  const width = document.getElementById('foundation-width').value;
  const height = document.getElementById('foundation-height').value;
  
  if (window.sketchup && window.sketchup.add_foundation) {
    // Конвертуємо в мм перед відправкою в Ruby
    const depthMm = convertToMm(depth);
    const widthMm = convertToMm(width);
    const heightMm = convertToMm(height);
    
    window.sketchup.add_foundation(depthMm, widthMm, heightMm);
    addedElements.foundation = true;
    updateSummaryTable();
  } else { debugLog(` window.sketchup.add_foundation не доступний`, 'error'); }
}



function addTiles() {
  const mode = getSelectedTilingMode();
  debugLog(`🏗️ Додавання плитки, режим: ${mode}`, 'info');
  
  if (window.sketchup && window.sketchup.add_tiles) {
    if (mode === 'frame') {
      const borderWidthElement = document.getElementById('tile-border-width');
      const overhangElement = document.getElementById('tile-overhang');
      
      if (!borderWidthElement) {
        debugLog(` Не знайдено поле ширини рамки (tile-border-width)`, 'error');
        return;
      }
      if (!overhangElement) {
        debugLog(` Не знайдено поле виступу (tile-overhang)`, 'error');
        return;
      }
      
      const thickness = getSelectedThickness();
      const borderWidth = borderWidthElement.value;
      const overhang = overhangElement.value;
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
      const sizeElement = document.getElementById('modular-tile-size');
      const thicknessElement = document.getElementById('modular-thickness');
      const overhangElement = document.getElementById('modular-overhang');
      
      if (!sizeElement) {
        debugLog(` Не знайдено поле розміру плитки (modular-tile-size)`, 'error');
        return;
      }
      if (!thicknessElement) {
        debugLog(` Не знайдено поле товщини модульної плитки (modular-thickness)`, 'error');
        return;
      }
      if (!overhangElement) {
        debugLog(` Не знайдено поле виступу модульної плитки (modular-overhang)`, 'error');
        return;
      }
      
      const size = sizeElement.value;
      const thickness = thicknessElement.value;
      const seam = getSelectedSeam();
      const overhang = overhangElement.value;
      
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
  } else {
    debugLog(` window.sketchup.add_tiles не доступний`, 'error');
  }
}



function addSideCladding() {
  const thickness = document.getElementById('cladding-thickness').value;
  
  if (window.sketchup && window.sketchup.add_side_cladding) {
    // Конвертуємо в мм
    const thicknessMm = convertToMm(thickness);
    window.sketchup.add_side_cladding(thicknessMm);
    addedElements.cladding = true;
    updateSummaryTable();
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
  updateAllDisplays();
  updateUnitLabels();
  updateThicknessButtons();
  updateSeamButtons();
  
  // Відправляємо зміну в Ruby
  if (window.sketchup && window.sketchup.change_unit) {
    window.sketchup.change_unit(newUnit);
  }
  
  debugLog(` Одиниця вимірювання змінена на: ${newUnit}`, 'success');
}

// Отримання всіх значень з полів вводу
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

// Конвертація всіх значень
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
  
  // Конвертуємо значення підставки
  if (oldValues.stands) {
    document.getElementById('stands-height').value = convertValue(oldValues.stands.height, oldUnit, newUnit);
    document.getElementById('stands-width').value = convertValue(oldValues.stands.width, oldUnit, newUnit);
    document.getElementById('stands-depth').value = convertValue(oldValues.stands.depth, oldUnit, newUnit);
  }
  
  // Конвертуємо значення проміжної
  if (oldValues.gaps) {
    document.getElementById('gaps-height').value = convertValue(oldValues.gaps.height, oldUnit, newUnit);
    document.getElementById('gaps-width').value = convertValue(oldValues.gaps.width, oldUnit, newUnit);
    document.getElementById('gaps-depth').value = convertValue(oldValues.gaps.depth, oldUnit, newUnit);
  }
  
  // Конвертуємо значення відстані між стелами
  if (oldValues.steleDistance !== undefined) {
    document.getElementById('stele-distance').value = convertValue(oldValues.steleDistance, oldUnit, newUnit);
  }
  
  // Конвертуємо значення кутової огорожі
  if (oldValues.fenceCorner) {
    document.getElementById('fence-corner-post-height').value = convertValue(oldValues.fenceCorner.postHeight, oldUnit, newUnit);
    document.getElementById('fence-corner-post-size').value = convertValue(oldValues.fenceCorner.postSize, oldUnit, newUnit);
    document.getElementById('fence-corner-side-height').value = convertValue(oldValues.fenceCorner.sideHeight, oldUnit, newUnit);
    document.getElementById('fence-corner-side-length').value = convertValue(oldValues.fenceCorner.sideLength, oldUnit, newUnit);
    document.getElementById('fence-corner-side-thickness').value = convertValue(oldValues.fenceCorner.sideThickness, oldUnit, newUnit);
    // decorativeSize - фіксоване значення, не конвертується
  }
  
  // Конвертуємо значення периметральної огорожі
  if (oldValues.fencePerimeter) {
    document.getElementById('fence-perimeter-post-height').value = convertValue(oldValues.fencePerimeter.postHeight, oldUnit, newUnit);
    document.getElementById('fence-perimeter-post-size').value = convertValue(oldValues.fencePerimeter.postSize, oldUnit, newUnit);
    document.getElementById('fence-perimeter-north-count').value = oldValues.fencePerimeter.northCount; // Кількість не конвертується
    document.getElementById('fence-perimeter-south-count').value = oldValues.fencePerimeter.southCount; // Кількість не конвертується
    document.getElementById('fence-perimeter-east-west-count').value = oldValues.fencePerimeter.eastWestCount; // Кількість не конвертується
    // decorativeHeight і decorativeThickness - фіксовані значення, не конвертуються
  }
  
  // Конвертуємо значення облицювання
  if (oldValues.cladding) {
    document.getElementById('cladding-thickness').value = convertValue(oldValues.cladding.thickness, oldUnit, newUnit);
  }
}

// Конвертація одного значення
function convertValue(value, oldUnit, newUnit, isSeam = false) {
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return value;
  
  // Шви завжди залишаються в мм, не конвертуються
  if (isSeam) {
    return value;
  }
  
  if (oldUnit === 'mm' && newUnit === 'cm') {
    return (numValue / 10).toFixed(0); // Прибираємо десяткові знаки для см
  } else if (oldUnit === 'cm' && newUnit === 'mm') {
    return Math.round(numValue * 10);
  }
  
  return value;
}

// Отримання поточної одиниці вимірювання
function getCurrentUnit() {
  return currentUnit;
}

// Оновлення всіх лейблів з одиницями вимірювання
function updateUnitLabels() {
  const unitText = currentUnit === 'mm' ? 'мм' : 'см';
  
  // Фундамент
  const foundationDepthLabel = document.getElementById('foundation-depth-label');
  const foundationWidthLabel = document.getElementById('foundation-width-label');
  const foundationHeightLabel = document.getElementById('foundation-height-label');
  
  if (foundationDepthLabel) foundationDepthLabel.textContent = `Довжина (${unitText})`;
  if (foundationWidthLabel) foundationWidthLabel.textContent = `Ширина (${unitText})`;
  if (foundationHeightLabel) foundationHeightLabel.textContent = `Висота (${unitText})`;
  
  // Відмостка
  const blindAreaThicknessLabel = document.getElementById('blind-area-thickness-label');
  const blindAreaUniformWidthLabel = document.getElementById('blind-area-uniform-width-label');
  const blindAreaNorthLabel = document.getElementById('blind-area-north-label');
  const blindAreaSouthLabel = document.getElementById('blind-area-south-label');
  const blindAreaEastLabel = document.getElementById('blind-area-east-label');
  const blindAreaWestLabel = document.getElementById('blind-area-west-label');
  
  if (blindAreaThicknessLabel) blindAreaThicknessLabel.textContent = `Товщина (${unitText})`;
  if (blindAreaUniformWidthLabel) blindAreaUniformWidthLabel.textContent = `Ширина (${unitText})`;
  if (blindAreaNorthLabel) blindAreaNorthLabel.textContent = `Північна сторона (${unitText})`;
  if (blindAreaSouthLabel) blindAreaSouthLabel.textContent = `Південна сторона (${unitText})`;
  if (blindAreaEastLabel) blindAreaEastLabel.textContent = `Східна сторона (${unitText})`;
  if (blindAreaWestLabel) blindAreaWestLabel.textContent = `Західна сторона (${unitText})`;
  
  // Плитка
  const tileThicknessFrameLabel = document.getElementById('tile-thickness-frame-label');
  const tileBorderWidthLabel = document.getElementById('tile-border-width-label');
  const tileOverhangLabel = document.getElementById('tile-overhang-label');
  const frameSeamLabel = document.getElementById('frame-seam-label');
  const modularThicknessLabel = document.getElementById('modular-thickness-label');
  const modularSeamLabel = document.getElementById('modular-seam-label');
  const modularOverhangLabel = document.getElementById('modular-overhang-label');
  
  if (tileThicknessFrameLabel) tileThicknessFrameLabel.textContent = `Товщина`;
  if (tileBorderWidthLabel) tileBorderWidthLabel.textContent = `Ширина рамки (${unitText})`;
  if (tileOverhangLabel) tileOverhangLabel.textContent = `Виступ (${unitText})`;
  if (frameSeamLabel) frameSeamLabel.textContent = `Шов між плитками (мм)`; // Шви завжди в мм
  if (modularThicknessLabel) modularThicknessLabel.textContent = `Товщина (${unitText}):`;
  if (modularSeamLabel) modularSeamLabel.textContent = `Шов (мм)`; // Шви завжди в мм
  if (modularOverhangLabel) modularOverhangLabel.textContent = `Виступ (${unitText}):`;
  
  // Облицювання
  const claddingThicknessLabel = document.getElementById('cladding-thickness-label');
  if (claddingThicknessLabel) claddingThicknessLabel.textContent = `Товщина (${unitText})`;
  
  // Кутова огорожа
  const fenceCornerPostHeightLabel = document.getElementById('fence-corner-post-height-label');
  const fenceCornerPostSizeLabel = document.getElementById('fence-corner-post-size-label');
  const fenceCornerSideHeightLabel = document.getElementById('fence-corner-side-height-label');
  const fenceCornerSideLengthLabel = document.getElementById('fence-corner-side-length-label');
  const fenceCornerSideThicknessLabel = document.getElementById('fence-corner-side-thickness-label');
  
  if (fenceCornerPostHeightLabel) fenceCornerPostHeightLabel.textContent = `Висота стовпа (${unitText})`;
  if (fenceCornerPostSizeLabel) fenceCornerPostSizeLabel.textContent = `Розмір стовпа (${unitText})`;
  if (fenceCornerSideHeightLabel) fenceCornerSideHeightLabel.textContent = `Висота панелі (${unitText})`;
  if (fenceCornerSideLengthLabel) fenceCornerSideLengthLabel.textContent = `Довжина панелі (${unitText})`;
  if (fenceCornerSideThicknessLabel) fenceCornerSideThicknessLabel.textContent = `Товщина панелі (${unitText})`;
  
  // Периметральна огорожа
  const fencePerimeterPostHeightLabel = document.getElementById('fence-perimeter-post-height-label');
  const fencePerimeterPostSizeLabel = document.getElementById('fence-perimeter-post-size-label');
  
  if (fencePerimeterPostHeightLabel) fencePerimeterPostHeightLabel.textContent = `Висота стовпа (${unitText})`;
  if (fencePerimeterPostSizeLabel) fencePerimeterPostSizeLabel.textContent = `Розмір стовпа (${unitText})`;
  
  // Підставка
  const standsHeightLabel = document.getElementById('stands-height-label');
  const standsWidthLabel = document.getElementById('stands-width-label');
  const standsDepthLabel = document.getElementById('stands-depth-label');
  
  if (standsHeightLabel) standsHeightLabel.textContent = `Висота (${unitText})`;
  if (standsWidthLabel) standsWidthLabel.textContent = `Ширина (${unitText})`;
  if (standsDepthLabel) standsDepthLabel.textContent = `Довжина (${unitText})`;
  
  // Проміжна
  const gapsHeightLabel = document.getElementById('gaps-height-label');
  const gapsWidthLabel = document.getElementById('gaps-width-label');
  const gapsDepthLabel = document.getElementById('gaps-depth-label');
  
  if (gapsHeightLabel) gapsHeightLabel.textContent = `Висота проміжної (${unitText})`;
  if (gapsWidthLabel) gapsWidthLabel.textContent = `Ширина проміжної (${unitText})`;
  if (gapsDepthLabel) gapsDepthLabel.textContent = `Довжина проміжної (${unitText})`;
  
  // Відстань між стелами
  const steleDistanceLabel = document.getElementById('stele-distance-label');
  if (steleDistanceLabel) steleDistanceLabel.textContent = `Відстань між стелами (${unitText})`;
}

// Форматування значення для відображення
function formatValue(value, unit = null) {
  const u = unit || currentUnit;
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return value;
  
  if (u === 'mm') {
    return `${Math.round(numValue)}мм`;
  } else if (u === 'cm') {
    return `${numValue.toFixed(0)}см`; // Прибираємо десяткові знаки для см
  }
  
  return value;
}

// Конвертація значення в мм для відправки в Ruby
function convertToMm(value, isSeam = false) {
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return value;
  
  // Шви завжди вже в мм, не потребують конвертації
  if (isSeam) {
    return numValue;
  }
  
  if (currentUnit === 'mm') {
    return numValue;
  } else if (currentUnit === 'cm') {
    return Math.round(numValue * 10);
  }
  
  return numValue;
}



// Функція для вибору товщини плитки
function selectThickness(button) {
  // Видаляємо активний клас з усіх кнопок
  const buttons = document.querySelectorAll('.thickness-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  // Додаємо активний клас до натиснутої кнопки
  button.classList.add('active');
  
  // Оновлюємо відображення
  updateAllDisplays();
  
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
  updateAllDisplays();
  
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

// Функція для оновлення тексту кнопок шву при зміні одиниць
function updateSeamButtons() {
  const buttons = document.querySelectorAll('.seam-btn');
  buttons.forEach(button => {
    const originalValue = button.dataset.originalValue || button.dataset.value;
    
    // Зберігаємо оригінальне значення в мм при першому виклику
    if (!button.dataset.originalValue) {
      button.dataset.originalValue = button.dataset.value;
    }
    
    // Шви завжди відображаються в мм, незалежно від поточних одиниць
    button.textContent = `${originalValue} мм`;
    button.dataset.value = originalValue;
  });
}

// Функція для скидання опцій товщини плитки до початкових значень (для зворотної сумісності)
function resetTileThicknessOptions() {
  debugLog(` Функція resetTileThicknessOptions застаріла, використовуйте кнопки`, 'warning');
}

// Функція для оновлення значення слайдера



// ========== MISSING FUNCTIONS ==========

// Глобальні змінні для функціональності
let currentTheme = 'light';
let currentAccent = 'blue';



// ========== THEME FUNCTIONS ==========
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
// Функція для перемикання debug логу
function toggleDebugLog() {
  const debugLog = document.getElementById('debug-log');
  const debugToggle = document.getElementById('debug-toggle');
  
  if (debugLog.style.display === 'none') {
    debugLog.style.display = 'block';
    debugToggle.textContent = 'Hide Debug';
  } else {
    debugLog.style.display = 'none';
    debugToggle.textContent = 'Debug';
  }
}


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
let currentPreviewData = null;
let previewSettings = {
  size: 512,
  quality: 'medium'
};

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

