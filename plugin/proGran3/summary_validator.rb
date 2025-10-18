# progran3/summary_validator.rb
# Валідація компонентів та генерація попереджень

module ProGran3
  module SummaryValidator
    extend self
    
    # Перевіряє чи є компонент декоративним елементом
    def is_decorative?(name)
      # Декоративні елементи (ball.skp, pancake.skp, ball2.skp тощо)
      decorative_patterns = [
        /ball/i,
        /pancake/i,
        /\.skp$/i,
        /decor/i
      ]
      
      decorative_patterns.any? { |pattern| name =~ pattern }
    end
    
    # Валідує розміри компонента
    def validate_dimensions(width, depth, height, name)
      warnings = []
      
      # Пропускаємо декоративні елементи
      return warnings if is_decorative?(name)
      
      # Перевірка мінімальних розмірів
      if width < 1 || depth < 1 || height < 1
        warnings << "#{name}: Занадто малі розміри (< 1 см)"
      end
      
      # Перевірка максимальних розмірів (> 10 метрів підозріло)
      if width > 1000 || depth > 1000 || height > 1000
        warnings << "#{name}: Підозріло великі розміри (> 10 м)"
      end
      
      # Перевірка пропорцій
      max_dim = [width, depth, height].max
      min_dim = [width, depth, height].min
      
      if max_dim / min_dim > 100
        warnings << "#{name}: Незвичайні пропорції (співвідношення > 100:1)"
      end
      
      warnings
    end
    
    # Валідує площу
    def validate_area(area_m2, name)
      warnings = []
      
      # Пропускаємо декоративні елементи
      return warnings if is_decorative?(name)
      
      if area_m2 <= 0
        warnings << "#{name}: Площа не розрахована або дорівнює 0"
      elsif area_m2 > 100
        warnings << "#{name}: Дуже велика площа (> 100 м²)"
      end
      
      warnings
    end
    
    # Валідує об'єм
    def validate_volume(volume_m3, name)
      warnings = []
      
      # Пропускаємо декоративні елементи
      return warnings if is_decorative?(name)
      
      if volume_m3 <= 0
        warnings << "#{name}: Об'єм не розрахований або дорівнює 0"
      elsif volume_m3 > 50
        warnings << "#{name}: Дуже великий об'єм (> 50 м³)"
      end
      
      warnings
    end
    
    # Валідує весь підсумок
    def validate_summary(summary)
      all_warnings = []
      skipped_decorative = []
      
      summary.each do |category, items|
        items.each do |item|
          item_name = item[:name] || category.to_s
          
          # Пропускаємо декоративні елементи
          if is_decorative?(item_name)
            skipped_decorative << item_name
            next
          end
          
          # Валідація розмірів
          if item[:width] && item[:depth] && item[:height]
            warnings = validate_dimensions(item[:width], item[:depth], item[:height], item_name)
            all_warnings.concat(warnings)
          end
          
          # Валідація площі
          if item[:area_m2]
            warnings = validate_area(item[:area_m2], item_name)
            all_warnings.concat(warnings)
          end
          
          # Валідація об'єму
          if item[:volume_m3]
            warnings = validate_volume(item[:volume_m3], item_name)
            all_warnings.concat(warnings)
          end
        end
      end
      
      # Логуємо пропущені декоративні елементи
      if skipped_decorative.any?
        require_relative 'logger'
        ProGran3::Logger.info("🎨 Пропущено валідацію для декоративних елементів (#{skipped_decorative.count}): #{skipped_decorative.uniq.join(', ')}", "Validator")
      end
      
      # Перевірка повноти проекту
      required = [:foundation, :tiles, :stands, :steles]
      missing = required.select { |cat| summary[cat].nil? || summary[cat].empty? }
      
      if missing.any?
        all_warnings << "Відсутні обов'язкові компоненти: #{missing.join(', ')}"
      end
      
      all_warnings
    end
    
    # Розраховує повноту проекту (%)
    def calculate_completeness(summary)
      required = [:foundation, :tiles, :blind_area, :stands, :steles]
      
      completed = required.count { |cat| summary[cat] && !summary[cat].empty? }
      
      percentage = (completed.to_f / required.count * 100).round(0)
      
      {
        percentage: percentage,
        completed: completed,
        total: required.count,
        is_complete: percentage == 100,
        missing: required.select { |cat| summary[cat].nil? || summary[cat].empty? }
      }
    end
  end
end

