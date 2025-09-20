// modules/ui/Panels.js
// Система панелей для ProGran3

(function(global) {
  'use strict';
  
  // Створюємо namespace
  global.ProGran3 = global.ProGran3 || {};
  global.ProGran3.UI = global.ProGran3.UI || {};
  
  // Приватні змінні
  let panelCallbacks = {};
  
  // Приватні функції
  function logPanelAction(message, type = 'info') {
    if (global.ProGran3.Core.Logger) {
      global.ProGran3.Core.Logger.debugLog(message, type, 'Panels');
    }
  }
  
  function findPanelByHeader(headerElement) {
    if (!headerElement) return null;
    return headerElement.closest('.panel');
  }
  
  function findNextPanel(currentPanel) {
    if (!currentPanel) return null;
    
    const allPanels = currentPanel.parentElement.querySelectorAll('.panel');
    const currentIndex = Array.from(allPanels).indexOf(currentPanel);
    
    if (currentIndex < allPanels.length - 1) {
      return allPanels[currentIndex + 1];
    }
    
    return null;
  }
  
  function expandPanel(panel) {
    if (!panel) return false;
    
    panel.classList.remove('collapsed');
    panel.classList.add('expanded');
    
    const header = panel.querySelector('.panel-header');
    const chevron = header?.querySelector('.chevron');
    if (chevron) {
      chevron.classList.add('rotated');
    }
    
    logPanelAction(`Панель розгорнута: ${panel.id || 'unknown'}`, 'info');
    return true;
  }
  
  function collapsePanel(panel) {
    if (!panel) return false;
    
    panel.classList.remove('expanded');
    panel.classList.add('collapsed');
    
    const header = panel.querySelector('.panel-header');
    const chevron = header?.querySelector('.chevron');
    if (chevron) {
      chevron.classList.remove('rotated');
    }
    
    logPanelAction(`Панель згорнута: ${panel.id || 'unknown'}`, 'info');
    return true;
  }
  
  function isPanelExpanded(panel) {
    return panel && panel.classList.contains('expanded');
  }
  
  function isPanelCollapsed(panel) {
    return panel && panel.classList.contains('collapsed');
  }
  
  // Публічні функції
  function togglePanel(headerElement) {
    if (!headerElement) {
      logPanelAction('Header element не надано для togglePanel', 'error');
      return false;
    }
    
    const panel = findPanelByHeader(headerElement);
    if (!panel) {
      logPanelAction('Не знайдено панель для header element', 'error');
      return false;
    }
    
    const panelId = panel.id || 'unknown';
    
    if (isPanelExpanded(panel)) {
      collapsePanel(panel);
    } else {
      expandPanel(panel);
    }
    
    // Викликаємо callback якщо є
    if (panelCallbacks[panelId]) {
      try {
        panelCallbacks[panelId](panel, isPanelExpanded(panel));
      } catch (error) {
        logPanelAction(`Помилка в callback для панелі ${panelId}: ${error.message}`, 'error');
      }
    }
    
    return true;
  }
  
  function advanceToNextPanel(buttonElement) {
    if (!buttonElement) {
      logPanelAction('Button element не надано для advanceToNextPanel', 'error');
      return false;
    }
    
    const currentPanel = buttonElement.closest('.panel');
    if (!currentPanel) {
      logPanelAction('Не знайдено поточну панель для advanceToNextPanel', 'error');
      return false;
    }
    
    const activeTab = global.ProGran3.Core.StateManager ? 
      global.ProGran3.Core.StateManager.getActiveTab() : 'base';
    
    const allPanelsInTab = document.querySelectorAll(`#${activeTab}-tab .panel`);
    const currentIndex = Array.from(allPanelsInTab).indexOf(currentPanel);
    
    logPanelAction(`advanceToNextPanel: поточна панель ${currentIndex + 1}/${allPanelsInTab.length} в табі ${activeTab}`, 'info');
    
    const nextPanel = findNextPanel(currentPanel);
    if (nextPanel) {
      // Згортаємо поточну панель
      collapsePanel(currentPanel);
      
      // Розгортаємо наступну панель
      expandPanel(nextPanel);
      
      // Прокручуємо до наступної панелі
      nextPanel.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
      
      logPanelAction(`Перехід до наступної панелі: ${nextPanel.id || 'unknown'}`, 'info');
      return true;
    } else {
      logPanelAction('Це остання панель в табі', 'info');
      return false;
    }
  }
  
  function initializeFloatingLabels() {
    logPanelAction('Ініціалізація floating labels', 'info');
    
    const floatingInputs = document.querySelectorAll('.floating-label input');
    const floatingSelects = document.querySelectorAll('.floating-label select');
    
    function handleFocus(event) {
      const label = event.target.closest('.floating-label');
      if (label) {
        label.classList.add('focused');
      }
    }
    
    function handleBlur(event) {
      const label = event.target.closest('.floating-label');
      if (label) {
        if (!event.target.value) {
          label.classList.remove('focused');
        }
      }
    }
    
    function handleInput(event) {
      const label = event.target.closest('.floating-label');
      if (label) {
        if (event.target.value) {
          label.classList.add('focused');
        } else {
          label.classList.remove('focused');
        }
      }
    }
    
    // Додаємо обробники для input полів
    floatingInputs.forEach(input => {
      input.addEventListener('focus', handleFocus);
      input.addEventListener('blur', handleBlur);
      input.addEventListener('input', handleInput);
      
      // Встановлюємо початковий стан
      if (input.value) {
        const label = input.closest('.floating-label');
        if (label) {
          label.classList.add('focused');
        }
      }
    });
    
    // Додаємо обробники для select полів
    floatingSelects.forEach(select => {
      select.addEventListener('focus', handleFocus);
      select.addEventListener('blur', handleBlur);
      select.addEventListener('change', handleInput);
      
      // Встановлюємо початковий стан
      if (select.value) {
        const label = select.closest('.floating-label');
        if (label) {
          label.classList.add('focused');
        }
      }
    });
    
    logPanelAction(`Floating labels ініціалізовано для ${floatingInputs.length} input та ${floatingSelects.length} select полів`, 'success');
  }
  
  function expandAllPanels() {
    const panels = document.querySelectorAll('.panel');
    panels.forEach(panel => {
      expandPanel(panel);
    });
    
    logPanelAction(`Розгорнуто всі панелі (${panels.length})`, 'info');
  }
  
  function collapseAllPanels() {
    const panels = document.querySelectorAll('.panel');
    panels.forEach(panel => {
      collapsePanel(panel);
    });
    
    logPanelAction(`Згорнуто всі панелі (${panels.length})`, 'info');
  }
  
  function getPanelState(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return null;
    
    return {
      id: panelId,
      isExpanded: isPanelExpanded(panel),
      isCollapsed: isPanelCollapsed(panel)
    };
  }
  
  function getAllPanelsState() {
    const panels = document.querySelectorAll('.panel');
    const states = {};
    
    panels.forEach(panel => {
      const panelId = panel.id || `panel-${Math.random().toString(36).substr(2, 9)}`;
      states[panelId] = getPanelState(panelId);
    });
    
    return states;
  }
  
  function registerPanelCallback(panelId, callback) {
    if (typeof callback !== 'function') {
      logPanelAction(`Callback має бути функцією для панелі: ${panelId}`, 'error');
      return false;
    }
    
    panelCallbacks[panelId] = callback;
    logPanelAction(`Callback зареєстровано для панелі: ${panelId}`, 'info');
    return true;
  }
  
  function unregisterPanelCallback(panelId) {
    if (panelCallbacks[panelId]) {
      delete panelCallbacks[panelId];
      logPanelAction(`Callback видалено для панелі: ${panelId}`, 'info');
      return true;
    }
    return false;
  }
  
  // Експорт публічного API
  global.ProGran3.UI.Panels = {
    togglePanel: togglePanel,
    advanceToNextPanel: advanceToNextPanel,
    initializeFloatingLabels: initializeFloatingLabels,
    expandAllPanels: expandAllPanels,
    collapseAllPanels: collapseAllPanels,
    getPanelState: getPanelState,
    getAllPanelsState: getAllPanelsState,
    registerPanelCallback: registerPanelCallback,
    unregisterPanelCallback: unregisterPanelCallback
  };
  
  // Зворотна сумісність - функції доступні глобально
  global.togglePanel = togglePanel;
  global.advanceToNextPanel = advanceToNextPanel;
  global.initializeFloatingLabels = initializeFloatingLabels;
  
  // Ініціалізація
  if (global.ProGran3.Core.Logger) {
    global.ProGran3.Core.Logger.debugLog('Panels модуль завантажено', 'info', 'Panels');
  }
  
})(window);
