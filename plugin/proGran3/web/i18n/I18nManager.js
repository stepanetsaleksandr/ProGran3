(function(global) {
  'use strict';
  
  // Ініціалізуємо namespace
  if (!global.ProGran3) {
    global.ProGran3 = {};
  }
  if (!global.ProGran3.I18n) {
    global.ProGran3.I18n = {};
  }
  
  const I18nManager = {
    currentLanguage: 'uk',
    translations: {},
    fallbackLanguage: 'en',
    supportedLanguages: ['uk', 'pl', 'en'],
    languageNames: {
      'uk': 'Українська',
      'pl': 'Polski', 
      'en': 'English'
    },
    // Видалено languageFlags - не використовуємо емодзі
    
    // Ініціалізація
    async init() {
      try {
        await this.detectLanguage();
        
        // Примусово встановлюємо українську якщо це перший запуск
        if (!localStorage.getItem('progran3_language')) {
          this.currentLanguage = 'uk';
          localStorage.setItem('progran3_language', 'uk');
          this.logI18nAction('Перший запуск - встановлюємо українську мову', 'info');
        }
        
        // Спочатку завантажуємо вбудовані переклади
        this.loadBuiltinTranslations(this.currentLanguage);
        
        // Потім намагаємося завантажити з файлів
        try {
          await this.loadTranslations(this.currentLanguage);
        } catch (error) {
          this.logI18nAction(`Використовуємо вбудовані переклади для ${this.currentLanguage}`, 'warning');
        }
        
        this.applyTranslations();
        this.setupLanguageSwitcher();
        this.logI18nAction('I18nManager ініціалізовано', 'info');
      } catch (error) {
        this.logI18nAction(`Помилка ініціалізації I18nManager: ${error.message}`, 'error');
      }
    },
    
    // Визначення мови
    async detectLanguage() {
      // 1. Збережена мова
      const saved = localStorage.getItem('progran3_language');
      if (saved && this.isLanguageSupported(saved)) {
        this.currentLanguage = saved;
        this.logI18nAction(`Використовуємо збережену мову: ${saved}`, 'info');
        return;
      }
      
      // 2. Мова браузера (тільки якщо це українська або польська)
      const browserLang = navigator.language.split('-')[0];
      if (this.isLanguageSupported(browserLang) && (browserLang === 'uk' || browserLang === 'pl')) {
        this.currentLanguage = browserLang;
        this.logI18nAction(`Використовуємо мову браузера: ${browserLang}`, 'info');
        return;
      }
      
      // 3. За замовчуванням - завжди українська
      this.currentLanguage = 'uk';
      this.logI18nAction('Використовуємо мову за замовчуванням: uk', 'info');
    },
    
    // Завантаження перекладів
    async loadTranslations(lang) {
      try {
        this.logI18nAction(`Спроба завантаження перекладів для мови: ${lang}`, 'info');
        
        // Спробуємо різні шляхи
        const paths = [
          `i18n/locales/${lang}.json`,
          `./i18n/locales/${lang}.json`,
          `../i18n/locales/${lang}.json`,
          `locales/${lang}.json`
        ];
        
        let response = null;
        let usedPath = '';
        
        for (const path of paths) {
          try {
            this.logI18nAction(`Спроба шляху: ${path}`, 'info');
            response = await fetch(path);
            if (response.ok) {
              usedPath = path;
              break;
            }
          } catch (e) {
            this.logI18nAction(`Шлях ${path} не працює: ${e.message}`, 'warning');
          }
        }
        
        if (!response || !response.ok) {
          throw new Error(`Не вдалося завантажити файл перекладів для ${lang}`);
        }
        
        this.logI18nAction(`Відповідь сервера: ${response.status} ${response.statusText} (шлях: ${usedPath})`, 'info');
        
        const data = await response.json();
        this.translations = data;
        this.logI18nAction(`Переклади завантажено для мови: ${lang} (${Object.keys(data).length} категорій)`, 'success');
      } catch (error) {
        this.logI18nAction(`Не вдалося завантажити ${lang} переклади: ${error.message}`, 'error');
        if (lang !== this.fallbackLanguage) {
          this.logI18nAction(`Спроба завантаження fallback мови: ${this.fallbackLanguage}`, 'warning');
          await this.loadTranslations(this.fallbackLanguage);
        } else {
          // Якщо навіть fallback не працює, використовуємо базові переклади
          this.logI18nAction('Використовуємо базові переклади', 'warning');
          this.translations = this.getFallbackTranslations();
        }
      }
    },
    
    // Завантаження вбудованих перекладів
    loadBuiltinTranslations(lang) {
      this.logI18nAction(`Завантаження вбудованих перекладів для: ${lang}`, 'info');
      
      const builtinTranslations = {
        'uk': {
          ui: {
            foundation: "Фундамент",
            stele: "Стела",
            flowerbed: "Квітник",
            gravestone: "Надгробна плита",
            fence_corner: "Кутова огорожа",
            fence_perimeter: "Периметральна огорожа",
            fence_decor: "Декор огорожі",
            stand: "Підставка",
            lamp: "Лампа",
            blind_area: "Відмостка",
            tiling: "Плитка",
            cladding: "Облицювання"
          },
          buttons: {
            create: "Створити",
            add: "Додати",
            next: "Далі",
            previous: "Назад",
            save: "Зберегти",
            cancel: "Скасувати",
            apply: "Застосувати"
          },
          tabs: {
            base: "База",
            monument: "Памятник",
            gravestone: "Надгробна частина",
            fence: "Огорожа",
            view: "Вигляд",
          },
          panels: {
            foundation: "Фундамент",
            blind_area: "Відмостка",
            tiling: "Плитка на фундаменті",
            cladding: "Бокове облицювання",
            stands: "Підставка",
            steles: "Стела",
            flowerbeds: "Квітник",
            gravestones: "Надгробна плита",
            fence_corner: "Кутова огорожа",
            fence_perimeter: "Периметральна огорожа",
            fence_decor: "Декор огорожі"
          },
          summary: {
            title: "Специфікація",
            foundation: "Фундамент:",
            blind_area: "Відмостка:",
            tiling: "Плитка (верх):",
            cladding: "Облицювання (бік):",
            stand: "Підставка:",
            flowerbed: "Квітник:",
            gravestone: "Надгробна плита:",
            stele: "Стела:",
            fence_corner: "Кутова огорожа:",
            fence_perimeter: "Периметральна огорожа:",
            fence_decor: "Декор огорожі:"
          },
          language: {
            ukrainian: "Українська",
            polish: "Polski",
            english: "English"
          },
          units: {
            mm: "мм",
            cm: "см",
            m: "м"
          }
        },
        'pl': {
          ui: {
            foundation: "Fundament",
            stele: "Stela",
            flowerbed: "Kwietnik",
            gravestone: "Płyta nagrobna",
            fence_corner: "Ogrodzenie narożne",
            fence_perimeter: "Ogrodzenie obwodowe",
            fence_decor: "Dekoracja ogrodzenia",
            stand: "Podstawa",
            lamp: "Lampa",
            blind_area: "Obrzeże",
            tiling: "Płytka",
            cladding: "Okładzina"
          },
          buttons: {
            create: "Utwórz",
            add: "Dodaj",
            next: "Dalej",
            previous: "Wstecz",
            save: "Zapisz",
            cancel: "Anuluj",
            apply: "Zastosuj"
          },
          tabs: {
            base: "Podstawa",
            monument: "Pomnik",
            gravestone: "Nagrobek",
            fence: "Ogrodzenie",
            view: "Widok",
          },
          panels: {
            foundation: "Fundament",
            blind_area: "Obrzeże",
            tiling: "Płytka",
            cladding: "Okładzina",
            stands: "Podstawy",
            steles: "Stele",
            flowerbeds: "Kwietniki",
            gravestones: "Płyty nagrobne",
            fence_corner: "Ogrodzenie narożne",
            fence_perimeter: "Ogrodzenie obwodowe",
            fence_decor: "Dekoracja ogrodzenia"
          },
          summary: {
            title: "Podsumowanie projektu",
            foundation: "Fundament:",
            blind_area: "Obrzeże:",
            tiling: "Płytka:",
            cladding: "Okładzina:",
            stand: "Podstawa:",
            flowerbed: "Kwietnik:",
            gravestone: "Płyta nagrobna:",
            stele: "Stela:",
            fence_corner: "Ogrodzenie narożne:",
            fence_perimeter: "Ogrodzenie obwodowe:",
            fence_decor: "Dekoracja ogrodzenia:"
          },
          language: {
            ukrainian: "Українська",
            polish: "Polski",
            english: "English"
          },
          units: {
            mm: "mm",
            cm: "cm",
            m: "m"
          }
        },
        'en': {
          ui: {
            foundation: "Foundation",
            stele: "Stele",
            flowerbed: "Flowerbed",
            gravestone: "Gravestone",
            fence_corner: "Corner Fence",
            fence_perimeter: "Perimeter Fence",
            fence_decor: "Fence Decor",
            stand: "Stand",
            lamp: "Lamp",
            blind_area: "Blind Area",
            tiling: "Tiling",
            cladding: "Cladding"
          },
          buttons: {
            create: "Create",
            add: "Add",
            next: "Next",
            previous: "Previous",
            save: "Save",
            cancel: "Cancel",
            apply: "Apply"
          },
          tabs: {
            base: "Base",
            monument: "Monument",
            gravestone: "Gravestone",
            fence: "Fence",
            view: "View",
          },
          panels: {
            foundation: "Foundation",
            blind_area: "Blind Area",
            tiling: "Tiling",
            cladding: "Cladding",
            stands: "Stands",
            steles: "Steles",
            flowerbeds: "Flowerbeds",
            gravestones: "Gravestones",
            fence_corner: "Corner Fence",
            fence_perimeter: "Perimeter Fence",
            fence_decor: "Fence Decor"
          },
          summary: {
            title: "Project Summary",
            foundation: "Foundation:",
            blind_area: "Blind Area:",
            tiling: "Tiling:",
            cladding: "Cladding:",
            stand: "Stand:",
            flowerbed: "Flowerbed:",
            gravestone: "Gravestone:",
            stele: "Stele:",
            fence_corner: "Corner Fence:",
            fence_perimeter: "Perimeter Fence:",
            fence_decor: "Fence Decor:"
          },
          language: {
            ukrainian: "Українська",
            polish: "Polski",
            english: "English"
          },
          units: {
            mm: "mm",
            cm: "cm",
            m: "m"
          }
        }
      };
      
      if (builtinTranslations[lang]) {
        this.translations = builtinTranslations[lang];
        this.logI18nAction(`Вбудовані переклади завантажено для: ${lang}`, 'success');
      } else {
        this.translations = this.getFallbackTranslations();
        this.logI18nAction(`Використовуємо fallback переклади для: ${lang}`, 'warning');
      }
    },
    
    // Базові переклади якщо файли не завантажуються
    getFallbackTranslations() {
      return {
        ui: {
          foundation: "Фундамент",
          stele: "Стела",
          flowerbed: "Квітник",
          gravestone: "Надгробна плита",
          fence_corner: "Кутова огорожа",
          fence_perimeter: "Периметральна огорожа",
          fence_decor: "Декор огорожі",
          stand: "Підставка",
          lamp: "Лампа",
          blind_area: "Відмостка",
          tiling: "Плитка",
          cladding: "Облицювання"
        },
        buttons: {
          create: "Створити",
          add: "Додати",
          next: "Далі",
          previous: "Назад",
          save: "Зберегти",
          cancel: "Скасувати",
          apply: "Застосувати"
        },
        tabs: {
          base: "База",
          monument: "Памятник",
          gravestone: "Надгробна частина",
          fence: "Огорожа",
          view: "Вигляд",
        },
        panels: {
          foundation: "Фундамент",
          blind_area: "Відмостка",
          tiling: "Плитка на фундаменті",
          cladding: "Бокове облицювання",
          stands: "Підставка",
          steles: "Стела",
          flowerbeds: "Квітник",
          gravestones: "Надгробна плита",
          fence_corner: "Кутова огорожа",
          fence_perimeter: "Периметральна огорожа",
          fence_decor: "Декор огорожі"
        },
        summary: {
          title: "Специфікація",
          foundation: "Фундамент:",
          blind_area: "Відмостка:",
          tiling: "Плитка (верх):",
          cladding: "Облицювання (бік):",
          stand: "Підставка:",
          flowerbed: "Квітник:",
          gravestone: "Надгробна плита:",
          stele: "Стела:",
          fence_corner: "Кутова огорожа:",
          fence_perimeter: "Периметральна огорожа:",
          fence_decor: "Декор огорожі:"
        },
        language: {
          ukrainian: "Українська",
          polish: "Polski",
          english: "English"
        },
        units: {
          mm: "мм",
          cm: "см",
          m: "м"
        }
      };
    },
    
    // Перевірка підтримки мови
    isLanguageSupported(lang) {
      return this.supportedLanguages.includes(lang);
    },
    
    // Отримання перекладу
    t(key, params = {}) {
      const keys = key.split('.');
      let value = this.translations;
      
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          this.logI18nAction(`Переклад не знайдено: ${key}`, 'warning');
          return key; // Повертаємо ключ якщо переклад не знайдено
        }
      }
      
      // Заміна параметрів
      if (typeof value === 'string' && Object.keys(params).length > 0) {
        return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
          return params[param] || match;
        });
      }
      
      return value;
    },
    
    // Зміна мови
    async changeLanguage(lang) {
      this.logI18nAction(`Спроба зміни мови на: ${lang}`, 'info');
      
      if (!this.isLanguageSupported(lang)) {
        this.logI18nAction(`Непідтримувана мова: ${lang}`, 'error');
        return false;
      }
      
      try {
        this.logI18nAction(`Встановлюємо поточну мову: ${lang}`, 'info');
        this.currentLanguage = lang;
        
        this.logI18nAction(`Зберігаємо в localStorage: ${lang}`, 'info');
        localStorage.setItem('progran3_language', lang);
        
        this.logI18nAction(`Завантажуємо переклади для: ${lang}`, 'info');
        
        // Спочатку завантажуємо вбудовані переклади
        this.loadBuiltinTranslations(lang);
        
        // Потім намагаємося завантажити з файлів
        try {
          await this.loadTranslations(lang);
        } catch (error) {
          this.logI18nAction(`Використовуємо вбудовані переклади для ${lang}`, 'warning');
        }
        
        this.logI18nAction(`Застосовуємо переклади до DOM`, 'info');
        this.applyTranslations();
        
        this.logI18nAction(`Оновлюємо перемикач мов`, 'info');
        this.updateLanguageSwitcher();
        
        this.logI18nAction(`Мову успішно змінено на: ${lang}`, 'success');
        return true;
      } catch (error) {
        this.logI18nAction(`Помилка зміни мови: ${error.message}`, 'error');
        return false;
      }
    },
    
    // Застосування перекладів до DOM
    applyTranslations() {
      this.logI18nAction('Початок застосування перекладів до DOM', 'info');
      
      const elements = document.querySelectorAll('[data-i18n]');
      this.logI18nAction(`Знайдено ${elements.length} елементів з data-i18n`, 'info');
      
      let appliedCount = 0;
      elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = this.t(key);
        
        if (translation !== key) {
          if (element.tagName === 'INPUT' && element.type === 'text') {
            element.placeholder = translation;
          } else if (element.tagName === 'INPUT' && element.type === 'submit') {
            element.value = translation;
          } else {
            element.textContent = translation;
          }
          appliedCount++;
        }
      });
      
      this.logI18nAction(`Застосовано перекладів: ${appliedCount} з ${elements.length}`, 'info');
      
      // Оновлюємо title атрибути
      const titleElements = document.querySelectorAll('[data-i18n-title]');
      titleElements.forEach(element => {
        const key = element.getAttribute('data-i18n-title');
        const translation = this.t(key);
        if (translation !== key) {
          element.title = translation;
        }
      });
      
      this.logI18nAction('Завершено застосування перекладів до DOM', 'success');
    },
    
    // Налаштування перемикача мов
    setupLanguageSwitcher() {
      const switcher = document.getElementById('language-switcher');
      if (switcher) {
        this.updateLanguageSwitcher();
        this.setupSwitcherEvents(switcher);
      }
    },
    
    // Оновлення перемикача мов
    updateLanguageSwitcher() {
      const currentFlag = this.languageFlags[this.currentLanguage];
      const currentName = this.languageNames[this.currentLanguage];
      
      const flagElement = document.querySelector('.language-flag');
      const nameElement = document.querySelector('.language-name');
      
      if (flagElement) flagElement.textContent = currentFlag;
      if (nameElement) nameElement.textContent = currentName;
    },
    
    // Налаштування подій перемикача
    setupSwitcherEvents(switcher) {
      const dropdown = switcher.querySelector('.language-dropdown');
      const toggle = switcher.querySelector('.language-toggle');
      
      if (toggle && dropdown) {
        toggle.addEventListener('click', (e) => {
          e.stopPropagation();
          dropdown.classList.toggle('active');
        });
        
        // Закриття при кліку поза межами
        document.addEventListener('click', () => {
          dropdown.classList.remove('active');
        });
        
        // Обробка вибору мови
        const options = dropdown.querySelectorAll('.language-option');
        options.forEach(option => {
          option.addEventListener('click', async (e) => {
            e.stopPropagation();
            const lang = option.dataset.lang;
            if (lang && lang !== this.currentLanguage) {
              await this.changeLanguage(lang);
              dropdown.classList.remove('active');
            }
          });
        });
      }
    },
    
    // Логування дій
    logI18nAction(message, level = 'info') {
      if (window.ProGran3 && window.ProGran3.Core && window.ProGran3.Core.Logger) {
        window.ProGran3.Core.Logger.debugLog(`[I18n] ${message}`, level, 'I18nManager');
      } else {
        console.log(`[I18n] ${message}`);
      }
    },
    
    // Отримання поточної мови
    getCurrentLanguage() {
      return this.currentLanguage;
    },
    
    // Отримання списку підтримуваних мов
    getSupportedLanguages() {
      return this.supportedLanguages.map(lang => ({
        code: lang,
        name: this.languageNames[lang],
        flag: this.languageFlags[lang]
      }));
    }
  };
  
  // Експорт
  global.ProGran3.I18n.Manager = I18nManager;
  
  // Глобальна функція для зручності
  global.t = (key, params) => I18nManager.t(key, params);
  
})(window);
