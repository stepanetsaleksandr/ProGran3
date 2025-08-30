// proGran3/web/src/modules/utils/Logger.js
// Модуль логування для ProGran3

export class Logger {
  // Функція для додавання повідомлень в debug лог
  static debug(message, type = 'info') {
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
  static clear() {
    const debugLog = document.getElementById('debug-log');
    if (debugLog) {
      debugLog.innerHTML = '<div>🔍 Очікування логів...</div>';
    }
  }
}

// Експорт глобальних функцій для зворотної сумісності
export function debugLog(message, type = 'info') {
  Logger.debug(message, type);
}

export function clearDebugLog() {
  Logger.clear();
}
