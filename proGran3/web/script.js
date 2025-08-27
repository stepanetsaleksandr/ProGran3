// progran3/web/script.js

// --- ГЛОБАЛЬНІ ЗМІННІ ---
let modelLists = {};
let carouselState = {
  stands: { index: 0 },
  steles: { index: 0 },
  flowerbeds: { index: 0 }
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
    }, 100);
    
    // Якщо переключилися на тестовий таб, створюємо UI компоненти
    if (tabName === 'test') {
      setTimeout(() => {
        createTestAccordion();
      }, 150);
    }
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
  steles: false
};

// Поточна одиниця вимірювання
let currentUnit = 'mm';




// Універсальна система каруселей
const CarouselManager = {
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
    const track = document.getElementById(`${category}-carousel-track`);
    const viewport = document.getElementById(`${category}-carousel-viewport`);
    
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
    
    const track = document.getElementById(`${category}-carousel-track`);
    const viewport = document.getElementById(`${category}-carousel-viewport`);
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
    
    const track = document.getElementById(`${category}-carousel-track`);
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
    const track = document.getElementById(`${category}-carousel-track`);
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
    
    Object.keys(this.carousels).forEach(category => {
      debugLog(`🔍 Перевіряємо карусель: ${category}`, 'info');
      
      const trackElement = document.getElementById(`${category}-carousel-track`);
      const viewportElement = document.getElementById(`${category}-carousel-viewport`);
      
      debugLog(`🔍 Перевірка каруселі ${category}: моделі=${!!modelLists[category]}, кількість=${modelLists[category]?.length || 0}, track=${!!trackElement}, viewport=${!!viewportElement}`, 'info');
      
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
  
  // Створюємо тестовий акордеон
  createTestAccordion();
  
  debugLog(`✅ initializeApp завершено`, 'success');
}

function loadModelLists(data) {
  debugLog(`📥 loadModelLists викликано`, 'info');
  debugLog(`📊 Отримано дані для категорій: ${Object.keys(data).join(', ')}`, 'info');
  
  modelLists = data;
  
  // Використовуємо автоматичну ініціалізацію всіх каруселей
  debugLog(`🔄 Викликаємо CarouselManager.initializeAllCarousels()`, 'info');
  CarouselManager.initializeAllCarousels();
  
     // Тестовий блок очищений - готовий для нової функціональності
  
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
  panel.classList.toggle('collapsed');
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

// Функція для створення заглушки в тестовій каруселі (для зворотної сумісності)
function createTestPlaceholder(item, loadingDiv, text) {
  createPlaceholder(item, loadingDiv, text);
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

function updateBlindAreaControls() {
  const mode = document.getElementById('blind-area-mode').value;
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
  const mode = document.getElementById('blind-area-mode').value;
  
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
  const blindAreaMode = document.getElementById('blind-area-mode').value;
  
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
  
  // Стела
  if (addedElements.steles && carouselState.steles && modelLists.steles) {
    const steleFilename = modelLists.steles[carouselState.steles.index];
    document.getElementById('summary-stele').textContent = 
      steleFilename ? steleFilename.replace('.skp', '') : '--';
  } else {
    document.getElementById('summary-stele').textContent = '--';
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
    if (statusData.steles === true) {
      addedElements.steles = true;
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

// ========== CREATE TEST ACCORDION FUNCTION ==========
function createTestAccordion() {
  debugLog('🔄 createTestAccordion викликано', 'info');
  const testTab = document.getElementById('test-tab');
  if (!testTab) {
    debugLog('❌ Не знайдено елемент test-tab', 'error');
    return;
  }
  debugLog('✅ Знайдено елемент test-tab', 'success');

  // Повний UI showcase
  testTab.innerHTML = `
    <div class="ui-showcase">
      <h2 class="showcase-title">Liquid Glass UI Components</h2>
      <p class="showcase-subtitle">Тестування основних елементів інтерфейсу</p>
      
      <!-- Кнопки -->
      <div class="component-section">
        <h3 class="section-title">Кнопки (Buttons)</h3>
        <div class="component-demo">
          <div class="button-group-demo">
            <button class="lg-btn lg-btn-primary" onclick="testButton('Primary')">Primary</button>
            <button class="lg-btn lg-btn-ghost" onclick="testButton('Ghost')">Ghost</button>
            <button class="lg-btn lg-btn-outline" onclick="testButton('Outline')">Outline</button>
            <button class="lg-btn lg-btn-soft" onclick="testButton('Soft')">Soft</button>
            <button class="lg-btn lg-btn-danger" onclick="testButton('Danger')">Danger</button>
            <button class="lg-btn lg-btn-loading" disabled>Loading...</button>
          </div>
          <div class="component-description">
            <p>Різні варіанти кнопок з hover ефектами та анімаціями. Клікніть для тестування.</p>
            <div class="test-result" id="button-test-result"></div>
          </div>
        </div>
      </div>

      <!-- Поля вводу -->
      <div class="component-section">
        <h3 class="section-title">Поля вводу (Inputs)</h3>
        <div class="component-demo">
          <div class="input-group-demo">
            <div class="input-wrapper">
              <label>Текстове поле</label>
              <input type="text" class="lg-input" placeholder="Введіть текст..." onchange="testInput(this.value, 'text')">
            </div>
            <div class="input-wrapper">
              <label>Числове поле</label>
              <input type="number" class="lg-input" placeholder="0" onchange="testInput(this.value, 'number')">
            </div>
            <div class="input-wrapper">
              <label>Email поле</label>
              <input type="email" class="lg-input" placeholder="email@example.com" onchange="testInput(this.value, 'email')">
            </div>
          </div>
          <div class="component-description">
            <p>Поля вводу з різними типами та валідацією. Змінюйте значення для тестування.</p>
            <div class="test-result" id="input-test-result"></div>
          </div>
        </div>
      </div>

      <!-- Випадаючі списки -->
      <div class="component-section">
        <h3 class="section-title">Випадаючі списки (Selects)</h3>
        <div class="component-demo">
          <div class="select-group-demo">
            <div class="input-wrapper">
              <label>Вибір кольору</label>
              <select class="lg-select" onchange="testSelect(this.value, 'color')">
                <option value="">Оберіть колір</option>
                <option value="red">Червоний</option>
                <option value="blue">Синій</option>
                <option value="green">Зелений</option>
                <option value="yellow">Жовтий</option>
              </select>
            </div>
            <div class="input-wrapper">
              <label>Вибір розміру</label>
              <select class="lg-select" onchange="testSelect(this.value, 'size')">
                <option value="">Оберіть розмір</option>
                <option value="small">Малий</option>
                <option value="medium">Середній</option>
                <option value="large">Великий</option>
              </select>
            </div>
          </div>
          <div class="component-description">
            <p>Випадаючі списки з різними опціями. Змінюйте вибір для тестування.</p>
            <div class="test-result" id="select-test-result"></div>
          </div>
        </div>
      </div>

      <!-- Перемикачі -->
      <div class="component-section">
        <h3 class="section-title">Перемикачі (Toggles)</h3>
        <div class="component-demo">
          <div class="toggle-group-demo">
            <div class="toggle-item">
              <label>Темна тема</label>
              <div class="lg-toggle" onclick="testToggle(this, 'dark-theme')">
                <div class="toggle-slider"></div>
              </div>
            </div>
            <div class="toggle-item">
              <label>Звук</label>
              <div class="lg-toggle lg-toggle-active" onclick="testToggle(this, 'sound')">
                <div class="toggle-slider"></div>
              </div>
            </div>
            <div class="toggle-item">
              <label>Автозбереження</label>
              <div class="lg-toggle" onclick="testToggle(this, 'autosave')">
                <div class="toggle-slider"></div>
              </div>
            </div>
          </div>
          <div class="component-description">
            <p>Перемикачі для різних налаштувань. Клікніть для зміни стану.</p>
            <div class="test-result" id="toggle-test-result"></div>
          </div>
        </div>
      </div>

      <!-- Чекбокси та радіо -->
      <div class="component-section">
        <h3 class="section-title">Чекбокси та радіо кнопки</h3>
        <div class="component-demo">
          <div class="checkbox-radio-group-demo">
            <div class="checkbox-group">
              <h4>Чекбокси:</h4>
              <label class="lg-checkbox">
                <input type="checkbox" onchange="testCheckbox(this, 'option1')">
                <span class="checkmark"></span>
                Опція 1
              </label>
              <label class="lg-checkbox">
                <input type="checkbox" onchange="testCheckbox(this, 'option2')">
                <span class="checkmark"></span>
                Опція 2
              </label>
              <label class="lg-checkbox">
                <input type="checkbox" onchange="testCheckbox(this, 'option3')">
                <span class="checkmark"></span>
                Опція 3
              </label>
            </div>
            <div class="radio-group">
              <h4>Радіо кнопки:</h4>
              <label class="lg-radio">
                <input type="radio" name="radio-group" value="a" onchange="testRadio(this, 'radio-a')">
                <span class="radio-mark"></span>
                Варіант A
              </label>
              <label class="lg-radio">
                <input type="radio" name="radio-group" value="b" onchange="testRadio(this, 'radio-b')">
                <span class="radio-mark"></span>
                Варіант B
              </label>
              <label class="lg-radio">
                <input type="radio" name="radio-group" value="c" onchange="testRadio(this, 'radio-c')">
                <span class="radio-mark"></span>
                Варіант C
              </label>
            </div>
          </div>
          <div class="component-description">
            <p>Чекбокси та радіо кнопки для вибору опцій. Тестуйте різні комбінації.</p>
            <div class="test-result" id="checkbox-radio-test-result"></div>
          </div>
        </div>
      </div>

      <!-- Слайдер -->
      <div class="component-section">
        <h3 class="section-title">Слайдер (Slider)</h3>
        <div class="component-demo">
          <div class="slider-group-demo">
            <div class="slider-item">
              <label>Гучність: <span id="volume-value">50</span>%</label>
              <input type="range" class="lg-slider" min="0" max="100" value="50" oninput="testSlider(this, 'volume')">
            </div>
            <div class="slider-item">
              <label>Яскравість: <span id="brightness-value">75</span>%</label>
              <input type="range" class="lg-slider" min="0" max="100" value="75" oninput="testSlider(this, 'brightness')">
            </div>
            <div class="slider-item">
              <label>Контраст: <span id="contrast-value">60</span>%</label>
              <input type="range" class="lg-slider" min="0" max="100" value="60" oninput="testSlider(this, 'contrast')">
            </div>
          </div>
          <div class="component-description">
            <p>Слайдери для налаштування числових значень. Пересувайте для зміни.</p>
            <div class="test-result" id="slider-test-result"></div>
          </div>
        </div>
      </div>

      <!-- Прогрес бар -->
      <div class="component-section">
        <h3 class="section-title">Прогрес бар (Progress)</h3>
        <div class="component-demo">
          <div class="progress-group-demo">
            <div class="progress-item">
              <label>Завантаження: <span id="progress-value">45</span>%</label>
              <div class="lg-progress">
                <div class="progress-fill" style="width: 45%"></div>
              </div>
            </div>
            <div class="progress-item">
              <label>Виконання: <span id="progress-value2">78</span>%</label>
              <div class="lg-progress">
                <div class="progress-fill" style="width: 78%"></div>
              </div>
            </div>
            <button class="lg-btn lg-btn-primary" onclick="testProgress()">Оновити прогрес</button>
          </div>
          <div class="component-description">
            <p>Прогрес бари для відображення процесу виконання. Клікніть кнопку для тестування.</p>
            <div class="test-result" id="progress-test-result"></div>
          </div>
        </div>
      </div>

      <!-- Бейджі та чіпи -->
      <div class="component-section">
        <h3 class="section-title">Бейджі та чіпи (Badges & Chips)</h3>
        <div class="component-demo">
          <div class="badge-chip-group-demo">
            <div class="badge-group">
              <span class="lg-badge">New</span>
              <span class="lg-badge lg-badge-success">Success</span>
              <span class="lg-badge lg-badge-warning">Warning</span>
              <span class="lg-badge lg-badge-error">Error</span>
            </div>
            <div class="chip-group">
              <span class="lg-chip">Тег 1 <button class="chip-close" onclick="removeChip(this)">×</button></span>
              <span class="lg-chip">Тег 2 <button class="chip-close" onclick="removeChip(this)">×</button></span>
              <span class="lg-chip">Тег 3 <button class="chip-close" onclick="removeChip(this)">×</button></span>
            </div>
            <button class="lg-btn lg-btn-outline" onclick="addChip()">Додати чіп</button>
          </div>
          <div class="component-description">
            <p>Бейджі для статусів та чіпи для тегів. Тестуйте видалення чіпів.</p>
            <div class="test-result" id="badge-chip-test-result"></div>
          </div>
        </div>
      </div>

      <!-- Алерти -->
      <div class="component-section">
        <h3 class="section-title">Алерти (Alerts)</h3>
        <div class="component-demo">
          <div class="alert-group-demo">
            <div class="lg-alert lg-alert-info">
              <span class="alert-icon">ℹ</span>
              <div class="alert-content">
                <strong>Інформація:</strong> Це інформаційне повідомлення
              </div>
              <button class="alert-close" onclick="closeAlert(this)">×</button>
            </div>
            <div class="lg-alert lg-alert-success">
              <span class="alert-icon">✓</span>
              <div class="alert-content">
                <strong>Успіх:</strong> Операція виконана успішно
              </div>
              <button class="alert-close" onclick="closeAlert(this)">×</button>
            </div>
            <div class="lg-alert lg-alert-warning">
              <span class="alert-icon">⚠</span>
              <div class="alert-content">
                <strong>Попередження:</strong> Будьте обережні
              </div>
              <button class="alert-close" onclick="closeAlert(this)">×</button>
            </div>
            <div class="lg-alert lg-alert-error">
              <span class="alert-icon">✕</span>
              <div class="alert-content">
                <strong>Помилка:</strong> Щось пішло не так
              </div>
              <button class="alert-close" onclick="closeAlert(this)">×</button>
            </div>
          </div>
          <div class="component-description">
            <p>Алерти для різних типів повідомлень. Клікніть × для закриття.</p>
            <div class="test-result" id="alert-test-result"></div>
          </div>
        </div>
      </div>

      <!-- Таблиця -->
      <div class="component-section">
        <h3 class="section-title">Таблиця (Table)</h3>
        <div class="component-demo">
          <div class="table-demo">
            <table class="lg-table">
              <thead>
                <tr>
                  <th>Ім'я</th>
                  <th>Роль</th>
                  <th>Статус</th>
                  <th>Дії</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Анна</td>
                  <td>Дизайнер</td>
                  <td><span class="lg-badge lg-badge-success">Активна</span></td>
                  <td><button class="lg-btn lg-btn-ghost" onclick="testTableAction('edit', 'Анна')">Редагувати</button></td>
                </tr>
                <tr>
                  <td>Борис</td>
                  <td>Розробник</td>
                  <td><span class="lg-badge lg-badge-warning">Відсутній</span></td>
                  <td><button class="lg-btn lg-btn-ghost" onclick="testTableAction('edit', 'Борис')">Редагувати</button></td>
                </tr>
                <tr>
                  <td>Віра</td>
                  <td>Менеджер</td>
                  <td><span class="lg-badge lg-badge-success">Активна</span></td>
                  <td><button class="lg-btn lg-btn-ghost" onclick="testTableAction('edit', 'Віра')">Редагувати</button></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="component-description">
            <p>Таблиця з даними та інтерактивними елементами. Клікніть кнопки для тестування.</p>
            <div class="test-result" id="table-test-result"></div>
          </div>
        </div>
      </div>

      <!-- Пагінація -->
      <div class="component-section">
        <h3 class="section-title">Пагінація (Pagination)</h3>
        <div class="component-demo">
          <div class="pagination-demo">
            <div class="lg-pagination">
              <button class="pagination-btn" onclick="testPagination('prev')">‹ Попередня</button>
              <button class="pagination-btn pagination-active">1</button>
              <button class="pagination-btn" onclick="testPagination('2')">2</button>
              <button class="pagination-btn" onclick="testPagination('3')">3</button>
              <button class="pagination-btn" onclick="testPagination('next')">Наступна ›</button>
            </div>
            <div class="pagination-info">
              Показано сторінку <span id="current-page">1</span> з 3
            </div>
          </div>
          <div class="component-description">
            <p>Пагінація для навігації по сторінках. Клікніть номери сторінок.</p>
            <div class="test-result" id="pagination-test-result"></div>
          </div>
        </div>
      </div>

      <!-- Результати тестування -->
      <div class="component-section">
        <h3 class="section-title">Результати тестування</h3>
        <div class="test-results">
          <div class="test-summary">
            <h4>Загальна статистика:</h4>
            <div class="test-stats">
              <div class="stat-item">
                <span class="stat-label">Кліків по кнопках:</span>
                <span class="stat-value" id="button-clicks">0</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Змін у полях:</span>
                <span class="stat-value" id="input-changes">0</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Перемикань:</span>
                <span class="stat-value" id="toggle-switches">0</span>
              </div>
            </div>
          </div>
          <button class="lg-btn lg-btn-outline" onclick="resetTestStats()">Скинути статистику</button>
        </div>
      </div>
    </div>
  `;
  
  debugLog('✅ UI showcase додано в test-tab', 'success');
  debugLog('✅ UI компоненти створено в тестовому табі', 'success');
}