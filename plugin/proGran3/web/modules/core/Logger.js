// modules/core/Logger.js
// Система логування для ProGran3

(function(global) {
  'use strict';
  
  // Створюємо namespace
  global.ProGran3 = global.ProGran3 || {};
  global.ProGran3.Core = global.ProGran3.Core || {};
  
  // Приватні змінні (інкапсуляція)
  let logLevel = 'info';
  let logHistory = [];
  let maxHistorySize = 100;
  
  // Рівні логування
  const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4
  };
  
  // Іконки для різних рівнів
  const ICONS = {
    debug: '🔍',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
    fatal: '💥'
  };
  
  // Приватні функції
  function shouldLog(level) {
    return LOG_LEVELS[level] >= LOG_LEVELS[logLevel];
  }
  
  function formatMessage(message, type, context) {
    const timestamp = new Date().toLocaleTimeString();
    const icon = ICONS[type] || '📝';
    const contextStr = context ? `[${context}] ` : '';
    return `[${timestamp}] ${icon} ${contextStr}${message}`;
  }
  
  function addToHistory(formattedMessage) {
    logHistory.push(formattedMessage);
    if (logHistory.length > maxHistorySize) {
      logHistory.shift(); // Видаляємо найстаріший запис
    }
  }
  
  function updateDebugLogElement(formattedMessage, type) {
    const debugLogElement = document.getElementById('debug-log');
    if (!debugLogElement) return;
    
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${type}`;
    logEntry.textContent = formattedMessage;
    debugLogElement.appendChild(logEntry);
    debugLogElement.scrollTop = debugLogElement.scrollHeight;
    
    // Обмежуємо кількість записів в UI
    while (debugLogElement.children.length > 50) {
      debugLogElement.removeChild(debugLogElement.firstChild);
    }
  }
  
  // Публічні функції
  function debugLog(message, type = 'info', context = null) {
    if (!shouldLog(type)) return;
    
    const formattedMessage = formatMessage(message, type, context);
    
    // Додаємо в історію
    addToHistory(formattedMessage);
    
    // Виводимо в консоль
    console.log(formattedMessage);
    
    // Виводимо в UI
    updateDebugLogElement(formattedMessage, type);
  }
  
  function clearDebugLog() {
    logHistory = [];
    const debugLogElement = document.getElementById('debug-log');
    if (debugLogElement) {
      debugLogElement.innerHTML = '<div>🔍 Очікування логів...</div>';
    }
  }
  
  function setLogLevel(level) {
    if (LOG_LEVELS.hasOwnProperty(level)) {
      logLevel = level;
      debugLog(`Рівень логування змінено на: ${level}`, 'info', 'Logger');
    } else {
      debugLog(`Невірний рівень логування: ${level}`, 'error', 'Logger');
    }
  }
  
  function getLogLevel() {
    return logLevel;
  }
  
  function getLogHistory() {
    return [...logHistory]; // Повертаємо копію
  }
  
  function getLogStats() {
    const stats = {
      total: logHistory.length,
      byLevel: {}
    };
    
    Object.keys(LOG_LEVELS).forEach(level => {
      stats.byLevel[level] = 0;
    });
    
    logHistory.forEach(entry => {
      Object.keys(ICONS).forEach(level => {
        if (entry.includes(ICONS[level])) {
          stats.byLevel[level]++;
        }
      });
    });
    
    return stats;
  }
  
  // Експорт публічного API
  global.ProGran3.Core.Logger = {
    debugLog: debugLog,
    clearDebugLog: clearDebugLog,
    setLogLevel: setLogLevel,
    getLogLevel: getLogLevel,
    getLogHistory: getLogHistory,
    getLogStats: getLogStats,
    LOG_LEVELS: LOG_LEVELS
  };
  
  // Зворотна сумісність - функції доступні глобально
  global.debugLog = debugLog;
  global.clearDebugLog = clearDebugLog;
  
  // Ініціалізація
  debugLog('Logger модуль завантажено', 'info', 'Logger');
  
})(window);
