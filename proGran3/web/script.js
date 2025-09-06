// progran3/web/script.js

// --- ГЛОБАЛЬНІ ЗМІННІ ---
let modelLists = {};
let carouselState = {
  stands: { index: 0 },
  steles: { index: 0 },
  flowerbeds: { index: 0 },
  gravestones: { index: 0 },
  fence_decor: { index: 0 }
};

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
        // Додатково ініціалізуємо каруселі для нового таба
  initializeCarouselsForTab(tabName);
  
  // Спеціальна обробка для таба gravestone
  if (tabName === 'gravestone') {
    setTimeout(() => {
      debugLog(`🎠 Спеціальна ініціалізація каруселі gravestones для таба gravestone`, 'info');
      if (CarouselManager.hasCarousel('gravestones') && modelLists['gravestones']) {
        const trackElement = document.getElementById('gravestones-carousel-track');
        const viewportElement = document.getElementById('gravestones-carousel-viewport');
        
        if (trackElement && viewportElement) {
          debugLog(`✅ Спеціально ініціалізуємо карусель gravestones для таба gravestone`, 'success');
          initializeGravestonesCarousel('gravestones');
        } else {
          debugLog(`❌ Не знайдено елементи каруселі gravestones для таба gravestone`, 'error');
        }
      } else {
        debugLog(`⚠️ Карусель gravestones не доступна або немає моделей для таба gravestone`, 'warning');
      }
    }, 300);
  }
  
  // Спеціальна обробка для таба fence
  if (tabName === 'fence') {
    setTimeout(() => {
      debugLog(`🎠 Спеціальна ініціалізація каруселі fence_decor для таба fence`, 'info');
      debugLog(`🔍 Діагностика для таба fence:`, 'info');
      debugLog(`   - hasCarousel: ${CarouselManager.hasCarousel('fence_decor')}`, 'info');
      debugLog(`   - modelLists['fence_decor']: ${!!modelLists['fence_decor']}`, 'info');
      debugLog(`   - кількість моделей: ${modelLists['fence_decor']?.length || 0}`, 'info');
      debugLog(`   - моделі: ${modelLists['fence_decor']?.join(', ') || 'немає'}`, 'info');
      
      if (CarouselManager.hasCarousel('fence_decor') && modelLists['fence_decor']) {
        const trackElement = document.getElementById(CarouselManager.getCarouselElementId('fence_decor', 'track'));
        const viewportElement = document.getElementById(CarouselManager.getCarouselElementId('fence_decor', 'viewport'));
        
        debugLog(`   - trackElement: ${!!trackElement}`, 'info');
        debugLog(`   - viewportElement: ${!!viewportElement}`, 'info');
        debugLog(`   - trackId: ${CarouselManager.getCarouselElementId('fence_decor', 'track')}`, 'info');
        debugLog(`   - viewportId: ${CarouselManager.getCarouselElementId('fence_decor', 'viewport')}`, 'info');
        
        if (trackElement && viewportElement) {
          debugLog(`✅ Спеціально ініціалізуємо карусель fence_decor для таба fence`, 'success');
          CarouselManager.initialize('fence_decor');
        } else {
          debugLog(`❌ Не знайдено елементи каруселі fence_decor для таба fence`, 'error');
        }
      } else {
        debugLog(`⚠️ Карусель fence_decor не доступна або немає моделей для таба fence`, 'warning');
      }
    }, 300);
  }
    }, 100);
    
    
}

