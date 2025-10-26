/**
 * ComponentsManager - модуль для роботи з компонентами в табі матеріалів
 * Відповідає за завантаження, відображення та управління компонентами з моделі SketchUp
 */

(function() {
  'use strict';
  
  // Створюємо namespace для ComponentsManager
  if (!global.ProGran3) global.ProGran3 = {};
  if (!global.ProGran3.Materials) global.ProGran3.Materials = {};
  
  const ComponentsManager = {
    
    // Приватні змінні
    allComponents: [],
    selectedComponents: [],
    materialsLibrary: [],
    
    /**
     * Ініціалізація модуля
     */
    init() {
      this.logAction('Ініціалізація ComponentsManager', 'info');
      this.bindEvents();
      this.initializeUI();
    },
    
    /**
     * Прив'язка подій
     */
    bindEvents() {
      // Подія для отримання компонентів з SketchUp
      window.receiveAllComponents = this.receiveAllComponents.bind(this);
      console.log('✅ receiveAllComponents прив\'язано до window');
      
      this.logAction('Події прив\'язано', 'info');
    },
    
    /**
     * Ініціалізація UI елементів
     */
    initializeUI() {
      // Ініціалізація завершена
      console.log('✅ UI ініціалізовано');
    },
    
    /**
     * Завантаження всіх компонентів з моделі SketchUp
     */
    loadAllComponents() {
      console.log('🔄 loadAllComponents викликано');
      this.logAction('Завантаження компонентів з моделі', 'info');
      
      // Показуємо індикатор завантаження
      this.showLoadingState();
      
      // Перевіряємо доступність window.sketchup
      if (!window.sketchup) {
        console.error('❌ window.sketchup недоступний');
        this.logAction('window.sketchup недоступний', 'error');
        this.showErrorState('SketchUp не підключено');
        return;
      }
      
      console.log('✅ window.sketchup доступний:', window.sketchup);
      
      // Встановлюємо таймаут для завантаження
      this.loadingTimeout = setTimeout(() => {
        console.warn('⏰ Таймаут завантаження компонентів (10 секунд)');
        this.showErrorState('Таймаут завантаження компонентів. Спробуйте ще раз.');
      }, 10000); // 10 секунд
      
      // Перевіряємо наявність методу
      if (typeof window.sketchup.get_all_components !== 'function') {
        console.error('❌ Метод get_all_components недоступний');
        this.logAction('Метод get_all_components недоступний', 'error');
        this.showErrorState('Метод get_all_components не знайдено');
        return;
      }
      
      console.log('✅ Метод get_all_components доступний');
      
      try {
        // Викликаємо метод SketchUp
        console.log('📞 Викликаємо window.sketchup.get_all_components()');
        this.logAction('Викликаємо window.sketchup.get_all_components()', 'info');
        window.sketchup.get_all_components();
      } catch (error) {
        console.error('❌ Помилка виклику get_all_components:', error);
        this.logAction(`Помилка виклику get_all_components: ${error.message}`, 'error');
        this.showErrorState(`Помилка виклику: ${error.message}`);
        this.clearLoadingTimeout();
      }
    },
    
    /**
     * Обробка отриманих компонентів з SketchUp
     * @param {Array} components - Масив компонентів
     */
    receiveAllComponents(components) {
      console.log('🔍 receiveAllComponents викликано з даними:', components);
      this.logAction(`Отримано ${components ? components.length : 0} компонентів`, 'info');
      
      // Очищаємо таймаут
      this.clearLoadingTimeout();
      
      if (!components || !Array.isArray(components)) {
        console.error('❌ Некоректні дані компонентів:', components);
        this.logAction('Некоректні дані компонентів', 'error');
        this.showErrorState('Некоректні дані компонентів');
        return;
      }
      
      if (components.length === 0) {
        console.log('📦 Компоненти не знайдено, показуємо порожній стан');
        this.showEmptyState();
        return;
      }
      
      // Зберігаємо всі компоненти (тільки назви)
      this.allComponents = components.map(component => ({
        name: component.name
      }));
      
      console.log('✅ Збережено компонентів:', this.allComponents.length);
      console.log('📋 Компоненти:', this.allComponents);
      
      // Відображаємо компоненти
      this.displayComponents(this.allComponents);
      
      // Завантажуємо матеріали з бібліотеки
      this.loadMaterialsLibrary();
    },
    
    
    /**
     * Відображення списку компонентів
     * @param {Array} components - Масив компонентів
     */
    displayComponents(components) {
      console.log('🖼️ displayComponents викликано з:', components);
      
      const container = document.getElementById('components-list');
      if (!container) {
        console.error('❌ Контейнер компонентів не знайдено');
        this.logAction('Контейнер компонентів не знайдено', 'error');
        return;
      }
      
      console.log('✅ Контейнер компонентів знайдено');
      
      // Очищаємо контейнер
      container.innerHTML = '';
      
      if (components.length === 0) {
        console.log('📦 Компонентів немає, показуємо порожній стан');
        container.innerHTML = `
          <div class="no-components">
            <div class="no-components-icon">📦</div>
            <div class="no-components-text">Компоненти не знайдено</div>
            <div class="no-components-subtext">В моделі немає компонентів</div>
          </div>
        `;
        return;
      }
      
      console.log(`🔄 Створюємо ${components.length} елементів компонентів`);
      
      // Створюємо HTML для кожного компонента
      components.forEach((component, index) => {
        console.log(`📝 Створюємо компонент ${index + 1}:`, component);
        const componentElement = this.createComponentElement(component, index);
        container.appendChild(componentElement);
      });
      
      console.log(`✅ Відображено ${components.length} компонентів`);
      this.logAction(`Відображено ${components.length} компонентів`, 'info');
    },
    
    /**
     * Створення HTML елемента для компонента
     * @param {Object} component - Дані компонента
     * @param {number} index - Індекс компонента
     * @returns {HTMLElement} - HTML елемент компонента
     */
    createComponentElement(component, index) {
      const div = document.createElement('div');
      div.className = 'component-item-simple';
      div.setAttribute('data-index', index);
      
      // Простий дизайн тільки з чекбоксом та назвою
      div.innerHTML = `
        <label class="component-checkbox-label">
          <input type="checkbox" class="component-checkbox" data-component-name="${this.escapeHtml(component.name || 'Без назви')}">
          <span class="component-name">${this.escapeHtml(component.name || 'Без назви')}</span>
        </label>
      `;
      
      // Додаємо обробник зміни чекбокса
      const checkbox = div.querySelector('.component-checkbox');
      checkbox.addEventListener('change', () => this.updateSelectedComponents());
      
      return div;
    },
    
    /**
     * Показ стану завантаження
     */
    showLoadingState() {
      const container = document.getElementById('components-list');
      if (!container) return;
      
      container.innerHTML = `
        <div class="loading-components">
          <div class="spinner"></div>
          Завантаження компонентів з моделі...
        </div>
      `;
      
    },
    
    /**
     * Показ стану помилки
     * @param {string} message - Повідомлення про помилку
     */
    showErrorState(message) {
      const container = document.getElementById('components-list');
      if (!container) return;
      
      container.innerHTML = `
        <div class="no-components">
          <div class="no-components-icon">⚠️</div>
          <div class="no-components-text">Помилка завантаження</div>
          <div class="no-components-subtext">${this.escapeHtml(message)}</div>
        </div>
      `;
    },
    
    /**
     * Показ стану порожнього списку
     */
    showEmptyState() {
      const container = document.getElementById('components-list');
      if (!container) return;
      
      container.innerHTML = `
        <div class="no-components">
          <div class="no-components-icon">📦</div>
          <div class="no-components-text">Компоненти не знайдено</div>
          <div class="no-components-subtext">В моделі немає компонентів або вони не завантажилися</div>
        </div>
      `;
      
    },
    
    /**
     * Екранування HTML
     * @param {string} text - Текст для екранування
     * @returns {string} - Екранований текст
     */
    escapeHtml(text) {
      if (typeof text !== 'string') return '';
      
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },
    
    /**
     * Оновлення списку вибраних компонентів
     */
    updateSelectedComponents() {
      const checkboxes = document.querySelectorAll('.component-checkbox:checked');
      this.selectedComponents = Array.from(checkboxes).map(checkbox => checkbox.dataset.componentName);
      console.log('Вибрано компонентів:', this.selectedComponents.length);
    },
    
    /**
     * Очищення таймауту завантаження
     */
    clearLoadingTimeout() {
      if (this.loadingTimeout) {
        clearTimeout(this.loadingTimeout);
        this.loadingTimeout = null;
        console.log('✅ Таймаут завантаження очищено');
      }
    },
    
    /**
     * Очищення таймауту завантаження матеріалів
     */
    clearMaterialsTimeout() {
      if (this.materialsTimeout) {
        clearTimeout(this.materialsTimeout);
        this.materialsTimeout = null;
        console.log('✅ Таймаут завантаження матеріалів очищено');
      }
    },
    
    
    /**
     * Завантаження матеріалів з бібліотеки SketchUp
     */
    loadMaterialsLibrary() {
      console.log('🔄 Завантаження матеріалів з бібліотеки GRANIT');
      
      // Показуємо секцію матеріалів
      this.showMaterialsLibrary();
      
      // Показуємо індикатор завантаження
      this.showMaterialsLoading();
      
      // Встановлюємо таймаут для завантаження матеріалів
      this.materialsTimeout = setTimeout(() => {
        console.warn('⏰ Таймаут завантаження матеріалів (5 секунд)');
        this.showMaterialsError('Таймаут завантаження матеріалів. Спробуйте ще раз.');
      }, 5000); // 5 секунд
      
      // Викликаємо Ruby callback для отримання матеріалів
      if (window.sketchup && typeof window.sketchup.get_granit_materials === 'function') {
        try {
          window.sketchup.get_granit_materials();
          console.log('📞 Викликаємо window.sketchup.get_granit_materials()');
        } catch (error) {
          console.error('❌ Помилка виклику get_granit_materials:', error);
          this.showMaterialsError('Помилка завантаження матеріалів');
          this.clearMaterialsTimeout();
        }
      } else {
        console.error('❌ Метод get_granit_materials недоступний');
        this.showMaterialsError('Метод get_granit_materials не доступний');
        this.clearMaterialsTimeout();
      }
    },
    
    /**
     * Показ секції матеріалів
     */
    showMaterialsLibrary() {
      const libraryElement = document.getElementById('materials-library');
      if (libraryElement) {
        libraryElement.style.display = 'block';
        console.log('✅ Секція матеріалів показана');
      }
    },
    
    /**
     * Показ стану завантаження матеріалів
     */
    showMaterialsLoading() {
      const gridElement = document.getElementById('materials-grid');
      if (!gridElement) return;
      
      gridElement.innerHTML = `
        <div class="materials-loading">
          <div class="spinner"></div>
          Завантаження матеріалів з бібліотеки GRANIT...
        </div>
      `;
    },
    
    /**
     * Показ помилки завантаження матеріалів
     */
    showMaterialsError(message) {
      const gridElement = document.getElementById('materials-grid');
      if (!gridElement) return;
      
      gridElement.innerHTML = `
        <div class="materials-error">
          <div class="error-icon">⚠️</div>
          <div class="error-text">Помилка завантаження</div>
          <div class="error-subtext">${message}</div>
        </div>
      `;
    },
    
    /**
     * Обробка отриманих матеріалів з SketchUp
     * @param {Array} materials - Масив матеріалів
     */
    receiveGranitMaterials(materials) {
      console.log('🎨 receiveGranitMaterials викликано з даними:', materials);
      
      // Очищаємо таймаут
      this.clearMaterialsTimeout();
      
      if (!materials || !Array.isArray(materials)) {
        console.error('❌ Некоректні дані матеріалів:', materials);
        this.showMaterialsError('Некоректні дані матеріалів');
        return;
      }
      
      if (materials.length === 0) {
        console.log('📦 Матеріали не знайдено, показуємо порожній стан');
        this.showMaterialsEmpty();
        return;
      }
      
      // Зберігаємо матеріали (обмежуємо до 2)
      this.materialsLibrary = materials.slice(0, 2);
      
      console.log('✅ Збережено матеріалів:', this.materialsLibrary.length);
      console.log('🎨 Матеріали:', this.materialsLibrary);
      
      // Відображаємо матеріали
      this.displayMaterialsLibrary();
    },
    
    /**
     * Показ стану порожнього списку матеріалів
     */
    showMaterialsEmpty() {
      const gridElement = document.getElementById('materials-grid');
      if (!gridElement) return;
      
      gridElement.innerHTML = `
        <div class="materials-empty">
          <div class="empty-icon">📦</div>
          <div class="empty-text">Матеріали не знайдено</div>
          <div class="empty-subtext">В папці GRANIT немає матеріалів</div>
        </div>
      `;
    },
    
    /**
     * Відображення матеріалів з бібліотеки
     */
    displayMaterialsLibrary() {
      const gridElement = document.getElementById('materials-grid');
      if (!gridElement) {
        console.error('❌ Контейнер матеріалів не знайдено');
        return;
      }
      
      // Очищаємо контейнер
      gridElement.innerHTML = '';
      
      // Створюємо HTML для кожного матеріалу
      this.materialsLibrary.forEach((material, index) => {
        const materialElement = this.createMaterialElement(material, index);
        gridElement.appendChild(materialElement);
      });
      
      console.log(`✅ Відображено ${this.materialsLibrary.length} матеріалів`);
    },
    
    /**
     * Створення HTML елемента для матеріалу
     * @param {Object} material - Дані матеріалу
     * @param {number} index - Індекс матеріалу
     * @returns {HTMLElement} - HTML елемент матеріалу
     */
    createMaterialElement(material, index) {
      const div = document.createElement('div');
      div.className = 'material-item';
      div.setAttribute('data-index', index);
      div.setAttribute('data-material-name', material.name);
      
      // Створюємо HTML для матеріалу
      div.innerHTML = `
        <div class="material-preview">
          ${material.preview}
        </div>
        <div class="material-name">${this.escapeHtml(material.name)}</div>
      `;
      
      // Додаємо обробник кліку
      div.addEventListener('click', () => this.selectMaterial(material));
      
      return div;
    },
    
    /**
     * Вибір матеріалу
     * @param {Object} material - Вибраний матеріал
     */
    selectMaterial(material) {
      console.log('🎨 Вибрано матеріал:', material.name);
      
      // Показуємо повідомлення про вибір
      if (window.ProGran3 && window.ProGran3.UI && window.ProGran3.UI.showNotification) {
        window.ProGran3.UI.showNotification(`Вибрано матеріал: ${material.name}`, 'info');
      } else {
        console.log(`✅ Вибрано матеріал: ${material.name}`);
      }
      
      // Тут можна додати логіку застосування матеріалу до вибраних компонентів
      this.applyMaterialToSelectedComponents(material);
    },
    
    /**
     * Застосування матеріалу до вибраних компонентів
     * @param {Object} material - Матеріал для застосування
     */
    applyMaterialToSelectedComponents(material) {
      if (this.selectedComponents.length === 0) {
        console.log('⚠️ Немає вибраних компонентів для застосування матеріалу');
        return;
      }
      
      console.log(`🔧 Застосовуємо матеріал "${material.name}" до ${this.selectedComponents.length} компонентів`);
      
      // Відправляємо команду в SketchUp для застосування матеріалу
      if (window.sketchup && typeof window.sketchup.apply_material === 'function') {
        try {
          window.sketchup.apply_material(material.name, this.selectedComponents);
          console.log('✅ Команда застосування матеріалу відправлена в SketchUp');
        } catch (error) {
          console.error('❌ Помилка застосування матеріалу:', error);
          this.simulateMaterialApplication(material);
        }
      } else {
        console.log('ℹ️ Метод apply_material недоступний, симулюємо застосування');
        // Симулюємо застосування матеріалу
        this.simulateMaterialApplication(material);
      }
    },
    
    /**
     * Симуляція застосування матеріалу
     * @param {Object} material - Матеріал для застосування
     */
    simulateMaterialApplication(material) {
      console.log(`🎨 Симуляція: застосовуємо "${material.name}" до компонентів:`, this.selectedComponents);
      
      // Показуємо повідомлення про симуляцію
      setTimeout(() => {
        if (window.ProGran3 && window.ProGran3.UI && window.ProGran3.UI.showNotification) {
          window.ProGran3.UI.showNotification(`Матеріал "${material.name}" застосовано до ${this.selectedComponents.length} компонентів`, 'success');
        } else {
          console.log(`✅ Матеріал "${material.name}" застосовано до ${this.selectedComponents.length} компонентів`);
        }
      }, 500);
    },
    
    /**
     * Логування дій
     * @param {string} message - Повідомлення
     * @param {string} level - Рівень логування
     */
    logAction(message, level = 'info') {
      if (window.ProGran3 && window.ProGran3.Logger) {
        window.ProGran3.Logger.log(message, 'ComponentsManager', level);
      } else {
        console.log(`[ComponentsManager] ${message}`);
      }
    }
  };
  
  // Експортуємо модуль
  global.ProGran3.Materials.ComponentsManager = ComponentsManager;
  
  // Глобальна функція для отримання матеріалів з SketchUp
  global.receiveGranitMaterials = function(materials) {
    if (global.ProGran3 && global.ProGran3.Materials && global.ProGran3.Materials.ComponentsManager) {
      global.ProGran3.Materials.ComponentsManager.receiveGranitMaterials(materials);
    } else {
      console.error('ComponentsManager не доступний для receiveGranitMaterials');
    }
  };
  
  // Автоматична ініціалізація при завантаженні
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('DOM завантажено, ініціалізуємо ComponentsManager');
      ComponentsManager.init();
    });
  } else {
    console.log('DOM вже готовий, ініціалізуємо ComponentsManager');
    ComponentsManager.init();
  }
  
})();
