// modules/ui/ReportWithPreview.js
// Об'єднана функціональність генерації звіту з превью

(function(global) {
  'use strict';
  
  // Створюємо namespace
  global.ProGran3 = global.ProGran3 || {};
  global.ProGran3.UI = global.ProGran3.UI || {};
  
  // Приватні функції
  function logReportPreviewAction(message, type = 'info') {
    if (global.ProGran3.Core.Logger) {
      global.ProGran3.Core.Logger.debugLog(message, type, 'ReportWithPreview');
    }
  }
  
  // Налаштування превью
  const previewSettings = {
    size: 800,
    quality: 'high'
  };
  
  // Стан перемикача включення превью
  let includePreviewInReport = true;
  
  // Ініціалізація модуля
  function initializeReportWithPreview() {
    logReportPreviewAction('Ініціалізація ReportWithPreview модуля', 'info');
    
    // Додаємо HTML елементи
    addReportPreviewControls();
    
    // Ініціалізуємо перемикач
    initializePreviewToggle();
    
    logReportPreviewAction('ReportWithPreview модуль ініціалізовано', 'success');
  }
  
  // Додавання елементів управління
  function addReportPreviewControls() {
    const viewTab = document.getElementById('view-tab');
    if (!viewTab) {
      logReportPreviewAction('Не знайдено view-tab для додавання контролів', 'error');
      return;
    }
    
    // Перевіряємо чи контроли вже існують (щоб уникнути дублювання)
    const existingControls = document.getElementById('report-preview-controls');
    if (existingControls) {
      logReportPreviewAction('Контроли вже існують, пропускаємо додавання', 'info');
      return;
    }
    
    // Створюємо панель
    const controlsContainer = document.createElement('section');
    controlsContainer.id = 'report-preview-controls';
    controlsContainer.className = 'panel';
    
    controlsContainer.innerHTML = `
      <div class="panel-header" onclick="toggleAccordionPanel(this)">
        <h2 class="panel-title">Технічна документація проекту</h2>
        <span class="chevron"></span>
        <span class="header-placeholder"></span>
      </div>
      <div class="panel-content">
        <div class="toggle-container">
          <span class="toggle-label">Включити превью моделі</span>
          <label class="modern-toggle">
            <input type="checkbox" id="include-preview-toggle" checked>
            <span class="toggle-slider"></span>
          </label>
        </div>
        
        <button onclick="window.ProGran3.UI.ReportWithPreview.generateReportWithPreview()" 
                class="btn btn-primary" id="generate-report-preview-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
          Генерувати звіт
        </button>
        
        <div class="legislation-info">
          <p class="legislation-notice">Тестовий варіант звіту, пізніше документація буде адаптована під Законодавчі Акти:</p>
          <div class="legislation-categories">
            <div class="legislation-category">
              <strong>I. Закони України</strong>
              <ul>
                <li>«Про охорону культурної спадщини»</li>
                <li>«Про архітектурну діяльність»</li>
                <li>«Про регулювання містобудівної діяльності»</li>
              </ul>
            </div>
            <div class="legislation-category">
              <strong>II. Державні Будівельні Норми (ДБН)</strong>
              <ul>
                <li>ДБН А.2.2-3:2014 Склад та зміст проєктної документації на будівництво</li>
                <li>ДБН А.2.2-14:2016 Склад та зміст науково-проєктної документації на реставрацію пам'яток</li>
              </ul>
            </div>
            <div class="legislation-category">
              <strong>III. Державні Стандарти України (ДСТУ)</strong>
              <ul>
                <li>ДСТУ Б А.2.4-4:2009 Основні вимоги до проєктної та робочої документації</li>
                <li>ДСТУ Б А.2.4-7:2009 Правила виконання архітектурно-будівельних робочих креслень</li>
                <li>ДСТУ Б В.2.2-35:2013 Намогильні споруди та склепи</li>
              </ul>
            </div>
            <div class="legislation-category">
              <strong>IV. Додаткові та Місцеві Нормативи</strong>
              <ul>
                <li>Положення органів місцевого самоврядування</li>
                <li>Кваліфікаційні вимоги до ГАП та ГІП</li>
                <li>Ліцензійні вимоги для робіт на об'єктах культурної спадщини</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Вставляємо перед першою секцією
    const firstPanel = viewTab.querySelector('.panel');
    if (firstPanel) {
      viewTab.insertBefore(controlsContainer, firstPanel);
    } else {
      viewTab.appendChild(controlsContainer);
    }
    
    logReportPreviewAction('Контроли додано до view-tab', 'info');
  }
  
  // Ініціалізація перемикача
  function initializePreviewToggle() {
    const toggle = document.getElementById('include-preview-toggle');
    if (toggle) {
      toggle.addEventListener('change', function() {
        includePreviewInReport = this.checked;
        logReportPreviewAction(`Перемикач превью: ${includePreviewInReport ? 'увімкнено' : 'вимкнено'}`, 'info');
        
        // Оновлюємо текст кнопки
        updateButtonText();
      });
    }
  }
  
  // Оновлення тексту кнопки
  function updateButtonText() {
    const button = document.getElementById('generate-report-preview-btn');
    const span = button?.querySelector('span');
    
    if (span) {
      span.textContent = 'Генерувати звіт';
    }
  }
  
  // Головна функція генерації звіту з превью
  function generateReportWithPreview() {
    logReportPreviewAction('Початок генерації звіту з превью', 'info');
    
    try {
      // Показуємо індикатор завантаження
      showLoadingIndicator(true);
      
      if (includePreviewInReport) {
        // Генеруємо превью та звіт
        generatePreviewAndReport();
      } else {
        // Генеруємо тільки звіт
        generateReportOnly();
      }
      
    } catch (error) {
      logReportPreviewAction(`Помилка в generateReportWithPreview(): ${error.message}`, 'error');
      showLoadingIndicator(false);
      alert('Помилка при генерації звіту: ' + error.message);
    }
  }
  
  // Генерація тільки звіту
  function generateReportOnly() {
    logReportPreviewAction('Генерація тільки звіту', 'info');
    
    if (window.ProGran3.UI.SummaryTable && window.ProGran3.UI.SummaryTable.generateReport) {
      window.ProGran3.UI.SummaryTable.generateReport();
      showLoadingIndicator(false);
      logReportPreviewAction('Звіт успішно згенеровано та відкрито', 'success');
    } else {
      throw new Error('SummaryTable модуль не доступний');
    }
  }
  
  // Генерація превью та звіту
  function generatePreviewAndReport() {
    logReportPreviewAction('Генерація превью та звіту', 'info');
    
    // Перевіряємо доступність SketchUp API
    if (!window.sketchup || !window.sketchup.generate_model_preview) {
      logReportPreviewAction('SketchUp API для генерації превью не доступний, генеруємо тільки звіт', 'warn');
      generateReportOnly();
      return;
    }
    
    try {
      // Викликаємо SketchUp API для генерації превью
      const result = window.sketchup.generate_model_preview(previewSettings.size, previewSettings.quality);
      
      logReportPreviewAction(`Результат генерації превью: ${result}`, 'info');
      
      if (result === 1) {
        logReportPreviewAction('Превью успішно згенеровано, очікуємо дані', 'success');
        
        // Додаємо таймаут для випадку, коли превью не приходить
        window.previewTimeout = setTimeout(() => {
          logReportPreviewAction('Таймаут очікування превью, генеруємо звіт без превью', 'warn');
          window.currentPreviewData = null;
          global.currentPreviewData = null;
          generateReportOnly();
        }, 10000); // 10 секунд
        
        // Дані прийдуть через callback handlePreviewData
      } else {
        logReportPreviewAction('Помилка генерації превью, генеруємо тільки звіт', 'warn');
        generateReportOnly();
      }
    } catch (error) {
      logReportPreviewAction(`Помилка при виклику generate_model_preview: ${error.message}`, 'error');
      generateReportOnly();
    }
  }
  
  // Показ індикатора завантаження
  function showLoadingIndicator(show) {
    const button = document.getElementById('generate-report-preview-btn');
    if (button) {
      if (show) {
        button.disabled = true;
        button.innerHTML = `
          <div class="loading-spinner"></div>
          <span>Генерація...</span>
        `;
      } else {
        button.disabled = false;
        updateButtonText();
        button.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <span>${includePreviewInReport ? 'Генерувати звіт з превью' : 'Генерувати звіт'}</span>
        `;
      }
    }
  }
  
  // Callback для отримання превью даних
  function handlePreviewData(data) {
    console.log('🎯 [ReportWithPreview] handlePreviewData викликано');
    console.log('🎯 [ReportWithPreview] Дані:', data ? `є дані, довжина: ${data.length}` : 'немає даних');
    logReportPreviewAction('Отримано дані превью', 'info');
    
    try {
      // Очищуємо таймаут
      if (window.previewTimeout) {
        clearTimeout(window.previewTimeout);
        window.previewTimeout = null;
        console.log('🎯 [ReportWithPreview] Таймаут очищено');
      }
      
      if (data) {
        // Зберігаємо превью дані в різних місцях для сумісності
        window.currentPreviewData = data;
        global.currentPreviewData = data;
        console.log(`🎯 [ReportWithPreview] Дані збережено в window.currentPreviewData (${window.currentPreviewData.length}) та global.currentPreviewData (${global.currentPreviewData.length})`);
        logReportPreviewAction(`Превью дані збережено в window.currentPreviewData та global.currentPreviewData, довжина: ${data.length} символів`, 'info');
        
        // Генеруємо звіт з превью
        console.log('🎯 [ReportWithPreview] Викликаємо generateReportWithPreviewData');
        generateReportWithPreviewData();
      } else {
        console.log('⚠️ [ReportWithPreview] Превью дані порожні');
        logReportPreviewAction('Превью дані порожні, генеруємо звіт без превью', 'warn');
        window.currentPreviewData = null;
        global.currentPreviewData = null;
        generateReportOnly();
      }
      
    } catch (error) {
      console.error('❌ [ReportWithPreview] Помилка обробки превью даних:', error);
      logReportPreviewAction(`Помилка обробки превью даних: ${error.message}`, 'error');
      showLoadingIndicator(false);
    }
  }
  
  // Генерація звіту з превью даними
  function generateReportWithPreviewData() {
    console.log('📊 [ReportWithPreview] generateReportWithPreviewData викликано');
    logReportPreviewAction('Генерація звіту з превью даними', 'info');
    
    // Перевіряємо чи превью дані дійсно збережені
    if (window.currentPreviewData) {
      console.log(`✅ [ReportWithPreview] Превью дані доступні в window.currentPreviewData, довжина: ${window.currentPreviewData.length}`);
      console.log(`✅ [ReportWithPreview] Перші 100 символів:`, window.currentPreviewData.substring(0, 100));
      logReportPreviewAction(`Превью дані доступні для звіту, довжина: ${window.currentPreviewData.length} символів`, 'info');
    } else {
      console.error('❌ [ReportWithPreview] ПРЕВЬЮ ДАНІ НЕ ЗНАЙДЕНІ в window.currentPreviewData!');
      logReportPreviewAction('ПРЕВЬЮ ДАНІ НЕ ЗНАЙДЕНІ в window.currentPreviewData!', 'error');
    }
    
    // Генеруємо звіт (превью дані вже збережені в window.currentPreviewData)
    if (window.ProGran3.UI.SummaryTable && window.ProGran3.UI.SummaryTable.generateReport) {
      console.log('📊 [ReportWithPreview] Викликаємо SummaryTable.generateReport');
      window.ProGran3.UI.SummaryTable.generateReport();
      showLoadingIndicator(false);
      console.log('✅ [ReportWithPreview] Звіт згенеровано');
      logReportPreviewAction('Звіт з превью успішно згенеровано та відкрито', 'success');
    } else {
      console.error('❌ [ReportWithPreview] SummaryTable generateReport не доступний');
      throw new Error('SummaryTable generateReport не доступний');
    }
  }
  
  // Експорт публічного API
  global.ProGran3.UI.ReportWithPreview = {
    initializeReportWithPreview: initializeReportWithPreview,
    generateReportWithPreview: generateReportWithPreview,
    handlePreviewData: handlePreviewData,
    updateButtonText: updateButtonText
  };
  
  // Зворотна сумісність - функції доступні глобально
  global.generateReportWithPreview = generateReportWithPreview;
  global.handlePreviewData = handlePreviewData;
  
  // Ініціалізація при завантаженні
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeReportWithPreview);
  } else {
    initializeReportWithPreview();
  }
  
  logReportPreviewAction('ReportWithPreview модуль завантажено', 'info');
  
})(window);
