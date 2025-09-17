// modules/core/I18nManager.js
// Менеджер інтернаціоналізації ProGran3

(function(global) {
  'use strict';
  
  // Створюємо namespace
  global.ProGran3 = global.ProGran3 || {};
  global.ProGran3.Core = global.ProGran3.Core || {};
  
  // Приватні змінні
  let isInitialized = false;
  
  // Публічні методи
  const I18nManager = {
    // Ініціалізація I18n системи
    init: async function() {
      try {
        // Ініціалізуємо I18nManager
        if (window.ProGran3 && window.ProGran3.I18n && window.ProGran3.I18n.Manager) {
          await window.ProGran3.I18n.Manager.init();
          if (window.debugLog) {
            window.debugLog('I18n ініціалізовано успішно', 'success');
          }
        }
        
        // Ініціалізуємо перемикач мов
        if (window.ProGran3 && window.ProGran3.UI && window.ProGran3.UI.LanguageSwitcher) {
          window.ProGran3.UI.LanguageSwitcher.init();
          if (window.debugLog) {
            window.debugLog('Перемикач мов ініціалізовано', 'success');
          }
        }
        
        isInitialized = true;
        return true;
      } catch (error) {
        if (window.debugLog) {
          window.debugLog(`Помилка ініціалізації i18n: ${error.message}`, 'error');
        }
        return false;
      }
    },
    
    // Функція для отримання перекладу
    t: function(key, params = {}) {
      if (window.ProGran3 && window.ProGran3.I18n && window.ProGran3.I18n.Manager) {
        return window.ProGran3.I18n.Manager.t(key, params);
      }
      return key; // Fallback
    },
    
    // Функція для зміни мови
    changeLanguage: async function(lang) {
      if (window.ProGran3 && window.ProGran3.I18n && window.ProGran3.I18n.Manager) {
        const success = await window.ProGran3.I18n.Manager.changeLanguage(lang);
        if (success) {
          if (window.debugLog) {
            window.debugLog(`Мову змінено на: ${lang}`, 'success');
          }
          // Оновлюємо динамічний контент
          this.updateDynamicContent();
        }
        return success;
      }
      return false;
    },
    
    // Оновлення динамічного контенту після зміни мови
    updateDynamicContent: function() {
      // Оновлюємо заголовки панелей
      this.updatePanelHeaders();
      
      // Оновлюємо всі лейбли з data-i18n атрибутами
      this.updateAllI18nLabels();
      
      // Оновлюємо розміри в заголовках
      if (typeof window.updateAllDisplays === 'function') {
        window.updateAllDisplays();
      }
      
      // Оновлюємо лейбли з одиницями вимірювання
      if (typeof window.updateUnitLabels === 'function') {
        window.updateUnitLabels();
      }
      
      // Оновлюємо специфікацію
      if (typeof window.updateSummaryTable === 'function') {
        window.updateSummaryTable();
      }
    },
    
    // Оновлення заголовків панелей
    updatePanelHeaders: function() {
      const panels = document.querySelectorAll('.panel-title');
      panels.forEach(panel => {
        const key = panel.getAttribute('data-i18n');
        if (key) {
          panel.textContent = this.t(key);
        }
      });
    },
    
    // Оновлення всіх лейблів з data-i18n атрибутами
    updateAllI18nLabels: function() {
      const labels = document.querySelectorAll('[data-i18n]');
      if (window.debugLog) {
        window.debugLog(`Оновлення ${labels.length} лейблів з data-i18n атрибутами`, 'info');
      }
      
      labels.forEach(label => {
        const key = label.getAttribute('data-i18n');
        if (key) {
          // Перевіряємо, чи це не лейбл з одиницями вимірювання (крім спеціальних випадків)
          if (!label.id.includes('-label') || label.id.includes('stele-distance-label') || label.id.includes('gaps-') || label.id.includes('stands-') || label.id.includes('central-detail-')) {
            const translation = this.t(key);
            if (translation !== key) {
              label.textContent = translation;
              if (window.debugLog) {
                window.debugLog(`Оновлено лейбл ${label.id}: ${key} -> ${translation}`, 'info');
              }
            } else {
              if (window.debugLog) {
                window.debugLog(`Переклад не знайдено для ключа: ${key}`, 'warning');
              }
            }
          }
        }
      });
    },
    
    // Перевірка чи ініціалізовано
    isInitialized: function() {
      return isInitialized;
    },
    
    // Отримання поточної мови
    getCurrentLanguage: function() {
      if (window.ProGran3 && window.ProGran3.I18n && window.ProGran3.I18n.Manager) {
        return window.ProGran3.I18n.Manager.getCurrentLanguage();
      }
      return 'uk'; // Fallback
    },
    
    // Отримання доступних мов
    getAvailableLanguages: function() {
      if (window.ProGran3 && window.ProGran3.I18n && window.ProGran3.I18n.Manager) {
        return window.ProGran3.I18n.Manager.getAvailableLanguages();
      }
      return ['uk', 'en', 'pl']; // Fallback
    }
  };
  
  // Експорт
  global.ProGran3.Core.I18nManager = I18nManager;
  
  // Зворотна сумісність - глобальні функції
  global.initializeI18n = async function() {
    return await I18nManager.init();
  };
  
  global.t = function(key, params = {}) {
    return I18nManager.t(key, params);
  };
  
  global.changeLanguage = async function(lang) {
    return await I18nManager.changeLanguage(lang);
  };
  
  global.updateDynamicContent = function() {
    return I18nManager.updateDynamicContent();
  };
  
  global.updatePanelHeaders = function() {
    return I18nManager.updatePanelHeaders();
  };
  
  global.updateAllI18nLabels = function() {
    return I18nManager.updateAllI18nLabels();
  };
  
})(window);
