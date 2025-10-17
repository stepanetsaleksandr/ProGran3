# progran3/splash_screen.rb
# Система завантаження з ліцензуванням

module ProGran3
  class SplashScreen
    # HTML для splash screen
    SPLASH_HTML = <<~HTML
      <!DOCTYPE html>
      <html lang="uk">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ProGran3 - Завантаження</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #e9eff5;
            color: #333;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          
          .splash-container {
            text-align: center;
            max-width: 380px;
            padding: 30px;
            background: rgba(255, 255, 255, 0.12);
            border-radius: 15px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18), 0 4px 16px rgba(0, 0, 0, 0.12);
          }
          
          .logo {
            font-size: 36px;
            margin-bottom: 15px;
            font-weight: bold;
            color: #333;
          }
          
          .title {
            font-size: 20px;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
          }
          
          .subtitle {
            font-size: 14px;
            color: #555;
            margin-bottom: 25px;
          }
          
          .loading-container {
            margin: 30px 0;
          }
          
          .loading-text {
            font-size: 16px;
            margin-bottom: 15px;
            font-weight: 500;
            color: #333;
          }
          
          .progress-bar {
            width: 100%;
            height: 6px;
            background: rgba(0, 0, 0, 0.1);
            border-radius: 3px;
            overflow: hidden;
            margin-bottom: 8px;
          }
          
          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #4CAF50, #45a049);
            border-radius: 3px;
            width: 0%;
            transition: width 0.3s ease;
            animation: pulse 2s infinite;
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          
          .spinner {
            width: 32px;
            height: 32px;
            border: 3px solid rgba(0, 0, 0, 0.1);
            border-top: 3px solid #4CAF50;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .status-text {
            font-size: 12px;
            color: #666;
            margin-top: 8px;
          }
          
          .version {
            position: absolute;
            bottom: 15px;
            right: 15px;
            font-size: 10px;
            color: #666;
          }
          
          .error-message {
            color: #ff6b6b;
            font-size: 14px;
            margin-top: 15px;
            padding: 10px;
            background: rgba(255, 107, 107, 0.1);
            border-radius: 8px;
            border: 1px solid rgba(255, 107, 107, 0.3);
            display: none;
          }
        </style>
      </head>
      <body>
        <div class="splash-container">
          <div class="logo">ProGran3</div>
          <div class="title">Конструктор</div>
          <div class="subtitle">Меморіальних комплексів</div>
          
          <div class="loading-container">
            <div class="loading-text" id="loadingText">Завантаження...</div>
            <div class="progress-bar">
              <div class="progress-fill" id="progressFill"></div>
            </div>
            <div class="spinner"></div>
            <div class="status-text" id="statusText">Ініціалізація системи...</div>
          </div>
          
          <div class="error-message" id="errorMessage"></div>
          <div class="version">v1.0.0</div>
        </div>
        
        <script>
          // Симуляція завантаження
          let progress = 0;
          const progressFill = document.getElementById('progressFill');
          const loadingText = document.getElementById('loadingText');
          const statusText = document.getElementById('statusText');
          const errorMessage = document.getElementById('errorMessage');
          
          const loadingSteps = [
            { text: 'Завантаження...', status: 'Ініціалізація системи...', progress: 20 },
            { text: 'Перевірка ліцензії...', status: 'Підключення до сервера...', progress: 40 },
            { text: 'Валідація даних...', status: 'Перевірка конфігурації...', progress: 60 },
            { text: 'Завантаження модулів...', status: 'Підготовка інтерфейсу...', progress: 80 },
            { text: 'Завершення...', status: 'Майже готово...', progress: 100 }
          ];
          
          let currentStep = 0;
          
          function updateProgress() {
            if (currentStep < loadingSteps.length) {
              const step = loadingSteps[currentStep];
              loadingText.textContent = step.text;
              statusText.textContent = step.status;
              progressFill.style.width = step.progress + '%';
              currentStep++;
              
              setTimeout(updateProgress, 800);
            } else {
              // Завантаження завершено
              setTimeout(() => {
                // Симуляція перевірки ліцензії
                checkLicense();
              }, 500);
            }
          }
          
          function checkLicense() {
            loadingText.textContent = 'Перевірка ліцензії...';
            statusText.textContent = 'Підключення до сервера...';
            
            // Викликаємо Ruby callback для перевірки ліцензії
            if (window.sketchup && window.sketchup.validate_license) {
              window.sketchup.validate_license();
            } else {
              // Fallback якщо callback не зареєстровано
              console.warn('License validation callback не знайдено');
              loadingText.textContent = 'Ліцензія не знайдена';
              statusText.textContent = 'Потрібна активація';
              
              setTimeout(() => {
                if (window.sketchup && window.sketchup.show_license_ui) {
                  window.sketchup.show_license_ui();
                } else {
                  console.error('show_license_ui callback не знайдено');
                }
              }, 1000);
            }
          }
          
          // Обробка результату валідації від Ruby
          window.handleLicenseValidationResult = function(result) {
            console.log('License validation result:', result);
            
            if (result.valid) {
              // Ліцензія валідна
              loadingText.textContent = 'Ліцензія валідна!';
              statusText.textContent = 'Завантаження інтерфейсу...';
              
              // Показуємо попередження якщо є
              if (result.warning) {
                statusText.textContent = result.warning;
              }
              
              setTimeout(() => {
                // Переходимо до основного UI
                if (window.sketchup && window.sketchup.show_main_ui) {
                  window.sketchup.show_main_ui();
                } else {
                  window.parent.postMessage({ type: 'show_main_ui' }, '*');
                }
              }, 1000);
            } else {
              // Ліцензія не валідна
              loadingText.textContent = 'Ліцензія не знайдена';
              statusText.textContent = result.message || 'Потрібна активація';
              
              setTimeout(() => {
                // Переходимо до ліцензійного UI
                if (window.sketchup && window.sketchup.show_license_ui) {
                  window.sketchup.show_license_ui();
                } else {
                  console.error('show_license_ui callback не знайдено');
                }
              }, 1000);
            }
          }
          
          // Початок завантаження
          setTimeout(updateProgress, 500);
          
          // Обробка помилок
          window.addEventListener('error', (e) => {
            errorMessage.textContent = 'Помилка завантаження: ' + e.message;
            errorMessage.style.display = 'block';
          });
        </script>
      </body>
      </html>
    HTML

    def self.show
      begin
        # Створюємо діалог для splash screen
        dialog = ::UI::HtmlDialog.new({
          :dialog_title => "ProGran3 - Завантаження",
          :preferences_key => "ProGran3_Splash",
          :scrollable => false,
          :resizable => false,
          :width => 420,
          :height => 850,
          :min_width => 350,
          :min_height => 600,
          :max_width => 420,
          :max_height => 850,
          :style => ::UI::HtmlDialog::STYLE_DIALOG
        })
        
        # Встановлюємо HTML
        dialog.set_html(SPLASH_HTML)
        
        # Додаємо callback для валідації ліцензії
        dialog.add_action_callback("validate_license") do |action_context|
          puts "🔍 Callback: validate_license викликано"
          
          begin
            # Ініціалізуємо License Manager
            require_relative 'security/license_manager'
            manager = Security::LicenseManager.new
            
            # Валідуємо ліцензію
            result = manager.validate_license
            
            # Повертаємо результат в JavaScript
            js_result = {
              valid: result[:valid],
              message: result[:message] || result[:error],
              warning: result[:warning]
            }.to_json
            
            dialog.execute_script("window.handleLicenseValidationResult(#{js_result})")
            
          rescue => e
            puts "❌ Помилка валідації: #{e.message}"
            puts e.backtrace.first(3)
            
            # Повертаємо помилку в JavaScript
            error_result = {
              valid: false,
              message: "Помилка перевірки ліцензії: #{e.message}"
            }.to_json
            
            dialog.execute_script("window.handleLicenseValidationResult(#{error_result})")
          end
        end
        
        # Обробка повідомлень від JavaScript
        dialog.add_action_callback("license_valid") do |action_context|
          puts "✅ Ліцензія валідна - показуємо основний UI (тестовий режим)"
          dialog.close
          show_main_ui
        end
        
        dialog.add_action_callback("license_required") do |action_context|
          puts "🔐 Потрібна ліцензія - показуємо ліцензійний UI"
          dialog.close
          show_license_ui
        end
        
        # Додаємо прямі callback функції для JavaScript
        dialog.add_action_callback("show_main_ui") do |action_context|
          puts "🎯 Прямий виклик - показуємо основний UI"
          puts "📱 Закриваємо splash screen..."
          dialog.close
          puts "🚀 Викликаємо show_main_ui..."
          show_main_ui
          puts "✅ show_main_ui виконано"
        end
        
        dialog.add_action_callback("show_license_ui") do |action_context|
          puts "🔐 Прямий виклик - показуємо ліцензійний UI"
          dialog.close
          show_license_ui
        end
        
        # Показуємо splash screen
        dialog.show
        
        # Центруємо діалог
        dialog.center
        
        Logger.info("Splash screen показано", "SplashScreen")
        
      rescue => e
        Logger.error("Помилка показу splash screen: #{e.message}", "SplashScreen")
        # Fallback - показуємо основний UI
        show_main_ui
      end
    end
    
    private
    
    def self.show_main_ui
      # Показуємо основний UI плагіна
      ProGran3::UI.show_dialog
    end
    
    def self.show_license_ui
      # Показуємо ліцензійний UI
      LicenseUI.show
    end
  end
end
