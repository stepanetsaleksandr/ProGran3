// modules/utils/Helpers.js
// Допоміжні функції для ProGran3

(function(global) {
  'use strict';
  
  // Створюємо namespace
  global.ProGran3 = global.ProGran3 || {};
  global.ProGran3.Utils = global.ProGran3.Utils || {};
  
  // Приватні функції
  function logHelperAction(message, type = 'info') {
    if (global.ProGran3.Core.Logger) {
      global.ProGran3.Core.Logger.debugLog(message, type, 'Helpers');
    }
  }
  
  // Публічні функції
  function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  }
  
  function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
  
  function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  }
  
  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
  
  function formatTime(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  }
  
  function generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  function parseQueryString(queryString) {
    const params = {};
    if (!queryString) return params;
    
    queryString.split('&').forEach(param => {
      const [key, value] = param.split('=');
      if (key) {
        params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
      }
    });
    
    return params;
  }
  
  function buildQueryString(params) {
    const queryParts = [];
    
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
      }
    });
    
    return queryParts.join('&');
  }
  
  function isElementInViewport(element) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
  
  function scrollToElement(element, offset = 0) {
    if (!element) return false;
    
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;
    
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
    
    return true;
  }
  
  function getElementCenter(element) {
    if (!element) return null;
    
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  }
  
  function createElement(tag, attributes = {}, textContent = '') {
    const element = document.createElement(tag);
    
    Object.keys(attributes).forEach(key => {
      if (key === 'className') {
        element.className = attributes[key];
      } else if (key === 'innerHTML') {
        element.innerHTML = attributes[key];
      } else {
        element.setAttribute(key, attributes[key]);
      }
    });
    
    if (textContent) {
      element.textContent = textContent;
    }
    
    return element;
  }
  
  function removeElement(element) {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
      return true;
    }
    return false;
  }
  
  function addClass(element, className) {
    if (element && className) {
      element.classList.add(className);
      return true;
    }
    return false;
  }
  
  function removeClass(element, className) {
    if (element && className) {
      element.classList.remove(className);
      return true;
    }
    return false;
  }
  
  function toggleClass(element, className) {
    if (element && className) {
      element.classList.toggle(className);
      return true;
    }
    return false;
  }
  
  function hasClass(element, className) {
    return element && className && element.classList.contains(className);
  }
  
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }
  
  function setCookie(name, value, days = 7) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  }
  
  function deleteCookie(name) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }
  
  function getLocalStorage(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      logHelperAction(`Помилка читання localStorage для ключа ${key}: ${error.message}`, 'error');
      return null;
    }
  }
  
  function setLocalStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      logHelperAction(`Помилка запису в localStorage для ключа ${key}: ${error.message}`, 'error');
      return false;
    }
  }
  
  function removeLocalStorage(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      logHelperAction(`Помилка видалення з localStorage для ключа ${key}: ${error.message}`, 'error');
      return false;
    }
  }
  
  function clearLocalStorage() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      logHelperAction(`Помилка очищення localStorage: ${error.message}`, 'error');
      return false;
    }
  }
  
  function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      
      const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(selector);
        if (element) {
          obs.disconnect();
          resolve(element);
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  }
  
  function waitForCondition(condition, timeout = 5000, interval = 100) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const check = () => {
        if (condition()) {
          resolve(true);
        } else if (Date.now() - startTime >= timeout) {
          reject(new Error(`Condition not met within ${timeout}ms`));
        } else {
          setTimeout(check, interval);
        }
      };
      
      check();
    });
  }
  
  function retry(fn, maxAttempts = 3, delay = 1000) {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      
      const attempt = () => {
        attempts++;
        
        try {
          const result = fn();
          if (result instanceof Promise) {
            result.then(resolve).catch(error => {
              if (attempts >= maxAttempts) {
                reject(error);
              } else {
                setTimeout(attempt, delay);
              }
            });
          } else {
            resolve(result);
          }
        } catch (error) {
          if (attempts >= maxAttempts) {
            reject(error);
          } else {
            setTimeout(attempt, delay);
          }
        }
      };
      
      attempt();
    });
  }
  
  // Експорт публічного API
  global.ProGran3.Utils.Helpers = {
    debounce: debounce,
    throttle: throttle,
    deepClone: deepClone,
    formatBytes: formatBytes,
    formatTime: formatTime,
    generateId: generateId,
    parseQueryString: parseQueryString,
    buildQueryString: buildQueryString,
    isElementInViewport: isElementInViewport,
    scrollToElement: scrollToElement,
    getElementCenter: getElementCenter,
    createElement: createElement,
    removeElement: removeElement,
    addClass: addClass,
    removeClass: removeClass,
    toggleClass: toggleClass,
    hasClass: hasClass,
    getCookie: getCookie,
    setCookie: setCookie,
    deleteCookie: deleteCookie,
    getLocalStorage: getLocalStorage,
    setLocalStorage: setLocalStorage,
    removeLocalStorage: removeLocalStorage,
    clearLocalStorage: clearLocalStorage,
    waitForElement: waitForElement,
    waitForCondition: waitForCondition,
    retry: retry
  };
  
  // Ініціалізація
  if (global.ProGran3.Core.Logger) {
    global.ProGran3.Core.Logger.debugLog('Helpers модуль завантажено', 'info', 'Helpers');
  }
  
})(window);
