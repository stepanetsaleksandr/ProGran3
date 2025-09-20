# proGran3/carousel/carousel_manager.rb
# Спрощений модуль каруселі - тільки бізнес-логіка

require 'json'

module ProGran3
  module Carousel
    class CarouselManager
      
      # Ініціалізація класу
      def initialize
        @carousel_states = {}
      end
      
      # Ініціалізація каруселі (спрощена версія)
      def initialize_carousel(carousel_id, model_list = [])
        @carousel_states[carousel_id] = {
          index: 0,
          models: model_list,
          loaded_previews: {}
        }
        
        puts "🎨 Ініціалізовано карусель: #{carousel_id}"
        puts "📦 Моделей: #{model_list.length}"
        
        true
      end
      
      # Отримання поточної моделі
      def get_current_model(carousel_id)
        state = @carousel_states[carousel_id]
        return nil unless state
        
        models = state[:models]
        index = state[:index]
        
        models[index] if models && index < models.length
      end
      
      # Перехід до наступної моделі
      def next_model(carousel_id)
        state = @carousel_states[carousel_id]
        return false unless state
        
        models = state[:models]
        return false unless models && models.length > 0
        
        state[:index] = (state[:index] + 1) % models.length
        puts "➡️ Перехід до моделі: #{get_current_model(carousel_id)}"
        
        true
      end
      
      # Перехід до попередньої моделі
      def previous_model(carousel_id)
        state = @carousel_states[carousel_id]
        return false unless state
        
        models = state[:models]
        return false unless models && models.length > 0
        
        state[:index] = (state[:index] - 1) % models.length
        puts "⬅️ Перехід до моделі: #{get_current_model(carousel_id)}"
        
        true
      end
      
      # Генерація превью для поточної моделі
      def generate_preview(carousel_id, category)
        state = @carousel_states[carousel_id]
        return nil unless state
        
        current_model = get_current_model(carousel_id)
        return nil unless current_model
        
        component_path = "#{category}/#{current_model}"
        
        puts "🎨 Генерація превью для: #{component_path}"
        
        # Використовуємо існуючий модуль превью
        preview_path = ProGran3.extract_skp_preview(component_path, 256)
        
        if preview_path
          state[:loaded_previews][current_model] = preview_path
          puts "✅ Превью згенеровано: #{File.basename(preview_path)}"
          return preview_path
        else
          puts "❌ Помилка генерації превью"
          return nil
        end
      end
      
      # Отримання base64 превью
      def get_preview_base64(carousel_id, category)
        state = @carousel_states[carousel_id]
        return nil unless state
        
        current_model = get_current_model(carousel_id)
        return nil unless current_model
        
        component_path = "#{category}/#{current_model}"
        
        # Використовуємо існуючий модуль превью
        base64_data = ProGran3.get_preview_base64(component_path, 256)
        
        if base64_data
          puts "✅ Отримано base64 превью для: #{current_model}"
          return base64_data
        else
          puts "❌ Помилка отримання base64 превью"
          return nil
        end
      end
      
      # Додавання поточної моделі до сцени
      def add_current_model(carousel_id, category)
        state = @carousel_states[carousel_id]
        return false unless state
        
        current_model = get_current_model(carousel_id)
        return false unless current_model
        
        puts "➕ Додавання моделі до сцени: #{current_model}"
        
        # Використовуємо існуючий метод додавання компонентів
        ProGran3.insert_component(category, current_model)
        
        true
      end
      
      # Отримання інформації про карусель
      def get_carousel_info(carousel_id)
        state = @carousel_states[carousel_id]
        return nil unless state
        
        current_model = get_current_model(carousel_id)
        
        {
          id: carousel_id,
          current_model: current_model,
          current_index: state[:index],
          total_models: state[:models].length
        }
      end
      
      # Отримання списку всіх каруселей
      def get_all_carousels
        @carousel_states.keys.map do |carousel_id|
          get_carousel_info(carousel_id)
        end.compact
      end
      
      # Тестування модуля
      def test_module
        puts "🧪 Тестування модуля каруселі..."
        
        # Тестуємо ініціалізацію
        test_models = ['stele_100x50x8.skp', 'stele_120x60x8.skp', 'stele_80x40x5.skp']
        success = initialize_carousel('test_steles', test_models)
        
        if success
          puts "✅ Ініціалізація успішна"
          
          # Тестуємо навігацію
          info = get_carousel_info('test_steles')
          puts "📊 Інформація: #{info}"
          
          # Тестуємо перехід
          next_model('test_steles')
          info = get_carousel_info('test_steles')
          puts "📊 Після переходу: #{info}"
          
          puts "✅ Тестування завершено успішно"
        else
          puts "❌ Помилка ініціалізації"
        end
      end
    end
  end
end
