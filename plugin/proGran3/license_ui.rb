# progran3/license_ui.rb
# Ліцензійний інтерфейс для активації

module ProGran3
  class LicenseUI
    # HTML для ліцензійного UI
    LICENSE_HTML = <<~HTML
      <!DOCTYPE html>
      <html lang="uk">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ProGran3 - Активація ліцензії</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          
          .license-container {
            max-width: 500px;
            padding: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            text-align: center;
          }
          
          .logo {
            font-size: 48px;
            margin-bottom: 20px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
          }
          
          .title {
            font-size: 28px;
            margin-bottom: 10px;
            font-weight: 600;
          }
          
          .subtitle {
            font-size: 16px;
            opacity: 0.8;
            margin-bottom: 30px;
          }
          
          .form-group {
            margin-bottom: 20px;
            text-align: left;
          }
          
          .form-label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            font-size: 14px;
          }
          
          .form-input {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            font-size: 16px;
            transition: all 0.3s ease;
          }
          
          .form-input:focus {
            outline: none;
            border-color: #4CAF50;
            background: rgba(255, 255, 255, 0.15);
          }
          
          .form-input::placeholder {
            color: rgba(255, 255, 255, 0.6);
          }
          
          .button-group {
            display: flex;
            gap: 15px;
            margin-top: 30px;
          }
          
          .btn {
            flex: 1;
            padding: 14px 24px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .btn-primary {
            background: linear-gradient(45deg, #4CAF50, #45a049);
            color: white;
            box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
          }
          
          .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
          }
          
          .btn-secondary {
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border: 2px solid rgba(255, 255, 255, 0.3);
          }
          
          .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.2);
            border-color: rgba(255, 255, 255, 0.5);
          }
          
          .info-box {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: left;
          }
          
          .info-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 10px;
            color: #4CAF50;
          }
          
          .info-text {
            font-size: 14px;
            line-height: 1.5;
            opacity: 0.9;
          }
          
          .status-message {
            margin-top: 20px;
            padding: 12px;
            border-radius: 8px;
            font-size: 14px;
            display: none;
          }
          
          .status-success {
            background: rgba(76, 175, 80, 0.2);
            border: 1px solid rgba(76, 175, 80, 0.5);
            color: #4CAF50;
          }
          
          .status-error {
            background: rgba(255, 107, 107, 0.2);
            border: 1px solid rgba(255, 107, 107, 0.5);
            color: #ff6b6b;
          }
          
          .demo-info {
            background: rgba(255, 193, 7, 0.1);
            border: 1px solid rgba(255, 193, 7, 0.3);
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
          }
          
          .demo-title {
            font-size: 16px;
            font-weight: 600;
            color: #FFC107;
            margin-bottom: 8px;
          }
          
          .demo-text {
            font-size: 14px;
            opacity: 0.9;
          }
        </style>
      </head>
      <body>
        <div class="license-container">
          <div class="logo">🔐</div>
          <div class="title">Активація ліцензії</div>
          <div class="subtitle">ProGran3 Конструктор меморіальних комплексів</div>
          
          <form id="licenseForm">
            <div class="form-group">
              <label class="form-label" for="email">Email адреса</label>
              <input 
                type="email" 
                id="email" 
                class="form-input" 
                placeholder="your@email.com"
                required
              >
            </div>
            
            <div class="form-group">
              <label class="form-label" for="licenseKey">Ключ ліцензії</label>
              <input 
                type="text" 
                id="licenseKey" 
                class="form-input" 
                placeholder="PROGRAN3-2025-XXXXXXXX-XXXXXXXX"
                required
              >
            </div>
            
            <div class="button-group">
              <button type="submit" class="btn btn-primary" id="activateBtn">
                Активувати ліцензію
              </button>
              <button type="button" class="btn btn-secondary" id="demoBtn">
                Демо версія
              </button>
            </div>
          </form>
          
          <div class="info-box">
            <div class="info-title">ℹ️ Інформація</div>
            <div class="info-text">
              Для використання ProGran3 необхідна активна ліцензія. 
              Введіть ваш email та ключ ліцензії для активації плагіна.
            </div>
          </div>
          
          <div class="demo-info">
            <div class="demo-title">🎯 Демо версія</div>
            <div class="demo-text">
              Можете спробувати демо версію з обмеженим функціоналом
            </div>
          </div>
          
          <div class="status-message" id="statusMessage"></div>
        </div>
        
        <script>
          const form = document.getElementById('licenseForm');
          const activateBtn = document.getElementById('activateBtn');
          const demoBtn = document.getElementById('demoBtn');
          const statusMessage = document.getElementById('statusMessage');
          
          // Обробка активації ліцензії
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const licenseKey = document.getElementById('licenseKey').value;
            
            if (!email || !licenseKey) {
              showStatus('Будь ласка, заповніть всі поля', 'error');
              return;
            }
            
            // Реальна активація через Ruby callback
            activateBtn.textContent = 'Активація...';
            activateBtn.disabled = true;
            
            // Викликаємо Ruby callback
            if (window.sketchup && window.sketchup.activate_license) {
              window.sketchup.activate_license(email, licenseKey);
            } else {
              showStatus('❌ Помилка: callback не знайдено', 'error');
              activateBtn.textContent = 'Активувати ліцензію';
              activateBtn.disabled = false;
            }
          });
          
          // Обробка результату активації від Ruby
          window.handleActivationResult = function(result) {
            console.log('Activation result:', result);
            
            if (result.success) {
              showStatus('✅ Ліцензію успішно активовано!', 'success');
              // Діалог закриється автоматично з Ruby side
            } else {
              showStatus('❌ ' + (result.error || 'Помилка активації'), 'error');
              activateBtn.textContent = 'Активувати ліцензію';
              activateBtn.disabled = false;
            }
          };
          
          // Обробка демо версії
          demoBtn.addEventListener('click', () => {
            showStatus('🎯 Запуск демо версії...', 'success');
            setTimeout(() => {
              window.parent.postMessage({ type: 'demo_mode' }, '*');
            }, 1000);
          });
          
          function showStatus(message, type) {
            statusMessage.textContent = message;
            statusMessage.className = `status-message status-${type}`;
            statusMessage.style.display = 'block';
          }
          
          // Валідація email
          document.getElementById('email').addEventListener('input', (e) => {
            const email = e.target.value;
            const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            
            if (email && !isValid) {
              e.target.style.borderColor = '#ff6b6b';
            } else {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }
          });
          
          // Валідація ключа ліцензії
          document.getElementById('licenseKey').addEventListener('input', (e) => {
            // Дозволяємо тільки великі літери, цифри та дефіс
            let value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
            // Без обмеження довжини - підтримуємо різні формати ключів
            e.target.value = value;
          });
        </script>
      </body>
      </html>
    HTML

    def self.show
      begin
        # Створюємо діалог для ліцензійного UI
        dialog = ::UI::HtmlDialog.new({
          :dialog_title => "ProGran3 - Активація ліцензії",
          :preferences_key => "ProGran3_License",
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
        dialog.set_html(LICENSE_HTML)
        
        # Callback для активації ліцензії
        dialog.add_action_callback("activate_license") do |action_context, email, license_key|
          puts "🔐 Callback: activate_license викликано"
          puts "   Email: #{email}"
          puts "   Key: #{license_key[0..8]}..."
          
          begin
            # Ініціалізуємо License Manager
            require_relative 'system/core/session_manager'
            manager = ProGran3::System::Core::SessionManager.new
            
            # Активуємо ліцензію
            result = manager.activate_license(email, license_key)
            
            # Повертаємо результат в JavaScript
            js_result = {
              success: result[:success],
              error: result[:error],
              message: result[:message]
            }.to_json
            
            dialog.execute_script("window.handleActivationResult(#{js_result})")
            
            # Якщо успішно - закриваємо діалог та показуємо UI
            if result[:success]
              sleep(1.5) # Даємо час показати success message
              dialog.close
              show_main_ui
            end
            
          rescue => e
            puts "❌ Помилка активації: #{e.message}"
            puts e.backtrace.first(3)
            
            # Повертаємо помилку в JavaScript
            error_result = {
              success: false,
              error: "Помилка активації: #{e.message}"
            }.to_json
            
            dialog.execute_script("window.handleActivationResult(#{error_result})")
          end
        end
        
        # Обробка повідомлень від JavaScript (старі callbacks для сумісності)
        dialog.add_action_callback("license_activated") do |action_context, email, licenseKey|
          puts "✅ Ліцензія активована: #{email}"
          dialog.close
          show_main_ui
        end
        
        dialog.add_action_callback("demo_mode") do |action_context|
          puts "🎯 Демо режим активовано"
          dialog.close
          show_demo_ui
        end
        
        # Показуємо ліцензійний UI
        dialog.show
        
        # Центруємо діалог
        dialog.center
        
        Logger.info("Ліцензійний UI показано", "LicenseUI")
        
      rescue => e
        Logger.error("Помилка показу ліцензійного UI: #{e.message}", "LicenseUI")
        # Fallback - показуємо основний UI
        show_main_ui
      end
    end
    
    private
    
    def self.show_main_ui
      # Показуємо основний UI плагіна
      ProGran3::UI.show_dialog
    end
    
    def self.show_demo_ui
      # Показуємо демо версію UI
      DemoUI.show
    end
  end
end
