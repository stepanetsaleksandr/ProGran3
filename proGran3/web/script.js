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

// --- ІНІЦІАЛІЗАЦІЯ ---
window.onload = function () {
  if (window.sketchup && window.sketchup.ready) {
    window.sketchup.ready();
  }
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
};

function loadModelLists(data) {
  modelLists = data;
  ['stands', 'steles', 'flowerbeds'].forEach(category => {
    if (modelLists[category] && document.getElementById(`${category}-carousel-track`)) {
      initializeCarousel(category);
    }
  });
  // Ініціалізуємо тестову карусель стел
  if (modelLists['steles'] && document.getElementById('test-steles-carousel-track')) {
    initializeTestCarousel('steles');
  }
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

// --- УНІВЕРСАЛЬНА ЛОГІКА ДЛЯ КАРУСЕЛЕЙ ---

function initializeCarousel(category) {
  const track = document.getElementById(`${category}-carousel-track`);
  const viewport = document.getElementById(`${category}-carousel-viewport`);
  if (!track || !viewport || !modelLists[category] || modelLists[category].length === 0) return;
  
  track.innerHTML = '';

  modelLists[category].forEach(filename => {
    const item = document.createElement('div');
    item.className = 'carousel-item';
    const img = document.createElement('img');
    const imgPath = `../assets/${category}/${filename.replace('.skp', '.png')}`;
    img.src = imgPath;
    img.alt = filename;
    item.appendChild(img);
    track.appendChild(item);
  });
  
  viewport.addEventListener('wheel', (event) => {
    event.preventDefault();
    moveCarousel(category, event.deltaY > 0 ? 1 : -1);
  });

  setTimeout(() => showCarouselItem(category, 0), 100); 
}

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
  loadingDiv.textContent = 'Завантаження';

  item.dataset.status = 'pending';

  const img = new Image();
  img.alt = filename;
  img.onload = function() {
    item.dataset.status = 'loaded';
    if (loadingDiv && loadingDiv.parentNode) loadingDiv.parentNode.removeChild(loadingDiv);
    item.appendChild(img);
    debugLog(`✅ Зображення завантажено: ${filename}`);
  };
  img.onerror = function() {
    debugLog(`❌ PNG відсутнє, запускаємо генерацію: ${filename}`);
    loadingDiv.textContent = 'Генерація превью...';
    autoGenerateTestPreview(category, filename, item, loadingDiv);
  };
  img.src = `../assets/${category}/${filename.replace('.skp', '.png')}`;
}

// Функція для логування в веб-інтерфейсі
function debugLog(message) {
  const debugElement = document.getElementById('debug-log');
  if (debugElement) {
    const time = new Date().toLocaleTimeString();
    debugElement.innerHTML += `<div>[${time}] ${message}</div>`;
    debugElement.scrollTop = debugElement.scrollHeight;
  }
  console.log(message);
}

// Автоматична генерація превью для тестової каруселі
function autoGenerateTestPreview(category, filename, item, loadingDiv) {
  debugLog(`🔍 autoGenerateTestPreview викликано для: ${category}/${filename}`);
  
  if (!window.sketchup) {
    debugLog('❌ window.sketchup не доступний');
    createTestPlaceholder(item, loadingDiv, `Помилка генерації\n${filename}`);
    return;
  }
  
  debugLog('✅ window.sketchup доступний, викликаємо generate_web_preview');
  
  // Генеруємо веб-превью через SketchUp
  window.sketchup.generate_web_preview(`${category}/${filename}`);
  
  // Зберігаємо посилання на елементи для callback
  window.pendingPreviews = window.pendingPreviews || {};
  window.pendingPreviews[`${category}/${filename}`] = { item, loadingDiv, filename };
  
  debugLog(`📝 Збережено pending preview для: ${category}/${filename}`);
}

// Функція для створення заглушки в тестовій каруселі
function createTestPlaceholder(item, loadingDiv, text) {
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
  debugLog(`🔍 receiveWebPreview викликано для: ${componentPath}`);
  debugLog(`📊 base64Data довжина: ${base64Data ? base64Data.length : 0}`);
  debugLog(`📄 Перші 100 символів: ${base64Data ? base64Data.substring(0, 100) : 'null'}`);
  
  const pendingData = window.pendingPreviews && window.pendingPreviews[componentPath];
  if (!pendingData) {
    debugLog('❌ Не знайдено pending data для: ' + componentPath);
    return;
  }
  
  debugLog('✅ Знайдено pending data');
  
  const { item, loadingDiv, filename } = pendingData;
  
  if (base64Data && base64Data.startsWith('data:image/')) {
    debugLog('✅ Отримано валідні base64 дані, створюємо зображення');
    
    // Створюємо зображення з base64 даних
    const img = document.createElement('img');
    img.src = base64Data;
    img.alt = filename;
    
    // Видаляємо індикатор завантаження та додаємо зображення
    loadingDiv.remove();
    item.appendChild(img);
    
    // Сповіщення прибрано для кінцевого користувача
  } else {
    debugLog('❌ Невалідні base64 дані або відсутні');
    debugLog(`🔍 Перевірка: startsWith('data:image/'): ${base64Data ? base64Data.startsWith('data:image/') : false}`);
    // Якщо не вдалося згенерувати, показуємо заглушку
    createTestPlaceholder(item, loadingDiv, `Помилка генерації\n${filename}`);
  }
  
  // Очищаємо pending
  delete window.pendingPreviews[componentPath];
  debugLog('🧹 Очищено pending preview');
}

