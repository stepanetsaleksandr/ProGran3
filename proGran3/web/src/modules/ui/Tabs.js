// proGran3/web/src/modules/ui/Tabs.js
// Модуль управління табами для ProGran3

import { Logger } from '../utils/Logger.js';

export class TabsManager {
  constructor() {
    this.activeTab = 'base';
  }

  // Функція переключення табів
  switchTab(tabName) {
    Logger.debug(`🔄 Переключення на таб: ${tabName}`, 'info');
    
    // Приховуємо всі таби
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => {
      tab.classList.remove('active');
    });
    
    // Видаляємо активний клас з усіх кнопок табів
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.classList.remove('active');
    });
    
    // Показуємо вибраний таб
    const selectedTab = document.getElementById(tabName + '-tab');
    if (selectedTab) {
      selectedTab.classList.add('active');
    }
    
    // Активуємо відповідну кнопку
    const selectedButton = document.querySelector(`[data-tab="${tabName}"]`);
    if (selectedButton) {
      selectedButton.classList.add('active');
    }
    
    // Зберігаємо активний таб
    this.activeTab = tabName;
    
    // Оновлюємо каруселі в активному табі
    setTimeout(() => {
      this.updateCarouselsInActiveTab();
    }, 100);
    
    Logger.debug(`✅ Таб змінено на: ${tabName}`, 'success');
  }

  // Оновлення каруселей в активному табі
  updateCarouselsInActiveTab() {
    const activeTabContent = document.querySelector('.tab-content.active');
    if (activeTabContent) {
      // Знаходимо всі каруселі в активному табі
      const carousels = activeTabContent.querySelectorAll('.carousel-container');
      carousels.forEach(carousel => {
        // Тригеримо оновлення каруселі
        const viewport = carousel.querySelector('.carousel-viewport');
        if (viewport) {
          viewport.style.display = 'none';
          setTimeout(() => {
            viewport.style.display = 'block';
          }, 10);
        }
      });
    }
  }

  // Ініціалізація табів
  initialize() {
    Logger.debug(`🚀 Ініціалізація табів`, 'info');
    
    // Перевіряємо наявність навігації табів
    const tabsNavigation = document.querySelector('.tabs-navigation');
    if (!tabsNavigation) {
      Logger.debug(`❌ Не знайдено навігацію табів`, 'error');
      return;
    }
    
    // Перевіряємо наявність контенту табів
    const tabContents = document.querySelectorAll('.tab-content');
    if (tabContents.length === 0) {
      Logger.debug(`❌ Не знайдено контент табів`, 'error');
      return;
    }
    
    Logger.debug(`✅ Знайдено ${tabContents.length} табів`, 'success');
    
    // Встановлюємо активний таб за замовчуванням
    this.switchTab('base');
    
    // Додаємо обробники подій для кнопок табів
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        const tabName = this.getAttribute('data-tab');
        if (tabName) {
          Logger.debug(`🔄 Переключення на таб: ${tabName}`, 'info');
          this.switchTab(tabName);
        }
      }.bind(this));
    });
    
    Logger.debug(`✅ Таби ініціалізовані успішно`, 'success');
  }

  // Отримання активного таба
  getActiveTab() {
    return this.activeTab;
  }

  // Встановлення активного таба
  setActiveTab(tabName) {
    this.switchTab(tabName);
  }
}

// Глобальний екземпляр
const tabsManager = new TabsManager();

// Експорт глобальних функцій для зворотної сумісності
export function switchTab(tabName) {
  tabsManager.switchTab(tabName);
}

export function updateCarouselsInActiveTab() {
  tabsManager.updateCarouselsInActiveTab();
}

export function initializeTabs() {
  tabsManager.initialize();
}
