// proGran3/web/src/modules/ui/Panels.js
// Модуль управління панелями для ProGran3

import { Logger } from '../utils/Logger.js';

export class PanelsManager {
  constructor() {
    this.initializeFloatingLabels();
  }

  // Логіка згортання/розгортання панелей
  togglePanel(headerElement) {
    const panel = headerElement.closest('.panel');
    if (panel) {
      Logger.debug('Toggle panel:', panel);
      panel.classList.toggle('collapsed');
      Logger.debug('Panel collapsed:', panel.classList.contains('collapsed'));
    } else {
      Logger.debug('Panel not found for element:', headerElement, 'error');
    }
  }

  // Перехід до наступної панелі
  advanceToNextPanel(buttonElement) {
    // Знаходимо батьківську панель кнопки
    const currentPanel = buttonElement.closest('.panel');
    
    // Знаходимо всі панелі в поточному активному табі
    const activeTabContent = document.querySelector('.tab-content.active');
    if (!activeTabContent) {
      Logger.debug(`❌ Не знайдено активний таб для advanceToNextPanel`, 'error');
      return;
    }
    
    const allPanelsInTab = Array.from(activeTabContent.querySelectorAll('.panel'));
    const currentIndex = allPanelsInTab.indexOf(currentPanel);
    const nextPanel = allPanelsInTab[currentIndex + 1];

    // Згортаємо поточну панель
    if (currentPanel && !currentPanel.classList.contains('collapsed')) {
      currentPanel.classList.add('collapsed');
    }

    // Розгортаємо наступну, якщо вона існує і є згорнутою
    if (nextPanel && nextPanel.classList.contains('collapsed')) {
      nextPanel.classList.remove('collapsed');
    }
    
    Logger.debug(`🔄 advanceToNextPanel: поточна панель ${currentIndex + 1}/${allPanelsInTab.length}`, 'info');
  }

  // Ініціалізація floating labels
  initializeFloatingLabels() {
    const floatingInputs = document.querySelectorAll('.floating-label input');
    const floatingSelects = document.querySelectorAll('.floating-label select');
    
    // Обробка input елементів
    floatingInputs.forEach(input => {
      // Встановлюємо початковий стан для полів зі значеннями
      if (input.value && input.value.trim() !== '') {
        input.classList.add('has-value');
      }
      
      // Додаємо обробники подій
      input.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
      });
      
      input.addEventListener('blur', function() {
        this.parentElement.classList.remove('focused');
        if (this.value && this.value.trim() !== '') {
          this.classList.add('has-value');
        } else {
          this.classList.remove('has-value');
        }
      });
      
      input.addEventListener('input', function() {
        if (this.value && this.value.trim() !== '') {
          this.classList.add('has-value');
        } else {
          this.classList.remove('has-value');
        }
      });
    });
    
    // Обробка select елементів
    floatingSelects.forEach(select => {
      // Встановлюємо початковий стан для полів зі значеннями
      if (select.value && select.value.trim() !== '') {
        select.classList.add('has-value');
      }
      
      // Додаємо обробники подій
      select.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
      });
      
      select.addEventListener('blur', function() {
        this.parentElement.classList.remove('focused');
        if (this.value && this.value.trim() !== '') {
          this.classList.add('has-value');
        } else {
          this.classList.remove('has-value');
        }
      });
      
      select.addEventListener('change', function() {
        if (this.value && this.value.trim() !== '') {
          this.classList.add('has-value');
        } else {
          this.classList.remove('has-value');
        }
      });
    });
  }

  // Згортання всіх панелей в табі, крім першої
  collapseAllPanelsExceptFirst() {
    const tabContents = document.querySelectorAll('.tab-content');
    Logger.debug(`📋 Знайдено ${tabContents.length} табів`, 'info');
    
    tabContents.forEach(tabContent => {
      const panels = tabContent.querySelectorAll('.panel');
      Logger.debug(`📋 Знайдено ${panels.length} панелей в табі ${tabContent.id}`, 'info');
      
      panels.forEach((panel, index) => {
        if (index > 0) {
          panel.classList.add('collapsed');
        }
      });
    });
  }

  // Отримання всіх панелей в активному табі
  getPanelsInActiveTab() {
    const activeTabContent = document.querySelector('.tab-content.active');
    if (!activeTabContent) return [];
    
    return Array.from(activeTabContent.querySelectorAll('.panel'));
  }

  // Розгортання конкретної панелі
  expandPanel(panelId) {
    const panel = document.getElementById(panelId);
    if (panel) {
      panel.classList.remove('collapsed');
      Logger.debug(`✅ Розгорнуто панель: ${panelId}`, 'success');
    } else {
      Logger.debug(`❌ Не знайдено панель: ${panelId}`, 'error');
    }
  }

  // Згортання конкретної панелі
  collapsePanel(panelId) {
    const panel = document.getElementById(panelId);
    if (panel) {
      panel.classList.add('collapsed');
      Logger.debug(`✅ Згорнуто панель: ${panelId}`, 'success');
    } else {
      Logger.debug(`❌ Не знайдено панель: ${panelId}`, 'error');
    }
  }
}

// Глобальний екземпляр
const panelsManager = new PanelsManager();

// Експорт глобальних функцій для зворотної сумісності
export function togglePanel(headerElement) {
  panelsManager.togglePanel(headerElement);
}

export function advanceToNextPanel(buttonElement) {
  panelsManager.advanceToNextPanel(buttonElement);
}

export function initializeFloatingLabels() {
  panelsManager.initializeFloatingLabels();
}
