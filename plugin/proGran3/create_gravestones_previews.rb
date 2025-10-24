# proGran3/create_gravestones_previews.rb
# Скрипт для створення превью для всіх .skp файлів gravestones

require_relative 'logger'
require_relative 'skp_preview_extractor'

module ProGran3
  module GravestonesPreviewCreator
    extend self
    
    def create_all_previews
      Logger.start("Створення превью для gravestones", "GravestonesPreviewCreator")
      
      # Шлях до папки з gravestones
      gravestones_path = File.join(File.dirname(__FILE__), 'assets', 'gravestones')
      
      # Знаходимо всі .skp файли
      skp_files = Dir.glob(File.join(gravestones_path, '*.skp'))
      
      if skp_files.empty?
        Logger.warn("Не знайдено .skp файлів в папці gravestones", "GravestonesPreviewCreator")
        return
      end
      
      # Знайдено .skp файлів - без логування
      
      # Створюємо превью для кожного файла
      skp_files.each do |skp_file|
        create_preview_for_file(skp_file)
      end
      
      Logger.finish("Створення превью для gravestones", "GravestonesPreviewCreator")
    end
    
    def create_preview_for_file(skp_file)
      filename = File.basename(skp_file)
      # Обробка файла - без логування
      
      # Перевіряємо, чи вже є .png файл
      png_file = skp_file.sub('.skp', '.png')
      if File.exist?(png_file)
        # Превью вже існує - без логування
        return
      end
      
      # Створюємо компонентний шлях
      component_path = "gravestones/#{filename}"
      
      # Створюємо превью
      # Створення превью - без логування
      
      begin
        preview_path = SkpPreviewExtractor.extract_preview(component_path, 256)
        
        if preview_path && File.exist?(preview_path)
          # Превью створено - без логування
          
          # Тестуємо base64 конвертацію
          base64_data = SkpPreviewExtractor.get_preview_base64(component_path, 256)
          if base64_data
            # Base64 конвертація успішна - без логування
          else
            Logger.warn("Помилка base64 конвертації", "GravestonesPreviewCreator")
          end
        else
          Logger.error("Помилка створення превью", "GravestonesPreviewCreator")
        end
      rescue => e
        Logger.error("Помилка обробки #{filename}: #{e.message}", "GravestonesPreviewCreator")
      end
    end
    
    def check_existing_previews
      Logger.start("Перевірка існуючих превью", "GravestonesPreviewCreator")
      
      gravestones_path = File.join(File.dirname(__FILE__), 'assets', 'gravestones')
      
      # Знаходимо всі файли
      skp_files = Dir.glob(File.join(gravestones_path, '*.skp'))
      png_files = Dir.glob(File.join(gravestones_path, '*.png'))
      
      # Знайдено .skp файлів - без логування
      Logger.info("Знайдено #{png_files.length} .png файлів", "GravestonesPreviewCreator")
      
      # Перевіряємо кожен .skp файл
      skp_files.each do |skp_file|
        filename = File.basename(skp_file, '.skp')
        png_file = File.join(gravestones_path, "#{filename}.png")
        
        if File.exist?(png_file)
          Logger.success("✅ #{filename}.skp -> #{filename}.png", "GravestonesPreviewCreator")
        else
          Logger.warn("❌ #{filename}.skp -> відсутній .png", "GravestonesPreviewCreator")
        end
      end
      
      Logger.finish("Перевірка існуючих превью", "GravestonesPreviewCreator")
    end
  end
end

# Запуск скрипта
if __FILE__ == $0
  puts "=== Створення превью для gravestones ==="
  
  # Спочатку перевіряємо існуючі превью
  ProGran3::GravestonesPreviewCreator.check_existing_previews
  
  puts "\n=== Створення відсутніх превью ==="
  
  # Створюємо відсутні превью
  ProGran3::GravestonesPreviewCreator.create_all_previews
  
  puts "\n=== Фінальна перевірка ==="
  
  # Фінальна перевірка
  ProGran3::GravestonesPreviewCreator.check_existing_previews
  
  puts "\n=== Завершено ==="
end