// Функція для обробки помилки генерації превью
function handlePreviewError(componentPath, errorMessage) {
  const pendingData = window.pendingPreviews && window.pendingPreviews[componentPath];
  if (!pendingData) return;
  
  const { item, loadingDiv, filename } = pendingData;
  createTestPlaceholder(item, loadingDiv, `Помилка генерації\n${filename}`);
  
  // Очищаємо pending
  delete window.pendingPreviews[componentPath];
}



function moveCarousel(category, direction) {
  const state = carouselState[category];
  const newIndex = state.index + direction;
  
  if (newIndex >= 0 && newIndex < modelLists[category].length) {
    showCarouselItem(category, newIndex);
  }
}

function moveTestCarousel(category, direction) {
  const state = testCarouselState[category];
  const newIndex = state.index + direction;
  
  if (newIndex >= 0 && newIndex < modelLists[category].length) {
    showTestCarouselItem(category, newIndex);
  }
}

function showCarouselItem(category, index) {
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
  
  updateAllDisplays();
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
  // Ледаче завантаження для активного та сусідніх елементів
  loadOrGenerateTestPreview(category, index);
  if (index + 1 < items.length) loadOrGenerateTestPreview(category, index + 1);
  if (index - 1 >= 0) loadOrGenerateTestPreview(category, index - 1);
}

// --- ФУНКЦІЇ ДЛЯ СТВОРЕННЯ ЕЛЕМЕНТІВ ---

function addModel(category) {
  const state = carouselState[category];
  const filename = modelLists[category][state.index];
  if (window.sketchup && filename) {
    window.sketchup.insert_component(`${category}|${filename}`);
  }
}

function addTestModel(category) {
  const state = testCarouselState[category];
  const filename = modelLists[category][state.index];
  if (window.sketchup && filename) {
    window.sketchup.insert_component(`${category}|${filename}`);
    showNotification(`Тестовий компонент ${filename} додано!`, 'success');
  }
}

function updateTilingControls() {
    const mode = document.getElementById('tiling-mode').value;
    const frameControls = document.getElementById('frame-controls');
    const modularControls = document.getElementById('modular-controls');
    
    if (mode === 'frame') {
        frameControls.classList.remove('hidden');
        modularControls.classList.add('hidden');
    } else if (mode === 'modular') {
        frameControls.classList.add('hidden');
        modularControls.classList.remove('hidden');
    }
    updateAllDisplays();
}

function addTiles() {
    updateAllDisplays(); 
    const mode = document.getElementById('tiling-mode').value;
    if (mode === 'frame') {
        addPerimeterTiles();
    } else if (mode === 'modular') {
        addModularTiles();
    }
}

function addPerimeterTiles() {
  const thickness = document.getElementById("tile-thickness-frame").value;
  const borderWidth = document.getElementById("tile-border-width").value;
  const overhang = document.getElementById("tile-overhang").value;
  if (window.sketchup) {
    const params = { type: 'frame', thickness: parseFloat(thickness), borderWidth: parseFloat(borderWidth), overhang: parseFloat(overhang) };
    window.sketchup.insert_tiles(JSON.stringify(params));
  }
}

function addModularTiles() {
    const tileSize = document.getElementById('modular-tile-size').value;
    const thickness = document.getElementById('modular-thickness').value;
    const seam = document.getElementById('modular-seam').value;
    const overhang = document.getElementById('modular-overhang').value;
    if (window.sketchup) {
        const params = { type: 'modular', tileSize: tileSize, thickness: parseFloat(thickness), seam: parseFloat(seam), overhang: parseFloat(overhang) };
        window.sketchup.insert_tiles(JSON.stringify(params));
    }
}

function addFoundation() {
  const depth = document.getElementById("foundation-depth").value;
  const width = document.getElementById("foundation-width").value;
  const height = document.getElementById("foundation-height").value;
  
  if (window.sketchup) {
    const params = { depth: parseFloat(depth), width: parseFloat(width), height: parseFloat(height) };
    window.sketchup.insert_foundation(JSON.stringify(params));
  }
  updateAllDisplays();
}

function addSideCladding() {
    const thickness = document.getElementById("cladding-thickness").value;
    if (window.sketchup) {
        const params = { thickness: parseFloat(thickness) };
        window.sketchup.insert_side_cladding(JSON.stringify(params));
    }
    updateAllDisplays();
}


