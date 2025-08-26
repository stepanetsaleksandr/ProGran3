# progran3/test_suite.rb
module ProGran3
  module TestSuite
    extend self

    # Основний тест плагіна
    def test_plugin
      Logger.info("Тестування плагіна ProGran3", "Test")
      Logger.info("Шлях до плагіна: #{File.dirname(File.dirname(__FILE__))}", "Test")
      Logger.info("Версія: #{Constants::VERSION}", "Test")
      
      # Тестуємо систему валідації
      Validation.test
      
      Logger.success("Плагін готовий до роботи!", "Test")
    end

    # Тестування SkpPreviewExtractor
    def test_skp_preview_extractor
      SkpPreviewExtractor.test_extraction
    end

    def test_universal_extraction
      SkpPreviewExtractor.test_universal_extraction
    end

    # Тестування валідації
    def test_validation
      ErrorHandler.safe_execute("Test", "Тестування валідації") do
        Logger.info("Тестування системи валідації...", "Test")
        
        # Тестуємо DimensionsManager
        test_dimensions_manager
        
        Logger.success("Тестування завершено", "Test")
      end
    end

    # Тестування DimensionsManager
    def test_dimensions_manager
      Logger.info("Тестування DimensionsManager...", "Test")
      
      # Тест 1: Валідація фундаменту
      result = DimensionsManager.validate_and_convert(2000, :foundation_depth, "Test")
      Logger.info("Фундамент 2000мм: #{result[:success]}", "Test")
      
      # Тест 2: Валідація відмостки
      result = DimensionsManager.validate_and_convert(50, :blind_area_thickness, "Test")
      Logger.info("Відмостка 50мм: #{result[:success]}", "Test")
      
      # Тест 3: Неправильний розмір
      result = DimensionsManager.validate_and_convert(10000, :foundation_depth, "Test")
      Logger.info("Фундамент 10000мм: #{result[:success]} - #{result[:errors]&.join(', ')}", "Test")
      
      # Тест 4: Отримання конфігурації
      config = DimensionsManager.get_dimension_config(:foundation_depth)
      Logger.info("Конфігурація фундаменту: #{config}", "Test")
      
      Logger.success("DimensionsManager протестовано", "Test")
    end

    # Тестування каруселі
    def test_carousel
      Logger.info("Тестування каруселі...", "Test")
      CarouselManager.test_module
      Logger.success("Карусель протестовано", "Test")
    end

    # Тестування UI
    def test_ui
      Logger.info("Тестування UI...", "Test")
      CarouselUI.test_ui_module
      Logger.success("UI протестовано", "Test")
    end

    # Комплексне тестування
    def run_all_tests
      Logger.start("Запуск всіх тестів", "TestSuite")
      
      test_plugin
      test_validation
      test_skp_preview_extractor
      test_carousel
      test_ui
      
      Logger.finish("Всі тести завершено", "TestSuite")
    end
  end
end
