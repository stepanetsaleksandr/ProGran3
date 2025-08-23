// progran3/web/script.js

// --- ГЛОБАЛЬНІ ЗМІННІ ---
let modelLists = {};
let carouselState = {
  stands: { index: 0 },
  steles: { index: 0 },
  flowerbeds: { index: 0 }
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

function moveCarousel(category, direction) {
  const state = carouselState[category];
  const newIndex = state.index + direction;
  
  if (newIndex >= 0 && newIndex < modelLists[category].length) {
    showCarouselItem(category, newIndex);
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

// --- ФУНКЦІЇ ДЛЯ СТВОРЕННЯ ЕЛЕМЕНТІВ ---

function addModel(category) {
  const state = carouselState[category];
  const filename = modelLists[category][state.index];
  if (window.sketchup && filename) {
    window.sketchup.insert_component(`${category}|${filename}`);
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