// modules/core/DebugManager.js
// Модуль для управління дебаг логами

/**
 * DebugManager - управління дебаг логами
 * Експортує функції: debugLog, clearDebugLog, toggleDebugLog
 */

// Функція логування з підтримкою різних типів
function debugLog(message, type = 'info') {
  // Тільки в development режимі
  const isDevelopment = typeof window !== 'undefined' && window.location && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  
  if (!isDevelopment && type !== 'error') {
    return; // Пропускаємо non-error логи в production
  }
  
  const debugLog = document.getElementById('debug-log');
  if (!debugLog) return;
  
  // Обмежуємо кількість записів
  const maxEntries = 50;
  const entries = debugLog.querySelectorAll('.debug-entry');
  if (entries.length >= maxEntries) {
    entries[0].remove(); // Видаляємо найстаріший запис
  }
  
  const timestamp = new Date().toLocaleTimeString();
  const entry = document.createElement('div');
  entry.className = 'debug-entry';
  entry.innerHTML = `<span class="debug-time">[${timestamp}]</span> <span class="debug-type debug-${type}">[${type.toUpperCase()}]</span> ${message}`;
  
  debugLog.appendChild(entry);
  debugLog.scrollTop = debugLog.scrollHeight;
  
  // Додатково в консоль для розробки
  if (isDevelopment) {
    console.log(`[DEBUG ${type.toUpperCase()}] ${message}`);
  }
}

// Очищення дебаг логів
function clearDebugLog() {
  const debugLog = document.getElementById('debug-log');
  if (debugLog) {
    debugLog.innerHTML = '<div> Очікування логів...</div>';
  }
}

// Переключення видимості дебаг логів
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

// Експорт функцій глобально для зворотної сумісності
if (typeof window !== 'undefined') {
  window.debugLog = debugLog;
  window.clearDebugLog = clearDebugLog;
  window.toggleDebugLog = toggleDebugLog;
}

// Експорт для модульної системи
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    debugLog,
    clearDebugLog,
    toggleDebugLog
  };
}