// Оновлення каруселей в активному табі
function updateCarouselsInActiveTab() {
  const activeTabContent = document.querySelector('.tab-content.active');
  if (activeTabContent) {
    // Знаходимо всі каруселі в активному табі
    const carousels = activeTabContent.querySelectorAll('.carousel-container');
    carousels.forEach(carousel => {
      // Тригеримо оновлення каруселі
      const viewport = carousel.querySelector('.carousel-viewport');
      if (viewport) {
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
    'elements': ['steles'],
    'fence': ['fence_decor']
  };
  
  const carouselTypes = tabCarousels[tabName] || [];
  carouselTypes.forEach(category => {
    debugLog(`🔍 Перевіряємо карусель ${category} для таба ${tabName}`, 'info');
    
    if (CarouselManager.hasCarousel(category) && modelLists[category]) {
      const trackElement = document.getElementById(CarouselManager.getCarouselElementId(category, 'track'));
      const viewportElement = document.getElementById(CarouselManager.getCarouselElementId(category, 'viewport'));
      
      // Додаткова діагностика для fence_decor
      if (category === 'fence_decor') {
        debugLog(`🎯 Спеціальна діагностика для fence_decor:`, 'info');
        debugLog(`   - hasCarousel: ${CarouselManager.hasCarousel(category)}`, 'info');
        debugLog(`   - modelLists[category]: ${!!modelLists[category]}`, 'info');
        debugLog(`   - кількість моделей: ${modelLists[category]?.length || 0}`, 'info');
        debugLog(`   - trackElement: ${!!trackElement}`, 'info');
        debugLog(`   - viewportElement: ${!!viewportElement}`, 'info');
        debugLog(`   - trackId: ${CarouselManager.getCarouselElementId(category, 'track')}`, 'info');
        debugLog(`   - viewportId: ${CarouselManager.getCarouselElementId(category, 'viewport')}`, 'info');
      }
      
      if (trackElement && viewportElement) {
        debugLog(`✅ Ініціалізуємо карусель ${category} для таба ${tabName}`, 'success');
        
        // Спеціальна обробка для gravestones з превью
        if (category === 'gravestones') {
          initializeGravestonesCarousel(category);
        } else {
          CarouselManager.initialize(category);
        }
      } else {
        debugLog(`❌ Не знайдено елементи каруселі ${category} для таба ${tabName}`, 'error');
      }
    } else {
      debugLog(`⚠️ Карусель ${category} не доступна або немає моделей для таба ${tabName}`, 'warning');
    }
  });
}

// Ініціалізація табів
function initializeTabs() {
  debugLog(`🚀 Ініціалізація табів`, 'info');
  
  // Перевіряємо наявність навігації табів
  const tabsNavigation = document.querySelector('.tabs-navigation');
  if (!tabsNavigation) {
    debugLog(`❌ Не знайдено навігацію табів`, 'error');
    return;
  }
  
  // Перевіряємо наявність контенту табів
  const tabContents = document.querySelectorAll('.tab-content');
  if (tabContents.length === 0) {
    debugLog(`❌ Не знайдено контент табів`, 'error');
    return;
  }
  
  debugLog(`✅ Знайдено ${tabContents.length} табів`, 'success');
  
  // Встановлюємо активний таб за замовчуванням
  switchTab('base');
  
  // Додаємо обробники подій для кнопок табів
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const tabName = this.getAttribute('data-tab');
      if (tabName) {
        debugLog(`🔄 Переключення на таб: ${tabName}`, 'info');
        switchTab(tabName);
      }
    });
  });
  
  debugLog(`✅ Таби ініціалізовані успішно`, 'success');
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
    console.log(`🎨 Зареєстровано нову карусель: ${category}`);
  },

  // Отримання конфігурації каруселі
  getCarouselConfig(category) {
    return this.carousels[category] || null;
  },

  // Перевірка чи існує карусель
  hasCarousel(category) {
    return category in this.carousels;
  },

  // Ініціалізація каруселі
  initialize(category, options = {}) {
    debugLog(`🚀 CarouselManager.initialize викликано для ${category}`, 'info');
    
    const config = { ...this.carousels[category], ...options };
    const track = document.getElementById(this.getCarouselElementId(category, 'track'));
    const viewport = document.getElementById(this.getCarouselElementId(category, 'viewport'));
    
    // Додаткова діагностика для fence_decor
    if (category === 'fence_decor') {
      debugLog(`🎯 Діагностика fence_decor в initialize:`, 'info');
      debugLog(`   - config: ${JSON.stringify(config)}`, 'info');
      debugLog(`   - track: ${!!track}`, 'info');
      debugLog(`   - viewport: ${!!viewport}`, 'info');
      debugLog(`   - modelLists[category]: ${!!modelLists[category]}`, 'info');
      debugLog(`   - кількість моделей: ${modelLists[category]?.length || 0}`, 'info');
      debugLog(`   - trackId: ${this.getCarouselElementId(category, 'track')}`, 'info');
      debugLog(`   - viewportId: ${this.getCarouselElementId(category, 'viewport')}`, 'info');
    }
    
    if (!track || !viewport || !modelLists[category] || modelLists[category].length === 0) {
      debugLog(`❌ Не вдалося ініціалізувати карусель ${category}: track=${!!track}, viewport=${!!viewport}, моделі=${!!modelLists[category]}, кількість=${modelLists[category]?.length || 0}`, 'error');
      return;
    }
    
    debugLog(`✅ Створюємо ${modelLists[category].length} елементів для ${category}`, 'success');
    
    track.innerHTML = '';
    
    modelLists[category].forEach(filename => {
      const item = this.createCarouselItem(category, filename, config);
      track.appendChild(item);
    });
    
    this.setupCarouselEvents(category, viewport);
    
    debugLog(`⏰ Запускаємо showCarouselItem для ${category}[0] через 100мс`, 'info');
    
    setTimeout(() => {
      this.showCarouselItem(category, 0);
      // Ледаче завантаження для першого елемента (як у тестовій логіці)
      this.loadOrGeneratePreview(category, 0);
    }, 100);
  },

  // Створення елемента каруселі - з підтримкою дизайнів
  createCarouselItem(category, filename, config) {
    const item = document.createElement('div');
    item.className = 'carousel-item';
    
    // Додаємо CSS клас для дизайну
    const design = config.design || 'default';
    item.classList.add(`design-${design}`);
    
    // Всі елементи використовують динамічне превью з ледачим завантаженням
    item.dataset.status = 'idle';
    item.dataset.filename = filename;
    item.dataset.category = category;
    item.dataset.design = design;
    
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-indicator';
    loadingDiv.textContent = 'Готово до завантаження';
    item.appendChild(loadingDiv);
    
    return item;
  },

  // Налаштування подій каруселі
  setupCarouselEvents(category, viewport) {
    viewport.addEventListener('wheel', (event) => {
      event.preventDefault();
      this.moveCarousel(category, event.deltaY > 0 ? 1 : -1);
    });
  },

  // Показ елемента каруселі
  showCarouselItem(category, index) {
    debugLog(`🎯 CarouselManager.showCarouselItem викликано для ${category}[${index}]`, 'info');
    
    const track = document.getElementById(this.getCarouselElementId(category, 'track'));
    const viewport = document.getElementById(this.getCarouselElementId(category, 'viewport'));
    const items = track.querySelectorAll('.carousel-item');
    
    if (!track || items.length === 0 || !items[index]) {
      debugLog(`❌ Не вдалося знайти елементи для ${category}[${index}]`, 'error');
      return;
    }

    items.forEach((item, i) => {
      item.classList.toggle('active', i === index);
    });
    
    const viewportCenter = viewport.offsetWidth / 2;
    const targetItem = items[index];
    const itemCenter = targetItem.offsetLeft + targetItem.offsetWidth / 2;
    const newTransform = viewportCenter - itemCenter;

    carouselState[category].index = index;
    track.style.transform = `translateX(${newTransform}px)`;
    
    debugLog(`🔄 Запуск завантаження для ${category}[${index}] та сусідів`, 'info');
    
    // Ледаче завантаження для активного елемента та сусідів (як у тестовій логіці)
    this.loadOrGeneratePreview(category, index);
    if (index + 1 < items.length) this.loadOrGeneratePreview(category, index + 1);
    if (index - 1 >= 0) this.loadOrGeneratePreview(category, index - 1);
    
    updateAllDisplays();
  },

  // Ледаче завантаження превью - тепер тільки генерація
  loadOrGeneratePreview(category, index) {
    debugLog(`🔍 CarouselManager.loadOrGeneratePreview викликано для ${category}[${index}]`, 'info');
    
    const track = document.getElementById(this.getCarouselElementId(category, 'track'));
    if (!track) {
      debugLog(`❌ Не знайдено track для категорії: ${category}`, 'error');
      return;
    }
    
    const items = track.querySelectorAll('.carousel-item');
    const item = items[index];
    if (!item) {
      debugLog(`❌ Не знайдено item з індексом ${index} для категорії: ${category}`, 'error');
      return;
    }

    const currentStatus = item.dataset.status;
    debugLog(`📊 Статус елемента ${category}[${index}]: ${currentStatus}`, 'info');
    
    if (currentStatus === 'loaded' || currentStatus === 'pending') {
      debugLog(`⏭️ Пропущено завантаження для ${category}[${index}] - статус: ${currentStatus}`, 'warning');
      return;
    }

    const filename = item.dataset.filename || (modelLists[category] && modelLists[category][index]);
    if (!filename) {
      debugLog(`❌ Не знайдено filename для ${category}[${index}]`, 'error');
      return;
    }

    const componentPath = `${category}/${filename}`;
    
    // Перевіряємо, чи вже є pending для цього шляху
    if (window.pendingPreviews && window.pendingPreviews[componentPath]) {
      debugLog(`⏭️ Пропущено завантаження для ${componentPath} - вже в pending`, 'warning');
      return;
    }

    debugLog(`🔄 Завантаження превью для ${componentPath} (індекс: ${index})`, 'info');

    let loadingDiv = item.querySelector('.loading-indicator');
    if (!loadingDiv) {
      loadingDiv = document.createElement('div');
      loadingDiv.className = 'loading-indicator';
      item.appendChild(loadingDiv);
    }
    loadingDiv.textContent = 'Генерація превью...';

    item.dataset.status = 'pending';

    // Відразу запускаємо генерацію превью
    this.autoGeneratePreview(category, filename, item, loadingDiv);
  },

  // Автоматична генерація превью
  autoGeneratePreview(category, filename, item, loadingDiv) {
    if (!window.sketchup) {
      debugLog(`❌ window.sketchup не доступний для: ${category}/${filename}`, 'error');
      createPlaceholder(item, loadingDiv, `Помилка генерації\n${filename}`);
      return;
    }
    
    const componentPath = `${category}/${filename}`;
    debugLog(`🚀 Запуск генерації превью для: ${componentPath}`, 'info');
    
    try {
      window.sketchup.generate_web_preview(componentPath);
      debugLog(`✅ Ruby callback викликано для: ${componentPath}`, 'success');
    } catch (error) {
      debugLog(`❌ Помилка виклику Ruby callback: ${error.message}`, 'error');
      createPlaceholder(item, loadingDiv, `Помилка генерації\n${filename}`);
      return;
    }
    
    window.pendingPreviews = window.pendingPreviews || {};
    window.pendingPreviews[componentPath] = { item, loadingDiv, filename, source: 'CarouselManager' };
    
    debugLog(`📝 Додано до pending: ${componentPath} (CarouselManager)`, 'info');
    debugLog(`📋 Всього pending: ${Object.keys(window.pendingPreviews).length}`, 'info');
    
    // Таймаут для pending елементів (10 секунд)
    setTimeout(() => {
      if (window.pendingPreviews && window.pendingPreviews[componentPath]) {
        debugLog(`⏰ Таймаут для: ${componentPath}`, 'warning');
        const pendingData = window.pendingPreviews[componentPath];
        if (pendingData.item && pendingData.loadingDiv) {
          createPlaceholder(pendingData.item, pendingData.loadingDiv, `Таймаут генерації\n${filename}`);
          pendingData.item.dataset.status = 'timeout';
        }
        delete window.pendingPreviews[componentPath];
      }
    }, 10000);
  },



  // Створення заглушки
  createPlaceholder(item, loadingDiv, text) {
    createPlaceholder(item, loadingDiv, text);
  },

  // Рух каруселі
  moveCarousel(category, direction) {
    const state = carouselState[category];
    const newIndex = state.index + direction;
    const track = document.getElementById(this.getCarouselElementId(category, 'track'));
    const items = track.querySelectorAll('.carousel-item');
    
    if (newIndex >= 0 && newIndex < items.length) {
      this.showCarouselItem(category, newIndex);
    }
  },

  // Додавання моделі
  addModel(category) {
    const state = carouselState[category];
    const filename = modelLists[category][state.index];
    
    if (window.sketchup && window.sketchup.add_model) {
      window.sketchup.add_model(category, filename);
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
    
    console.log(`🎨 Зареєстровано нову карусель: ${category}`);
  },

  // Автоматична ініціалізація всіх каруселей
  initializeAllCarousels() {
    debugLog(`🚀 initializeAllCarousels викликано`, 'info');
    debugLog(`📋 Доступні каруселі: ${Object.keys(this.carousels).join(', ')}`, 'info');
    
    // Додаткова перевірка для gravestones
    if (this.carousels.gravestones) {
      debugLog(`✅ Карусель gravestones знайдена в конфігурації`, 'success');
    } else {
      debugLog(`❌ Карусель gravestones не знайдена в конфігурації`, 'error');
    }
    
    // Додаткова перевірка для fence_decor
    if (this.carousels.fence_decor) {
      debugLog(`✅ Карусель fence_decor знайдена в конфігурації`, 'success');
    } else {
      debugLog(`❌ Карусель fence_decor не знайдена в конфігурації`, 'error');
    }
    
    Object.keys(this.carousels).forEach(category => {
      debugLog(`🔍 Перевіряємо карусель: ${category}`, 'info');
      
      const trackElement = document.getElementById(this.getCarouselElementId(category, 'track'));
      const viewportElement = document.getElementById(this.getCarouselElementId(category, 'viewport'));
      
      debugLog(`🔍 Перевірка каруселі ${category}: моделі=${!!modelLists[category]}, кількість=${modelLists[category]?.length || 0}, track=${!!trackElement}, viewport=${!!viewportElement}`, 'info');
      
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
      
      // Додаткова перевірка для fence_decor
      if (category === 'fence_decor') {
        debugLog(`🎯 Спеціальна перевірка для fence_decor:`, 'info');
        debugLog(`   - trackElement: ${!!trackElement}`, 'info');
        debugLog(`   - viewportElement: ${!!viewportElement}`, 'info');
        debugLog(`   - modelLists[fence_decor]: ${!!modelLists[category]}`, 'info');
        debugLog(`   - кількість моделей: ${modelLists[category]?.length || 0}`, 'info');
        if (modelLists[category]) {
          debugLog(`   - моделі: ${modelLists[category].join(', ')}`, 'info');
        }
      }
      
      if (modelLists[category] && trackElement && viewportElement) {
        debugLog(`✅ Умови виконані для ${category}, запускаємо initialize`, 'success');
        this.initialize(category);
        debugLog(`✅ Автоматично ініціалізовано карусель: ${category}`, 'success');
      } else {
        debugLog(`❌ Не вдалося ініціалізувати карусель: ${category}`, 'error');
        debugLog(`❌ Деталі для ${category}: моделі=${!!modelLists[category]}, track=${!!trackElement}, viewport=${!!viewportElement}`, 'error');
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
    debugLog.innerHTML = '<div>🔍 Очікування логів...</div>';
  }
}

// --- ІНІЦІАЛІЗАЦІЯ ---
window.onload = function () {
  debugLog(`🚀 window.onload викликано`, 'info');
  
  // Ініціалізуємо додаток одразу
  debugLog(`🔄 Викликаємо initializeApp()`, 'info');
  initializeApp();
  
  // Запускаємо готовність
  if (window.sketchup && window.sketchup.ready) {
    debugLog(`📞 Викликаємо window.sketchup.ready()`, 'info');
    window.sketchup.ready();
  } else {
    debugLog(`❌ window.sketchup.ready не доступний`, 'error');
  }
};

// Ініціалізація додатку
function initializeApp() {
  debugLog(`🚀 initializeApp викликано`, 'info');
  
  // Ініціалізація табів
  initializeTabs();
  
  // Ініціалізація UI (без повторного виклику ready)
  if(document.querySelector('.tiling-mode-btn')) {
    debugLog(`✅ Знайдено кнопки способу укладання, оновлюємо контроли`, 'success');
    updateTilingControls();
  } else {
    debugLog(`❌ Не знайдено кнопки способу укладання`, 'error');
  }
  
  // Ініціалізація контролів відмостки
  if(document.getElementById('blind-area-mode')) {
    debugLog(`✅ Знайдено blind-area-mode, оновлюємо контроли`, 'success');
    updateBlindAreaControls();
  } else {
    debugLog(`❌ Не знайдено blind-area-mode`, 'error');
  }
  
  // Перевірка полів плитки
  debugLog(`🔍 Перевірка полів плитки...`, 'info');
  const tileBorderWidth = document.getElementById('tile-border-width');
  const tileOverhang = document.getElementById('tile-overhang');
  const modularThickness = document.getElementById('modular-thickness');
  const modularOverhang = document.getElementById('modular-overhang');
  
  // Перевіряємо кнопки товщини
  const thicknessButtons = document.querySelectorAll('.thickness-btn');
  if (thicknessButtons.length > 0) {
    debugLog(`✅ Знайдено ${thicknessButtons.length} кнопок товщини плитки`, 'success');
    updateThicknessButtons(); // Оновлюємо відображення кнопок товщини
    const activeThickness = getSelectedThickness();
    debugLog(`✅ Активна товщина: ${activeThickness}`, 'success');
  } else {
    debugLog(`❌ Не знайдено кнопки товщини плитки`, 'error');
  }
  
  // Перевіряємо кнопки шву
  const seamButtons = document.querySelectorAll('.seam-btn');
  if (seamButtons.length > 0) {
    debugLog(`✅ Знайдено ${seamButtons.length} кнопок шву`, 'success');
    updateSeamButtons(); // Оновлюємо відображення кнопок шву
    const activeSeam = getSelectedSeam();
    debugLog(`✅ Активний шов: ${activeSeam} мм`, 'success');
  } else {
    debugLog(`❌ Не знайдено кнопки шву`, 'error');
  }
  
  if (tileBorderWidth) {
    debugLog(`✅ Знайдено поле ширини рамки: ${tileBorderWidth.value}`, 'success');
  } else {
    debugLog(`❌ Не знайдено поле ширини рамки`, 'error');
  }
  
  if (tileOverhang) {
    debugLog(`✅ Знайдено поле виступу: ${tileOverhang.value}`, 'success');
  } else {
    debugLog(`❌ Не знайдено поле виступу`, 'error');
  }
  
  if (modularThickness) {
    debugLog(`✅ Знайдено поле товщини модульної: ${modularThickness.value}`, 'success');
  } else {
    debugLog(`❌ Не знайдено поле товщини модульної`, 'error');
  }
  
  if (modularOverhang) {
    debugLog(`✅ Знайдено поле виступу модульної: ${modularOverhang.value}`, 'success');
  } else {
    debugLog(`❌ Не знайдено поле виступу модульної`, 'error');
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
  debugLog(`✅ Floating labels ініціалізовано`, 'success');
  
  debugLog(`🔄 Викликаємо updateAllDisplays()`, 'info');
  updateAllDisplays();
  updateUnitLabels();
  updateThicknessButtons();
  updateSeamButtons();
  
  
  
  // Ініціалізуємо тему
  initializeTheme();
  debugLog(`✅ Тема ініціалізована`, 'success');
  
  debugLog(`✅ initializeApp завершено`, 'success');
}

function loadModelLists(data) {
  debugLog(`📥 loadModelLists викликано`, 'info');
  debugLog(`📊 Отримано дані для категорій: ${Object.keys(data).join(', ')}`, 'info');
  
  // Додаткова перевірка для gravestones
  if (data.gravestones) {
    debugLog(`✅ Категорія gravestones знайдена з ${data.gravestones.length} моделями`, 'success');
    debugLog(`📋 Моделі gravestones: ${data.gravestones.join(', ')}`, 'info');
  } else {
    debugLog(`❌ Категорія gravestones не знайдена в даних`, 'error');
  }
  
  // Додаткова перевірка для fence_decor
  if (data.fence_decor) {
    debugLog(`✅ Категорія fence_decor знайдена з ${data.fence_decor.length} моделями`, 'success');
    debugLog(`📋 Моделі fence_decor: ${data.fence_decor.join(', ')}`, 'info');
  } else {
    debugLog(`❌ Категорія fence_decor не знайдена в даних`, 'error');
  }
  
  modelLists = data;
  
  // Використовуємо автоматичну ініціалізацію всіх каруселей
  debugLog(`🔄 Викликаємо CarouselManager.initializeAllCarousels()`, 'info');
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
        debugLog(`✅ Примусово ініціалізуємо карусель gravestones`, 'success');
        initializeGravestonesCarousel('gravestones');
      } else {
        debugLog(`❌ Не знайдено елементи каруселі gravestones для примусової ініціалізації`, 'error');
      }
    } else {
      debugLog(`⚠️ Карусель gravestones не доступна або немає моделей для примусової ініціалізації`, 'warning');
    }
  }, 500);
  
  // Примусово ініціалізуємо карусель fence_decor
  setTimeout(() => {
    debugLog(`🎠 Примусова ініціалізація каруселі fence_decor`, 'info');
    debugLog(`🔍 Діагностика примусової ініціалізації fence_decor:`, 'info');
    debugLog(`   - hasCarousel: ${CarouselManager.hasCarousel('fence_decor')}`, 'info');
    debugLog(`   - modelLists['fence_decor']: ${!!modelLists['fence_decor']}`, 'info');
    debugLog(`   - кількість моделей: ${modelLists['fence_decor']?.length || 0}`, 'info');
    debugLog(`   - моделі: ${modelLists['fence_decor']?.join(', ') || 'немає'}`, 'info');
    
    if (CarouselManager.hasCarousel('fence_decor') && modelLists['fence_decor']) {
      const trackElement = document.getElementById(CarouselManager.getCarouselElementId('fence_decor', 'track'));
      const viewportElement = document.getElementById(CarouselManager.getCarouselElementId('fence_decor', 'viewport'));
      
      debugLog(`   - trackElement: ${!!trackElement}`, 'info');
      debugLog(`   - viewportElement: ${!!viewportElement}`, 'info');
      debugLog(`   - trackId: ${CarouselManager.getCarouselElementId('fence_decor', 'track')}`, 'info');
      debugLog(`   - viewportId: ${CarouselManager.getCarouselElementId('fence_decor', 'viewport')}`, 'info');
      
      if (trackElement && viewportElement) {
        debugLog(`✅ Примусово ініціалізуємо карусель fence_decor`, 'success');
        CarouselManager.initialize('fence_decor');
      } else {
        debugLog(`❌ Не знайдено елементи каруселі fence_decor для примусової ініціалізації`, 'error');
      }
    } else {
      debugLog(`⚠️ Карусель fence_decor не доступна або немає моделей для примусової ініціалізації`, 'warning');
    }
  }, 600);
  
  
  
  // Ініціалізуємо основну карусель стел (копія тестової логіки)
  if (modelLists['steles'] && document.getElementById('steles-carousel-track')) {
    debugLog(`🏛️ Ініціалізуємо основну карусель стел (копія тестової)`, 'info');
    initializeMainStelesCarousel('steles');
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
  // Знаходимо батьківську панель кнопки
  const currentPanel = buttonElement.closest('.panel');
  
  // Знаходимо всі панелі в поточному активному табі
  const activeTabContent = document.querySelector('.tab-content.active');
  if (!activeTabContent) {
    debugLog(`❌ Не знайдено активний таб для advanceToNextPanel`, 'error');
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
  
  debugLog(`🔄 advanceToNextPanel: поточна панель ${currentIndex + 1}/${allPanelsInTab.length} в табі ${activeTab}`, 'info');
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
  
  viewport.addEventListener('wheel', (event) => {
    event.preventDefault();
    moveMainStelesCarousel(category, event.deltaY > 0 ? 1 : -1);
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
  debugLog(`🚀 Запуск генерації превью для: ${componentPath} (MainSteles)`, 'info');
  
  // Генеруємо веб-превью через SketchUp
  window.sketchup.generate_web_preview(componentPath);
  
  // Зберігаємо посилання на елементи для callback
  window.pendingPreviews = window.pendingPreviews || {};
  window.pendingPreviews[componentPath] = { item, loadingDiv, filename, source: 'MainSteles' };
  
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
  debugLog(`🔍 Перші 50 символів base64: ${base64Data ? base64Data.substring(0, 50) : 'null'}`, 'info');
  
  const pendingData = window.pendingPreviews && window.pendingPreviews[componentPath];
  if (!pendingData) {
    debugLog(`❌ Не знайдено pending дані для: ${componentPath}`, 'error');
    debugLog(`📋 Доступні pending: ${Object.keys(window.pendingPreviews || {}).join(', ')}`, 'error');
    return;
  }
  
  const { item, loadingDiv, filename, source } = pendingData;
  debugLog(`✅ Знайдено pending дані для: ${filename} (${source})`, 'success');
  
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
      debugLog(`✅ Зображення додано для: ${filename}`, 'success');
    }
    
  } else {
    debugLog(`❌ Помилка: base64 дані не є валідним зображенням для: ${filename}`, 'error');
    // Якщо не вдалося згенерувати, показуємо заглушку
    if (item && loadingDiv) createPlaceholder(item, loadingDiv, `Помилка генерації\n${filename}`);
  }
  
  // Очищаємо pending
  delete window.pendingPreviews[componentPath];
  debugLog(`🧹 Очищено pending для: ${componentPath}`, 'info');
}

// Функція для обробки помилки генерації превью
function handlePreviewError(componentPath, errorMessage) {
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
  
  if (newIndex >= 0 && newIndex < items.length) {
    showMainStelesCarouselItem(category, newIndex);
  }
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
    } else { debugLog(`❌ window.sketchup.add_blind_area_uniform не доступний`, 'error'); }
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
    } else { debugLog(`❌ window.sketchup.add_blind_area_custom не доступний`, 'error'); }
  }
}



