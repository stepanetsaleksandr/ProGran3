// ========== BLOCKING FUNCTIONS ==========

// Глобальна змінна для статусу блокування
let pluginBlocked = false;

// Показати карточку блокування
function showBlockingCard() {
  console.log('🔒 showBlockingCard() викликано автоматично з heartbeat');
  debugLog('🔒 Показуємо карточку блокування автоматично', 'warning');
  
  const blockingCard = document.getElementById('blocking-card');
  const tabsNavigation = document.querySelector('.tabs-navigation');
  const tabContents = document.querySelectorAll('.tab-content');
  const specificationPanel = document.getElementById('specification-panel');

  if (blockingCard) {
    blockingCard.style.display = 'block';
  }
  
  // Приховуємо навігацію табів
  if (tabsNavigation) {
    tabsNavigation.style.display = 'none';
  }
  
  // Приховуємо всі таби
  tabContents.forEach(tab => {
    tab.style.display = 'none';
  });
  
  // Приховуємо панель специфікації
  if (specificationPanel) {
    specificationPanel.style.display = 'none';
  }
  
  pluginBlocked = true;
  debugLog('🔒 Показано карточку блокування', 'warning');
}

// Приховати карточку блокування
function hideBlockingCard() {
  console.log('✅ hideBlockingCard() викликано автоматично з heartbeat');
  debugLog('✅ Приховуємо карточку блокування автоматично', 'success');
  
  const blockingCard = document.getElementById('blocking-card');
  const tabsNavigation = document.querySelector('.tabs-navigation');
  const tabContents = document.querySelectorAll('.tab-content');
  const specificationPanel = document.getElementById('specification-panel');

  if (blockingCard) {
    blockingCard.style.display = 'none';
  }
  
  // Показуємо навігацію табів
  if (tabsNavigation) {
    tabsNavigation.style.display = 'flex';
  }
  
  // Показуємо активний таб
  const activeTabButton = document.querySelector('.tabs-navigation .tab-button.active');
  if (activeTabButton) {
    const activeTabId = activeTabButton.dataset.tab + '-tab';
    const activeTabContent = document.getElementById(activeTabId);
    if (activeTabContent) {
      activeTabContent.style.display = 'block';
    }
  }
  
  // Показуємо панель специфікації
  if (specificationPanel) {
    specificationPanel.style.display = 'block';
  }
  
  pluginBlocked = false;
  debugLog('🔓 Приховано карточку блокування', 'info');
}

// Відкрити сторінку покупки
function openPurchasePage() {
  debugLog('🛒 Відкриваємо сторінку покупки', 'info');
  // Тут буде посилання на сайт для покупки
  window.open('https://progran3.com/purchase', '_blank');
}

// Повторити підключення
function retryConnection() {
  debugLog('🔄 Перевіряємо підключення та статус блокування', 'info');
  checkServerBlockingStatus();
}


// Перевірити чи заблокований плагін
function isPluginBlocked() {
  return pluginBlocked;
}

// Перевірити статус блокування з сервера через Ruby callback
function checkServerBlockingStatus() {
  debugLog('🔍 Перевіряємо статус блокування з сервера...', 'info');
  
  if (window.sketchup && window.sketchup.checkBlockingStatus) {
    window.sketchup.checkBlockingStatus();
  } else {
    debugLog('❌ Ruby callback checkBlockingStatus не знайдено', 'error');
  }
}

// Оновити статус блокування на основі відповіді сервера
function updateBlockingStatusFromServer(isBlocked) {
  debugLog(`📡 Отримано статус з сервера: ${isBlocked ? 'ЗАБЛОКОВАНО' : 'АКТИВНИЙ'}`, isBlocked ? 'warning' : 'success');
  
  if (isBlocked) {
    showBlockingCard();
  } else {
    hideBlockingCard();
  }
}
