# progran3/demo_ui.rb
# Демо версія інтерфейсу з обмеженим функціоналом

module ProGran3
  class DemoUI
    # HTML для демо UI
    DEMO_HTML = <<~HTML
      <!DOCTYPE html>
      <html lang="uk">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ProGran3 - Демо версія</title>
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
          
          .demo-container {
            max-width: 600px;
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
          
          .demo-badge {
            background: linear-gradient(45deg, #FFC107, #FF9800);
            color: #333;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            display: inline-block;
            margin-bottom: 30px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .features-list {
            text-align: left;
            margin: 30px 0;
          }
          
          .feature-item {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
            padding: 10px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .feature-icon {
            font-size: 20px;
            margin-right: 15px;
            width: 30px;
            text-align: center;
          }
          
          .feature-text {
            flex: 1;
          }
          
          .feature-title {
            font-weight: 600;
            margin-bottom: 5px;
          }
          
          .feature-desc {
            font-size: 14px;
            opacity: 0.8;
          }
          
          .limitation {
            background: rgba(255, 107, 107, 0.1);
            border: 1px solid rgba(255, 107, 107, 0.3);
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            text-align: left;
          }
          
          .limitation-title {
            color: #ff6b6b;
            font-weight: 600;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
          }
          
          .limitation-icon {
            margin-right: 8px;
          }
          
          .limitation-text {
            font-size: 14px;
            opacity: 0.9;
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
          
          .upgrade-info {
            background: rgba(76, 175, 80, 0.1);
            border: 1px solid rgba(76, 175, 80, 0.3);
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: left;
          }
          
          .upgrade-title {
            color: #4CAF50;
            font-weight: 600;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
          }
          
          .upgrade-icon {
            margin-right: 8px;
          }
          
          .upgrade-text {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 10px;
          }
          
          .upgrade-benefits {
            font-size: 13px;
            opacity: 0.8;
            line-height: 1.4;
          }
        </style>
      </head>
      <body>
        <div class="demo-container">
          <div class="logo">🎯</div>
          <div class="title">ProGran3</div>
          <div class="subtitle">Конструктор меморіальних комплексів</div>
          <div class="demo-badge">Демо версія</div>
          
          <div class="features-list">
            <div class="feature-item">
              <div class="feature-icon">✅</div>
              <div class="feature-text">
                <div class="feature-title">Базові функції</div>
                <div class="feature-desc">Створення простих конструкцій</div>
              </div>
            </div>
            
            <div class="feature-item">
              <div class="feature-icon">✅</div>
              <div class="feature-text">
                <div class="feature-title">Обмежений набір елементів</div>
                <div class="feature-desc">До 5 типів елементів</div>
              </div>
            </div>
            
            <div class="feature-item">
              <div class="feature-icon">✅</div>
              <div class="feature-text">
                <div class="feature-title">Базові налаштування</div>
                <div class="feature-desc">Мінімальна конфігурація</div>
              </div>
            </div>
          </div>
          
          <div class="limitation">
            <div class="limitation-title">
              <span class="limitation-icon">⚠️</span>
              Обмеження демо версії
            </div>
            <div class="limitation-text">
              Демо версія має обмежений функціонал. Для повного доступу до всіх можливостей необхідна активна ліцензія.
            </div>
          </div>
          
          <div class="upgrade-info">
            <div class="upgrade-title">
              <span class="upgrade-icon">🚀</span>
              Отримайте повну версію
            </div>
            <div class="upgrade-text">
              Розблокуйте всі можливості ProGran3 з повною ліцензією:
            </div>
            <div class="upgrade-benefits">
              • Необмежений набір елементів<br>
              • Розширені налаштування<br>
              • Експорт в різні формати<br>
              • Технічна підтримка<br>
              • Оновлення та нові функції
            </div>
          </div>
          
          <div class="button-group">
            <button class="btn btn-primary" id="startDemoBtn">
              Почати демо
            </button>
            <button class="btn btn-secondary" id="activateLicenseBtn">
              Активувати ліцензію
            </button>
          </div>
        </div>
        
        <script>
          const startDemoBtn = document.getElementById('startDemoBtn');
          const activateLicenseBtn = document.getElementById('activateLicenseBtn');
          
          // Початок демо
          startDemoBtn.addEventListener('click', () => {
            window.parent.postMessage({ type: 'start_demo' }, '*');
          });
          
          // Активація ліцензії
          activateLicenseBtn.addEventListener('click', () => {
            window.parent.postMessage({ type: 'show_license_ui' }, '*');
          });
        </script>
      </body>
      </html>
    HTML

    def self.show
      begin
        # Створюємо діалог для демо UI
        dialog = ::UI::HtmlDialog.new({
          :dialog_title => "ProGran3 - Демо версія",
          :preferences_key => "ProGran3_Demo",
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
        dialog.set_html(DEMO_HTML)
        
        # Обробка повідомлень від JavaScript
        dialog.add_action_callback("start_demo") do |action_context|
          puts "🎯 Демо режим запущено"
          dialog.close
          show_demo_main_ui
        end
        
        dialog.add_action_callback("show_license_ui") do |action_context|
          puts "🔐 Перехід до активації ліцензії"
          dialog.close
          LicenseUI.show
        end
        
        # Показуємо демо UI
        dialog.show
        
        # Центруємо діалог
        dialog.center
        
        Logger.info("Демо UI показано", "DemoUI")
        
      rescue => e
        Logger.error("Помилка показу демо UI: #{e.message}", "DemoUI")
        # Fallback - показуємо основний UI
        show_main_ui
      end
    end
    
    private
    
    def self.show_demo_main_ui
      # Показуємо демо версію основного UI
      ProGran3::UI.show_dialog
    end
    
    def self.show_main_ui
      # Показуємо основний UI плагіна
      ProGran3::UI.show_dialog
    end
  end
end
