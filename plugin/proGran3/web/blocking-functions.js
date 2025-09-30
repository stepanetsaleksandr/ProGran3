// ========== BLOCKING FUNCTIONS ==========

// Глобальна змінна для статусу блокування
let pluginBlocked = false;

// ========== ЛІЦЕНЗІЙНІ ФУНКЦІЇ ==========

// Активація ліцензії
function activateLicense() {
  const email = document.getElementById('email-input').value.trim();
  const licenseKey = document.getElementById('license-key-input').value.trim();
  
  if (!email) {
    showLicenseMessage('❌ Введіть email', 'error');
    return;
  }
  
  if (!licenseKey) {
    showLicenseMessage('❌ Введіть ключ ліцензії', 'error');
    return;
  }
  
  if (!isValidEmail(email)) {
    showLicenseMessage('❌ Невірний формат email', 'error');
    return;
  }
  
  const activateBtn = document.getElementById('activate-license-btn');
  const originalText = activateBtn.textContent;
  
  activateBtn.textContent = 'Активація...';
  activateBtn.disabled = true;
  
  debugLog('🔐 Спроба активації ліцензії: ' + email + ' + ' + licenseKey.substring(0, 8) + '...', 'info');
  
  if (window.sketchup && window.sketchup.register_license_with_email) {
    try {
      const result = window.sketchup.register_license_with_email(email, licenseKey);
      
      if (result && result.success) {
        showLicenseMessage('✅ Ліцензія успішно зареєстрована!', 'success');
        setTimeout(() => {
          hideLicenseCard();
          debugLog('🔄 Оновлюємо UI після активації ліцензії...', 'info');
          updateLicenseStatusInUI();
          checkServerBlockingStatus();
        }, 1000);
      } else {
        const errorMsg = result ? result.error : 'Невідома помилка';
        showLicenseMessage('❌ Помилка активації: ' + errorMsg, 'error');
        activateBtn.textContent = originalText;
        activateBtn.disabled = false;
      }
    } catch (error) {
      showLicenseMessage('❌ Помилка підключення: ' + error.message, 'error');
      activateBtn.textContent = originalText;
      activateBtn.disabled = false;
    }
  } else {
    showLicenseMessage('❌ Плагін не підключений', 'error');
    activateBtn.textContent = originalText;
    activateBtn.disabled = false;
  }
}

