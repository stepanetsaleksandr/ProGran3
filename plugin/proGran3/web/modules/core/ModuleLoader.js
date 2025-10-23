// modules/core/ModuleLoader.js
// Система динамічного завантаження модулів з сервера

(function(global) {
  'use strict';
  
  // Створюємо namespace
  global.ProGran3 = global.ProGran3 || {};
  global.ProGran3.Core = global.ProGran3.Core || {};
  
  // Константи
  const CACHE_PREFIX = 'ProGran3_Module_';
  const DEFAULT_CACHE_TTL = 86400000; // 24 години в мілісекундах
  const LOAD_TIMEOUT = 10000; // 10 секунд
  
  // Приватні змінні
  let loadedModules = {};
  let loadingPromises = {};
  
  // Логування
  function logModuleLoader(message, type = 'info') {
    if (global.ProGran3.Core.Logger) {
      global.ProGran3.Core.Logger.debugLog(message, type, 'ModuleLoader');
    } else {
      console.log(`[ModuleLoader] ${message}`);
    }
  }
  
  /**
   * Завантажити модуль з сервера або cache
   * @param {string} moduleName - Назва модуля (e.g., 'report-generator')
   * @param {Object} options - Опції завантаження
   * @returns {Promise<Object>} Завантажений модуль
   */
  async function loadModule(moduleName, options = {}) {
    logModuleLoader(`Завантаження модуля: ${moduleName}`, 'info');
    
    // Якщо вже завантажуємо - почекати
    if (loadingPromises[moduleName]) {
      logModuleLoader(`Модуль ${moduleName} вже завантажується, очікуємо...`, 'info');
      return loadingPromises[moduleName];
    }
    
    // Якщо вже завантажений і не потрібен force reload
    if (loadedModules[moduleName] && !options.forceReload) {
      logModuleLoader(`Модуль ${moduleName} вже завантажений з memory`, 'info');
      return Promise.resolve(loadedModules[moduleName]);
    }
    
    // Створюємо promise для завантаження
    const loadPromise = (async () => {
      try {
        // 1. Перевірити cache
        const cached = getCachedModule(moduleName);
        if (cached && !options.forceReload) {
          logModuleLoader(`Використовую cached модуль: ${moduleName}`, 'info');
          const module = executeModuleCode(cached.code, moduleName);
          loadedModules[moduleName] = module;
          return module;
        }
        
        // 2. Завантажити з сервера
        logModuleLoader(`Завантаження ${moduleName} з сервера...`, 'info');
        const moduleData = await fetchModuleFromServer(moduleName);
        
        // 3. Verify signature
        if (!verifyModuleSignature(moduleData)) {
          throw new Error('Module signature verification failed');
        }
        
        // 4. Cache модуль
        cacheModule(moduleName, moduleData);
        
        // 5. Execute code
        const module = executeModuleCode(moduleData.code, moduleName);
        loadedModules[moduleName] = module;
        
        logModuleLoader(`Модуль ${moduleName} v${moduleData.version} завантажено успішно`, 'success');
        
        return module;
        
      } catch (error) {
        logModuleLoader(`Помилка завантаження ${moduleName}: ${error.message}`, 'error');
        
        // Fallback: спробувати використати старий cache
        const oldCached = getCachedModule(moduleName, true); // ignoreExpiry
        if (oldCached) {
          logModuleLoader(`Використовую застарілий cache як fallback`, 'warn');
          const module = executeModuleCode(oldCached.code, moduleName);
          loadedModules[moduleName] = module;
          return module;
        }
        
        throw error;
      } finally {
        delete loadingPromises[moduleName];
      }
    })();
    
    loadingPromises[moduleName] = loadPromise;
    return loadPromise;
  }
  
  /**
   * Завантажити модуль з сервера
   */
  async function fetchModuleFromServer(moduleName) {
    const apiUrl = getApiBaseUrl();
    const url = `${apiUrl}/api/modules/${moduleName}`;
    
    logModuleLoader(`Fetching from: ${url}`, 'info');
    
    // Timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Module load timeout')), LOAD_TIMEOUT);
    });
    
    // Fetch promise з headers
    const fetchPromise = fetch(url, {
      method: 'GET',
      headers: {
        'X-Plugin-Version': '3.2.1',
        'X-Fingerprint-Hash': getFingerprintHash(),
        'Content-Type': 'application/json'
      }
    });
    
    // Race між fetch та timeout
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to load module');
    }
    
    return data.data;
  }
  
  /**
   * Отримати API base URL
   */
  function getApiBaseUrl() {
    // Спробувати отримати з config
    if (typeof window.ProGran3Config !== 'undefined') {
      return window.ProGran3Config.apiBaseUrl;
    }
    
    // Fallback до hardcoded
    return 'https://server-hbf7li0u7-provis3ds-projects.vercel.app';
  }
  
  /**
   * Отримати fingerprint hash для telemetry
   */
  function getFingerprintHash() {
    // Спробувати отримати з SketchUp bridge
    if (typeof window.sketchup !== 'undefined' && window.sketchup.get_fingerprint_hash) {
      return window.sketchup.get_fingerprint_hash();
    }
    return 'unknown';
  }
  
  /**
   * Verify module signature
   */
  function verifyModuleSignature(moduleData) {
    // TODO: Implement crypto verification
    // Для простоти зараз просто перевіряємо наявність
    return moduleData.signature && moduleData.signature.length > 0;
  }
  
  /**
   * Execute module code
   */
  function executeModuleCode(code, moduleName) {
    try {
      logModuleLoader(`Виконання коду модуля: ${moduleName}`, 'info');
      
      // Створюємо безпечний контекст для виконання
      const moduleFunction = new Function('global', 'window', 'document', 'console', code + '; return typeof ProGran3_ReportGenerator !== "undefined" ? ProGran3_ReportGenerator : null;');
      
      // Виконуємо код
      const module = moduleFunction(global, window, document, console);
      
      if (!module) {
        throw new Error('Module did not export expected object');
      }
      
      logModuleLoader(`Модуль ${moduleName} виконано успішно`, 'success');
      return module;
      
    } catch (error) {
      logModuleLoader(`Помилка виконання коду ${moduleName}: ${error.message}`, 'error');
      throw error;
    }
  }
  
  /**
   * Cache модуль в localStorage
   */
  function cacheModule(moduleName, moduleData) {
    try {
      const cacheKey = CACHE_PREFIX + moduleName;
      const cacheData = {
        code: moduleData.code,
        version: moduleData.version,
        signature: moduleData.signature,
        cachedAt: Date.now(),
        ttl: moduleData.cache_ttl || DEFAULT_CACHE_TTL
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      logModuleLoader(`Модуль ${moduleName} збережено в cache`, 'info');
      
    } catch (error) {
      logModuleLoader(`Не вдалося cache модуль ${moduleName}: ${error.message}`, 'warn');
    }
  }
  
  /**
   * Отримати модуль з cache
   */
  function getCachedModule(moduleName, ignoreExpiry = false) {
    try {
      const cacheKey = CACHE_PREFIX + moduleName;
      const cachedString = localStorage.getItem(cacheKey);
      
      if (!cachedString) {
        return null;
      }
      
      const cached = JSON.parse(cachedString);
      const age = Date.now() - cached.cachedAt;
      
      // Перевірка expiry
      if (!ignoreExpiry && age > cached.ttl) {
        logModuleLoader(`Cache для ${moduleName} застарів (age: ${Math.floor(age/1000)}s)`, 'info');
        return null;
      }
      
      logModuleLoader(`Знайдено cached модуль: ${moduleName} v${cached.version}`, 'info');
      return cached;
      
    } catch (error) {
      logModuleLoader(`Помилка читання cache для ${moduleName}: ${error.message}`, 'warn');
      return null;
    }
  }
  
  /**
   * Очистити cache модуля
   */
  function clearModuleCache(moduleName) {
    try {
      const cacheKey = CACHE_PREFIX + moduleName;
      localStorage.removeItem(cacheKey);
      delete loadedModules[moduleName];
      logModuleLoader(`Cache для ${moduleName} очищено`, 'info');
    } catch (error) {
      logModuleLoader(`Помилка очищення cache: ${error.message}`, 'warn');
    }
  }
  
  /**
   * Очистити весь cache модулів
   */
  function clearAllModulesCache() {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      loadedModules = {};
      logModuleLoader('Весь cache модулів очищено', 'info');
    } catch (error) {
      logModuleLoader(`Помилка очищення всього cache: ${error.message}`, 'warn');
    }
  }
  
  /**
   * Отримати інформацію про cache
   */
  function getCacheInfo() {
    const modules = [];
    
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          const data = JSON.parse(localStorage.getItem(key));
          const moduleName = key.replace(CACHE_PREFIX, '');
          const age = Date.now() - data.cachedAt;
          
          modules.push({
            name: moduleName,
            version: data.version,
            cachedAt: new Date(data.cachedAt).toISOString(),
            age_seconds: Math.floor(age / 1000),
            expired: age > data.ttl,
            loaded: !!loadedModules[moduleName]
          });
        }
      });
    } catch (error) {
      logModuleLoader(`Помилка отримання cache info: ${error.message}`, 'warn');
    }
    
    return modules;
  }
  
  // Експорт публічного API
  global.ProGran3.Core.ModuleLoader = {
    loadModule: loadModule,
    clearModuleCache: clearModuleCache,
    clearAllModulesCache: clearAllModulesCache,
    getCacheInfo: getCacheInfo,
    version: '1.0.0'
  };
  
  logModuleLoader('ModuleLoader ініціалізовано', 'info');
  
})(window);

