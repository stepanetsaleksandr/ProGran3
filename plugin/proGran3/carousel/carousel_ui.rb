# proGran3/carousel/carousel_ui.rb
# UI інтеграція для незалежного модуля каруселі

module ProGran3
  module Carousel
    class CarouselUI
      
      # Ініціалізація класу
      def initialize
        @carousel_manager = nil
      end
      
      # Реєстрація callback'ів для нового модуля каруселі
      def register_callbacks(dialog)
        puts "🎨 Реєстрація callback'ів для модуля каруселі..."
        
        # Створюємо екземпляр менеджера каруселей
        @carousel_manager = CarouselManager.new
        
        # Callback для ініціалізації каруселі
        dialog.add_action_callback("initialize_carousel_module") do |dialog, carousel_id, model_list_json|
          model_list = JSON.parse(model_list_json)
          success = @carousel_manager.initialize_carousel(carousel_id, model_list)
          
          if success
            info = @carousel_manager.get_carousel_info(carousel_id)
            dialog.execute_script("carouselModuleInitialized('#{carousel_id}', #{info.to_json});")
          else
            dialog.execute_script("carouselModuleError('#{carousel_id}', 'Помилка ініціалізації');")
          end
        end
        
        # Callback для навігації каруселі
        dialog.add_action_callback("carousel_next") do |dialog, carousel_id|
          success = @carousel_manager.next_model(carousel_id)
          
          if success
            info = @carousel_manager.get_carousel_info(carousel_id)
            dialog.execute_script("carouselNavigated('#{carousel_id}', #{info.to_json});")
          end
        end
        
        dialog.add_action_callback("carousel_previous") do |dialog, carousel_id|
          success = @carousel_manager.previous_model(carousel_id)
          
          if success
            info = @carousel_manager.get_carousel_info(carousel_id)
            dialog.execute_script("carouselNavigated('#{carousel_id}', #{info.to_json});")
          end
        end
        
        # Callback для генерації превью
        dialog.add_action_callback("carousel_generate_preview") do |dialog, carousel_id|
          base64_data = @carousel_manager.get_preview_base64(carousel_id)
          
          if base64_data
            dialog.execute_script("carouselPreviewGenerated('#{carousel_id}', '#{base64_data}');")
          else
            dialog.execute_script("carouselPreviewError('#{carousel_id}', 'Помилка генерації превью');")
          end
        end
        
        # Callback для додавання моделі
        dialog.add_action_callback("carousel_add_model") do |dialog, carousel_id|
          success = @carousel_manager.add_current_model(carousel_id)
          
          if success
            info = @carousel_manager.get_carousel_info(carousel_id)
            dialog.execute_script("carouselModelAdded('#{carousel_id}', #{info.to_json});")
          else
            dialog.execute_script("carouselAddError('#{carousel_id}', 'Помилка додавання моделі');")
          end
        end
        
        # Callback для отримання інформації про карусель
        dialog.add_action_callback("carousel_get_info") do |dialog, carousel_id|
          info = @carousel_manager.get_carousel_info(carousel_id)
          
          if info
            dialog.execute_script("carouselInfoReceived('#{carousel_id}', #{info.to_json});")
          else
            dialog.execute_script("carouselInfoError('#{carousel_id}', 'Карусель не знайдена');")
          end
        end
        
        puts "✅ Callback'и для модуля каруселі зареєстровані"
      end
      
      # Отримання HTML для каруселі
      def get_carousel_html(carousel_id)
        config = @carousel_manager.class::CAROUSEL_CONFIG[carousel_id]
        return "" unless config
        
        html = <<~HTML
          <div class="carousel-module" id="#{carousel_id}-module">
            <div class="carousel-module-header">
              <h3>#{config[:name]}</h3>
              <div class="carousel-module-info" id="#{carousel_id}-info">
                <span class="current-model">--</span>
                <span class="model-counter">0 / 0</span>
              </div>
            </div>
            
            <div class="carousel-module-viewport" id="#{carousel_id}-viewport">
              <div class="carousel-module-track" id="#{carousel_id}-track">
                <!-- Елементи каруселі будуть додані через JavaScript -->
              </div>
            </div>
            
            <div class="carousel-module-controls">
              <button class="carousel-module-btn prev" onclick="carouselModulePrevious('#{carousel_id}')">
                ← Попередня
              </button>
              <button class="carousel-module-btn generate" onclick="carouselModuleGeneratePreview('#{carousel_id}')">
                🎨 Генерувати превью
              </button>
              <button class="carousel-module-btn add" onclick="carouselModuleAddModel('#{carousel_id}')">
                ➕ Додати модель
              </button>
              <button class="carousel-module-btn next" onclick="carouselModuleNext('#{carousel_id}')">
                Наступна →
              </button>
            </div>
            
            <div class="carousel-module-preview" id="#{carousel_id}-preview">
              <!-- Превью буде відображено тут -->
            </div>
          </div>
        HTML
        
        html
      end
      
      # Тестування UI модуля
      def test_ui_module
        puts "🧪 Тестування UI модуля каруселі..."
        
        # Тестуємо генерацію HTML
        html = get_carousel_html('test_steles')
        puts "✅ HTML згенеровано (#{html.length} символів)"
        
        puts "✅ UI модуль готовий до використання"
      end
    end
  end
end
