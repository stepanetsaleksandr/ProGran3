// progran3/web/script.js

// --- ГЛОБАЛЬНІ ЗМІННІ ---
let modelLists = {};
let carouselState = {
  stands: { index: 0 },
  steles: { index: 0 },
  flowerbeds: { index: 0 }
};
let testCarouselState = {
  steles: { index: 0 }
};



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
    },
    'steles': { 
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
    const config = { ...this.carousels[category], ...options };
    const track = document.getElementById(`${category}-carousel-track`);
    const viewport = document.getElementById(`${category}-carousel-viewport`);
    
    if (!track || !viewport || !modelLists[category] || modelLists[category].length === 0) return;
    
    track.innerHTML = '';
    
    modelLists[category].forEach(filename => {
      const item = this.createCarouselItem(category, filename, config);
      track.appendChild(item);
    });
    
    this.setupCarouselEvents(category, viewport);
    
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
    
    // Ледаче завантаження для активного елемента та сусідів (як у тестовій логіці)
    this.loadOrGeneratePreview(category, index);
    if (index + 1 < items.length) this.loadOrGeneratePreview(category, index + 1);
    if (index - 1 >= 0) this.loadOrGeneratePreview(category, index - 1);
    
    updateAllDisplays();
  },

  // Ледаче завантаження превью - тепер тільки генерація
  loadOrGeneratePreview(category, index) {
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
    this.autoGeneratePreview(category, filename, item, loadingDiv);
  },

  // Автоматична генерація превью
  autoGeneratePreview(category, filename, item, loadingDiv) {
    if (!window.sketchup) {
      createPlaceholder(item, loadingDiv, `Помилка генерації\n${filename}`);
      return;
    }
    
    window.sketchup.generate_web_preview(`${category}/${filename}`);
    
    window.pendingPreviews = window.pendingPreviews || {};
    window.pendingPreviews[`${category}/${filename}`] = { item, loadingDiv, filename };
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
    Object.keys(this.carousels).forEach(category => {
      if (modelLists[category] && document.getElementById(`${category}-carousel-track`)) {
        this.initialize(category);
        console.log(`✅ Автоматично ініціалізовано карусель: ${category}`);
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

// --- ІНІЦІАЛІЗАЦІЯ ---
window.onload = function () {
  // Ініціалізуємо додаток одразу
  initializeApp();
  
  // Запускаємо готовність
  if (window.sketchup && window.sketchup.ready) {
    window.sketchup.ready();
  }
};

// Ініціалізація додатку
function initializeApp() {
  // Ініціалізація UI (без повторного виклику ready)
  if(document.getElementById('tiling-mode')) {
    updateTilingControls();
  }
  // Згортаємо всі панелі, крім першої
  document.querySelectorAll('.panel').forEach((panel, index) => {
    if (index > 0) {
      panel.classList.add('collapsed');
    }
  });
  updateAllDisplays();
}

function loadModelLists(data) {
  modelLists = data;
  
  // Використовуємо автоматичну ініціалізацію всіх каруселей
  CarouselManager.initializeAllCarousels();
  
  // Ініціалізуємо тестову карусель стел
  if (modelLists['steles'] && document.getElementById('test-steles-carousel-track')) {
    initializeTestCarousel('steles');
  }
  
  // Виводимо статистику каруселей
  const stats = CarouselManager.getCarouselStats();
  console.log(`📊 Статистика каруселей: ${stats.active}/${stats.total} активних`);
  
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
  // Знаходимо всі панелі на сторінці
  const allPanels = Array.from(document.querySelectorAll('.panel'));
  const currentIndex = allPanels.indexOf(currentPanel);
  const nextPanel = allPanels[currentIndex + 1];

  // Згортаємо поточну панель
  if (currentPanel && !currentPanel.classList.contains('collapsed')) {
    currentPanel.classList.add('collapsed');
  }

  // Розгортаємо наступну, якщо вона існує і є згорнутою
  if (nextPanel && nextPanel.classList.contains('collapsed')) {
    nextPanel.classList.remove('collapsed');
  }
}



// --- ТЕСТОВА КАРУСЕЛЬ (залишаємо для зворотної сумісності) ---

// Ініціалізація тестової каруселі
function initializeTestCarousel(category) {
  const track = document.getElementById(`test-${category}-carousel-track`);
  const viewport = document.getElementById(`test-${category}-carousel-viewport`);
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
    moveTestCarousel(category, event.deltaY > 0 ? 1 : -1);
  });

  setTimeout(() => {
    showTestCarouselItem(category, 0);
    // Ледаче завантаження для першого елемента
    loadOrGenerateTestPreview(category, 0);
  }, 100); 
}

// Ледаче завантаження превью для активного елемента тестової каруселі
function loadOrGenerateTestPreview(category, index) {
  const track = document.getElementById(`test-${category}-carousel-track`);
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
  autoGenerateTestPreview(category, filename, item, loadingDiv);
}



// Автоматична генерація превью для тестової каруселі
function autoGenerateTestPreview(category, filename, item, loadingDiv) {
  if (!window.sketchup) {
    createPlaceholder(item, loadingDiv, `Помилка генерації\n${filename}`);
    return;
  }
  
  // Генеруємо веб-превью через SketchUp
  window.sketchup.generate_web_preview(`${category}/${filename}`);
  
  // Зберігаємо посилання на елементи для callback
  window.pendingPreviews = window.pendingPreviews || {};
  window.pendingPreviews[`${category}/${filename}`] = { item, loadingDiv, filename };
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
  const pendingData = window.pendingPreviews && window.pendingPreviews[componentPath];
  if (!pendingData) {
    return;
  }
  
  const { item, loadingDiv, filename } = pendingData;
  
  if (base64Data && base64Data.startsWith('data:image/')) {
    // Створюємо зображення з base64 даних
    const img = document.createElement('img');
    img.src = base64Data;
    img.alt = filename;
    
    // Видаляємо індикатор завантаження та додаємо зображення
    if (loadingDiv && loadingDiv.parentNode) loadingDiv.parentNode.removeChild(loadingDiv);
    if (item) item.appendChild(img);
    
  } else {
    // Якщо не вдалося згенерувати, показуємо заглушку
    if (item && loadingDiv) createPlaceholder(item, loadingDiv, `Помилка генерації\n${filename}`);
  }
  
  // Очищаємо pending
  delete window.pendingPreviews[componentPath];
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

function moveTestCarousel(category, direction) {
  const state = testCarouselState[category];
  const newIndex = state.index + direction;
  const track = document.getElementById(`test-${category}-carousel-track`);
  const items = track.querySelectorAll('.carousel-item');
  
  if (newIndex >= 0 && newIndex < items.length) {
    showTestCarouselItem(category, newIndex);
  }
}

function showTestCarouselItem(category, index) {
  const track = document.getElementById(`test-${category}-carousel-track`);
  const viewport = document.getElementById(`test-${category}-carousel-viewport`);
  const items = track.querySelectorAll('.carousel-item');
  
  if (!track || items.length === 0 || !items[index]) return;

  items.forEach((item, i) => {
    item.classList.toggle('active', i === index);
  });
  
  const viewportCenter = viewport.offsetWidth / 2;
  const targetItem = items[index];
  const itemCenter = targetItem.offsetLeft + targetItem.offsetWidth / 2;
  const newTransform = viewportCenter - itemCenter;

  testCarouselState[category].index = index;
  track.style.transform = `translateX(${newTransform}px)`;
  
  // Ледаче завантаження для активного елемента та сусідів
  loadOrGenerateTestPreview(category, index);
  if (index + 1 < items.length) loadOrGenerateTestPreview(category, index + 1);
  if (index - 1 >= 0) loadOrGenerateTestPreview(category, index - 1);
}



function addTestModel(category) {
  const state = testCarouselState[category];
  const filename = modelLists[category][state.index];
  
  if (window.sketchup && window.sketchup.add_model) {
    window.sketchup.add_model(category, filename);
  }
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
  const tilingMode = document.getElementById('tiling-mode');
  const frameControls = document.getElementById('frame-controls');
  const modularControls = document.getElementById('modular-controls');
  
  if (tilingMode.value === 'frame') {
    frameControls.classList.remove('hidden');
    modularControls.classList.add('hidden');
  } else {
    frameControls.classList.add('hidden');
    modularControls.classList.remove('hidden');
  }
}

function updateAllDisplays() {
  // Оновлення відображення розмірів фундаменту
  const foundationDepth = document.getElementById('foundation-depth').value;
  const foundationWidth = document.getElementById('foundation-width').value;
  const foundationHeight = document.getElementById('foundation-height').value;
  document.getElementById('foundation-dimensions-display').textContent = 
    `${foundationDepth}×${foundationWidth}×${foundationHeight} мм`;
  
  // Оновлення відображення типу плитки
  const tilingMode = document.getElementById('tiling-mode');
  if (tilingMode) {
    const modeText = tilingMode.options[tilingMode.selectedIndex].text;
    document.getElementById('tiling-type-display').textContent = modeText;
  }
  
  // Оновлення відображення товщини облицювання
  const claddingThickness = document.getElementById('cladding-thickness').value;
  document.getElementById('cladding-dimensions-display').textContent = 
    `Товщина: ${claddingThickness} мм`;
  
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
  // Фундамент
  const foundationDepth = document.getElementById('foundation-depth').value;
  const foundationWidth = document.getElementById('foundation-width').value;
  const foundationHeight = document.getElementById('foundation-height').value;
  document.getElementById('summary-foundation').textContent = 
    `${foundationDepth}×${foundationWidth}×${foundationHeight} мм`;
  
  // Плитка
  const tilingMode = document.getElementById('tiling-mode');
  if (tilingMode) {
    const modeText = tilingMode.options[tilingMode.selectedIndex].text;
    document.getElementById('summary-tiling').textContent = modeText;
  }
  
  // Облицювання
  const claddingThickness = document.getElementById('cladding-thickness').value;
  document.getElementById('summary-cladding').textContent = 
    `Товщина: ${claddingThickness} мм`;
  
  // Підставка
  if (carouselState.stands && modelLists.stands) {
    const standFilename = modelLists.stands[carouselState.stands.index];
    document.getElementById('summary-stand').textContent = 
      standFilename ? standFilename.replace('.skp', '') : '--';
  }
  
  // Квітник
  if (carouselState.flowerbeds && modelLists.flowerbeds) {
    const flowerbedFilename = modelLists.flowerbeds[carouselState.flowerbeds.index];
    document.getElementById('summary-flowerbed').textContent = 
      flowerbedFilename ? flowerbedFilename.replace('.skp', '') : '--';
  }
  
  // Стела
  if (carouselState.steles && modelLists.steles) {
    const steleFilename = modelLists.steles[carouselState.steles.index];
    document.getElementById('summary-stele').textContent = 
      steleFilename ? steleFilename.replace('.skp', '') : '--';
  }
}

// Функції для додавання елементів
function addFoundation() {
  const depth = document.getElementById('foundation-depth').value;
  const width = document.getElementById('foundation-width').value;
  const height = document.getElementById('foundation-height').value;
  
  if (window.sketchup && window.sketchup.add_foundation) {
    window.sketchup.add_foundation(depth, width, height);
  }
}

function addTiles() {
  const mode = document.getElementById('tiling-mode').value;
  
  if (window.sketchup && window.sketchup.add_tiles) {
    if (mode === 'frame') {
      const thickness = document.getElementById('tile-thickness-frame').value;
      const borderWidth = document.getElementById('tile-border-width').value;
      const overhang = document.getElementById('tile-overhang').value;
      window.sketchup.add_tiles('frame', thickness, borderWidth, overhang);
    } else {
      const size = document.getElementById('modular-tile-size').value;
      const thickness = document.getElementById('modular-thickness').value;
      const seam = document.getElementById('modular-seam').value;
      const overhang = document.getElementById('modular-overhang').value;
      window.sketchup.add_tiles('modular', size, thickness, seam, overhang);
    }
  }
}

function addSideCladding() {
  const thickness = document.getElementById('cladding-thickness').value;
  
  if (window.sketchup && window.sketchup.add_side_cladding) {
    window.sketchup.add_side_cladding(thickness);
  }
}





