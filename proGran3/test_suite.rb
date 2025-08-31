# progran3/test_suite.rb
require_relative 'logger'
require_relative 'error_handler'
require_relative 'validation'
require_relative 'dimensions_manager'
require_relative 'coordination_manager'
require_relative 'callback_manager'
require_relative 'skp_preview_extractor'
require_relative 'carousel/carousel_manager'
require_relative 'carousel/carousel_ui'

module ProGran3
  module TestSuite
    extend self

    def test_plugin
      Logger.start("Тестування плагіна ProGran3", "TestSuite")
      
      # Тестуємо основні модулі
      test_validation
      test_dimensions_manager
      test_skp_preview_extractor
      test_carousel
      test_ui
      
      Logger.finish("Тестування плагіна ProGran3", "TestSuite")
    end

    def test_validation
      Logger.start("Тестування валідації", "TestSuite")
      
      # Тестуємо валідацію розмірів
      result = Validation.validate_dimensions(100, 200, 50, "Test")
      Logger.success("Валідація розмірів", "TestSuite") if result.valid
      
      # Тестуємо валідацію з помилками
      result = Validation.validate_dimensions(-10, 0, 1000, "Test")
      Logger.warn("Валідація з помилками", "TestSuite") unless result.valid
      
      Logger.finish("Тестування валідації", "TestSuite")
    end

    def test_dimensions_manager
      Logger.start("Тестування менеджера розмірів", "TestSuite")
      
      # Тестуємо конвертацію одиниць
      mm_value = DimensionsManager.convert_to_mm(10, 'cm')
      Logger.success("Конвертація 10см в мм: #{mm_value}", "TestSuite")
      
      cm_value = DimensionsManager.convert_to_cm(100, 'mm')
      Logger.success("Конвертація 100мм в см: #{cm_value}", "TestSuite")
      
      Logger.finish("Тестування менеджера розмірів", "TestSuite")
    end

    def test_skp_preview_extractor
      Logger.start("Тестування екстрактора превью", "TestSuite")
      
      # Тестуємо універсальне витягування
      test_universal_extraction
      
      Logger.finish("Тестування екстрактора превью", "TestSuite")
    end

    def test_universal_extraction
      Logger.start("Тестування універсального витягування", "TestSuite")
      
      # Тестуємо з різними категоріями
      test_cases = [
        "steles/stele_100x50x8.skp",
        "stands/stand_50x20x15.skp",
        "flowerbeds/flowerbed_100x50x10.skp",
        "gravestones/plate_50x30x3.skp"
      ]
      
      test_cases.each do |component_path|
        Logger.info("Тестуємо: #{component_path}", "TestSuite")
        result = SkpPreviewExtractor.extract_preview(component_path, 256)
        
        if result
          Logger.success("Успішно: #{File.basename(result)}", "TestSuite")
        else
          Logger.warn("Невдало", "TestSuite")
        end
      end
      
      Logger.finish("Тестування універсального витягування", "TestSuite")
    end

    def test_carousel
      Logger.start("Тестування каруселі", "TestSuite")
      
      # Створюємо менеджер каруселі
      manager = Carousel::CarouselManager.new
      
      # Тестуємо ініціалізацію
      test_models = ['stele_100x50x8.skp', 'stele_120x60x8.skp', 'stele_80x40x5.skp']
      success = manager.initialize_carousel('test_steles', test_models)
      
      if success
        Logger.success("Ініціалізація успішна", "TestSuite")
        
        # Тестуємо навігацію
        info = manager.get_carousel_info('test_steles')
        Logger.info("Інформація: #{info}", "TestSuite")
        
        # Тестуємо перехід
        manager.next_model('test_steles')
        info = manager.get_carousel_info('test_steles')
        Logger.info("Після переходу: #{info}", "TestSuite")
        
        Logger.success("Тестування завершено успішно", "TestSuite")
      else
        Logger.error("Помилка ініціалізації", "TestSuite")
      end
      
      Logger.finish("Тестування каруселі", "TestSuite")
    end

    def test_ui
      Logger.start("Тестування UI", "TestSuite")
      
      # Створюємо UI модуль
      ui = Carousel::CarouselUI.new
      
      # Тестуємо генерацію HTML
      html = ui.get_carousel_html('test_steles')
      Logger.success("HTML згенеровано (#{html.length} символів)", "TestSuite")
      
      Logger.finish("Тестування UI", "TestSuite")
    end

    def run_all_tests
      Logger.start("Запуск всіх тестів", "TestSuite")
      
      test_plugin
      
      Logger.finish("Всі тести завершено", "TestSuite")
    end

    # Спеціальний тест для gravestones
    def test_gravestones_preview
      Logger.start("Тестування превью для gravestones", "TestSuite")
      
      # Тестуємо всі доступні файли gravestones
      gravestone_files = Dir.glob(File.join(File.dirname(__FILE__), 'assets', 'gravestones', '*.skp'))
      
      if gravestone_files.empty?
        Logger.warn("Не знайдено .skp файлів для gravestones", "TestSuite")
        return
      end
      
      gravestone_files.each do |skp_file|
        filename = File.basename(skp_file)
        component_path = "gravestones/#{filename}"
        
        Logger.info("Тестуємо превью для: #{filename}", "TestSuite")
        
        # Тестуємо витягування превью
        preview_path = SkpPreviewExtractor.extract_preview(component_path, 256)
        
        if preview_path && File.exist?(preview_path)
          Logger.success("Превью створено: #{File.basename(preview_path)}", "TestSuite")
          
          # Тестуємо base64 конвертацію
          base64_data = SkpPreviewExtractor.get_preview_base64(component_path, 256)
          if base64_data
            Logger.success("Base64 конвертація успішна (#{base64_data.length} символів)", "TestSuite")
          else
            Logger.warn("Помилка base64 конвертації", "TestSuite")
          end
        else
          Logger.warn("Помилка створення превью", "TestSuite")
        end
      end
      
      Logger.finish("Тестування превью для gravestones", "TestSuite")
    end
  end
end
