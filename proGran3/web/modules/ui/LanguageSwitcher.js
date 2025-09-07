(function(global) {
  'use strict';
  
  // Ініціалізуємо namespace
  if (!global.ProGran3) {
    global.ProGran3 = {};
  }
  if (!global.ProGran3.UI) {
    global.ProGran3.UI = {};
  }
  
  const LanguageSwitcher = {
    
    // Створення перемикача мов
    createLanguageSwitcher() {
      const switcher = document.createElement('div');
      switcher.id = 'language-switcher';
      switcher.className = 'language-switcher';
      
      // Отримуємо поточну мову та створюємо перемикач
      const currentLang = this.getCurrentLanguage();
      const currentLangInfo = this.getLanguageInfo(currentLang);
      
      // Генеруємо опції мов
      const languageOptions = this.generateLanguageOptions();
      
      switcher.innerHTML = `
        <div class="language-toggle">
          <span class="language-flag">${currentLangInfo.flag}</span>
          <span class="language-name">${currentLangInfo.name}</span>
          <span class="language-arrow">▼</span>
        </div>
        <div class="language-dropdown">
          ${languageOptions}
        </div>
      `;
      
      // Додаємо логування для діагностики
      console.log('🔧 LanguageSwitcher створено:', {
        currentLang,
        currentLangInfo,
        languageOptions: languageOptions.length,
        switcherHTML: switcher.innerHTML.length
      });
      
      return switcher;
    },
    
    // Отримання поточної мови
    getCurrentLanguage() {
      if (window.ProGran3 && window.ProGran3.I18n && window.ProGran3.I18n.Manager) {
        return window.ProGran3.I18n.Manager.getCurrentLanguage();
      }
      return 'uk'; // Fallback
    },
    
    // Отримання інформації про мову
    getLanguageInfo(lang) {
      const languages = {
        'uk': { flag: '🇺🇦', name: 'Українська' },
        'pl': { flag: '🇵🇱', name: 'Polski' },
        'en': { flag: '🇬🇧', name: 'English' }
      };
      return languages[lang] || languages['uk'];
    },
    
    // Генерація опцій мов
    generateLanguageOptions() {
      const languages = [
        { code: 'uk', flag: '🇺🇦', name: 'Українська' },
        { code: 'pl', flag: '🇵🇱', name: 'Polski' },
        { code: 'en', flag: '🇬🇧', name: 'English' }
      ];
      
      const options = languages.map(lang => `
        <div class="language-option" data-lang="${lang.code}">
          <span class="option-flag">${lang.flag}</span>
          <span class="option-name">${lang.name}</span>
        </div>
      `).join('');
      
      // Додаємо логування для діагностики
      console.log('🌍 Генеровано опцій мов:', {
        languagesCount: languages.length,
        optionsLength: options.length,
        options: options.substring(0, 200) + '...'
      });
      
      return options;
    },
    
    // Додавання стилів для перемикача
    addStyles() {
      const style = document.createElement('style');
      style.textContent = `
        .language-switcher {
          position: relative;
          display: inline-block;
          z-index: 1000;
        }
        
        .language-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          border: none;
          font-size: 14px;
          font-weight: 500;
          min-width: 140px;
        }
        
        .language-toggle:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        
        .language-toggle:active {
          transform: translateY(0);
        }
        
        .language-flag {
          font-size: 18px;
          line-height: 1;
        }
        
        .language-name {
          flex: 1;
          text-align: left;
        }
        
        .language-arrow {
          font-size: 10px;
          transition: transform 0.3s ease;
        }
        
        .language-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          border: 1px solid #e1e5e9;
          overflow: hidden;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: all 0.3s ease;
          z-index: 1001;
          min-width: 160px;
        }
        
        .language-dropdown.active {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
        
        .language-dropdown.active ~ .language-toggle .language-arrow,
        .language-switcher:has(.language-dropdown.active) .language-arrow {
          transform: rotate(180deg);
        }
        
        .language-option {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 1px solid #f1f3f4;
        }
        
        .language-option:last-child {
          border-bottom: none;
        }
        
        .language-option:hover {
          background: linear-gradient(135deg, #f8f9ff 0%, #e8f0ff 100%);
          color: #667eea;
        }
        
        .language-option.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .option-flag {
          font-size: 16px;
          line-height: 1;
        }
        
        .option-name {
          font-size: 14px;
          font-weight: 500;
        }
        
        /* Анімація для мобільних пристроїв */
        @media (max-width: 768px) {
          .language-toggle {
            min-width: 120px;
            padding: 6px 10px;
            font-size: 13px;
          }
          
          .language-flag {
            font-size: 16px;
          }
          
          .language-dropdown {
            min-width: 140px;
            left: 50% !important;
            transform: translateX(-50%) translateY(-10px) !important;
          }
          
          .language-dropdown.active {
            transform: translateX(-50%) translateY(0) !important;
          }
        }
        
        /* Темна тема */
        @media (prefers-color-scheme: dark) {
          .language-dropdown {
            background: #2d3748;
            border-color: #4a5568;
          }
          
          .language-option {
            color: #e2e8f0;
            border-bottom-color: #4a5568;
          }
          
          .language-option:hover {
            background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
            color: #90cdf4;
          }
        }
        
        /* Плавна анімація зміни мови */
        .language-transition {
          transition: all 0.3s ease;
        }
        
        /* Стилі для інтеграції в header */
        .header-right .language-switcher {
          margin: 0;
        }
        
        .header .language-toggle {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .header .language-toggle:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        /* Z-index для dropdown щоб не ховався за іншими елементами */
        .language-dropdown {
          z-index: 1001;
        }
      `;
      
      document.head.appendChild(style);
    },
    
    // Ініціалізація перемикача
    init() {
      console.log('🚀 Ініціалізація LanguageSwitcher...');
      
      this.addStyles();
      
      // Створюємо перемикач
      const switcher = this.createLanguageSwitcher();
      
      // Додаємо в header-right (правий верхній кут)
      const headerRight = document.querySelector('.header-right');
      if (headerRight) {
        console.log('📍 Знайдено header-right, додаємо перемикач мов');
        headerRight.appendChild(switcher);
        console.log('✅ Перемикач мов додано в header-right');
      } else {
        console.log('⚠️ header-right не знайдено, використовуємо fallback');
        // Fallback: додаємо в header
        const header = document.querySelector('.header') || document.querySelector('header');
        if (header) {
          header.appendChild(switcher);
          console.log('✅ Перемикач додано в header');
        } else {
          // Якщо немає header, додаємо в body
          switcher.style.position = 'fixed';
          switcher.style.top = '20px';
          switcher.style.right = '20px';
          switcher.style.zIndex = '1000';
          document.body.appendChild(switcher);
          console.log('✅ Перемикач додано в body (fixed position)');
        }
      }
      
      // Налаштовуємо події
      this.setupEvents(switcher);
      
      // Перевіряємо що dropdown створено правильно
      const dropdown = switcher.querySelector('.language-dropdown');
      const options = dropdown ? dropdown.querySelectorAll('.language-option') : [];
      console.log('🔍 Перевірка dropdown:', {
        dropdownExists: !!dropdown,
        optionsCount: options.length,
        dropdownHTML: dropdown ? dropdown.innerHTML.substring(0, 100) + '...' : 'не знайдено'
      });
      
      return switcher;
    },
    
    // Налаштування подій
    setupEvents(switcher) {
      const dropdown = switcher.querySelector('.language-dropdown');
      const toggle = switcher.querySelector('.language-toggle');
      
      console.log('🔧 Налаштування подій:', {
        toggleExists: !!toggle,
        dropdownExists: !!dropdown,
        optionsCount: dropdown ? dropdown.querySelectorAll('.language-option').length : 0
      });
      
      if (toggle && dropdown) {
        // Клік по перемикачу
        toggle.addEventListener('click', (e) => {
          e.stopPropagation();
          const wasActive = dropdown.classList.contains('active');
          dropdown.classList.toggle('active');
          const isActive = dropdown.classList.contains('active');
          
          console.log('🖱️ Клік по перемикачу:', {
            wasActive,
            isActive,
            optionsCount: dropdown.querySelectorAll('.language-option').length
          });
          
          // Позиціонуємо dropdown
          if (isActive) {
            this.positionDropdown(toggle, dropdown);
          }
        });
        
        // Закриття при кліку поза межами
        document.addEventListener('click', (e) => {
          if (!switcher.contains(e.target)) {
            dropdown.classList.remove('active');
          }
        });
        
        // Обробка вибору мови
        const options = dropdown.querySelectorAll('.language-option');
        console.log('🔧 Налаштування подій для опцій:', {
          optionsCount: options.length,
          options: Array.from(options).map(opt => ({
            lang: opt.dataset.lang,
            text: opt.textContent.trim()
          }))
        });
        
        options.forEach(option => {
          option.addEventListener('click', async (e) => {
            e.stopPropagation();
            const lang = option.dataset.lang;
            
            console.log('🖱️ Клік по опції мови:', {
              lang,
              optionText: option.textContent.trim(),
              hasI18nManager: !!(window.ProGran3 && window.ProGran3.I18n && window.ProGran3.I18n.Manager)
            });
            
            if (lang && window.ProGran3 && window.ProGran3.I18n && window.ProGran3.I18n.Manager) {
              const success = await window.ProGran3.I18n.Manager.changeLanguage(lang);
              console.log('🌍 Результат зміни мови:', { lang, success });
              
              if (success) {
                // Оновлюємо активний стан
                options.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                
                // Оновлюємо перемикач з новою мовою
                this.updateLanguageSwitcher(switcher, lang);
                
                // Закриваємо dropdown
                dropdown.classList.remove('active');
                
                // Анімація зміни
                this.animateLanguageChange(switcher);
              }
            } else {
              console.log('❌ Не вдалося змінити мову:', { lang, hasI18nManager: !!(window.ProGran3 && window.ProGran3.I18n && window.ProGran3.I18n.Manager) });
            }
          });
        });
      }
    },
    
    // Позиціонування dropdown
    positionDropdown(toggle, dropdown) {
      // Оскільки тепер використовуємо position: absolute, 
      // dropdown автоматично позиціонується відносно .language-switcher
      // Додаємо тільки логування для діагностики
      console.log('📍 Позиціонування dropdown:', {
        toggleRect: toggle.getBoundingClientRect(),
        dropdownStyle: {
          position: dropdown.style.position,
          top: dropdown.style.top,
          left: dropdown.style.left
        }
      });
    },
    
    // Анімація зміни мови
    animateLanguageChange(switcher) {
      const toggle = switcher.querySelector('.language-toggle');
      if (toggle) {
        toggle.classList.add('language-transition');
        setTimeout(() => {
          toggle.classList.remove('language-transition');
        }, 300);
      }
    },
    
    // Оновлення перемикача мов (нова функція)
    updateLanguageSwitcher(switcher, newLang) {
      const toggle = switcher.querySelector('.language-toggle');
      const flag = toggle.querySelector('.language-flag');
      const name = toggle.querySelector('.language-name');
      
      if (toggle && flag && name) {
        const langInfo = this.getLanguageInfo(newLang);
        flag.textContent = langInfo.flag;
        name.textContent = langInfo.name;
      }
    },
    
    // Оновлення перемикача
    updateSwitcher(currentLang) {
      const switcher = document.getElementById('language-switcher');
      if (!switcher) return;
      
      const flagElement = switcher.querySelector('.language-flag');
      const nameElement = switcher.querySelector('.language-name');
      const options = switcher.querySelectorAll('.language-option');
      
      // Оновлюємо поточну мову
      if (window.ProGran3 && window.ProGran3.I18n && window.ProGran3.I18n.Manager) {
        const manager = window.ProGran3.I18n.Manager;
        const currentFlag = manager.languageFlags[currentLang];
        const currentName = manager.languageNames[currentLang];
        
        if (flagElement) flagElement.textContent = currentFlag;
        if (nameElement) nameElement.textContent = currentName;
        
        // Оновлюємо активний стан опцій
        options.forEach(option => {
          if (option.dataset.lang === currentLang) {
            option.classList.add('active');
          } else {
            option.classList.remove('active');
          }
        });
      }
    }
  };
  
  // Експорт
  global.ProGran3.UI.LanguageSwitcher = LanguageSwitcher;
  
})(window);