// Показати діалог вводу email
function showEmailDialog(licenseKey) {
  const emailDialog = document.createElement('div');
  emailDialog.id = 'email-dialog';
  emailDialog.innerHTML = `
    <div class="email-dialog-overlay">
      <div class="email-dialog-content">
        <h3>📧 Введіть email для реєстрації</h3>
        <p>Для активації ліцензії потрібен ваш email</p>
        <input type="email" id="email-input" placeholder="your@email.com" />
        <div class="email-dialog-buttons">
          <button onclick="registerLicenseWithEmail('${licenseKey}')" class="btn-primary">Зареєструвати</button>
          <button onclick="hideEmailDialog()" class="btn-secondary">Скасувати</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(emailDialog);
  debugLog('📧 Показано діалог для введення email', 'info');
}

// Приховати діалог email
function hideEmailDialog() {
  const emailDialog = document.getElementById('email-dialog');
  if (emailDialog) {
    emailDialog.remove();
  }
}

// Реєстрація ліцензії з email
function registerLicenseWithEmail(licenseKey) {
  const email = document.getElementById('email-input').value.trim();
  
  if (!email) {
    showLicenseMessage('❌ Введіть email', 'error');
    return;
  }
  
  if (!isValidEmail(email)) {
    showLicenseMessage('❌ Невірний формат email', 'error');
    return;
  }
  
  debugLog('🔐 Реєстрація ліцензії: ' + email + ' + ' + licenseKey.substring(0, 8) + '...', 'info');
  
  if (window.sketchup && window.sketchup.register_license_with_email) {
    try {
      const result = window.sketchup.register_license_with_email(email, licenseKey);
      
      if (result && result.success) {
        showLicenseMessage('✅ Ліцензія успішно зареєстрована!', 'success');
        hideEmailDialog();
        hideLicenseCard();
        updateLicenseStatusInUI();
        checkServerBlockingStatus();
      } else {
        const errorMsg = result ? result.error : 'Невідома помилка';
        showLicenseMessage('❌ Помилка реєстрації: ' + errorMsg, 'error');
      }
    } catch (error) {
      showLicenseMessage('❌ Помилка підключення: ' + error.message, 'error');
    }
  } else {
    showLicenseMessage('❌ Плагін не підключений', 'error');
  }
}

// Оновити статус ліцензії в UI
function updateLicenseStatusInUI() {
  debugLog('🔄 updateLicenseStatusInUI викликано', 'info');
  
  if (window.sketchup && window.sketchup.get_license_info) {
    try {
      const result = window.sketchup.get_license_info();
      debugLog('📋 Результат get_license_info: ' + JSON.stringify(result), 'info');
      
      if (result && result.success) {
        const licenseInfo = result.license_info;
        const email = result.email;
        debugLog('✅ Оновлюємо UI з email: ' + email, 'info');
        
        // Оновлюємо відображення в UI
        if (email) {
          document.getElementById('license-status').innerHTML = `
            <div class="license-status-active">
              <span class="status-icon">✅</span>
              <span class="status-text">Ліцензія активна</span>
              <div class="license-details">
                <div>Email: ${email}</div>
                <div>Ключ: ${licenseInfo.license_key}</div>
              </div>
            </div>
          `;
          
          // Оновлюємо footer з інформацією про ліцензію
          updateLicenseFooter(email, licenseInfo.license_key);
        }
      }
    } catch (error) {
      debugLog('❌ Помилка отримання інформації про ліцензію: ' + error.message, 'error');
    }
  }
}

// Перевірити статус блокування на сервері
function checkServerBlockingStatus() {
  debugLog('🔄 Перевірка статусу блокування на сервері...', 'info');
  
  if (window.sketchup && window.sketchup.check_server_status) {
    try {
      window.sketchup.check_server_status();
    } catch (error) {
      debugLog('❌ Помилка перевірки статусу: ' + error.message, 'error');
    }
  }
}

// Валідація email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Показати повідомлення про ліцензію
function showLicenseMessage(message, type = 'info') {
  const messageDiv = document.getElementById('license-message');
  if (messageDiv) {
    messageDiv.innerHTML = message;
    messageDiv.className = `license-message ${type}`;
    messageDiv.style.display = 'block';
    
    // Автоматично приховати через 5 секунд
    setTimeout(() => {
      messageDiv.style.display = 'none';
    }, 5000);
  }
}

// Приховати карточку ліцензії
function hideLicenseCard() {
  const blockingCard = document.getElementById('blocking-card');
  if (blockingCard) {
    blockingCard.style.display = 'none';
  }
  
  // Показати нормальний UI
  const tabsNavigation = document.querySelector('.tabs-navigation');
  const tabContents = document.querySelectorAll('.tab-content');
  const specificationPanel = document.getElementById('specification-panel');
  
  if (tabsNavigation) {
    tabsNavigation.style.display = 'flex';
  }
  
  tabContents.forEach(tab => {
    tab.style.display = 'block';
  });
  
  if (specificationPanel) {
    specificationPanel.style.display = 'block';
  }
}

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
  
  // Приховуємо footer з інформацією про ліцензію
  hideLicenseFooter();
  
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
  
  // Показуємо footer з інформацією про ліцензію якщо вона є
  updateLicenseStatusInUI();
  
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

// Оновити footer з інформацією про ліцензію
function updateLicenseFooter(email, licenseKey) {
  const footer = document.getElementById('license-footer');
  const emailElement = document.getElementById('license-footer-email');
  const keyElement = document.getElementById('license-footer-key');
  
  if (footer && emailElement && keyElement) {
    emailElement.textContent = email;
    keyElement.textContent = licenseKey.substring(0, 8) + '...';
    footer.style.display = 'block';
    
    debugLog(`📧 Footer оновлено: ${email} + ${licenseKey.substring(0, 8)}...`, 'info');
  }
}

// Приховати footer з інформацією про ліцензію
function hideLicenseFooter() {
  const footer = document.getElementById('license-footer');
  if (footer) {
    footer.style.display = 'none';
    debugLog('📧 Footer приховано', 'info');
  }
}