// --- ЦЕНТРАЛІЗОВАНА ФУНКЦІЯ ОНОВЛЕННЯ ВСІХ НАПИСІВ ---
function updateAllDisplays() {
    updateHeaders();
    updateSummaryTable();
}

function updateHeaders() {
    const getVal = id => document.getElementById(id).value;
    const getFloat = id => parseFloat(getVal(id));
    const updateText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    const f_depth = getFloat('foundation-depth');
    const f_width = getFloat('foundation-width');
    const f_height = getFloat('foundation-height');
    updateText('foundation-dimensions-display', `${f_depth/10} x ${f_width/10} x ${f_height/10} см`);

    const mode = getVal('tiling-mode');
    updateText('tiling-type-display', mode === 'frame' ? 'Рамка' : 'Модульна');

    const c_thickness = getVal('cladding-thickness');
    updateText('cladding-dimensions-display', `h: ${f_height/10}см, товщ: ${c_thickness}мм`);

    ['stands', 'steles', 'flowerbeds'].forEach(category => {
        const state = carouselState[category];
        const display = document.getElementById(`${category}-dimensions-display`);
        if (display && modelLists[category] && modelLists[category].length > 0 && state) {
            const filename = modelLists[category][state.index];
            if (filename) {
                const match = filename.match(/(\d+x\d+x\d+)/);
                display.textContent = match ? match[1].replace(/x/g, 'x') + 'см' : '';
            }
        }
    });
}


function updateSummaryTable() {
    if (!document.getElementById('summary-foundation')) return;
    
    const getValue = id => document.getElementById(id).value;
    const getFloat = id => parseFloat(getValue(id));
    
    const summary = {
        foundation: document.getElementById('summary-foundation'),
        tiling: document.getElementById('summary-tiling'),
        cladding: document.getElementById('summary-cladding'),
        stand: document.getElementById('summary-stand'),
        flowerbed: document.getElementById('summary-flowerbed'),
        stele: document.getElementById('summary-stele')
    };

    const f_depth = getFloat('foundation-depth');
    const f_width = getFloat('foundation-width');
    const f_height = getFloat('foundation-height');
    summary.foundation.textContent = `${f_depth/10} x ${f_width/10} x ${f_height/10} см`;

    const mode = getValue('tiling-mode');
    if (mode === 'frame') {
        const width = getValue('tile-border-width');
        const overhang = getValue('tile-overhang');
        summary.tiling.textContent = `Рамка, шир. ${width}мм, виступ ${overhang}мм`;
    } else {
        const size = getValue('modular-tile-size');
        const seam = getValue('modular-seam');
        summary.tiling.textContent = `Модульна ${size}см, шов ${seam}мм`;
    }

    const c_thickness = getFloat('cladding-thickness');
    const perimeter = 2 * (f_depth + f_width);
    summary.cladding.textContent = `h: ${f_height/10}см, товщ: ${c_thickness}мм, L: ${perimeter/1000}м`;

    ['stands', 'flowerbeds', 'steles'].forEach(category => {
        const state = carouselState[category];
        const displayId = `summary-${category.slice(0, -1)}`;
        const display = document.getElementById(displayId);
        if (display && modelLists[category] && modelLists[category].length > 0 && state) {
            const filename = modelLists[category][state.index];
            if (filename) {
                const match = filename.match(/(\d+x\d+x\d+)/);
                display.textContent = match ? match[1].replace(/x/g, ' x ') + ' см' : '--';
            }
        } else if (display) {
            display.textContent = '--';
        }
    });
}

// ========================================
// ФУНКЦІЇ ДЛЯ ТЕСТУВАННЯ НОВИХ ФІЧ
// ========================================



// Генерація превью для тестової каруселі
function generateTestPreviews(category) {
  if (!modelLists[category] || modelLists[category].length === 0) {
    showNotification('Немає компонентів для генерації превью', 'warning');
    return;
  }
  
  const categoryText = getCategoryDisplayName(category);
  showNotification(`Генерація превью для ${categoryText}...`, 'info');
  
  if (window.sketchup) {
    window.sketchup.generate_category_previews(category);
  }
  
  showNotification(`Превью для ${categoryText} згенеровано!`, 'success');
  
  // Оновлюємо карусель після генерації
  setTimeout(() => {
    initializeTestCarousel(category);
  }, 2000);
}

// Отримання відображуваної назви категорії
function getCategoryDisplayName(category) {
    const names = {
        'stands': 'підставок',
        'steles': 'стел',
        'flowerbeds': 'квітників',
        'gravestones': 'надгробків',
        'pavement_tiles': 'плитки'
    };
    return names[category] || category;
}

// Система сповіщень
function showNotification(message, type = 'info') {
    // Створюємо елемент сповіщення
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Додаємо стилі
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    // Кольори для різних типів
    const colors = {
        'info': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'success': 'linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%)',
        'warning': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'error': 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)'
    };
    
    notification.style.background = colors[type] || colors.info;
    
    // Додаємо до сторінки
    document.body.appendChild(notification);
    
    // Показуємо
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Приховуємо через 3 секунди
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}