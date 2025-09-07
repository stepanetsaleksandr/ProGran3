(function() {
  'use strict';
  
  // Створюємо глобальний об'єкт якщо не існує
  if (typeof global === 'undefined') {
    window.global = window;
  }
  
  if (!global.ProGran3) {
    global.ProGran3 = {};
  }
  
  if (!global.ProGran3.UI) {
    global.ProGran3.UI = {};
  }
  
  const LanguageSwitcher = {
    
    // Створення перемикача мов (кнопка)
    createLanguageSwitcher() {
      const switcher = document.createElement('div');
      switcher.id = 'language-switcher';
      switcher.className = 'language-switcher';
      
      // Отримуємо поточну мову та створюємо перемикач
      const currentLang = this.getCurrentLanguage();
      const currentLangInfo = this.getLanguageInfo(currentLang);
      
      switcher.innerHTML = `
        <button class="language-button" type="button">
          <span class="language-name">${currentLangInfo.name}</span>
        </button>
      `;
      
      // Додаємо логування для діагностики
      console.log('LanguageSwitcher (кнопка) створено:', {
        currentLang,
        currentLangInfo,
        switcherHTML: switcher.innerHTML.length
      });
      
      return switcher;
    },
    
    // Отримання поточної мови
    getCurrentLanguage() {
      if (window.ProGran3 && window.ProGran3.I18n && window.ProGran3.I18n.Manager) {
        return window.ProGran3.I18n.Manager.getCurrentLanguage();
      }
      return 'uk'; // За замовчуванням українська
    },
    
    // Отримання інформації про мову
    getLanguageInfo(lang) {
      const languages = {
        'uk': { name: 'Українська' },
        'pl': { name: 'Polski' },
        'en': { name: 'English' }
      };
      return languages[lang] || languages['uk'];
    },
    
    // Почергове перемикання мов
    cycleLanguage() {
      const supportedLanguages = ['uk', 'pl', 'en'];
      const currentLang = this.getCurrentLanguage();
      const currentIndex = supportedLanguages.indexOf(currentLang);
      const nextIndex = (currentIndex + 1) % supportedLanguages.length;
      const nextLang = supportedLanguages[nextIndex];
      
      console.log('Почергове перемикання мов:', {
        currentLang,
        currentIndex,
        nextLang,
        nextIndex,
        supportedLanguages
      });
      
      // Змінюємо мову
      if (window.ProGran3 && window.ProGran3.I18n && window.ProGran3.I18n.Manager) {
        // Використовуємо правильний метод для зміни мови
        if (typeof window.ProGran3.I18n.Manager.changeLanguage === 'function') {
          window.ProGran3.I18n.Manager.changeLanguage(nextLang);
        } else if (typeof window.ProGran3.I18n.Manager.setLanguage === 'function') {
          window.ProGran3.I18n.Manager.setLanguage(nextLang);
        } else {
          // Якщо немає методів, викликаємо глобальну функцію
          if (typeof window.changeLanguage === 'function') {
            window.changeLanguage(nextLang);
          }
        }
      }
      
      return nextLang;
    },
    
    // Ініціалізація
    init() {
      console.log('Ініціалізація LanguageSwitcher...');
      this.addStyles();
      const switcher = this.createLanguageSwitcher();
      const headerRight = document.querySelector('.header-right');
      if (headerRight) {
        console.log('Знайдено header-right, додаємо перемикач мов');
        headerRight.appendChild(switcher);
        console.log('Перемикач мов додано в header-right');
      } else {
        console.log('header-right не знайдено, додаємо в body');
        document.body.appendChild(switcher);
      }
      this.setupEvents(switcher);
      console.log('Перевірка кнопки:', {
        buttonExists: !!switcher.querySelector('.language-button'),
        buttonHTML: switcher.querySelector('.language-button') ? switcher.querySelector('.language-button').innerHTML.substring(0, 100) + '...' : 'не знайдено'
      });
      return switcher;
    },
    
    // Налаштування подій
    setupEvents(switcher) {
      const button = switcher.querySelector('.language-button');
      
      console.log('Налаштування подій для кнопки:', {
        buttonExists: !!button
      });
      
      if (button) {
        // Клік по кнопці - почергове перемикання мов
        button.addEventListener('click', async (e) => {
          e.stopPropagation();
          
          console.log('Клік по кнопці перемикача мов');
          
          try {
            // Почергове перемикання мов
            const newLang = this.cycleLanguage();
            
            // Оновлюємо кнопку
            this.updateLanguageSwitcher(switcher, newLang);
            
            // Анімація кнопки
            this.animateButtonClick(button);
            
            console.log('Мова змінена на:', newLang);
          } catch (error) {
            console.error('Помилка зміни мови:', error);
          }
        });
        
        // Hover ефекти
        button.addEventListener('mouseenter', () => {
          button.style.transform = 'translateY(-2px)';
        });
        
        button.addEventListener('mouseleave', () => {
          button.style.transform = 'translateY(0)';
        });
      }
    },
    
    // Анімація кліку кнопки
    animateButtonClick(button) {
      if (button) {
        // Анімація натискання
        button.style.transform = 'scale(0.95)';
        button.style.transition = 'transform 0.1s ease';
        
        setTimeout(() => {
          button.style.transform = 'scale(1)';
        }, 100);
        
        setTimeout(() => {
          button.style.transition = '';
        }, 200);
      }
    },
    
    // Оновлення перемикача мов (кнопка)
    updateLanguageSwitcher(switcher, newLang) {
      const button = switcher.querySelector('.language-button');
      const name = button ? button.querySelector('.language-name') : null;
      
      if (button && name) {
        const langInfo = this.getLanguageInfo(newLang);
        name.textContent = langInfo.name;
        
        console.log('Перемикач мов оновлено:', {
          newLang,
          langInfo,
          name: name.textContent
        });
      }
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
        
        .language-button {
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
          min-width: 100px;
          height: 32px;
        
          outline: none;
        }
        
        .language-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        
        .language-button:active {
          transform: translateY(0) scale(0.95);
        }
        
        .language-button:focus {
          outline: 2px solid rgba(255, 255, 255, 0.5);
          outline-offset: 2px;
        }
        
        .language-name {
          flex: 1;
          text-align: center;
          font-weight: 500;
        }
        
        /* Мобільні стилі */
        @media (max-width: 480px) {
          .language-button {
            min-width: 100px;
            padding: 6px 10px;
            font-size: 13px;
          }
          
          .header-right {
            padding-right: 10px;
          }
        }
        
        /* Темна тема */
        @media (prefers-color-scheme: dark) {
          .language-button {
            background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          }
          
          .language-button:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          }
        }
        
        /* Стилі для інтеграції в header */
        .header-right .language-switcher {
          margin: 0;
          position: relative;
        }
        
        /* Додаткові стилі для правильного позиціонування */
        .header-right {
          position: relative;
          overflow: visible;
        }
        
        /* Плавна анімація зміни мови */
        .language-transition {
          transition: all 0.3s ease;
        }
        
        .header .language-button {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .header .language-button:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
        }
      `;
      
      document.head.appendChild(style);
    }
  };
  
  // Експортуємо модуль
  global.ProGran3.UI.LanguageSwitcher = LanguageSwitcher;
  
  console.log('LanguageSwitcher модуль завантажено');
  
})();