function updateAllDisplays() {
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
  
  // Оновлення підсумкової таблиці
  updateSummaryTable();
}

function updateModelDisplays() {
  // Оновлення відображення підставки
  if (carouselState.stands && modelLists.stands) {
    const standIndex = carouselState.stands.index;
    const standFilename = modelLists.stands[standIndex];
    if (standFilename) {
      document.getElementById('stands-dimensions-display').textContent = 
        standFilename.replace('.skp', '');
    }
  }
  
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
  const unitText = currentUnit === 'mm' ? 'мм' : 'см';
  
  // Фундамент
  if (addedElements.foundation) {
    const foundationDepth = document.getElementById('foundation-depth').value;
    const foundationWidth = document.getElementById('foundation-width').value;
    const foundationHeight = document.getElementById('foundation-height').value;
    document.getElementById('summary-foundation').textContent = 
      `${foundationDepth}×${foundationWidth}×${foundationHeight} ${unitText}`;
  } else {
    document.getElementById('summary-foundation').textContent = '--';
  }
  
  // Плитка
  if (addedElements.tiling) {
    const activeButton = document.querySelector('.tiling-mode-btn.active');
    if (activeButton) {
      document.getElementById('summary-tiling').textContent = activeButton.textContent;
    }
  } else {
    document.getElementById('summary-tiling').textContent = '--';
  }
  
  // Облицювання
  if (addedElements.cladding) {
    const claddingThickness = document.getElementById('cladding-thickness').value;
    document.getElementById('summary-cladding').textContent = 
      `Товщина: ${claddingThickness} ${unitText}`;
  } else {
    document.getElementById('summary-cladding').textContent = '--';
  }
  
  // Відмостка
  if (addedElements.blindArea) {
    const blindAreaThickness = document.getElementById('blind-area-thickness').value;
    const blindAreaMode = document.getElementById('blind-area-mode').value;
    
    if (blindAreaMode === 'uniform') {
      const uniformWidth = document.getElementById('blind-area-uniform-width').value;
      document.getElementById('summary-blind-area').textContent = 
        `Ширина: ${uniformWidth} ${unitText}, Товщина: ${blindAreaThickness} ${unitText}`;
    } else {
      const blindAreaNorth = document.getElementById('blind-area-north').value;
      const blindAreaSouth = document.getElementById('blind-area-south').value;
      const blindAreaEast = document.getElementById('blind-area-east').value;
      const blindAreaWest = document.getElementById('blind-area-west').value;
      document.getElementById('summary-blind-area').textContent = 
        `П:${blindAreaNorth} Пд:${blindAreaSouth} С:${blindAreaEast} З:${blindAreaWest} ${unitText}, Т:${blindAreaThickness} ${unitText}`;
    }
  } else {
    document.getElementById('summary-blind-area').textContent = '--';
  }
  
  // Підставка
  if (addedElements.stands && carouselState.stands && modelLists.stands) {
    const standFilename = modelLists.stands[carouselState.stands.index];
    document.getElementById('summary-stand').textContent = 
      standFilename ? standFilename.replace('.skp', '') : '--';
  } else {
    document.getElementById('summary-stand').textContent = '--';
  }
  
  // Квітник
  if (addedElements.flowerbeds && carouselState.flowerbeds && modelLists.flowerbeds) {
    const flowerbedFilename = modelLists.flowerbeds[carouselState.flowerbeds.index];
    document.getElementById('summary-flowerbed').textContent = 
      flowerbedFilename ? flowerbedFilename.replace('.skp', '') : '--';
  } else {
    document.getElementById('summary-flowerbed').textContent = '--';
  }
  
  // Надгробна плита
  if (addedElements.gravestones && carouselState.gravestones && modelLists.gravestones) {
    const gravestoneFilename = modelLists.gravestones[carouselState.gravestones.index];
    document.getElementById('summary-gravestone').textContent = 
      gravestoneFilename ? gravestoneFilename.replace('.skp', '') : '--';
  } else {
    document.getElementById('summary-gravestone').textContent = '--';
  }
  
  // Стела
  if (addedElements.steles && carouselState.steles && modelLists.steles) {
    const steleFilename = modelLists.steles[carouselState.steles.index];
    document.getElementById('summary-stele').textContent = 
      steleFilename ? steleFilename.replace('.skp', '') : '--';
  } else {
    document.getElementById('summary-stele').textContent = '--';
  }
  
  // Кутова огорожа
  if (addedElements.fence_corner) {
    const postHeight = document.getElementById('fence-corner-post-height').value;
    const postSize = document.getElementById('fence-corner-post-size').value;
    const sideHeight = document.getElementById('fence-corner-side-height').value;
    const sideLength = document.getElementById('fence-corner-side-length').value;
    const decorativeSize = 100; // Фіксоване значення
    
    document.getElementById('summary-fence-corner').textContent = 
      `Стовп: ${postHeight}×${postSize}×${postSize}${unitText}, Панель: ${sideHeight}×${sideLength}${unitText}, Декор: ${decorativeSize}${unitText}`;
  } else {
    document.getElementById('summary-fence-corner').textContent = '--';
  }
  
  // Периметральна огорожа
  if (addedElements.fence_perimeter) {
    const postHeight = document.getElementById('fence-perimeter-post-height').value;
    const postSize = document.getElementById('fence-perimeter-post-size').value;
    const northCount = document.getElementById('fence-perimeter-north-count').value;
    const southCount = document.getElementById('fence-perimeter-south-count').value;
    const eastWestCount = document.getElementById('fence-perimeter-east-west-count').value;
    const decorativeHeight = 100; // Фіксоване значення
    const decorativeThickness = 100; // Фіксоване значення
    
    document.getElementById('summary-fence-perimeter').textContent = 
      `Стовп: ${postHeight}×${postSize}×${postSize}${unitText}, Сторони: З${northCount} В${southCount} Б${eastWestCount}, Декор: ${decorativeHeight}×${decorativeThickness}${unitText}`;
  } else {
    document.getElementById('summary-fence-perimeter').textContent = '--';
  }
  
  // Декор огорожі
  if (addedElements.fence_decor && carouselState.fence_decor && modelLists.fence_decor) {
    const fenceDecorFilename = modelLists.fence_decor[carouselState.fence_decor.index];
    document.getElementById('summary-fence-decor').textContent = 
      fenceDecorFilename ? fenceDecorFilename.replace('.skp', '') : '--';
  } else {
    document.getElementById('summary-fence-decor').textContent = '--';
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
  } else { debugLog(`❌ window.sketchup.add_foundation не доступний`, 'error'); }
}



