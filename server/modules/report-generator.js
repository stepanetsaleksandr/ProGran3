/**
 * ProGran3 Report Generator Module
 * Version: 3.2.1
 * 
 * Динамічно завантажуваний модуль для генерації HTML звітів
 * Цей код завантажується з сервера та виконується в WebDialog
 */

(function(global) {
  'use strict';
  
  // Версія модуля
  const MODULE_VERSION = '3.2.1';
  
  /**
   * Генерація HTML звіту (головна функція)
   * @param {Object} data - Дані для звіту
   * @returns {string} HTML звіту
   */
  function generateReportHTML(data) {
    const summaryData = data.summary || data;
    const metadata = data.metadata || {};
    
    const currentDate = new Date().toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Розраховуємо загальну статистику
    let totalComponents = 0;
    let totalArea = 0;
    let totalVolume = 0;
    
    Object.values(summaryData).forEach(category => {
      if (Array.isArray(category)) {
        category.forEach(item => {
          totalComponents += (item.count || 1);
          totalArea += (item.area_m2 || 0) * (item.count || 1);
          totalVolume += (item.volume_m3 || 0) * (item.count || 1);
        });
      }
    });
    
    let html = `
      <style>
        .dimensions-table {
          border-collapse: collapse;
          margin: 0;
          padding: 0;
          display: inline-table;
          border: none;
        }
        .dimensions-table td {
          border: none;
          padding: 2px 6px;
          text-align: center;
          font-weight: 500;
          background-color: transparent;
          min-width: 35px;
          font-size: 0.9rem;
          white-space: nowrap;
        }
        .report-table .dimensions-table td {
          border: none;
          padding: 3px 8px;
          text-align: center;
          font-weight: 500;
          background-color: transparent;
          min-width: 40px;
          font-size: 0.85rem;
          white-space: nowrap;
        }
      </style>
      
      <div class="report-header">
        <div class="report-title-row">
          <h1>Технічний звіт проекту</h1>
          <div class="report-date">${currentDate}</div>
        </div>
      </div>
      
      <div class="report-main">
        <table class="report-table">
          <thead>
            <tr>
              <th>Назва</th>
              <th>Розміри (см)</th>
              <th class="text-center">Кількість</th>
              <th class="text-right">Площа (м²)</th>
              <th class="text-right">Об'єм (м³)</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    // Додаємо всі категорії
    const categories = [
      { key: 'foundation', label: 'Фундамент' },
      { key: 'blind_area', label: 'Відмостка' },
      { key: 'stands', label: 'Підставка' },
      { key: 'tiles', label: 'Плитка' },
      { key: 'steles', label: 'Стела' },
      { key: 'flowerbeds', label: 'Квітник' },
      { key: 'fence_corner', label: 'Кутова огорожа' },
      { key: 'fence_decor', label: 'Декор огорожі' }
    ];
    
    let hasData = false;
    
    categories.forEach(category => {
      const items = summaryData[category.key];
      if (items && items.length > 0) {
        hasData = true;
        html += generateCategoryRows(category.label, items);
      }
    });
    
    if (!hasData) {
      html += `
        <tr>
          <td colspan="5" class="text-center" style="padding: 20px; color: #999;">
            Немає даних для звіту
          </td>
        </tr>
      `;
    }
    
    html += `
          </tbody>
        </table>
        
        ${generatePreviewSection()}
      </div>
      
      <div class="report-footer">
        <div class="report-footer-info">
          <div>Згенеровано: ${new Date().toLocaleString('uk-UA')}</div>
          <div>ProGran3 Plugin v${metadata.plugin_version || '3.2.1'}</div>
        </div>
      </div>
    `;
    
    return html;
  }
  
  /**
   * Генерація рядків для категорії
   */
  function generateCategoryRows(label, items) {
    let html = '';
    
    // Групуємо однакові елементи
    const grouped = {};
    items.forEach(item => {
      const key = `${item.depth}×${item.width}×${item.height}`;
      if (!grouped[key]) {
        grouped[key] = { ...item, count: 0 };
      }
      grouped[key].count += (item.count || 1);
    });
    
    // Генеруємо рядки
    Object.values(grouped).forEach((item, index) => {
      // Сортуємо розміри від найбільшого до найменшого
      const dimensions = [item.depth, item.width, item.height].map(Number).sort((a, b) => b - a);
      
      // Форматуємо з розділювачами та вирівнюванням
      const dimensionsHTML = `${dimensions[0].toString().padStart(6)} × ${dimensions[1].toString().padStart(6)} × ${dimensions[2].toString().padStart(6)}`;
      
      const area = item.area_m2 ? (item.area_m2 * item.count).toFixed(2) : '—';
      const volume = item.volume_m3 ? (item.volume_m3 * item.count).toFixed(3) : '—';
      
      html += `
        <tr>
          <td>${label}</td>
          <td>${dimensionsHTML}</td>
          <td class="text-center">${item.count}</td>
          <td class="text-right">${area}</td>
          <td class="text-right">${volume}</td>
        </tr>
      `;
    });
    
    return html;
  }
  
  /**
   * Генерація секції превью
   */
  function generatePreviewSection() {
    // Перевіряємо чи превью увімкнене
    const previewToggle = (typeof document !== 'undefined') ? 
      document.getElementById('include-preview-toggle') : null;
    const includePreview = previewToggle ? previewToggle.checked : false;
    
    if (!includePreview) {
      return '';
    }
    
    // Шукаємо превью дані
    let previewData = null;
    
    if (typeof window !== 'undefined') {
      previewData = window.currentPreviewData;
    }
    
    if (!previewData && typeof global !== 'undefined') {
      previewData = global.currentPreviewData;
    }
    
    if (!previewData || typeof previewData !== 'string' || previewData.length < 100) {
      return '';
    }
    
    const imageSrc = previewData.startsWith('data:image') ? 
      previewData : `data:image/png;base64,${previewData}`;
    
    return `
      <div class="report-preview-section">
        <h2 class="report-section-title">Превью моделі</h2>
        <div class="report-preview-container">
          <img src="${imageSrc}" 
               alt="Превью моделі" 
               class="report-preview-image">
        </div>
      </div>
    `;
  }
  
  /**
   * Верифікація підпису коду (для безпеки)
   */
  function verifyCodeSignature(code, signature) {
    // В браузері використовуємо SubtleCrypto API
    // Для простоти зараз пропускаємо, але в production треба реалізувати
    return true;
  }
  
  // Експорт модуля
  const ReportGeneratorModule = {
    version: MODULE_VERSION,
    generateReportHTML: generateReportHTML,
    generateCategoryRows: generateCategoryRows,
    generatePreviewSection: generatePreviewSection
  };
  
  // Якщо є ProGran3 namespace - додаємо туди
  if (typeof global.ProGran3 !== 'undefined') {
    global.ProGran3.Modules = global.ProGran3.Modules || {};
    global.ProGran3.Modules.ReportGenerator = ReportGeneratorModule;
  }
  
  // Також експортуємо глобально для backwards compatibility
  global.ProGran3_ReportGenerator = ReportGeneratorModule;
  
  console.log(`✅ Report Generator Module v${MODULE_VERSION} loaded`);
  
  return ReportGeneratorModule;
  
})(typeof window !== 'undefined' ? window : global);