function addTiles() {
  const mode = getSelectedTilingMode();
  debugLog(`🏗️ Додавання плитки, режим: ${mode}`, 'info');
  
  if (window.sketchup && window.sketchup.add_tiles) {
    if (mode === 'frame') {
      const borderWidthElement = document.getElementById('tile-border-width');
      const overhangElement = document.getElementById('tile-overhang');
      
      if (!borderWidthElement) {
        debugLog(`❌ Не знайдено поле ширини рамки (tile-border-width)`, 'error');
        return;
      }
      if (!overhangElement) {
        debugLog(`❌ Не знайдено поле виступу (tile-overhang)`, 'error');
        return;
      }
      
      const thickness = getSelectedThickness();
      const borderWidth = borderWidthElement.value;
      const overhang = overhangElement.value;
      
      debugLog(`📏 Параметри рамки: товщина=${thickness}, ширина=${borderWidth}, виступ=${overhang}`, 'info');
      
      // Конвертуємо в мм
      const thicknessMm = convertToMm(thickness);
      const borderWidthMm = convertToMm(borderWidth);
      const overhangMm = convertToMm(overhang);
      
      debugLog(`📏 Параметри в мм: товщина=${thicknessMm}, ширина=${borderWidthMm}, виступ=${overhangMm}`, 'info');
      
      window.sketchup.add_tiles('frame', thicknessMm, borderWidthMm, overhangMm);
    } else {
      const sizeElement = document.getElementById('modular-tile-size');
      const thicknessElement = document.getElementById('modular-thickness');
      const overhangElement = document.getElementById('modular-overhang');
      
      if (!sizeElement) {
        debugLog(`❌ Не знайдено поле розміру плитки (modular-tile-size)`, 'error');
        return;
      }
      if (!thicknessElement) {
        debugLog(`❌ Не знайдено поле товщини модульної плитки (modular-thickness)`, 'error');
        return;
      }
      if (!overhangElement) {
        debugLog(`❌ Не знайдено поле виступу модульної плитки (modular-overhang)`, 'error');
        return;
      }
      
      const size = sizeElement.value;
      const thickness = thicknessElement.value;
      const seam = getSelectedSeam();
      const overhang = overhangElement.value;
      
      debugLog(`📏 Параметри модульної: розмір=${size}, товщина=${thickness}, шов=${seam}, виступ=${overhang}`, 'info');
      
      // Конвертуємо в мм
      const thicknessMm = convertToMm(thickness);
      const seamMm = convertToMm(seam, true); // Шви завжди в мм
      const overhangMm = convertToMm(overhang);
      
      debugLog(`📏 Параметри в мм: товщина=${thicknessMm}, шов=${seamMm}, виступ=${overhangMm}`, 'info');
      
      window.sketchup.add_tiles('modular', size, thicknessMm, seamMm, overhangMm);
    }
    addedElements.tiling = true;
    updateSummaryTable();
    debugLog(`✅ Плитка додана успішно`, 'success');
  } else {
    debugLog(`❌ window.sketchup.add_tiles не доступний`, 'error');
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
  debugLog(`🔄 Оновлення специфікації з моделі`, 'info');
  
  if (window.sketchup && window.sketchup.get_model_status) {
    // Викликаємо Ruby callback для отримання поточного стану моделі
    window.sketchup.get_model_status();
  } else {
    debugLog(`❌ window.sketchup.get_model_status не доступний`, 'error');
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
    debugLog(`❌ Дані статусу не отримані`, 'error');
  }
  
  // Оновлюємо таблицю
  updateSummaryTable();
  debugLog(`✅ Специфікація оновлена`, 'success');
}

// Функції для створення відмостки

// Функції для роботи з одиницями вимірювання
function changeUnit(newUnit) {
  debugLog(`🔄 Зміна одиниці вимірювання: ${currentUnit} -> ${newUnit}`, 'info');
  
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
  
  debugLog(`✅ Одиниця вимірювання змінена на: ${newUnit}`, 'success');
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
  document.getElementById('foundation-depth-label').textContent = `Довжина (${unitText})`;
  document.getElementById('foundation-width-label').textContent = `Ширина (${unitText})`;
  document.getElementById('foundation-height-label').textContent = `Висота (${unitText})`;
  
  // Відмостка
  document.getElementById('blind-area-thickness-label').textContent = `Товщина (${unitText})`;
  document.getElementById('blind-area-uniform-width-label').textContent = `Ширина (${unitText})`;
  document.getElementById('blind-area-north-label').textContent = `Північна сторона (${unitText})`;
  document.getElementById('blind-area-south-label').textContent = `Південна сторона (${unitText})`;
  document.getElementById('blind-area-east-label').textContent = `Східна сторона (${unitText})`;
  document.getElementById('blind-area-west-label').textContent = `Західна сторона (${unitText})`;
  
  // Плитка
  document.getElementById('tile-thickness-frame-label').textContent = `Товщина`;
  document.getElementById('tile-border-width-label').textContent = `Ширина рамки (${unitText})`;
  document.getElementById('tile-overhang-label').textContent = `Виступ (${unitText})`;
  document.getElementById('modular-thickness-label').textContent = `Товщина (${unitText}):`;
  document.getElementById('modular-seam-label').textContent = `Шов (мм)`; // Шви завжди в мм
  document.getElementById('modular-overhang-label').textContent = `Виступ (${unitText}):`;
  
  // Облицювання
  document.getElementById('cladding-thickness-label').textContent = `Товщина (${unitText})`;
  
  // Кутова огорожа
  document.getElementById('fence-corner-post-height-label').textContent = `Висота стовпа (${unitText})`;
  document.getElementById('fence-corner-post-size-label').textContent = `Розмір стовпа (${unitText})`;
  document.getElementById('fence-corner-side-height-label').textContent = `Висота панелі (${unitText})`;
  document.getElementById('fence-corner-side-length-label').textContent = `Довжина панелі (${unitText})`;
  document.getElementById('fence-corner-side-thickness-label').textContent = `Товщина панелі (${unitText})`;
  
  // Периметральна огорожа
  document.getElementById('fence-perimeter-post-height-label').textContent = `Висота стовпа (${unitText})`;
  document.getElementById('fence-perimeter-post-size-label').textContent = `Розмір стовпа (${unitText})`;
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
  
  debugLog(`✅ Вибрано товщину плитки: ${button.dataset.value}`, 'success');
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
  
  debugLog(`✅ Вибрано спосіб укладання: ${button.dataset.value}`, 'success');
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
  
  debugLog(`✅ Вибрано шов: ${button.dataset.value} мм`, 'success');
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
  return activeButton ? activeButton.dataset.value : 'frame';
}

// Функція для отримання вибраного шву
function getSelectedSeam() {
  const activeButton = document.querySelector('.seam-btn.active');
  if (!activeButton) return '5';
  
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
  debugLog(`🔄 Функція resetTileThicknessOptions застаріла, використовуйте кнопки`, 'warning');
}

// Функція для оновлення значення слайдера
function updateSliderValue(slider) {
  const value = slider.value;
  const valueDisplay = slider.parentElement.querySelector('.slider-value-variant-5');
  if (valueDisplay) {
    valueDisplay.textContent = value;
  }
}



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

function changeAccent(color) {
  currentAccent = color;
  document.documentElement.setAttribute('data-accent', color);
  localStorage.setItem('accent', color);
  

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
function initializeGravestonesCarousel(category) {
  const track = document.getElementById(`${category}-carousel-track`);
  const viewport = document.getElementById(`${category}-carousel-viewport`);
  if (!track || !viewport || !modelLists[category] || modelLists[category].length === 0) return;
  
  track.innerHTML = '';

  modelLists[category].forEach((filename, index) => {
    const item = document.createElement('div');
    item.className = 'carousel-item';
    // Стан ледачого завантаження
    item.dataset.status = 'idle';
    item.dataset.filename = filename;
    item.dataset.index = index;
    // Початковий індикатор
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-indicator';
    loadingDiv.textContent = 'Готово до завантаження';
    item.appendChild(loadingDiv);
    
    // Додаємо обробник кліків для вибору елемента
    item.addEventListener('click', () => {
      showGravestonesCarouselItem(category, index);
    });
    
    track.appendChild(item);
  });
  
  viewport.addEventListener('wheel', (event) => {
    event.preventDefault();
    moveGravestonesCarousel(category, event.deltaY > 0 ? 1 : -1);
  });

  setTimeout(() => {
    showGravestonesCarouselItem(category, 0);
    // Ледаче завантаження для першого елемента
    loadOrGenerateGravestonesPreview(category, 0);
  }, 100); 
}

// Ледаче завантаження превью для каруселі надгробних плит
function loadOrGenerateGravestonesPreview(category, index) {
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
  autoGenerateGravestonesPreview(category, filename, item, loadingDiv);
}

// Автоматична генерація превью для каруселі надгробних плит
function autoGenerateGravestonesPreview(category, filename, item, loadingDiv) {
  if (!window.sketchup) {
    createPlaceholder(item, loadingDiv, `Помилка генерації\n${filename}`);
    return;
  }
  
  const componentPath = `${category}/${filename}`;
  debugLog(`🚀 Запуск генерації превью для: ${componentPath} (Gravestones)`, 'info');
  
  // Генеруємо веб-превью через SketchUp
  window.sketchup.generate_web_preview(componentPath);
  
  // Зберігаємо посилання на елементи для callback
  window.pendingPreviews = window.pendingPreviews || {};
  window.pendingPreviews[componentPath] = { item, loadingDiv, filename, source: 'Gravestones' };
  
  debugLog(`📝 Додано до pending: ${componentPath} (Gravestones)`, 'info');
}

// Переміщення каруселі надгробних плит
function moveGravestonesCarousel(category, direction) {
  const state = carouselState[category];
  const newIndex = state.index + direction;
  const track = document.getElementById(`${category}-carousel-track`);
  const items = track.querySelectorAll('.carousel-item');
  
  if (newIndex >= 0 && newIndex < items.length) {
    showGravestonesCarouselItem(category, newIndex);
  }
}

// Показ елемента каруселі надгробних плит
function showGravestonesCarouselItem(category, index) {
  const track = document.getElementById(`${category}-carousel-track`);
  const viewport = document.getElementById(`${category}-carousel-viewport`);
  const items = track.querySelectorAll('.carousel-item');
  
  if (!track || items.length === 0 || !items[index]) return;

  items.forEach((item, i) => {
    item.classList.toggle('active', i === index);
  });
  
  const viewportCenter = viewport.offsetWidth / 2;
  const itemCenter = items[index].offsetLeft + items[index].offsetWidth / 2;
  const scrollLeft = itemCenter - viewportCenter;
  
  track.style.transform = `translateX(-${scrollLeft}px)`;
  
  carouselState[category].index = index;
  
  // Ледаче завантаження для поточного та сусідніх елементів
  loadOrGenerateGravestonesPreview(category, index);
  if (index + 1 < items.length) loadOrGenerateGravestonesPreview(category, index + 1);
  if (index - 1 >= 0) loadOrGenerateGravestonesPreview(category, index - 1);
  
  // Оновлюємо відображення
  updateAllDisplays();
}

// Додавання вибраної надгробної плити до моделі
function addGravestone() {
  const category = 'gravestones';
  const state = carouselState[category];
  
  if (!state || !modelLists[category] || !modelLists[category][state.index]) {
    debugLog(`❌ Не вдалося додати надгробну плиту: немає вибраного елемента`, 'error');
    return;
  }
  
  const filename = modelLists[category][state.index];
  debugLog(`🏗️ Додавання надгробної плити: ${filename}`, 'info');
  
  if (window.sketchup && window.sketchup.add_model) {
    window.sketchup.add_model(category, filename);
    addedElements[category] = true;
    updateSummaryTable();
    debugLog(`✅ Надгробна плита додана: ${filename}`, 'success');
  } else {
    debugLog(`❌ window.sketchup.add_model не доступний`, 'error');
  }
}

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
    
    // Отримуємо вибраний декор з каруселі
    let selectedDecor = null;
    debugLog(`🔍 Діагностика каруселі декору:`, 'info');
    debugLog(`   - carouselState.fence_decor: ${JSON.stringify(carouselState.fence_decor)}`, 'info');
    debugLog(`   - modelLists.fence_decor: ${JSON.stringify(modelLists.fence_decor)}`, 'info');
    
    if (carouselState.fence_decor && modelLists.fence_decor && modelLists.fence_decor[carouselState.fence_decor.index]) {
      selectedDecor = modelLists.fence_decor[carouselState.fence_decor.index];
      debugLog(`🎨 Вибраний декор для кутової огорожі: ${selectedDecor}`, 'info');
    } else {
      debugLog(`⚠️ Декор не вибрано, створюємо огорожу без декору`, 'warning');
    }
    
    debugLog(`🏗️ Створення кутової огорожі: ${postHeight}×${postSize}×${postSize}см`, 'info');
    debugLog(`🔍 Перевірка доступності функцій:`, 'info');
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
        
        // Додаємо декор, якщо він вибраний
        if (selectedDecor && window.sketchup.add_model) {
          debugLog(`🎨 Додаємо декор на всі стовпчики огорожі: ${selectedDecor}`, 'info');
          debugLog(`🔍 Викликаємо window.sketchup.add_model('fence_decor', '${selectedDecor}')`, 'info');
          const decorResult = window.sketchup.add_model('fence_decor', selectedDecor);
          debugLog(`📤 Результат додавання декору: ${decorResult}`, 'info');
          addedElements['fence_decor'] = true;
        } else {
          debugLog(`⚠️ Не можу додати декор: selectedDecor=${selectedDecor}, add_model=${typeof window.sketchup?.add_model}`, 'warning');
        }
        
        addedElements['fence_corner'] = true;
        updateSummaryTable();
        debugLog(`✅ Кутова огорожа створена успішно`, 'success');
      } catch (error) {
        debugLog(`❌ Помилка створення кутової огорожі: ${error.message}`, 'error');
        debugLog(`❌ Stack trace: ${error.stack}`, 'error');
      }
    } else {
      debugLog(`❌ window.sketchup.add_fence_corner не доступний`, 'error');
      debugLog(`🔍 Доступні функції в window.sketchup:`, 'info');
      if (window.sketchup) {
        Object.keys(window.sketchup).forEach(key => {
          if (key.includes('fence') || key.includes('Fence')) {
            debugLog(`   - ${key}: ${typeof window.sketchup[key]}`, 'info');
          }
        });
      }
    }
  } catch (error) {
    debugLog(`❌ Критична помилка в addFenceCorner: ${error.message}`, 'error');
    debugLog(`❌ Stack trace: ${error.stack}`, 'error');
  }
}

// Додавання периметральної огорожі
function addFencePerimeter() {
  console.log('🚀 addFencePerimeter() викликано!');
  debugLog('🚀 addFencePerimeter() викликано!', 'info');
  
  try {
    const postHeight = parseInt(document.getElementById('fence-perimeter-post-height').value);
    const postSize = parseInt(document.getElementById('fence-perimeter-post-size').value);
    const northCount = parseInt(document.getElementById('fence-perimeter-north-count').value);
    const southCount = parseInt(document.getElementById('fence-perimeter-south-count').value);
    const eastWestCount = parseInt(document.getElementById('fence-perimeter-east-west-count').value);
    const decorativeHeight = 100; // Фіксоване значення
    const decorativeThickness = 100; // Фіксоване значення
    
    // Отримуємо вибраний декор з каруселі
    let selectedDecor = null;
    debugLog(`🔍 Діагностика каруселі декору (периметральна):`, 'info');
    debugLog(`   - carouselState.fence_decor: ${JSON.stringify(carouselState.fence_decor)}`, 'info');
    debugLog(`   - modelLists.fence_decor: ${JSON.stringify(modelLists.fence_decor)}`, 'info');
    
    if (carouselState.fence_decor && modelLists.fence_decor && modelLists.fence_decor[carouselState.fence_decor.index]) {
      selectedDecor = modelLists.fence_decor[carouselState.fence_decor.index];
      debugLog(`🎨 Вибраний декор для периметральної огорожі: ${selectedDecor}`, 'info');
    } else {
      debugLog(`⚠️ Декор не вибрано, створюємо огорожу без декору`, 'warning');
    }
    
    debugLog(`🏗️ Створення периметральної огорожі: ${postHeight}×${postSize}×${postSize}см`, 'info');
    debugLog(`🔍 Детальна діагностика параметрів:`, 'info');
    debugLog(`   - postHeight: ${postHeight} (тип: ${typeof postHeight})`, 'info');
    debugLog(`   - postSize: ${postSize} (тип: ${typeof postSize})`, 'info');
    debugLog(`   - northCount: ${northCount} (тип: ${typeof northCount})`, 'info');
    debugLog(`   - southCount: ${southCount} (тип: ${typeof southCount})`, 'info');
    debugLog(`   - eastWestCount: ${eastWestCount} (тип: ${typeof eastWestCount})`, 'info');
    debugLog(`   - decorativeHeight: ${decorativeHeight} (тип: ${typeof decorativeHeight})`, 'info');
    debugLog(`   - decorativeThickness: ${decorativeThickness} (тип: ${typeof decorativeThickness})`, 'info');
    debugLog(`🔍 Перевірка доступності функцій:`, 'info');
    debugLog(`   - window.sketchup: ${typeof window.sketchup}`, 'info');
    debugLog(`   - window.sketchup?.add_fence_perimeter: ${typeof window.sketchup?.add_fence_perimeter}`, 'info');
    debugLog(`🔍 Поточний стан addedElements:`, 'info');
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
        
        // Додаємо декор, якщо він вибраний
        if (selectedDecor && window.sketchup.add_model) {
          debugLog(`🎨 Додаємо декор на всі стовпчики периметральної огорожі: ${selectedDecor}`, 'info');
          debugLog(`🔍 Викликаємо window.sketchup.add_model('fence_decor', '${selectedDecor}')`, 'info');
          const decorResult = window.sketchup.add_model('fence_decor', selectedDecor);
          debugLog(`📤 Результат додавання декору: ${decorResult}`, 'info');
          addedElements['fence_decor'] = true;
        } else {
          debugLog(`⚠️ Не можу додати декор: selectedDecor=${selectedDecor}, add_model=${typeof window.sketchup?.add_model}`, 'warning');
        }
        
        addedElements['fence_perimeter'] = true;
        updateSummaryTable();
        debugLog(`✅ Периметральна огорожа створена успішно`, 'success');
        debugLog(`🔍 Стан після створення:`, 'info');
        debugLog(`   - addedElements.fence_perimeter: ${addedElements.fence_perimeter}`, 'info');
        debugLog(`   - addedElements.fence_corner: ${addedElements.fence_corner}`, 'info');
      } catch (error) {
        debugLog(`❌ Помилка створення периметральної огорожі: ${error.message}`, 'error');
        debugLog(`❌ Stack trace: ${error.stack}`, 'error');
      }
    } else {
      debugLog(`❌ window.sketchup.add_fence_perimeter не доступний`, 'error');
      debugLog(`🔍 Доступні функції в window.sketchup:`, 'info');
      if (window.sketchup) {
        Object.keys(window.sketchup).forEach(key => {
          if (key.includes('fence') || key.includes('Fence')) {
            debugLog(`   - ${key}: ${typeof window.sketchup[key]}`, 'info');
          }
        });
      }
    }
  } catch (error) {
    debugLog(`❌ Критична помилка в addFencePerimeter: ${error.message}`, 'error');
    debugLog(`❌ Stack trace: ${error.stack}`, 'error');
  }
  
  console.log('🏁 addFencePerimeter() завершено!');
  debugLog('🏁 addFencePerimeter() завершено!', 'info');
}